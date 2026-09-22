import type { Card, CardId } from "./cards.js";
import type { Seat } from "./rules/types.js";
import { teamOfSeat } from "./rules/profile.js";

export const KASHO_BUSHAT_RANKS = ["7", "8", "9"] as const;

export interface KashoDeclaration {
  readonly declarationId: string;
  readonly declarerSeat: Seat;
  readonly teamId: ReturnType<typeof teamOfSeat>;
  readonly cardIds: readonly CardId[];
}

export interface KashoResolution {
  readonly status: "CANCELLED";
  readonly reason: "KASHO";
  readonly scoreAwarded: false;
  readonly roundScore: null;
  readonly matchScoreUnchanged: true;
  readonly dealerTransition: "ROTATE_RIGHT";
  readonly dealerSeat: Seat;
  readonly nextDealerSeat: Seat;
  readonly declaration: KashoDeclaration;
}

function isBushatRank(card: Card): boolean {
  return (KASHO_BUSHAT_RANKS as readonly string[]).includes(card.rank);
}

export function qualifiesForKasho(cards: readonly Card[]): boolean {
  if (cards.length < 5) return false;
  return cards.filter(isBushatRank).length >= 5;
}

export function canDeclareKasho(
  cards: readonly Card[],
  phase: "FIRST_BIDDING" | "SECOND_BIDDING" | "PLAYING" | "ROUND_COMPLETE",
  purchaseFinalized: boolean,
): boolean {
  return phase === "FIRST_BIDDING" && !purchaseFinalized && qualifiesForKasho(cards);
}

export function declareKasho(
  declarationId: string,
  declarerSeat: Seat,
  cards: readonly Card[],
  phase: "FIRST_BIDDING" | "SECOND_BIDDING" | "PLAYING" | "ROUND_COMPLETE",
  purchaseFinalized: boolean,
): KashoDeclaration {
  if (!canDeclareKasho(cards, phase, purchaseFinalized)) {
    throw new Error("Kasho is not eligible");
  }
  return {
    declarationId,
    declarerSeat,
    teamId: teamOfSeat(declarerSeat),
    cardIds: cards.filter(isBushatRank).map((card) => card.id),
  };
}

export function resolveKasho(
  declaration: KashoDeclaration,
  dealerSeat: Seat,
  processedDeclarationIds: readonly string[] = [],
): KashoResolution {
  if (processedDeclarationIds.includes(declaration.declarationId)) {
    throw new Error("Duplicate Kasho declaration");
  }
  const nextDealerSeat = ({
    NORTH: "WEST",
    WEST: "SOUTH",
    SOUTH: "EAST",
    EAST: "NORTH",
  } as const)[dealerSeat];
  return {
    status: "CANCELLED",
    reason: "KASHO",
    scoreAwarded: false,
    roundScore: null,
    matchScoreUnchanged: true,
    dealerTransition: "ROTATE_RIGHT",
    dealerSeat,
    nextDealerSeat,
    declaration,
  };
}
