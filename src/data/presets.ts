export interface Preset {
  id: string;
  name: string;
  description: string;
  source: string;
}

export const DEFAULT_PROGRAM = `ADD R1, R2, R3
SUB R4, R1, R5
LW R6, 0(R1)
ADD R7, R6, R8
BEQ R7, R0, label
ADD R9, R9, R1`;

export const PRESETS: Preset[] = [
  {
    id: "raw",
    name: "RAW Hazard",
    description:
      "Adjacent ALU instructions where the second reads a register the first writes — classic forwarding example.",
    source: `ADD R1, R2, R3
SUB R4, R1, R5
ADD R6, R4, R7`,
  },
  {
    id: "loaduse",
    name: "Load-Use",
    description:
      "LW followed immediately by an ADD that uses the loaded value — needs a stall even with forwarding.",
    source: `LW R1, 0(R2)
ADD R3, R1, R4
SUB R5, R3, R6`,
  },
  {
    id: "branch",
    name: "Branch",
    description:
      "Branch with speculatively fetched instructions — flushed when the branch resolves.",
    source: `ADD R1, R2, R3
BEQ R1, R0, target
ADD R4, R4, R4
SUB R5, R5, R5
target: ADD R6, R6, R6`,
  },
  {
    id: "clean",
    name: "No Hazard",
    description: "Four independent instructions — clean diagonal pipeline.",
    source: `ADD R1, R2, R3
SUB R4, R5, R6
NAND R7, R8, R9
ADDI R10, R11, 4`,
  },
];
