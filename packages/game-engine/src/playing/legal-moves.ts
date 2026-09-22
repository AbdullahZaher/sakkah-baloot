import type { Card, CardId, Suit } from "../cards.js";
import { compareCards, isTrump, cardStrength } from "../cards.js";
import type { PlayerId, Seat } from "../rules/types.js";
import { partnerOfSeat, teamOfSeat } from "../rules/profile.js";
import type { GameState, LegalMove, MoveConstraint, TrickPlay } from "./types.js";

export function getLeadSuit(state: GameState): Suit | null {
  return state.currentTrick[0]?.card.suit ?? null;
}

export function getCurrentWinner(state: GameState): TrickPlay | null {
  if (state.currentTrick.length === 0) return null;
  const led = getLeadSuit(state)!;
  let winner = state.currentTrick[0]!;
  for (let i = 1; i < state.currentTrick.length; i += 1) {
    const candidate = state.currentTrick[i]!;
    if (compareCards(candidate.card, winner.card, state.contract, state.trumpSuit, led) > 0) winner = candidate;
  }
  return winner;
}

function hasLeadSuit(hand: readonly Card[], led: Suit): boolean {
  return hand.some((c) => c.suit === led);
}

function hasTrump(hand: readonly Card[], state: GameState): boolean {
  return state.contract === "HOKUM" && state.trumpSuit !== null && hand.some((c) => isTrump(c, state.contract, state.trumpSuit));
}

function isIkaEligibleLead(card: Card, hand: readonly Card[], state: GameState): boolean {
  if (state.contract !== "HOKUM" || state.trumpSuit === null || isTrump(card, state.contract, state.trumpSuit)) return false;
  if (card.rank === "A") return true;
  const sameSuit = hand.filter((c) => c.suit === card.suit && !isTrump(c, state.contract, state.trumpSuit));
  return sameSuit.every((c) => cardStrength(card, state.contract, state.trumpSuit) >= cardStrength(c, state.contract, state.trumpSuit));
}

function validIkaDeclaration(state: GameState, card: Card): boolean {
  if (state.currentTrick.length !== 0) return false;
  const hand = state.hands[state.currentPlayerId] ?? [];
  return isIkaEligibleLead(card, hand, state);
}

function ikaPartnerExemption(state: GameState): boolean {
  if (state.contract !== "HOKUM" || state.currentTrick.length !== 2) return false;
  const playerSeat = state.players[state.currentPlayerId];
  if (!playerSeat) return false;
  const leader = state.currentTrick[0]!;
  const winner = getCurrentWinner(state);
  if (!winner) return false;
  if (partnerOfSeat(playerSeat) !== leader.seat) return false;
  if (winner.seat !== leader.seat) return false;
  if (state.currentTrick[0]!.ikaDeclared || state.currentTrick[0]!.card.rank === "A") return true;
  return false;
}

function isOpponentWinner(state: GameState, winner: TrickPlay): boolean {
  const playerSeat = state.players[state.currentPlayerId]!;
  return teamOfSeat(playerSeat) !== teamOfSeat(winner.seat);
}

function isPartnerWinner(state: GameState, winner: TrickPlay): boolean {
  const playerSeat = state.players[state.currentPlayerId]!;
  return partnerOfSeat(playerSeat) === winner.seat;
}

function annotate(cards: readonly Card[], constraint: MoveConstraint): LegalMove[] {
  return cards.map((card) => ({ cardId: card.id, allowed: true as const, constraint }));
}

export function getLegalMoves(state: GameState, playerId: PlayerId): LegalMove[] {
  if (state.phase !== "PLAYING") throw new Error("Game is not in PLAYING phase");
  if (state.currentPlayerId !== playerId) throw new Error("Not this player's turn");
  const hand = state.hands[playerId];
  if (!hand) throw new Error("Unknown player");
  if (hand.length === 0) return [];

  const led = getLeadSuit(state);
  const playerSeat = state.players[playerId]!;
  const leader = state.currentTrick[0];
  const position = state.currentTrick.length;
  const winner = getCurrentWinner(state);

  if (led === null) {
    let legal = [...hand];
    if (state.contract === "HOKUM" && state.hokumPlayMode === "LOCKED") {
      const nonTrump = legal.filter((c) => !isTrump(c, state.contract, state.trumpSuit));
      if (nonTrump.length > 0) legal = nonTrump;
    }
    return annotate(legal, "ANY_CARD");
  }

  if (hasLeadSuit(hand, led)) {
    return annotate(hand.filter((c) => c.suit === led), "FOLLOW_SUIT");
  }

  if (state.contract === "SUN") return annotate(hand, "ANY_CARD");

  if (ikaPartnerExemption(state)) return annotate(hand, "IKA_FREE_PLAY");

  const trumpCards = hand.filter((c) => isTrump(c, state.contract, state.trumpSuit));
  if (trumpCards.length === 0) return annotate(hand, "ANY_CARD");

  if (!winner) return annotate(hand, "ANY_CARD");

  const winnerIsTrump = isTrump(winner.card, state.contract, state.trumpSuit);
  const opponentWinning = isOpponentWinner(state, winner);
  const partnerWinning = isPartnerWinner(state, winner);

  if (partnerWinning && position === 2) return annotate(trumpCards, "MUST_TRUMP");
  if (partnerWinning && position === 3 && winnerIsTrump) return annotate(trumpCards, "ANY_CARD");
  if (partnerWinning && position === 3) return annotate(hand, "ANY_CARD");

  if (opponentWinning) {
    if (!winnerIsTrump) return annotate(trumpCards, "MUST_TRUMP");
    const higher = trumpCards.filter((c) =>
      compareCards(c, winner.card, state.contract, state.trumpSuit, led) > 0
    );
    if (higher.length > 0) return annotate(higher, "MUST_OVERTRUMP");
    return annotate(trumpCards, "ANY_CARD");
  }

  return annotate(hand, "ANY_CARD");
}

export function isCardLegal(state: GameState, playerId: PlayerId, cardId: CardId): boolean {
  return getLegalMoves(state, playerId).some((move) => move.cardId === cardId);
}
