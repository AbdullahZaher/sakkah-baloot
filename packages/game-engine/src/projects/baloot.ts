import type { Card, CardId, Suit } from "../cards.js";
import { isTrump } from "../cards.js";
import type { Contract, Seat, TeamId } from "../rules/types.js";
import { teamOfSeat } from "../rules/profile.js";

export interface BalootDeclaration {
  readonly declarationId: string;
  readonly ownerSeat: Seat;
  readonly teamId: TeamId;
  readonly trumpSuit: Suit;
  readonly cards: readonly [CardId, CardId];
  readonly qaydValue: 2;
  readonly declared: true;
}

export function isBalootPair(cards: readonly Card[], contract: Contract, trumpSuit: Suit | null): cards is readonly [Card, Card] {
  if (cards.length !== 2 || contract !== "HOKUM" || trumpSuit === null) return false;
  const trumpCards = cards.filter((c) => isTrump(c, contract, trumpSuit));
  const hasKing = trumpCards.some((c) => c.rank === "K");
  const hasQueen = trumpCards.some((c) => c.rank === "Q");
  return hasKing && hasQueen;
}

export function canDeclareBaloot(
  contract: Contract,
  trumpSuit: Suit | null,
  playerSeat: Seat,
  cardBeingPlayed: Card,
  alreadyPlayedByPlayer: readonly Card[],
  beforeCommit: boolean,
): boolean {
  if (!beforeCommit || contract !== "HOKUM" || trumpSuit === null) return false;
  if (!isTrump(cardBeingPlayed, contract, trumpSuit)) return false;
  if (cardBeingPlayed.rank !== "K" && cardBeingPlayed.rank !== "Q") return false;
  const partner = alreadyPlayedByPlayer.find((c) => isTrump(c, contract, trumpSuit) && (
    (c.rank === "K" && cardBeingPlayed.rank === "Q") ||
    (c.rank === "Q" && cardBeingPlayed.rank === "K")
  ));
  return partner !== undefined;
}

export function declareBaloot(
  declarationId: string,
  playerSeat: Seat,
  trumpSuit: Suit,
  king: Card,
  queen: Card,
): BalootDeclaration {
  if (king.rank !== "K" || queen.rank !== "Q" || king.suit !== trumpSuit || queen.suit !== trumpSuit) {
    throw new Error("Invalid Baloot pair");
  }
  return {
    declarationId,
    ownerSeat: playerSeat,
    teamId: teamOfSeat(playerSeat),
    trumpSuit,
    cards: [king.id, queen.id],
    qaydValue: 2,
    declared: true,
  };
}

export function isBalootAbsorbedByHundred(
  baloot: BalootDeclaration,
  hundredCards: readonly CardId[],
): boolean {
  return baloot.cards.every((id) => hundredCards.includes(id));
}
