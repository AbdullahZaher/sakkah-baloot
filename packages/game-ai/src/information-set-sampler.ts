import type { Card, CardId, Contract, GameState, PlayerId, Suit } from "@sakkah-baloot/game-engine";
import {
  CARDS_PER_PLAYER,
  DECK,
  assertDeckConservation,
  createEmptyConservationState,
  moveCard,
} from "@sakkah-baloot/game-engine";

export interface InformationSetInput {
  readonly playerId: PlayerId;
  readonly ownHand: readonly Card[];
  readonly game: Pick<GameState, "players" | "currentTrick" | "completedTricks">;
  readonly exposedCard?: Card | null;
  readonly contract: Contract;
  readonly trumpSuit: Suit | null;
}

export interface HiddenWorld {
  readonly hands: Readonly<Record<PlayerId, readonly Card[]>>;
}

export interface SeededRng {
  next(): number;
}

export function createSeededRng(seed: string): SeededRng {
  let state = hashSeed(seed);

  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    },
  };
}

export function sampleHiddenWorld(
  input: InformationSetInput,
  rng: SeededRng,
): HiddenWorld {
  const knownCards = collectKnownCards(input);
  const knownIds = new Set<CardId>(knownCards.map((card) => card.id));

  const deckById = new Map(DECK.map((card) => [card.id, card] as const));
  for (const card of knownCards) {
    if (!deckById.has(card.id)) {
      throw new Error(`Information-set contains unknown card: ${card.id}`);
    }
  }

  const opponents = Object.keys(input.game.players).filter(
    (playerId) => playerId !== input.playerId,
  );

  const playedByPlayer = countPlayedCardsByPlayer(input);
  const expectedOwnHandSize = CARDS_PER_PLAYER - (playedByPlayer[input.playerId] ?? 0);
  if (expectedOwnHandSize !== input.ownHand.length) {
    throw new Error(
      `Own hand size does not match observed play history: expected ${expectedOwnHandSize}`,
    );
  }

  const targetSizes = opponents.map((playerId) => ({
    playerId,
    size: CARDS_PER_PLAYER - (playedByPlayer[playerId] ?? 0),
  }));

  const unknown = DECK
    .filter((card) => !knownIds.has(card.id))
    .map((card) => ({ ...card }));

  const expectedUnknownCount = targetSizes.reduce(
    (sum, target) => sum + target.size,
    0,
  );

  if (unknown.length !== expectedUnknownCount) {
    throw new Error(
      `Information-set card count mismatch: ${unknown.length} unknown cards for ${expectedUnknownCount} hidden hand slots`,
    );
  }

  shuffle(unknown, rng);

  const hands: Record<PlayerId, readonly Card[]> = Object.fromEntries(
    Object.keys(input.game.players).map((playerId) => [
      playerId,
      playerId === input.playerId ? input.ownHand.map((card) => ({ ...card })) : [],
    ]),
  );

  let cursor = 0;
  for (const target of targetSizes) {
    hands[target.playerId] = unknown.slice(cursor, cursor + target.size);
    cursor += target.size;
  }

  if (cursor !== unknown.length) {
    throw new Error("Hidden-world sample did not assign every unknown card");
  }

  assertSampleConservation(input, hands, knownIds, deckById);

  return { hands };
}

function countPlayedCardsByPlayer(input: InformationSetInput): Readonly<Record<PlayerId, number>> {
  const counts: Record<PlayerId, number> = Object.fromEntries(
    Object.keys(input.game.players).map((playerId) => [playerId, 0]),
  );

  for (const trick of input.game.completedTricks) {
    for (const play of trick.plays) {
      counts[play.playerId] = (counts[play.playerId] ?? 0) + 1;
    }
  }

  for (const play of input.game.currentTrick) {
    counts[play.playerId] = (counts[play.playerId] ?? 0) + 1;
  }

  return counts;
}

function collectKnownCards(input: InformationSetInput): readonly Card[] {
  return [
    ...input.ownHand,
    ...(input.exposedCard ? [input.exposedCard] : []),
    ...input.game.completedTricks.flatMap((trick) =>
      trick.plays.map((play) => play.card),
    ),
    ...input.game.currentTrick.map((play) => play.card),
  ];
}

function assertSampleConservation(
  input: InformationSetInput,
  hands: Readonly<Record<PlayerId, readonly Card[]>>,
  knownIds: ReadonlySet<CardId>,
  deckById: ReadonlyMap<CardId, Card>,
): void {
  const state = createEmptyConservationState();

  let conservation = state;

  for (const cardId of knownIds) {
    conservation = moveCard(conservation, cardId, "TABLE");
  }

  for (const [playerId, hand] of Object.entries(hands)) {
    if (playerId === input.playerId) continue;

    for (const card of hand) {
      if (knownIds.has(card.id)) {
        throw new Error(`Sampled hidden hand contains known card: ${card.id}`);
      }
      if (!deckById.has(card.id)) {
        throw new Error(`Sampled hidden hand contains unknown card: ${card.id}`);
      }
      conservation = moveCard(conservation, card.id, "UNDEALT");
    }
  }

  assertDeckConservation(conservation);
}

function shuffle(cards: Card[], rng: SeededRng): void {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
