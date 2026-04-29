import { describe, expect, it } from "vitest";
import { ParseError, parseProgram } from "./parser";

describe("parseProgram", () => {
  it("parses ADD with three registers", () => {
    const result = parseProgram("ADD R1, R2, R3");
    expect(result).toEqual([
      {
        id: 0,
        raw: "ADD R1, R2, R3",
        opcode: "ADD",
        dest: "R1",
        sources: ["R2", "R3"],
        type: "ALU",
      },
    ]);
  });

  it("is case-insensitive for opcodes and registers", () => {
    const [inst] = parseProgram("add r1, r2, r3");
    expect(inst.opcode).toBe("ADD");
    expect(inst.dest).toBe("R1");
    expect(inst.sources).toEqual(["R2", "R3"]);
  });

  it("tolerates flexible whitespace", () => {
    const [inst] = parseProgram("  SUB    R4 ,R5,    R6   ");
    expect(inst.opcode).toBe("SUB");
    expect(inst.dest).toBe("R4");
    expect(inst.sources).toEqual(["R5", "R6"]);
  });

  it("parses NAND", () => {
    const [inst] = parseProgram("NAND R7, R8, R9");
    expect(inst.opcode).toBe("NAND");
    expect(inst.type).toBe("ALU");
    expect(inst.dest).toBe("R7");
    expect(inst.sources).toEqual(["R8", "R9"]);
  });

  it("parses ADDI", () => {
    const [inst] = parseProgram("ADDI R10, R11, 4");
    expect(inst.opcode).toBe("ADDI");
    expect(inst.type).toBe("ALU");
    expect(inst.dest).toBe("R10");
    expect(inst.sources).toEqual(["R11"]);
    expect(inst.immediate).toBe(4);
  });

  it("parses LW (LOAD)", () => {
    const [inst] = parseProgram("LW R6, 0(R1)");
    expect(inst.opcode).toBe("LW");
    expect(inst.type).toBe("LOAD");
    expect(inst.dest).toBe("R6");
    expect(inst.sources).toEqual(["R1"]);
    expect(inst.immediate).toBe(0);
  });

  it("parses SW (STORE) using standard MIPS ordering", () => {
    const [inst] = parseProgram("SW R6, 8(R1)");
    expect(inst.opcode).toBe("SW");
    expect(inst.type).toBe("STORE");
    expect(inst.dest).toBeUndefined();
    expect(inst.sources).toEqual(["R6", "R1"]);
    expect(inst.immediate).toBe(8);
  });

  it("parses BEQ", () => {
    const [inst] = parseProgram("BEQ R7, R0, target");
    expect(inst.opcode).toBe("BEQ");
    expect(inst.type).toBe("BRANCH");
    expect(inst.dest).toBeUndefined();
    expect(inst.sources).toEqual(["R7", "R0"]);
    expect(inst.label).toBe("target");
  });

  it("parses NOP and NOOP", () => {
    const result = parseProgram("NOP\nNOOP");
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("NOP");
    expect(result[1].type).toBe("NOP");
    expect(result[1].opcode).toBe("NOP");
  });

  it("strips label prefixes", () => {
    const [inst] = parseProgram("target: ADD R6, R6, R6");
    expect(inst.opcode).toBe("ADD");
    expect(inst.dest).toBe("R6");
  });

  it("ignores label-only lines and blank lines", () => {
    const result = parseProgram("end:\n\nADD R1, R2, R3\n  \n");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(0);
  });

  it("strips comments", () => {
    const [inst] = parseProgram("ADD R1, R2, R3  // increment R1");
    expect(inst.raw).toBe("ADD R1, R2, R3");
  });

  it("assigns sequential ids", () => {
    const result = parseProgram("ADD R1, R2, R3\nSUB R4, R5, R6\nNAND R7, R8, R9");
    expect(result.map((i) => i.id)).toEqual([0, 1, 2]);
  });

  it("throws ParseError on unknown opcode", () => {
    expect(() => parseProgram("FOO R1, R2, R3")).toThrow(ParseError);
  });

  it("throws ParseError on bad register", () => {
    expect(() => parseProgram("ADD R1, X9, R3")).toThrow(ParseError);
  });

  it("throws ParseError on out-of-range register", () => {
    expect(() => parseProgram("ADD R1, R32, R3")).toThrow(ParseError);
  });

  it("throws ParseError on bad memory operand", () => {
    expect(() => parseProgram("LW R1, R2")).toThrow(ParseError);
  });

  it("rejects immediates with trailing garbage", () => {
    expect(() => parseProgram("ADDI R1, R2, 5abc")).toThrow(ParseError);
    expect(() => parseProgram("ADDI R1, R2, 0x10")).toThrow(ParseError);
  });

  it("accepts negative immediates", () => {
    const [inst] = parseProgram("ADDI R1, R2, -7");
    expect(inst.immediate).toBe(-7);
  });
});
