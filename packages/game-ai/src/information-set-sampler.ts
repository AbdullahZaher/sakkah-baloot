import type { BiddingState, Card, CardId, Contract, GameState, PlayerId, Suit } from "@sakkah-baloot/game-engine";
import { CARDS_PER_PLAYER, DECK } from "@sakkah-baloot/game-engine";

export interface InformationSetInput {
  readonly playerId: PlayerId;
  readonly ownHand: readonly Card[];
  readonly game: Pick<GameState, "players" | "currentTrick" | "completedTricks"> & {
    readonly hands?: Readonly<Record<PlayerId, readonly Card[]>>;
  };
  readonly exposedCard?: Card | null;\n  readonly bidding?: BiddingState;
  readonly contract: Contract;
  readonly trumpSuit: Suit | null;
  readonly bidding?: BiddingState | null;
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
  const known = new Set<CardId>(input.ownHand.map((card) => card.id));
  if (input.exposedCard) known.add(input.exposedCard.id);

  for (const trick of input.game.completedTricks) {
    for (const play of trick.plays) known.add(play.card.id);
  }
  for (const play of input.game.currentTrick) known.add(play.card.id);

  const unknown = DECK
    .filter((card) => !known.has(card.id))
    .map((card) => ({ ...card }));

  const players = Object.keys(input.game.players).filter(
    (id) => id !== input.playerId,
  );

  const targetSizes = players.map((playerId) => ({
    playerId,
    size:
      input.game.hands?.[playerId]?.length ??
      CARDS_PER_PLAYER - countPlayedCards(input, playerId),
  }));

  const ownExpectedSize =
    input.game.hands?.[input.playerId]?.length ??
    CARDS_PER_PLAYER - countPlayedCards(input, input.playerId);

  if (ownExpectedSize !== input.ownHand.length) {
    throw new Error(
      `Observer hand size mismatch: expected ${ownExpectedSize}, received ${input.ownHand.length}`,
    );
  }

  const expectedUnknown = targetSizes.reduce(
    (sum, target) => sum + target.size,
    0,
  );

  if (expectedUnknown !== unknown.length) {
    throw new Error(
      `Hidden-world size mismatch: expected ${unknown.length} unknown cards, but hand sizes require ${expectedUnknown}`,
    );
  }

  shuffle(unknown, rng);

  const hands: Record<PlayerId, readonly Card[]> = Object.fromEntries(
    Object.keys(input.game.players).map((playerId) => [
      playerId,
      playerId === input.playerId
        ? input.ownHand.map((card) => ({ ...card }))
        : [],
    ]),
  );

  let cursor = 0;
  for (const target of targetSizes) {
    hands[target.playerId] = unknown
      .slice(cursor, cursor + target.size)
      .map((card) => ({ ...card }));
    cursor += target.size;
  }

  assertWorldConservation(known, hands, input.playerId);

  return { hands };
}

function countPlayedCards(
  input: InformationSetInput,
  playerId: PlayerId,
): number {
  const completed = input.game.completedTricks.flatMap((trick) => trick.plays);
  return [...completed, ...input.game.currentTrick].filter(
    (play) => play.playerId === playerId,
  ).length;
}

function assertWorldConservation(
  known: ReadonlySet<CardId>,
  hands: Readonly<Record<PlayerId, readonly Card[]>>,
  observerId: PlayerId,
): void {
  const hiddenIds = Object.entries(hands)
    .filter(([playerId]) => playerId !== observerId)
    .flatMap(([, hand]) => hand.map((card) => card.id));

  const partition = [...known, ...hiddenIds];
  const deckIds = new Set(DECK.map((card) => card.id));

  if (
    partition.length !== DECK.length ||
    new Set(partition).size !== DECK.length
  ) {
    throw new Error("Hidden-world sample does not partition the 32-card deck");
  }

  for (const cardId of partition) {
    if (!deckIds.has(cardId)) {
      throw new Error(`Hidden-world sample contains unknown card id: ${cardId}`);
    }
  }
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
