import type { BalootDeclaration } from "./projects/baloot.js";
import type { ProjectDeclaration } from "./projects/project-engine.js";
import type { BiddingState } from "./bidding/bidding-engine.js";
import type { DealState } from "./dealing/deal-engine.js";
import type { GameState } from "./playing/types.js";
import type { RoundScoreBreakdown } from "./scoring/scoring-types.js";
import type { RoundId, Seat } from "./rules/types.js";

export type RoundPhase =
  | "DEAL"
  | "BIDDING"
  | "PLAYING"
  | "ROUND_COMPLETE";

export interface RoundState {
  readonly roundId: RoundId;
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
  readonly phase: RoundPhase;
  readonly deal: DealState;
  readonly bidding: BiddingState;
  readonly game: GameState | null;
  readonly projects: readonly ProjectDeclaration[];
  readonly baloot: BalootDeclaration | null;
  readonly score: RoundScoreBreakdown | null;
}

export function createRoundState(
  deal: DealState,
  bidding: BiddingState,
  roundNumber: number,
): RoundState {
  return {
    roundId: deal.roundId,
    roundNumber,
    dealerSeat: deal.dealerSeat,
    phase: "BIDDING",
    deal,
    bidding,
    game: null,
    projects: [],
    baloot: null,
    score: null,
  };
}

export function withRoundGame(
  state: RoundState,
  game: GameState,
): RoundState {
  if (state.phase !== "BIDDING") {
    throw new Error("A round can only enter PLAYING from BIDDING");
  }

  return {
    ...state,
    phase: "PLAYING",
    game,
  };
}

export function withRoundProjects(
  state: RoundState,
  projects: readonly ProjectDeclaration[],
): RoundState {
  if (state.phase !== "PLAYING") {
    throw new Error("Projects require an active playing round");
  }

  return {
    ...state,
    projects: [...projects],
  };
}

export function withRoundBaloot(
  state: RoundState,
  baloot: BalootDeclaration,
): RoundState {
  if (state.phase !== "PLAYING") {
    throw new Error("Baloot requires an active playing round");
  }

  return {
    ...state,
    baloot,
  };
}

export function completeRoundState(
  state: RoundState,
  score: RoundScoreBreakdown,
): RoundState {
  if (state.phase !== "PLAYING" || state.game?.phase !== "ROUND_COMPLETE") {
    throw new Error("Round can only complete after all tricks are finished");
  }

  return {
    ...state,
    phase: "ROUND_COMPLETE",
    score,
  };
}
