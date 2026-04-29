import { describe, expect, it } from "vitest";
import { parseProgram } from "./parser";
import { simulate } from "./simulator";
import type { PipelineCell, SimulationConfig, Stage } from "./types";

const defaultConfig: SimulationConfig = {
  forwardingEnabled: false,
  branchFlushEnabled: true,
  branchResolutionStage: "EX",
};

function stageAt(cells: PipelineCell[], instId: number, cycle: number): Stage | undefined {
  return cells.find((c) => c.instructionId === instId && c.cycle === cycle)?.stage;
}

function row(cells: PipelineCell[], instId: number): { cycle: number; stage: Stage }[] {
  return cells
    .filter((c) => c.instructionId === instId)
    .sort((a, b) => a.cycle - b.cycle)
    .map((c) => ({ cycle: c.cycle, stage: c.stage }));
}

describe("simulate — no hazards", () => {
  it("staggers four independent instructions", () => {
    const insts = parseProgram(
      "ADD R1, R2, R3\nSUB R4, R5, R6\nNAND R7, R8, R9\nADDI R10, R11, 4"
    );
    const result = simulate(insts, defaultConfig);
    expect(result.totalCycles).toBe(8);

    expect(row(result.cells, 0)).toEqual([
      { cycle: 1, stage: "IF" },
      { cycle: 2, stage: "ID" },
      { cycle: 3, stage: "EX" },
      { cycle: 4, stage: "MEM" },
      { cycle: 5, stage: "WB" },
    ]);
    expect(row(result.cells, 3)).toEqual([
      { cycle: 4, stage: "IF" },
      { cycle: 5, stage: "ID" },
      { cycle: 6, stage: "EX" },
      { cycle: 7, stage: "MEM" },
      { cycle: 8, stage: "WB" },
    ]);
    expect(result.hazards).toHaveLength(0);
    expect(result.forwardings).toHaveLength(0);
  });
});

describe("simulate — RAW hazards without forwarding", () => {
  it("inserts 2 stalls for adjacent ADD-then-SUB dependency", () => {
    const insts = parseProgram("ADD R1, R2, R3\nSUB R4, R1, R5");
    const result = simulate(insts, defaultConfig);

    expect(stageAt(result.cells, 1, 4)).toBe("STALL");
    expect(stageAt(result.cells, 1, 5)).toBe("STALL");
    expect(stageAt(result.cells, 1, 6)).toBe("EX");
    expect(stageAt(result.cells, 1, 7)).toBe("MEM");
    expect(stageAt(result.cells, 1, 8)).toBe("WB");

    expect(result.hazards.some((h) => h.type === "RAW" && h.register === "R1")).toBe(true);
    expect(result.forwardings).toHaveLength(0);
  });

  it("propagates the stall to subsequent instructions", () => {
    const insts = parseProgram("ADD R1, R2, R3\nSUB R4, R1, R5\nNAND R6, R7, R8");
    const result = simulate(insts, defaultConfig);
    // NAND has no dependency but should be pushed back by SUB's 2 stalls.
    expect(stageAt(result.cells, 2, 5)).toBe("IF"); // not cycle 3
    expect(stageAt(result.cells, 2, 6)).toBe("ID");
    expect(stageAt(result.cells, 2, 7)).toBe("EX");
  });
});

describe("simulate — RAW hazards with forwarding", () => {
  it("resolves ALU-to-ALU RAW with no stall", () => {
    const insts = parseProgram("ADD R1, R2, R3\nSUB R4, R1, R5");
    const result = simulate(insts, { ...defaultConfig, forwardingEnabled: true });

    expect(stageAt(result.cells, 1, 4)).toBe("EX");
    expect(stageAt(result.cells, 1, 5)).toBe("MEM");
    expect(stageAt(result.cells, 1, 6)).toBe("WB");

    const fwd = result.forwardings.find(
      (f) => f.fromInstructionId === 0 && f.toInstructionId === 1 && f.register === "R1"
    );
    expect(fwd).toBeDefined();
    expect(fwd!.fromStage).toBe("EX/MEM");
    expect(fwd!.toStage).toBe("EX");
  });

  it("uses MEM/WB forward when one instruction is between producer and consumer", () => {
    const insts = parseProgram(
      "ADD R1, R2, R3\nSUB R4, R5, R6\nNAND R7, R1, R8"
    );
    const result = simulate(insts, { ...defaultConfig, forwardingEnabled: true });

    expect(stageAt(result.cells, 2, 5)).toBe("EX");
    const fwd = result.forwardings.find(
      (f) => f.fromInstructionId === 0 && f.toInstructionId === 2
    );
    expect(fwd).toBeDefined();
    expect(fwd!.fromStage).toBe("MEM/WB");
  });
});

