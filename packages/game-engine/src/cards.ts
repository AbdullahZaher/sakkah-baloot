import type { Contract, Seat } from "./rules/types.js";

export const SUITS = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ["7", "8", "9", "10", "J", "Q", "K", "A"] as const;
export type Rank = (typeof RANKS)[number];

export type CardId = `${Suit}-${Rank}`;

export interface Card {
  readonly id: CardId;
  readonly suit: Suit;
  readonly rank: Rank;
}

export const DECK: readonly Card[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({
    id: `${suit}-${rank}` as CardId,
    suit,
    rank,
  })),
);

export const CARD_LOOKUP: Readonly<Record<CardId, Card>> = Object.fromEntries(
  DECK.map((card) => [card.id, card]),
) as Readonly<Record<CardId, Card>>;

export function getCardById(id: CardId): Card {
  const card = CARD_LOOKUP[id];
  if (!card) throw new Error(`Unknown card ID: ${id}`);
  return card;
}

const SUN_ORDER: readonly Rank[] = ["A", "10", "K", "Q", "J", "9", "8", "7"];
const HOKUM_ORDER: readonly Rank[] = ["J", "9", "A", "10", "K", "Q", "8", "7"];

const SUN_RAW: Readonly<Record<Rank, number>> = {
  A: 11,
  "10": 10,
  K: 4,
  Q: 3,
  J: 2,
  9: 0,
  8: 0,
  7: 0,
};

const HOKUM_RAW: Readonly<Record<Rank, number>> = {
  J: 20,
  9: 14,
  A: 11,
  "10": 10,
  K: 4,
  Q: 3,
  8: 0,
  7: 0,
};

function orderIndex(order: readonly Rank[], rank: Rank): number {
  const index = order.indexOf(rank);
  if (index < 0) throw new Error(`Unknown rank: ${rank}`);
  return order.length - index;
}

export function isTrump(card: Card, contract: Contract, trumpSuit: Suit | null): boolean {
  return contract === "HOKUM" && trumpSuit !== null && card.suit === trumpSuit;
}

export function cardRawValue(card: Card, contract: Contract, trumpSuit: Suit | null): number {
  if (isTrump(card, contract, trumpSuit)) return HOKUM_RAW[card.rank];
  return SUN_RAW[card.rank];
}

export function cardStrength(card: Card, contract: Contract, trumpSuit: Suit | null): number {
  return orderIndex(
    isTrump(card, contract, trumpSuit) ? HOKUM_ORDER : SUN_ORDER,
    card.rank,
  );
}

export function compareCards(
  a: Card,
  b: Card,
  contract: Contract,
  trumpSuit: Suit | null,
  ledSuit: Suit | null,
): number {
  const aTrump = isTrump(a, contract, trumpSuit);
  const bTrump = isTrump(b, contract, trumpSuit);

  if (aTrump !== bTrump) return aTrump ? 1 : -1;

  if (ledSuit !== null) {
    const aLed = a.suit === ledSuit;
    const bLed = b.suit === ledSuit;
    if (aLed !== bLed) return aLed ? 1 : -1;
  }

  if (a.suit !== b.suit && !aTrump && !bTrump) return 0;
  return Math.sign(cardStrength(a, contract, trumpSuit) - cardStrength(b, contract, trumpSuit));
}

export function createDeck(): readonly Card[] {
  return DECK;
}

export interface CardLocation {
  readonly owner: Seat | "TABLE" | "UNDEALT";
}

export interface ConservationState {
  readonly locations: Readonly<Record<CardId, CardLocation>>;
}

export function createEmptyConservationState(): ConservationState {
  const locations = Object.fromEntries(
    DECK.map((card) => [card.id, { owner: "UNDEALT" as const }]),
  ) as Record<CardId, CardLocation>;

  return { locations };
}

export function moveCard(
  state: ConservationState,
  cardId: CardId,
  owner: CardLocation["owner"],
): ConservationState {
  if (!(cardId in state.locations)) throw new Error(`Unknown card: ${cardId}`);
  return {
    locations: {
      ...state.locations,
      [cardId]: { owner },
    },
  };
}

export function assertDeckConservation(state: ConservationState): void {
  const ids = Object.keys(state.locations);
  if (ids.length !== DECK.length) {
    throw new Error(`Card conservation violated: expected ${DECK.length} cards`);
  }

  const deckIds = new Set(DECK.map((card) => card.id));
  for (const id of ids) {
    if (!deckIds.has(id as CardId)) {
      throw new Error(`Card conservation violated: unknown card ${id}`);
    }
  }
}
