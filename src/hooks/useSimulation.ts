import { useMemo } from "react";
import { ParseError, parseProgram } from "../engine/parser";
import { simulate } from "../engine/simulator";
import type { SimulationConfig, SimulationResult } from "../engine/types";

export interface SimulationState {
  result: SimulationResult | null;
  error: string | null;
}

export function useSimulation(source: string, config: SimulationConfig): SimulationState {
  return useMemo(() => {
    try {
      const insts = parseProgram(source);
      const result = simulate(insts, config);
      return { result, error: null };
    } catch (err) {
      if (err instanceof ParseError) {
        return { result: null, error: err.message };
      }
      return {
        result: null,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }, [source, config]);
}
