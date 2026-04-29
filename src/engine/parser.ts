import type { InstructionType, ParsedInstruction } from "./types";

export class ParseError extends Error {
  constructor(public lineNumber: number, message: string) {
    super(`Line ${lineNumber}: ${message}`);
    this.name = "ParseError";
  }
}

const REGISTER_RE = /^[Rr](\d{1,2})$/;

function normalizeRegister(token: string, lineNumber: number): string {
  const m = token.match(REGISTER_RE);
  if (!m) {
    throw new ParseError(lineNumber, `Expected register (R0-R31), got "${token}"`);
  }
  const n = parseInt(m[1], 10);
  if (n < 0 || n > 31) {
    throw new ParseError(lineNumber, `Register R${n} out of range (R0-R31)`);
  }
  return `R${n}`;
}

function parseImmediate(token: string, lineNumber: number): number {
  if (!/^-?\d+$/.test(token)) {
    throw new ParseError(lineNumber, `Expected integer immediate, got "${token}"`);
  }
  return parseInt(token, 10);
}

/**
 * Splits a comma-separated operand list, allowing flexible whitespace.
 * Preserves "offset(reg)" syntax as a single token.
 */
function splitOperands(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function parseMemoryOperand(token: string, lineNumber: number): { offset: number; base: string } {
  const m = token.match(/^(-?\d+)\s*\(\s*([Rr]\d{1,2})\s*\)$/);
  if (!m) {
    throw new ParseError(
      lineNumber,
      `Expected memory operand "offset(Rs)", got "${token}"`
    );
  }
  return {
    offset: parseInt(m[1], 10),
    base: normalizeRegister(m[2], lineNumber),
  };
}

/**
 * Parses a full assembly program (one instruction per line).
 * Strips comments (// ...), label prefixes ("foo: ADD ..."), and blank lines.
 * Throws ParseError on malformed instructions.
 */
export function parseProgram(source: string): ParsedInstruction[] {
  const rawLines = source.split(/\r?\n/);
  const instructions: ParsedInstruction[] = [];
  let id = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    let line = rawLines[i];

    // Strip line comments
    const commentIdx = line.indexOf("//");
    if (commentIdx >= 0) line = line.slice(0, commentIdx);

    line = line.trim();
    if (!line) continue;

    // Strip label prefix (e.g., "target: ADD R6, R6, R6" or just "target:")
    const labelMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (labelMatch) {
      line = labelMatch[2].trim();
      if (!line) continue; // line that's only a label
    }

    instructions.push(parseInstruction(line, lineNumber, id++));
  }

  return instructions;
}

function parseInstruction(line: string, lineNumber: number, id: number): ParsedInstruction {
  // Split opcode from rest
  const m = line.match(/^([A-Za-z]+)\s*(.*)$/);
  if (!m) throw new ParseError(lineNumber, `Could not parse instruction "${line}"`);
  const opcode = m[1].toUpperCase();
  const rest = m[2].trim();
  const operands = rest ? splitOperands(rest) : [];

  const base = (
    type: InstructionType,
    fields: Partial<ParsedInstruction>
  ): ParsedInstruction => ({
    id,
    raw: line,
    opcode,
    sources: [],
    type,
    ...fields,
  });

  switch (opcode) {
    case "ADD":
    case "SUB":
    case "NAND": {
      if (operands.length !== 3) {
        throw new ParseError(
          lineNumber,
          `${opcode} expects 3 operands (Rd, Rs, Rt), got ${operands.length}`
        );
      }
      return base("ALU", {
        dest: normalizeRegister(operands[0], lineNumber),
        sources: [
          normalizeRegister(operands[1], lineNumber),
          normalizeRegister(operands[2], lineNumber),
        ],
      });
    }

    case "ADDI": {
      if (operands.length !== 3) {
        throw new ParseError(
          lineNumber,
          `ADDI expects 3 operands (Rd, Rs, imm), got ${operands.length}`
        );
      }
      return base("ALU", {
        dest: normalizeRegister(operands[0], lineNumber),
        sources: [normalizeRegister(operands[1], lineNumber)],
        immediate: parseImmediate(operands[2], lineNumber),
      });
    }

    case "LW": {
      if (operands.length !== 2) {
        throw new ParseError(
          lineNumber,
          `LW expects 2 operands (Rd, offset(Rs)), got ${operands.length}`
        );
      }
      const { offset, base: baseReg } = parseMemoryOperand(operands[1], lineNumber);
      return base("LOAD", {
        dest: normalizeRegister(operands[0], lineNumber),
        sources: [baseReg],
        immediate: offset,
      });
    }

    case "SW": {
      if (operands.length !== 2) {
        throw new ParseError(
          lineNumber,
          `SW expects 2 operands (Rt, offset(Rs)), got ${operands.length}`
        );
      }
      const { offset, base: baseReg } = parseMemoryOperand(operands[1], lineNumber);
      // Standard MIPS-style: SW Rt, offset(Rs) — Rt is value, Rs is base.
      return base("STORE", {
        sources: [normalizeRegister(operands[0], lineNumber), baseReg],
        immediate: offset,
      });
    }

    case "BEQ": {
      if (operands.length !== 3) {
        throw new ParseError(
          lineNumber,
          `BEQ expects 3 operands (Rs, Rt, label), got ${operands.length}`
        );
      }
      return base("BRANCH", {
        sources: [
          normalizeRegister(operands[0], lineNumber),
          normalizeRegister(operands[1], lineNumber),
        ],
        label: operands[2],
      });
    }

    case "NOP":
    case "NOOP": {
      return base("NOP", { opcode: "NOP" });
    }

    default:
      throw new ParseError(lineNumber, `Unknown opcode "${opcode}"`);
  }
}
