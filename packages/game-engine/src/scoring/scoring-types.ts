import type { CardId, Contract, EscalationLevel, TeamId, Seat } from "../rules/types.js";
import type { CompletedTrick } from "../playing/types.js";

export interface RoundScoreInput {
  readonly contract: Contract;
  readonly trumpSuit: import("../cards.js").Suit | null;
  readonly purchaserSeat: Seat;
  readonly dealerSeat: Seat;
  readonly buyerOriginallyHeldAce: boolean;
  readonly escalation: EscalationLevel;
  readonly tricks: readonly CompletedTrick[];
  readonly projectRaw: Readonly<Record<TeamId, number>>;
  readonly projectQaid: Readonly<Record<TeamId, number>>;
  readonly balootRaw: Readonly<Record<TeamId, number>>;
  readonly balootQaid: Readonly<Record<TeamId, number>>;
  readonly reverseKaboot?: boolean;
  readonly gahwa?: boolean;
}

export type ContractResult = "SUCCESS" | "FAILURE";

export interface RoundScoreBreakdown {
  readonly cardRaw: Readonly<Record<TeamId, number>>;
  readonly projectRaw: Readonly<Record<TeamId, number>>;
  readonly balootRaw: Readonly<Record<TeamId, number>>;
  readonly contractRaw: Readonly<Record<TeamId, number>>;
  readonly contractResult: ContractResult;
  readonly convertedQaid: Readonly<Record<TeamId, number>>;
  readonly projectQaid: Readonly<Record<TeamId, number>>;
  readonly balootQaid: Readonly<Record<TeamId, number>>;
  readonly finalQaid: Readonly<Record<TeamId, number>>;
  readonly kabootTeamId: TeamId | null;
  readonly reverseKaboot: boolean;
  readonly gahwa: boolean;
}

export interface MatchScore {
  readonly NORTH_SOUTH: number;
  readonly EAST_WEST: number;
}

export type MatchEndResult =
  | { readonly status: "ONGOING"; readonly score: MatchScore }
  | { readonly status: "FINISHED"; readonly score: MatchScore; readonly winnerTeamId: TeamId }
  | { readonly status: "EXTRA_DEAL"; readonly score: MatchScore };
