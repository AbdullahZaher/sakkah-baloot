import type { CardId } from "../cards.js";
import { DECK } from "../cards.js";
import type { TeamId } from "../rules/types.js";
import type { GameState } from "../playing/types.js";
import type { RoundScoreBreakdown } from "../scoring/scoring-types.js";

export function assertPlayingStateInvariants(state: GameState): void {
  const all: CardId[] = [];
  for (const hand of Object.values(state.hands)) all.push(...hand.map((c) => c.id));
  for (const play of state.currentTrick) all.push(play.card.id);
  for (const trick of state.completedTricks) for (const play of trick.plays) all.push(play.card.id);

  if (all.length !== DECK.length) throw new Error(`Card conservation violated: ${all.length}`);
  if (new Set(all).size !== DECK.length) throw new Error("Duplicate card across hands/table/history");
  const deckIds = new Set(DECK.map((c) => c.id));
  for (const id of all) if (!deckIds.has(id)) throw new Error(`Unknown card: ${id}`);

  if (state.completedTricks.length > 8) throw new Error("Too many completed tricks");
  for (const trick of state.completedTricks) {
    if (trick.plays.length !== 4) throw new Error("Completed trick must contain four cards");
    if (!trick.plays.some((p) => p.seat === trick.winnerSeat)) throw new Error("Trick winner is not a participant");
  }
  if (state.currentTrick.length > 3) throw new Error("Current trick cannot contain four committed cards");
  if (state.phase === "PLAYING" && !state.players[state.currentPlayerId]) throw new Error("Current player is missing");
}

export function assertRoundScoreInvariants(score: RoundScoreBreakdown): void {
  const teams: readonly TeamId[] = ["NORTH_SOUTH", "EAST_WEST"];
  for (const team of teams) {
    for (const value of [
      score.cardRaw[team], score.projectRaw[team], score.balootRaw[team],
      score.contractRaw[team], score.convertedQaid[team], score.projectQaid[team],
      score.balootQaid[team], score.finalQaid[team],
    ]) {
      if (!Number.isInteger(value) || value < 0) throw new Error(`Invalid score component for ${team}`);
    }
  }
  const expectedCardTotal = score.cardRaw.NORTH_SOUTH + score.cardRaw.EAST_WEST;
  if (expectedCardTotal !== 140 && expectedCardTotal !== 162) {
    throw new Error(`Invalid final card raw total: ${expectedCardTotal}`);
  }
}
