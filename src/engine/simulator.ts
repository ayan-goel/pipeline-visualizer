import type {
  ForwardingInfo,
  HazardInfo,
  ParsedInstruction,
  PipelineCell,
  SimulationConfig,
  SimulationResult,
  Stage,
} from "./types";

/**
 * 5-stage pipeline simulator (CS 2200 / classic MIPS-style).
 *
 * Stages: IF, ID, EX, MEM, WB. Each stage takes one cycle. Instruction i
 * (0-indexed) starts IF at cycle i+1 unless previous instructions stall.
 *
 * Half-cycle assumption: the register file is written in the first half of
 * WB and read in the second half of ID, so a producer's WB cycle can equal
 * its consumer's ID cycle without forwarding (i.e., consumer.EX >= producer.WB + 1).
 *
 * Forwarding paths modeled:
 *   - EX/MEM → EX  (ALU result forwarded to immediately-following instruction)
 *   - MEM/WB → EX  (loaded value or older ALU result forwarded one cycle later)
 *
 * Load-use hazard: when forwarding is enabled and a LOAD's result feeds the
 * very next instruction, exactly one bubble is inserted because the loaded
 * value is only available after MEM, one cycle too late for the consumer's EX.
 *
 * Control hazard: BEQ is treated as taken. Instructions fetched after BEQ
 * before the resolution stage (EX or MEM) are marked FLUSH and never proceed.
 */

interface ScheduleEntry {
  instructionId: number;
  ifCycle: number;
  stalls: number;
  flushed: boolean;
}

const stageHelpers = {
  ex(e: ScheduleEntry) {
    return e.ifCycle + 2 + e.stalls;
  },
  mem(e: ScheduleEntry) {
    return e.ifCycle + 3 + e.stalls;
  },
  wb(e: ScheduleEntry) {
    return e.ifCycle + 4 + e.stalls;
  },
};

