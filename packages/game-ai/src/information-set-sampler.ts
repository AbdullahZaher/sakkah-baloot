import type { Card, CardId, CompletedTrick, Contract, GameState, PlayerId, Seat, Suit } from "@sakkah-baloot/game-engine";
import { DECK, assertDeckConservation } from "@sakkah-baloot/game-engine";

export interface InformationSetInput {
  readonly playerId: PlayerId;
  readonly ownHand: readonly Card[];
  readonly game: Pick<GameState, "hands" | "players" | "currentTrick" | "completedTricks">;
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
  const known = new Set<CardId>(input.ownHand.map((card) => card.id));
  if (input.exposedCard) known.add(input.exposedCard.id);

  for (const trick of input.completedTricks ?? []) {
    for (const play of trick.plays) known.add(play.card.id);
  }
  for (const play of input.currentTrick ?? []) known.add(play.card.id);

  const unknown = DECK.filter((card) => !known.has(card.id)).map((card) => ({ ...card }));
  shuffle(unknown, rng);

  const players = Object.entries(input.game.players)
    .filter(([playerId]) => playerId !== input.playerId)
    .map(([playerId, seat]) => ({ playerId, seat }));

  const hands: Record<PlayerId, readonly Card[]> = {
    ...Object.fromEntries(Object.entries(input.game.hands).map(([id]) => [id, id === input.playerId ? input.ownHand.map((card) => ({ ...card })) : []])),
  };

  const targetSizes = players.map(({ playerId }) => ({
    playerId,
    size: input.game.hands[playerId]?.length ?? 0,
  }));

  let cursor = 0;
  for (const target of targetSizes) {
    hands[target.playerId] = unknown.slice(cursor, cursor + target.size);
    cursor += target.size;
  }

  if (cursor !== unknown.length) {
    throw new Error("Hidden-world sample does not conserve all unknown cards");
  }

  const sampledKnown = Object.values(hands).flat().map((card) => card.id);
  assertDeckConservation([
    ...sampledKnown,
  ].map((id) => DECK.find((card) => card.id === id)!).filter(Boolean));

  return { hands };
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
