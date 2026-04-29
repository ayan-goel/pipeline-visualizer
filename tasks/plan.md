# Implementation Plan — CS 2200 Pipeline Visualizer

## Strategy

**Vertical slices.** Each slice goes input → simulation → render. We don't build "all parsing, then all simulation, then all UI." We build a thin end-to-end pipeline first, then add features by extending it through every layer.

**Why:** Demoing the app at any checkpoint should produce something visibly working. Bugs surface early because every slice exercises the full path.

---

## Dependency Graph

```
                  ┌───────────────┐
                  │ Slice 0:      │
                  │ Scaffold      │
                  └───────┬───────┘
                          │
                  ┌───────▼───────┐
                  │ Slice 1:      │
                  │ Types +       │
                  │ Parser (ADD)  │
                  └───────┬───────┘
                          │
                  ┌───────▼───────┐
                  │ Slice 2:      │
                  │ Parser (all   │
                  │ instructions) │
                  └───────┬───────┘
                          │
                  ┌───────▼───────┐
                  │ Slice 3:      │
                  │ End-to-end    │
                  │ no-hazard     │
                  │ render        │
                  └───────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│ Slice 4:      │ │ Slice 6:      │ │ Slice 7:      │
│ RAW (stall)   │ │ Load-use      │ │ Branch flush  │
└───────┬───────┘ │ (depends on 5)│ └───────────────┘
        │         └───────┬───────┘
┌───────▼───────┐         │
│ Slice 5:      │◄────────┘
│ Forwarding    │
└───────┬───────┘
        │
┌───────▼───────┐
│ ── CHECKPOINT 1: All hazards working ──
└───────┬───────┘
        │
┌───────▼───────┐
│ Slice 8:      │
│ Controls      │
└───────┬───────┘
        │
┌───────▼───────┐
│ Slice 9:      │
│ Explanation + │
│ tooltips +    │
│ cycle select  │
└───────┬───────┘
        │
┌───────▼───────┐
│ Slice 10:     │
│ Presets +     │
│ legend +      │
│ teaching      │
│ notes         │
└───────┬───────┘
        │
┌───────▼───────┐
│ ── CHECKPOINT 2: Feature complete ──
└───────┬───────┘
        │
┌───────▼───────┐
│ Slice 11:     │
│ Step mode +   │
│ animation     │
└───────┬───────┘
        │
┌───────▼───────┐
│ Slice 12:     │
│ Dark mode +   │
│ polish +      │
│ README        │
└───────┬───────┘
        │
   ── DONE ──
```

---

## Phase 1: Foundation

### Slice 0 — Project Scaffold
**Goal:** A working Vite dev server with React + TS + Tailwind. Blank page renders with a styled header.

