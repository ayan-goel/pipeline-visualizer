# Todo — CS 2200 Pipeline Visualizer

Tick off as we go. Each item is one slice from `plan.md`.

## Phase 1: Foundation
- [ ] **Slice 0** — Vite + React + TS + Tailwind scaffold; styled header renders

## Phase 2: Engine Skeleton
- [ ] **Slice 1** — Types defined; parser handles ADD; Vitest configured; tests pass
- [ ] **Slice 2** — Parser handles all 8 instructions (ADD, SUB, NAND, ADDI, LW, SW, BEQ, NOP); labels stripped

## Phase 3: End-to-End Baseline
- [ ] **Slice 3** — End-to-end no-hazard pipeline renders (textarea → parse → simulate → grid with stages)

## Phase 4: Hazards
- [ ] **Slice 4** — RAW hazard without forwarding inserts correct stalls
- [ ] **Slice 5** — Forwarding resolves ALU-to-ALU RAW hazards (no stalls)
- [ ] **Slice 6** — Load-use hazard always inserts exactly 1 stall (even with forwarding)
- [ ] **Slice 7** — Branch flush marks speculative instructions; resolution stage configurable

### ✅ CHECKPOINT 1: All hazards working — run `npm test`, verify all 4 presets

## Phase 5: UI Features
- [ ] **Slice 8** — Controls panel wired (forwarding, flushing, resolution stage, show explanations)
- [ ] **Slice 9** — Explanation panel + cell tooltips + cycle selection + forwarding badges
- [ ] **Slice 10** — Preset buttons + legend + teaching notes section

### ✅ CHECKPOINT 2: Feature complete (MVP)

## Phase 6: Polish
- [ ] **Slice 11** — Step mode + Prev/Next/Play/Pause + speed slider + animation
- [ ] **Slice 12** — Dark mode + responsive polish + README + simulator comments

### ✅ DONE — Final demo walkthrough of all presets and controls

---

## Deferred (post-MVP)
- [ ] PNG export
- [ ] Copy explanation text button
- [ ] Interview mode
- [ ] Keyboard shortcuts (← →)
