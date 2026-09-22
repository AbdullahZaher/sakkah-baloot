import type { Contract, EscalationLevel, Seat } from "./rules/types.js";

export type EscalationWindow =
  | "CLOSED"
  | "HOKUM_AFTER_COMPLETION_DEAL"
  | "SUN_CONTRACT_FINALIZED";

export interface EscalationState {
  readonly contract: Contract;
  readonly level: EscalationLevel;
  readonly window: EscalationWindow;
  readonly initialDoublerSeat: Seat | null;
  readonly lockedPlayMode: "OPEN" | "LOCKED" | null;
}

const NEXT: Readonly<Partial<Record<Exclude<EscalationLevel, "GAHWA">, EscalationLevel>>> = {
  NORMAL: "DOUBLE",
  DOUBLE: "TRIPLE",
  TRIPLE: "FOUR",
  FOUR: "GAHWA",
};

export function createEscalationState(
  contract: Contract,
  window: EscalationWindow,
  lockedPlayMode: "OPEN" | "LOCKED" | null = null,
): EscalationState {
  return {
    contract,
    level: "NORMAL",
    window,
    initialDoublerSeat: null,
    lockedPlayMode,
  };
}

export function canEscalate(state: EscalationState): boolean {
  return state.window !== "CLOSED" && state.level !== "GAHWA";
}

export function escalate(
  state: EscalationState,
  callerSeat: Seat,
  requested: Exclude<EscalationLevel, "NORMAL">,
): EscalationState {
  if (!canEscalate(state)) throw new Error("Escalation window is closed");
  if (state.level === "GAHWA") throw new Error("Escalation cannot continue after Gahwa");

  const expected = NEXT[state.level];
  if (expected !== requested) {
    throw new Error(`Invalid escalation: expected ${expected ?? "none"}`);
  }

  if (state.contract === "SUN" && requested !== "DOUBLE") {
    throw new Error("Sun escalation is limited to Double");
  }

  return {
    ...state,
    level: requested,
    initialDoublerSeat:
      state.level === "NORMAL" ? callerSeat : state.initialDoublerSeat,
  };
}

export function closeEscalation(
  state: EscalationState,
  finalLockedPlayMode: "OPEN" | "LOCKED" | null = state.lockedPlayMode,
): EscalationState {
  return {
    ...state,
    window: "CLOSED",
    lockedPlayMode: finalLockedPlayMode,
  };
}

export function escalationCardMultiplier(level: EscalationLevel): number {
  switch (level) {
    case "NORMAL":
      return 1;
    case "DOUBLE":
      return 2;
    case "TRIPLE":
      return 3;
    case "FOUR":
      return 4;
    case "GAHWA":
      return 1;
  }
}

export function projectMultiplier(
  level: Exclude<EscalationLevel, "GAHWA">,
): number {
  return level === "DOUBLE" ? 2 : 1;
}
