export type Stage =
  | "IF"
  | "ID"
  | "EX"
  | "MEM"
  | "WB"
  | "STALL"
  | "BUBBLE"
  | "FLUSH";

export type InstructionType = "ALU" | "LOAD" | "STORE" | "BRANCH" | "NOP";

export interface ParsedInstruction {
  id: number;
  raw: string;
  opcode: string;
  dest?: string;
  sources: string[];
  immediate?: number;
  label?: string;
  type: InstructionType;
}

export interface HazardInfo {
  type: "RAW" | "LOAD_USE" | "CONTROL";
  register?: string;
  producerInstructionId?: number;
  consumerInstructionId?: number;
  message: string;
}

export interface ForwardingInfo {
  fromInstructionId: number;
  toInstructionId: number;
  register: string;
  fromStage: "EX/MEM" | "MEM/WB";
  toStage: "EX";
  message: string;
}

export interface PipelineCell {
  instructionId: number;
  cycle: number;
  stage: Stage;
  hazard?: HazardInfo;
  forwarding?: ForwardingInfo;
  explanation?: string;
}

export interface SimulationConfig {
  forwardingEnabled: boolean;
  branchFlushEnabled: boolean;
  branchResolutionStage: "EX" | "MEM";
}

export interface SimulationResult {
  instructions: ParsedInstruction[];
  cells: PipelineCell[];
  totalCycles: number;
  hazards: HazardInfo[];
  forwardings: ForwardingInfo[];
  flushedInstructionIds: number[];
}