export function simulate(
  instructions: ParsedInstruction[],
  config: SimulationConfig
): SimulationResult {
  const flushedIds = new Set<number>();
  const hazards: HazardInfo[] = [];
  const forwardings: ForwardingInfo[] = [];

  // Pass 1: identify flushed instructions from branches. A branch that is
  // itself flushed never executes, so it can't cause its own flushes — process
  // in program order and skip any branch already marked flushed.
  if (config.branchFlushEnabled) {
    const flushCount = config.branchResolutionStage === "EX" ? 1 : 2;
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].type !== "BRANCH") continue;
      if (flushedIds.has(instructions[i].id)) continue;
      for (let j = 1; j <= flushCount && i + j < instructions.length; j++) {
        const target = instructions[i + j];
        if (flushedIds.has(target.id)) continue;
        flushedIds.add(target.id);
        hazards.push({
          type: "CONTROL",
          producerInstructionId: instructions[i].id,
          consumerInstructionId: target.id,
          message: `Control hazard: ${target.opcode} (#${
            target.id + 1
          }) was speculatively fetched after ${instructions[i].opcode} (#${
            instructions[i].id + 1
          }) and flushed because branch outcome wasn't known until ${
            config.branchResolutionStage
          }.`,
        });
      }
    }
  }

  // Pass 2: schedule each instruction in order, computing stalls from RAW deps.
  const schedule: ScheduleEntry[] = [];
  const scheduleById = new Map<number, ScheduleEntry>();
  let nextEarliestIf = 1;

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    const ifCycle = nextEarliestIf;

    // Flushed instructions occupy a single IF slot and don't stall the front-end.
    if (flushedIds.has(inst.id)) {
      const entry: ScheduleEntry = {
        instructionId: inst.id,
        ifCycle,
        stalls: 0,
        flushed: true,
      };
      schedule.push(entry);
      scheduleById.set(inst.id, entry);
      nextEarliestIf = ifCycle + 1;
      continue;
    }

    let stalls = 0;
    type SourceMatch = {
      source: string;
      producerInst: ParsedInstruction;
      producerEntry: ScheduleEntry;
    };
    const matches: SourceMatch[] = [];

    // Find most recent (non-flushed) producer for each source.
    for (const source of inst.sources) {
      for (let j = i - 1; j >= 0; j--) {
        const prev = instructions[j];
        if (flushedIds.has(prev.id)) continue;
        if (prev.dest === source) {
          const prevEntry = scheduleById.get(prev.id)!;
          matches.push({ source, producerInst: prev, producerEntry: prevEntry });
          break;
        }
      }
    }

    // Compute stalls needed: take max across all source dependencies.
    for (const m of matches) {
      const pEx = stageHelpers.ex(m.producerEntry);
      const pMem = stageHelpers.mem(m.producerEntry);
      const pWb = stageHelpers.wb(m.producerEntry);

      let requiredEx: number;
      if (config.forwardingEnabled) {
        // ALU producer: EX/MEM → EX needs consumer.EX >= producer.EX + 1.
        // LOAD producer: MEM/WB → EX needs consumer.EX >= producer.MEM + 1.
        requiredEx = m.producerInst.type === "LOAD" ? pMem + 1 : pEx + 1;
      } else {
        // No forwarding: consumer must read after producer commits to register file.
        // With half-cycle write/read, consumer.ID >= producer.WB ⇔ consumer.EX >= producer.WB + 1.
        requiredEx = pWb + 1;
      }

      const naturalEx = ifCycle + 2;
      const need = Math.max(0, requiredEx - naturalEx);
      stalls = Math.max(stalls, need);
    }

    const entry: ScheduleEntry = {
      instructionId: inst.id,
      ifCycle,
      stalls,
      flushed: false,
    };
    schedule.push(entry);
    scheduleById.set(inst.id, entry);

    // Now record hazards and forwarding annotations using the final stall count.
    const consumerEx = stageHelpers.ex(entry);
    for (const m of matches) {
      const pEx = stageHelpers.ex(m.producerEntry);
      const pMem = stageHelpers.mem(m.producerEntry);
      const pWb = stageHelpers.wb(m.producerEntry);

      if (config.forwardingEnabled) {
        const causedStall =
          m.producerInst.type === "LOAD" && consumerEx === pMem + 1 && stalls > 0;
        if (causedStall) {
          hazards.push({
            type: "LOAD_USE",
            register: m.source,
            producerInstructionId: m.producerInst.id,
            consumerInstructionId: inst.id,
            message: `Load-use hazard: ${inst.opcode} (#${
              inst.id + 1
            }) needs ${m.source} from LW (#${
              m.producerInst.id + 1
            }) but the loaded value isn't ready until end of MEM. One bubble is inserted; afterwards MEM/WB → EX forwarding delivers the value.`,
          });
        }

        // Determine forwarding path (if any) for the final timing.
        let fromStage: "EX/MEM" | "MEM/WB" | null = null;
        if (consumerEx === pEx + 1) fromStage = "EX/MEM";
        else if (consumerEx === pMem + 1) fromStage = "MEM/WB";
        // consumerEx >= pWb + 1: value already in register file, no forwarding needed.

        if (fromStage) {
          const fwd: ForwardingInfo = {
            fromInstructionId: m.producerInst.id,
            toInstructionId: inst.id,
            register: m.source,
            fromStage,
            toStage: "EX",
            message: `Forward ${m.source} from ${m.producerInst.opcode} (#${
              m.producerInst.id + 1
            }) ${fromStage} → ${inst.opcode} (#${inst.id + 1}) EX.`,
          };
          forwardings.push(fwd);
        }
      } else {
        // No forwarding: any timing-violating dependency caused a stall (RAW).
        if (consumerEx > stageHelpers.ex(entry) - stalls) {
          // Stall was needed iff naturalEx < requiredEx i.e. stalls > 0 due to this dep.
          const naturalEx = entry.ifCycle + 2;
          if (pWb + 1 > naturalEx) {
            hazards.push({
              type: "RAW",
              register: m.source,
              producerInstructionId: m.producerInst.id,
              consumerInstructionId: inst.id,
              message: `RAW hazard: ${inst.opcode} (#${
                inst.id + 1
              }) needs ${m.source} from ${m.producerInst.opcode} (#${
                m.producerInst.id + 1
              }). Without forwarding, ${inst.opcode} stalls in ID until ${
                m.producerInst.opcode
              }'s WB completes.`,
            });
          }
        }
      }
    }

    // Back-pressure: if this instruction stalls k cycles, the next instruction's
    // IF is pushed back by k as well (it can't enter ID while this one is stuck).
    nextEarliestIf = ifCycle + 1 + stalls;
  }

  // Generate pipeline cells from the schedule.
  const cells: PipelineCell[] = [];

  for (const entry of schedule) {
    const inst = instructions.find((x) => x.id === entry.instructionId)!;

    if (entry.flushed) {
      const ctrlHazard = hazards.find(
        (h) => h.type === "CONTROL" && h.consumerInstructionId === inst.id
      );
      cells.push({
        instructionId: inst.id,
        cycle: entry.ifCycle,
        stage: "FLUSH",
        hazard: ctrlHazard,
        explanation: `${inst.opcode} (#${
          inst.id + 1
        }) was flushed — fetched speculatively after a branch.`,
      });
      continue;
    }

    const exCycle = stageHelpers.ex(entry);
    const memCycle = stageHelpers.mem(entry);
    const wbCycle = stageHelpers.wb(entry);

    // IF, ID always at the same offset.
    cells.push(makeStageCell(inst, entry.ifCycle, "IF"));
    cells.push(makeStageCell(inst, entry.ifCycle + 1, "ID"));

    // Stall cells (between ID and EX).
    for (let s = 0; s < entry.stalls; s++) {
      const stallHazard = hazards.find(
        (h) =>
          (h.type === "RAW" || h.type === "LOAD_USE") &&
          h.consumerInstructionId === inst.id
      );
      cells.push({
        instructionId: inst.id,
        cycle: entry.ifCycle + 2 + s,
        stage: "STALL",
        hazard: stallHazard,
        explanation: stallHazard
          ? stallHazard.message
          : `${inst.opcode} (#${inst.id + 1}) stalled while waiting for an operand.`,
      });
    }

    // EX cell — attach any forwarding into this cycle.
    const fwds = forwardings.filter((f) => f.toInstructionId === inst.id);
    cells.push({
      instructionId: inst.id,
      cycle: exCycle,
      stage: "EX",
      forwarding: fwds[0],
      explanation:
        fwds.length > 0
          ? fwds.map((f) => f.message).join(" ")
          : `${inst.opcode} (#${inst.id + 1}) executes in EX.`,
    });

    cells.push(makeStageCell(inst, memCycle, "MEM"));
    cells.push(makeStageCell(inst, wbCycle, "WB"));
  }

  // Total cycles = max cycle in cells (or 0 if empty).
  let totalCycles = 0;
  for (const cell of cells) totalCycles = Math.max(totalCycles, cell.cycle);

  return {
    instructions,
    cells,
    totalCycles,
    hazards,
    forwardings,
    flushedInstructionIds: Array.from(flushedIds),
  };
}

function makeStageCell(inst: ParsedInstruction, cycle: number, stage: Stage): PipelineCell {
  let what = "";
  switch (stage) {
    case "IF":
      what = "fetched from memory";
      break;
    case "ID":
      what = "decoded; register operands read";
      break;
    case "EX":
      what = "executes in the ALU";
      break;
    case "MEM":
      what =
        inst.type === "LOAD"
          ? "reads from data memory"
          : inst.type === "STORE"
          ? "writes to data memory"
          : "passes through MEM (no access)";
      break;
    case "WB":
      what = inst.dest
        ? `writes ${inst.dest} back to the register file`
        : "passes through WB (no register write)";
      break;
  }
  return {
    instructionId: inst.id,
    cycle,
    stage,
    explanation: `${inst.opcode} (#${inst.id + 1}) is ${what}.`,
  };
}
