import type {
  Card,
  Contract,
  Seat,
  Suit,
} from "@sakkah-baloot/game-engine";
import {
  cardRawValue,
  cardStrength,
  compareCards,
  isTrump,
  partnerOfSeat,
  teamOfSeat,
} from "@sakkah-baloot/game-engine";
import type { CardMemory } from "./card-memory.js";

export interface StrategyFeatures {
  readonly handPointValue: number;
  readonly handControlValue: number;
  readonly trumpCount: number;
  readonly trumpControlCount: number;
  readonly trumpJPresent: boolean;
  readonly trump9Present: boolean;
  readonly aceCount: number;
  readonly tenCount: number;
  readonly voidSuits: readonly Suit[];
  readonly remainingTrumpCount: number;
  readonly remainingHighImpactCount: number;
  readonly currentTrickWinning: boolean;
  readonly partnerWinning: boolean;
  readonly minimumWinningCardIds: readonly string[];
  readonly finalTrickControlValue: number;
  readonly informationValue: number;
  readonly teamId: ReturnType<typeof teamOfSeat>;
  readonly partnerSeat: Seat;
}

export interface StrategyFeatureInput {
  readonly ownHand: readonly Card[];
  readonly memory: CardMemory;
  readonly contract: Contract;
  readonly trumpSuit: Suit | null;
  readonly playerSeat: Seat;
  readonly currentTrick?: readonly { readonly card: Card; readonly seat: Seat }[];
  readonly completedTrickCount?: number;
}

export function extractStrategyFeatures(input: StrategyFeatureInput): StrategyFeatures {
  const {
    ownHand,
    memory,
    contract,
    trumpSuit,
    playerSeat,
    currentTrick = [],
    completedTrickCount = 0,
  } = input;

  const trump = trumpSuit === null
    ? []
    : ownHand.filter((card) => isTrump(card, contract, trumpSuit));

  const currentWinner = resolveCurrentWinner(currentTrick, contract, trumpSuit);
  const currentTrickWinning = currentWinner?.seat === playerSeat;
  const partnerWinning = currentWinner?.seat === partnerOfSeat(playerSeat);

  const winningCards = currentTrick.length === 0
    ? []
    : ownHand.filter((card) => beatsCurrentWinner(card, currentWinner?.card ?? null, currentTrick[0]?.card.suit ?? null, contract, trumpSuit));

  const minimumWinningCardIds = minimumWinningCards(
    winningCards,
    currentWinner?.card ?? null,
    currentTrick[0]?.card.suit ?? null,
    contract,
    trumpSuit,
  ).map((card) => card.id);

  const voidSuits = (["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const).filter(
    (suit) => ownHand.every((card) => card.suit !== suit),
  );

  return {
    handPointValue: ownHand.reduce(
      (sum, card) => sum + cardRawValue(card, contract, trumpSuit),
      0,
    ),
    handControlValue: ownHand.reduce(
      (sum, card) => sum + cardStrength(card, contract, trumpSuit),
      0,
    ),
    trumpCount: trump.length,
    trumpControlCount: trump.filter((card) => card.rank === "J" || card.rank === "9").length,
    trumpJPresent: trump.some((card) => card.rank === "J"),
    trump9Present: trump.some((card) => card.rank === "9"),
    aceCount: ownHand.filter((card) => card.rank === "A").length,
    tenCount: ownHand.filter((card) => card.rank === "10").length,
    voidSuits,
    remainingTrumpCount: memory.remainingTrump.length,
    remainingHighImpactCount: memory.remainingCards.filter(
      (card) =>
        card.rank === "A" ||
        (isTrump(card, contract, trumpSuit) && (card.rank === "J" || card.rank === "9")) ||
        (!isTrump(card, contract, trumpSuit) && card.rank === "10"),
    ).length,
    currentTrickWinning: Boolean(currentTrickWinning),
    partnerWinning: Boolean(partnerWinning),
    minimumWinningCardIds,
    finalTrickControlValue: completedTrickCount >= 7
      ? finalTrickControlValue(ownHand, contract, trumpSuit)
      : 0,
    informationValue: estimateInformationValue(memory, currentTrick),
    teamId: teamOfSeat(playerSeat),
    partnerSeat: partnerOfSeat(playerSeat),
  };
}

function resolveCurrentWinner(
  plays: readonly { readonly card: Card; readonly seat: Seat }[],
  contract: Contract,
  trumpSuit: Suit | null,
): { readonly card: Card; readonly seat: Seat } | null {
  if (plays.length === 0) return null;
  const ledSuit = plays[0]!.card.suit;
  let winner = plays[0]!;
  for (const play of plays.slice(1)) {
    if (compareCards(play.card, winner.card, contract, trumpSuit, ledSuit) > 0) {
      winner = play;
    }
  }
  return winner;
}

function beatsCurrentWinner(
  card: Card,
  winner: Card | null,
  ledSuit: Suit | null,
  contract: Contract,
  trumpSuit: Suit | null,
): boolean {
  if (!winner || !ledSuit) return true;
  return compareCards(card, winner, contract, trumpSuit, ledSuit) > 0;
}

function minimumWinningCards(
  candidates: readonly Card[],
  winner: Card | null,
  ledSuit: Suit | null,
  contract: Contract,
  trumpSuit: Suit | null,
): readonly Card[] {
  if (candidates.length === 0) return [];
  return [...candidates].sort(
    (a, b) =>
      cardStrength(a, contract, trumpSuit) - cardStrength(b, contract, trumpSuit),
  ).filter((card, index, sorted) => {
    if (index === 0) return true;
    return winner !== null && compareCards(sorted[index - 1]!, winner, contract, trumpSuit, ledSuit) <= 0;
  }).slice(0, 1);
}

function finalTrickControlValue(
  hand: readonly Card[],
  contract: Contract,
  trumpSuit: Suit | null,
): number {
  if (hand.length === 0) return 0;
  return Math.max(...hand.map((card) => cardStrength(card, contract, trumpSuit)));
}

function estimateInformationValue(
  memory: CardMemory,
  currentTrick: readonly { readonly card: Card; readonly seat: Seat }[],
): number {
  if (currentTrick.length === 0) return 0;
  const newlyObserved = currentTrick.length;
  const constrainedSuits = Object.values(memory.remainingBySuit).filter((count) => count <= 2).length;
  return newlyObserved + constrainedSuits * 0.5;
}
