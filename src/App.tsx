import { useEffect, useState } from "react";
import { ControlsPanel } from "./components/ControlsPanel";
import { ExplanationPanel } from "./components/ExplanationPanel";
import { Header } from "./components/Header";
import { InstructionInput } from "./components/InstructionInput";
import { Legend } from "./components/Legend";
import { PipelineDiagram } from "./components/PipelineDiagram";
import { DEFAULT_PROGRAM, PRESETS } from "./data/presets";
import type { SimulationConfig } from "./engine/types";
import { useSimulation } from "./hooks/useSimulation";

const DEFAULT_CONFIG: SimulationConfig = {
  forwardingEnabled: false,
  branchFlushEnabled: true,
  branchResolutionStage: "EX",
};

export default function App() {
  const [source, setSource] = useState(DEFAULT_PROGRAM);
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [showExplanations, setShowExplanations] = useState(true);
  const [stepMode, setStepMode] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [darkMode, setDarkMode] = useState(false);

  const { result, error } = useSimulation(source, config);
  const totalCycles = result?.totalCycles ?? 0;

  // Clamp selected cycle when results change.
  useEffect(() => {
    if (totalCycles === 0) {
      if (selectedCycle !== 1) setSelectedCycle(1);
      return;
    }
    if (selectedCycle > totalCycles) setSelectedCycle(totalCycles);
    if (selectedCycle < 1) setSelectedCycle(1);
  }, [totalCycles, selectedCycle]);

  // Animation tick.
  useEffect(() => {
    if (!isPlaying || !stepMode || totalCycles === 0) return;
    const id = window.setInterval(() => {
      setSelectedCycle((c) => {
        if (c >= totalCycles) {
          setIsPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, animationSpeed);
    return () => window.clearInterval(id);
  }, [isPlaying, stepMode, totalCycles, animationSpeed]);

  // Apply dark mode class to <html>.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Stop playing when step mode is turned off.
  useEffect(() => {
    if (!stepMode) setIsPlaying(false);
  }, [stepMode]);

  // Keyboard shortcuts: ←/→ step through cycles when step mode is on.
  useEffect(() => {
    if (!stepMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedCycle((c) => Math.max(1, c - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedCycle((c) => Math.min(totalCycles || 1, c + 1));
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stepMode, totalCycles]);

  const visibleCycle = stepMode ? selectedCycle : totalCycles;

  const handleClear = () => setSource("");

  const handleLoadPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (p) {
      setSource(p.source);
      setSelectedCycle(1);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => setSelectedCycle((c) => Math.max(1, c - 1));
  const handleNext = () => setSelectedCycle((c) => Math.min(totalCycles || 1, c + 1));

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)} />

      <main className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        {/* Left column */}
        <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <InstructionInput
            source={source}
            onChange={setSource}
            onClear={handleClear}
            onLoadPreset={handleLoadPreset}
            errorMessage={error}
          />
          <div className="min-h-0 flex-1 overflow-hidden">
            <ControlsPanel
              config={config}
              onConfigChange={setConfig}
              showExplanations={showExplanations}
              onToggleExplanations={setShowExplanations}
              stepMode={stepMode}
              onToggleStepMode={setStepMode}
              selectedCycle={selectedCycle}
              totalCycles={totalCycles}
              onPrevCycle={handlePrev}
              onNextCycle={handleNext}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              animationSpeed={animationSpeed}
              onSpeedChange={setAnimationSpeed}
            />
          </div>
        </aside>

        {/* Middle column */}
        <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <PipelineDiagram
              result={result}
              selectedCycle={selectedCycle}
              onSelectCycle={setSelectedCycle}
              visibleCycle={visibleCycle}
            />
          </div>
          <Legend />
        </section>

        {/* Right column */}
        <aside className="flex min-h-0 flex-col overflow-hidden">
          {showExplanations ? (
            <ExplanationPanel result={result} selectedCycle={selectedCycle} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/50 px-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500">
              Explanations are hidden. Toggle them back on in Controls.
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
