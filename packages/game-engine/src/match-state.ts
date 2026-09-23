import type { MatchId, RoundId, Seat, TeamId } from "./rules/types.js";
import { rotateDealer } from "./dealing/deal-engine.js";
import { evaluateMatchEnd } from "./scoring/scoring-engine.js";
import type { MatchEndResult, MatchScore, RoundScoreBreakdown } from "./scoring/scoring-types.js";

export type MatchPhase = "ROUND_ACTIVE" | "ROUND_COMPLETE" | "MATCH_COMPLETE";

export interface MatchState {
  readonly matchId: MatchId;
  readonly roundId: RoundId;
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
  readonly phase: MatchPhase;
  readonly stateVersion: number;
  readonly score: MatchScore;
  readonly lastRoundScore: RoundScoreBreakdown | null;
  readonly end: MatchEndResult;
}

export function createMatchState(matchId: MatchId, dealerSeat: Seat, roundNumber = 1): MatchState {
  if (roundNumber < 1 || !Number.isInteger(roundNumber)) throw new Error("Round number must be a positive integer");
  const score: MatchScore = { NORTH_SOUTH: 0, EAST_WEST: 0 };
  return { matchId, roundId: createRoundId(matchId, roundNumber), roundNumber, dealerSeat, phase: "ROUND_ACTIVE", score, lastRoundScore: null, end: { status: "ONGOING", score } };
}

export function completeMatchRound(state: MatchState, roundScore: RoundScoreBreakdown): MatchState {
  if (state.phase !== "ROUND_ACTIVE") throw new Error("Only an active round can be completed");
  const score: MatchScore = {
    NORTH_SOUTH: state.score.NORTH_SOUTH + roundScore.finalQaid.NORTH_SOUTH,
    EAST_WEST: state.score.EAST_WEST + roundScore.finalQaid.EAST_WEST,
  };
  const end = evaluateMatchEnd(score);
  return { ...state, phase: end.status === "FINISHED" ? "MATCH_COMPLETE" : "ROUND_COMPLETE", score, lastRoundScore: roundScore, end };
}

export function startNextRound(state: MatchState): MatchState {
  if (state.phase !== "ROUND_COMPLETE") throw new Error("Next round requires a completed non-final round");
  const roundNumber = state.roundNumber + 1;
  const dealerSeat = rotateDealer(state.dealerSeat);
  return { ...state, roundId: createRoundId(state.matchId, roundNumber), roundNumber, dealerSeat, phase: "ROUND_ACTIVE", lastRoundScore: null, end: { status: "ONGOING", score: state.score } };
}

export function isMatchFinished(state: MatchState): boolean {
  return state.phase === "MATCH_COMPLETE" && state.end.status === "FINISHED";
}

export function winningTeam(state: MatchState): TeamId | null {
  return state.end.status === "FINISHED" ? state.end.winnerTeamId : null;
}

function createRoundId(matchId: string, roundNumber: number): RoundId {
  return `${matchId}:round:${roundNumber}`;
}