**Files created:**
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
- `tailwind.config.js`, `postcss.config.js`
- `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Acceptance criteria:**
- `npm install && npm run dev` starts without errors
- Page shows "CS 2200 Pipeline Visualizer" header with Tailwind styling
- TypeScript strict mode enabled

**Verify:**
- `npm run dev` then open http://localhost:5173
- Header is visible, styled
- No console errors

---

## Phase 2: Engine Skeleton

### Slice 1 — Types + Parser (ADD only)
**Goal:** All TypeScript types defined. Parser handles `ADD Rd, Rs, Rt`. Vitest configured.

**Files created:**
- `src/engine/types.ts` — all interfaces from SPEC §5
- `src/engine/parser.ts` — exports `parseProgram(source: string): ParsedInstruction[]`
- `src/engine/parser.test.ts` — tests for ADD parsing
- `vitest.config.ts`

**Acceptance criteria:**
- `parseProgram("ADD R1, R2, R3")` returns `[{id: 0, raw: "ADD R1, R2, R3", opcode: "ADD", dest: "R1", sources: ["R2","R3"], type: "ALU"}]`
- Case-insensitive opcode/registers
- Whitespace tolerance
- `npm test` passes

**Verify:**
- Run `npm test` — parser tests pass

---

### Slice 2 — Parser (All Instructions)
**Goal:** Parser handles all 8 instruction types per SPEC §2.

**Files modified:**
- `src/engine/parser.ts`
- `src/engine/parser.test.ts`

**Acceptance criteria:**
- Handles ADD, SUB, NAND, ADDI, LW, SW, BEQ, NOP/NOOP
- LW: `LW R6, 0(R1)` → `{dest: "R6", sources: ["R1"], type: "LOAD"}`
- SW (standard): `SW R6, 0(R1)` → `{sources: ["R6","R1"], type: "STORE"}` — Rt is value, Rs is base
- BEQ: `BEQ R7, R0, label` → `{sources: ["R7","R0"], type: "BRANCH"}`, label stored but not resolved
- Labels: `target: ADD R6, R6, R6` parses as ADD with label prefix stripped
- Lines containing only a label are ignored
- Blank lines ignored
- Invalid instructions throw a clear error with line number

**Verify:**
- All parser tests pass for every instruction type

---

## Phase 3: End-to-End Baseline

### Slice 3 — No-Hazard Pipeline (Full Vertical Slice)
**Goal:** First end-to-end working app. Textarea → parse → simulate (no hazards yet) → grid renders with IF/ID/EX/MEM/WB.

**Files created:**
- `src/engine/simulator.ts` — exports `simulate(insts, config): SimulationResult`
- `src/engine/simulator.test.ts`
- `src/components/InstructionInput.tsx`
- `src/components/PipelineDiagram.tsx`
- `src/components/PipelineCell.tsx`
- `src/hooks/useSimulation.ts`

**Files modified:**
- `src/App.tsx` — wire up input + diagram

**Acceptance criteria:**
- Default 4-instruction no-hazard preset produces a clean diagonal stagger:
  - I0: cycles 1-5 (IF,ID,EX,MEM,WB)
  - I1: cycles 2-6
  - I2: cycles 3-7
  - I3: cycles 4-8
- Each stage renders with correct color (light blue, purple, orange, green, gray)
- Sticky row labels show instruction text in monospace
- Sticky cycle headers show 1, 2, 3, ...
- Empty cells render blank

**Verify:**
- Manually: load default no-hazard preset, see clean stagger
- `simulate` unit test confirms cell layout for 4 independent ALU instructions

---

## Phase 4: Hazards

### Slice 4 — RAW Hazard (No Forwarding)
**Goal:** Detect RAW hazards and insert stalls when forwarding is disabled.

**Files modified:**
- `src/engine/simulator.ts` — add stall logic
- `src/engine/hazards.ts` — extracted hazard detection helpers
- `src/engine/simulator.test.ts`

**Acceptance criteria:**
- For `ADD R1,R2,R3 / SUB R4,R1,R5` without forwarding:
  - SUB stalls in ID until ADD reaches WB
  - 2 STALL cells inserted in SUB's row (cycles 4, 5)
  - SUB's EX is at cycle 6 (after ADD's WB at cycle 5)
- STALL cells render in red/pink with "STALL" text
- Downstream instructions are correctly delayed
- HazardInfo recorded for each stall

**Verify:**
- Unit test: 2-instruction RAW dependency produces correct stall count
- Manually: load RAW preset with forwarding off, see stalls

---

### Slice 5 — Forwarding
**Goal:** When forwarding enabled, ALU-to-ALU RAW hazards are resolved without stalls.

**Files modified:**
- `src/engine/simulator.ts` — forwarding logic
- `src/engine/simulator.test.ts`

**Acceptance criteria:**
- For `ADD R1,R2,R3 / SUB R4,R1,R5` with forwarding:
  - No stalls
  - ForwardingInfo annotation present: `{from: 0, to: 1, register: "R1", fromStage: "EX/MEM", toStage: "EX"}`
- For 3-deep dependency chain with forwarding: still no stalls (uses MEM/WB forward when needed)
- Cells with incoming forwarding render with yellow outline
- Forwarding badge "FWD R1: ADD → SUB" visible (rendered later in Slice 9, but data is available)

**Verify:**
- Unit test: RAW dependency with forwarding has 0 stalls + ForwardingInfo
- Toggling forwarding on/off in UI changes diagram

---

### Slice 6 — Load-Use Hazard
**Goal:** LW followed by use of loaded register always produces 1 stall, even with forwarding.

**Files modified:**
- `src/engine/simulator.ts`
- `src/engine/simulator.test.ts`

**Acceptance criteria:**
- For `LW R1,0(R2) / ADD R3,R1,R4` with forwarding:
  - Exactly 1 stall in ADD's row
  - ADD's EX at cycle 5 (LW's MEM is cycle 4, forward MEM/WB → EX)
  - HazardInfo type = "LOAD_USE"
- For LW followed by independent instruction: no stall
- For LW followed by 2 instructions where the 2nd uses the result: no stall (the gap is enough)

**Verify:**
- Unit test: LW + dependent ADD = 1 stall with forwarding
- Unit test: LW + independent + dependent = 0 stalls

---

### Slice 7 — Branch Flush
**Goal:** BEQ flushes speculatively fetched instructions when flushing is enabled.

**Files modified:**
- `src/engine/simulator.ts`
- `src/engine/simulator.test.ts`

**Acceptance criteria:**
- BEQ at instruction i, resolution at EX, flushing on:
  - Instruction i+1 marked FLUSH (its IF cell becomes FLUSH)
- BEQ at instruction i, resolution at MEM, flushing on:
  - Instructions i+1 and i+2 marked FLUSH
- FLUSH cells render with dashed red border
- Flushing off: no flushes, no special rendering
- HazardInfo type = "CONTROL" recorded

**Verify:**
- Unit test: branch with EX resolution flushes 1
- Unit test: branch with MEM resolution flushes 2
- Unit test: flushing off preserves all instructions

### ✅ CHECKPOINT 1: All hazards working
- Run all unit tests: `npm test`
- Manually verify all 4 presets produce expected diagrams
- Toggle forwarding/flushing/resolution-stage and confirm visible changes

---

## Phase 5: UI Features

### Slice 8 — Controls Panel
**Goal:** Wire all config toggles to the simulation.

**Files created:**
- `src/components/ControlsPanel.tsx`

**Files modified:**
- `src/App.tsx`

**Acceptance criteria:**
- Toggle: Enable forwarding (default off)
- Toggle: Enable branch flushing (default on)
- Select: Branch resolution stage (EX | MEM, default EX)
- Toggle: Show explanations (default on)
- Toggle: Step mode (default off) — wires up in Slice 11
- All toggles update simulation immediately

**Verify:**
- Manually toggle each control, see diagram update

---

### Slice 9 — Explanation Panel + Tooltips + Cycle Selection
**Goal:** User can click a cycle column or hover a cell and see hazard/forwarding explanations.

**Files created:**
- `src/components/ExplanationPanel.tsx`

**Files modified:**
- `src/components/PipelineCell.tsx` — tooltip on hover
- `src/components/PipelineDiagram.tsx` — selected cycle highlight, click to select
- `src/App.tsx` — selectedCycle state

**Acceptance criteria:**
- Hovering a cell shows tooltip with: instruction text, stage name, hazard explanation, forwarding explanation
- Clicking a cycle column highlights it (visible border/background on column)
- Selected cycle's explanations appear in the explanation panel:
  - What each active instruction is doing
  - Hazards detected this cycle
  - Forwarding paths active
- Forwarding badges visible on cells: "FWD R1: ADD → SUB"
- Show explanations toggle hides/shows the panel

**Verify:**
- Manually hover cells, see correct tooltips
- Click cycle columns, see explanation update

---

### Slice 10 — Presets + Legend + Teaching Notes
**Goal:** Quick-load preset buttons + visible legend + "what students should notice" section.

**Files created:**
- `src/data/presets.ts`
- `src/components/Legend.tsx`
- `src/components/TeachingNotes.tsx`

**Files modified:**
- `src/components/InstructionInput.tsx` — preset buttons
- `src/App.tsx`

**Acceptance criteria:**
- 4 preset buttons load corresponding instruction sets:
  - RAW Hazard
  - Load-Use
  - Branch
  - (Default no-hazard already in textarea)
- Clear button empties textarea
- Legend shows color/style key for all stage types and forwarding/flush
- Teaching notes section displays the 5 bullets from SPEC §6.6

**Verify:**
- Click each preset → textarea populates → simulation updates
- Clear button works
- Legend visible and accurate

### ✅ CHECKPOINT 2: Feature complete (MVP)
- All hazard scenarios visualizable
- All UI panels present and wired
- All 4 presets produce correct diagrams
- Tooltips work, explanations are accurate

---

## Phase 6: Polish

### Slice 11 — Step Mode + Animation
**Goal:** Step through cycles one at a time, optionally animate playback.

**Files modified:**
- `src/components/ControlsPanel.tsx` — prev/next/play/speed slider
- `src/App.tsx` — step state, animation interval

**Acceptance criteria:**
- Step mode toggle reveals: Previous, Next, Play/Pause, Speed slider
- In step mode, only cycles up to the selected cycle are revealed in the diagram
- Play animates from cycle 1 to total cycles, then stops
- Speed slider controls interval (e.g., 100ms–2000ms)
- Pause halts animation; Play resumes from current cycle
- Prev/Next buttons increment/decrement selected cycle (clamped)

**Verify:**
- Manually use step mode, animate playback at different speeds

---

### Slice 12 — Dark Mode + Polish + README
**Goal:** Production polish.

**Files created:**
- `README.md`

**Files modified:**
- `src/App.tsx` — dark mode toggle
- `src/index.css` / `tailwind.config.js` — dark mode classes
- All components — dark mode color variants

**Acceptance criteria:**
- Dark mode toggle in header switches theme
- All colors have dark mode variants (cells still readable)
- Responsive: works on 1280px+ without horizontal scroll except in pipeline grid (which scrolls)
- README includes:
  - Setup: `npm install && npm run dev`
  - Supported instructions
  - Hazard explanations
  - Limitations (no out-of-order, no branch prediction, BEQ always taken)
- Comments in `simulator.ts` explain pipeline timing decisions

**Verify:**
- Toggle dark mode, all panels readable
- README renders correctly on GitHub-style preview
- Final demo run-through: load each preset, toggle each control, all works

---

## Out of Scope (Nice-to-Have, Defer)

- PNG export
- Copy explanation button
- Interview mode
- Keyboard shortcuts

These should only be added after Slice 12 if time permits.

---

## Testing Approach

- **Unit tests** for `parser.ts` and `simulator.ts` written alongside each slice
- **Manual UI testing** at every checkpoint
- **Vitest** runs in watch mode during development
- Final acceptance: run `npm test` (all green) + manually walk through SPEC §14 acceptance criteria

---

## Risks

| Risk | Mitigation |
|---|---|
| Stall logic edge cases (3+ deep dependency chains) | Test deep chains explicitly in Slice 5 |
| Forwarding + load-use interaction subtle bugs | Slice 6 tests both together |
| Sticky headers with complex CSS | Use simple `position: sticky` + Tailwind; fall back to non-sticky if issues |
| Dark mode reveals contrast issues | Test each color in dark mode at Slice 12 |
| Vitest setup issues | Slice 1 establishes tests early — fix any setup issues before more code lands |
