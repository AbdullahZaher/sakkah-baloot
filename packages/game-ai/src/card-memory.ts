import type {
  Card,
  CardId,
  Contract,
  CompletedTrick,
  Seat,
  Suit,
} from "@sakkah-baloot/game-engine";
import { cardRawValue, cardStrength, isTrump } from "@sakkah-baloot/game-engine";

export interface CardMemory {
  readonly knownCards: ReadonlySet<CardId>;
  readonly playedCards: readonly Card[];
  readonly remainingCards: readonly Card[];
  readonly remainingBySuit: Readonly<Record<Suit, number>>;
  readonly remainingByRank: Readonly<Record<Card["rank"], number>>;
  readonly remainingTrump: readonly Card[];
  readonly trumpPlayedCount: number;
  readonly lastTrickWinner: Seat | null;
  readonly finalTrickPending: boolean;
}

export interface CardMemoryInput {
  readonly ownHand: readonly Card[];
  readonly exposedCard?: Card | null;
  readonly completedTricks?: readonly CompletedTrick[];
  readonly currentTrick?: readonly { readonly card: Card; readonly seat: Seat }[];
  readonly contract: Contract;
  readonly trumpSuit: Suit | null;
}

export function createCardMemory(input: CardMemoryInput): CardMemory {
  const playedCards = [
    ...(input.completedTricks ?? []).flatMap((trick) => trick.plays.map((play) => play.card)),
    ...(input.currentTrick ?? []).map((play) => play.card),
  ];
  const known = new Set<CardId>([
    ...input.ownHand.map((card) => card.id),
    ...(input.exposedCard ? [input.exposedCard.id] : []),
    ...playedCards.map((card) => card.id),
  ]);

  const remainingCards = input.contract === "HOKUM" && input.trumpSuit !== null
    ? buildRemaining(known)
    : buildRemaining(known);

  const remainingBySuit = countBySuit(remainingCards);
  const remainingByRank = countByRank(remainingCards);
  const remainingTrump = input.trumpSuit === null
    ? []
    : remainingCards.filter((card) => isTrump(card, input.contract, input.trumpSuit));

  const lastTrick = input.completedTricks?.at(-1) ?? null;

  return {
    knownCards: known,
    playedCards,
    remainingCards,
    remainingBySuit,
    remainingByRank,
    remainingTrump,
    trumpPlayedCount: input.trumpSuit === null
      ? 0
      : playedCards.filter((card) => isTrump(card, input.contract, input.trumpSuit)).length,
    lastTrickWinner: lastTrick?.winnerSeat ?? null,
    finalTrickPending: (input.completedTricks?.length ?? 0) < 8,
  };
}

function buildRemaining(known: ReadonlySet<CardId>): readonly Card[] {
  const suits = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const;
  const ranks = ["7", "8", "9", "10", "J", "Q", "K", "A"] as const;
  return suits.flatMap((suit) =>
    ranks
      .map((rank) => ({ id: `${suit}-${rank}`, suit, rank }) as Card)
      .filter((card) => !known.has(card.id)),
  );
}

function countBySuit(cards: readonly Card[]): Readonly<Record<Suit, number>> {
  return {
    CLUBS: cards.filter((card) => card.suit === "CLUBS").length,
    DIAMONDS: cards.filter((card) => card.suit === "DIAMONDS").length,
    HEARTS: cards.filter((card) => card.suit === "HEARTS").length,
    SPADES: cards.filter((card) => card.suit === "SPADES").length,
  };
}

function countByRank(cards: readonly Card[]): Readonly<Record<Card["rank"], number>> {
  return {
    "7": cards.filter((card) => card.rank === "7").length,
    "8": cards.filter((card) => card.rank === "8").length,
    "9": cards.filter((card) => card.rank === "9").length,
    "10": cards.filter((card) => card.rank === "10").length,
    J: cards.filter((card) => card.rank === "J").length,
    Q: cards.filter((card) => card.rank === "Q").length,
    K: cards.filter((card) => card.rank === "K").length,
    A: cards.filter((card) => card.rank === "A").length,
  };
}

export function highImpactCards(
  memory: CardMemory,
  contract: Contract,
  trumpSuit: Suit | null,
): readonly Card[] {
  return memory.remainingCards.filter((card) =>
    card.rank === "A" ||
    (card.rank === "J" && isTrump(card, contract, trumpSuit)) ||
    (card.rank === "9" && isTrump(card, contract, trumpSuit)) ||
    (card.rank === "10" && !isTrump(card, contract, trumpSuit)),
  );
}

export function cardStrategicValue(
  card: Card,
  contract: Contract,
  trumpSuit: Suit | null,
): number {
  return cardRawValue(card, contract, trumpSuit) * 10 + cardStrength(card, contract, trumpSuit);
}
