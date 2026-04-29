# CS 2200 Pipeline Visualizer

An interactive teaching tool for the classic 5-stage pipelined processor used
in CS 2200. Enter assembly-like instructions and see exactly how RAW hazards,
forwarding, load-use stalls, and branch flushes play out cycle by cycle.

## Setup

```bash
npm install
npm run dev
```

Then open the dev server URL printed in the console (usually
[http://localhost:5173](http://localhost:5173)).

### Other scripts

- `npm test` — run unit tests for the parser and simulator.
- `npm run build` — type-check and produce a production bundle in `dist/`.
- `npm run preview` — preview the production bundle locally.

## Pipeline stages

```
IF → ID → EX → MEM → WB
```

| Stage | Meaning                    |
| ----- | -------------------------- |
| IF    | Instruction Fetch          |
| ID    | Decode / Register Read     |
| EX    | Execute / ALU              |
| MEM   | Memory Access              |
| WB    | Write Back                 |

## Supported instructions

| Instruction         | Format               | Destination | Sources             | Type   |
| ------------------- | -------------------- | ----------- | ------------------- | ------ |
| `ADD Rd, Rs, Rt`    | three-register ALU   | Rd          | Rs, Rt              | ALU    |
| `SUB Rd, Rs, Rt`    | three-register ALU   | Rd          | Rs, Rt              | ALU    |
| `NAND Rd, Rs, Rt`   | three-register ALU   | Rd          | Rs, Rt              | ALU    |
| `ADDI Rd, Rs, imm`  | ALU with immediate   | Rd          | Rs                  | ALU    |
| `LW Rd, offset(Rs)` | load                 | Rd          | Rs (base)           | LOAD   |
| `SW Rt, offset(Rs)` | store (MIPS order)   | —           | Rt (value), Rs (base) | STORE |
| `BEQ Rs, Rt, label` | branch (taken)       | —           | Rs, Rt              | BRANCH |
| `NOP` / `NOOP`      | no-op                | —           | —                   | NOP    |

- Opcodes and registers are case-insensitive.
- Registers are `R0`–`R31`.
- Lines may be prefixed with a label (`target: ADD R1, R2, R3`); the label is
  stripped before parsing. `BEQ`'s label operand is stored but not resolved —
  branches are always treated as **taken** for the visualization.
- `// ...` comments are stripped; blank lines and label-only lines are ignored.

## Hazards modeled

### RAW (Read-After-Write)

A later instruction needs a register that an earlier instruction writes.

- **Without forwarding** — the consumer stalls in ID until the producer's WB
  completes. Adjacent dependencies cost two stall cycles.
- **With forwarding** — ALU results are forwarded `EX/MEM → EX` (immediate
  consumer) or `MEM/WB → EX` (one instruction in between). No stall.

### Load-use

Even with forwarding, an `LW` whose result is needed by the very next
instruction requires exactly one bubble: the loaded value isn't ready until
the end of MEM, one cycle too late for the consumer's EX. After the bubble,
`MEM/WB → EX` forwarding delivers the value.

### Control (branches)

`BEQ` is treated as taken. Instructions fetched between the branch and the
configured resolution stage are speculatively executed and then **flushed**:

- Resolution at **EX** flushes 1 instruction.
- Resolution at **MEM** flushes 2 instructions.

Disable branch flushing to see what would happen if the processor didn't
squash speculative work.

## How the diagram works

- **Rows** are instructions (top → bottom in source order).
- **Columns** are cycles, starting at cycle 1.
- Click a cycle column header to inspect that cycle in the explanation panel.
- Hover any cell for its tooltip (instruction, stage, hazard, forwarding).
- A cell with a yellow ring and ⚡ icon is receiving a forwarded value.
- `STALL` cells appear between ID and EX when the consumer is waiting.
- `FLUSH` cells (dashed red border) are speculatively-fetched-and-discarded
  instructions.

## Limitations

This is a teaching tool, not a cycle-accurate simulator. Specifically:

- Branches are always treated as taken; no branch prediction is modeled.
- No structural hazards (e.g., single memory port).
- No out-of-order execution, no superscalar issue, no caches.
- The half-cycle write/read trick is assumed (a producer's WB cycle may equal
  its consumer's ID cycle without forwarding).
- The set of supported opcodes is intentionally minimal — enough for CS 2200
  hazard discussion, no more.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Vitest · lucide-react. No
backend, no external services.