describe("simulate — load-use hazard", () => {
  it("inserts exactly 1 stall when LW result feeds the very next instruction", () => {
    const insts = parseProgram("LW R1, 0(R2)\nADD R3, R1, R4");
    const result = simulate(insts, { ...defaultConfig, forwardingEnabled: true });

    expect(stageAt(result.cells, 1, 4)).toBe("STALL");
    expect(stageAt(result.cells, 1, 5)).toBe("EX");

    const hz = result.hazards.find((h) => h.type === "LOAD_USE");
    expect(hz).toBeDefined();
    expect(hz!.register).toBe("R1");

    // After the stall, MEM/WB forward to EX kicks in.
    const fwd = result.forwardings.find(
      (f) => f.fromInstructionId === 0 && f.toInstructionId === 1
    );
    expect(fwd).toBeDefined();
    expect(fwd!.fromStage).toBe("MEM/WB");
  });

  it("does not stall when there's an unrelated instruction between LW and the user", () => {
    const insts = parseProgram("LW R1, 0(R2)\nNOP\nADD R3, R1, R4");
    const result = simulate(insts, { ...defaultConfig, forwardingEnabled: true });

    expect(stageAt(result.cells, 2, 5)).toBe("EX");
    expect(stageAt(result.cells, 2, 4)).toBe("ID");
    expect(result.hazards.some((h) => h.type === "LOAD_USE")).toBe(false);
  });
});

describe("simulate — branch flush", () => {
  it("flushes 1 instruction when resolution is at EX", () => {
    const insts = parseProgram(
      "BEQ R1, R0, target\nADD R2, R3, R4\nSUB R5, R6, R7"
    );
    const result = simulate(insts, {
      ...defaultConfig,
      branchFlushEnabled: true,
      branchResolutionStage: "EX",
    });
    expect(result.flushedInstructionIds).toEqual([1]);
    expect(stageAt(result.cells, 1, 2)).toBe("FLUSH");
    expect(stageAt(result.cells, 2, 3)).toBe("IF");
  });

  it("flushes 2 instructions when resolution is at MEM", () => {
    const insts = parseProgram(
      "BEQ R1, R0, target\nADD R2, R3, R4\nSUB R5, R6, R7\nNAND R8, R9, R10"
    );
    const result = simulate(insts, {
      ...defaultConfig,
      branchFlushEnabled: true,
      branchResolutionStage: "MEM",
    });
    expect(result.flushedInstructionIds.sort()).toEqual([1, 2]);
    expect(stageAt(result.cells, 1, 2)).toBe("FLUSH");
    expect(stageAt(result.cells, 2, 3)).toBe("FLUSH");
    expect(stageAt(result.cells, 3, 4)).toBe("IF");
  });

  it("does not double-flush when a branch is itself flushed", () => {
    // BEQ #1 flushes BEQ #2; BEQ #2 should not also flush ADD #3.
    const insts = parseProgram(
      "BEQ R1, R0, target\nBEQ R2, R0, other\nADD R3, R4, R5"
    );
    const result = simulate(insts, {
      ...defaultConfig,
      branchFlushEnabled: true,
      branchResolutionStage: "EX",
    });
    expect(result.flushedInstructionIds).toEqual([1]);
    expect(stageAt(result.cells, 2, 3)).toBe("IF");
  });

  it("does not flush anything when flushing is disabled", () => {
    const insts = parseProgram(
      "BEQ R1, R0, target\nADD R2, R3, R4\nSUB R5, R6, R7"
    );
    const result = simulate(insts, {
      ...defaultConfig,
      branchFlushEnabled: false,
    });
    expect(result.flushedInstructionIds).toHaveLength(0);
    expect(stageAt(result.cells, 1, 2)).toBe("IF");
  });
});
