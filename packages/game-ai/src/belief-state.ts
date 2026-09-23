import type { CardId, PlayerId, Suit } from "@sakkah-baloot/game-engine";
import { DECK } from "@sakkah-baloot/game-engine";
import type {
  HiddenWorld,
  InformationSetInput,
  SeededRng,
} from "./information-set-sampler.js";
import { createSeededRng, sampleHiddenWorld } from "./information-set-sampler.js";

export interface BeliefState {
  readonly playerId: PlayerId;
  readonly unknownCardIds: readonly CardId[];
  readonly possibleOwners: Readonly<Record<CardId, readonly PlayerId[]>>;
  readonly voidSuits: Readonly<Record<PlayerId, readonly Suit[]>>;
  readonly observations: readonly BeliefObservation[];
}

export type BeliefObservation =
  | { readonly type: "VOID_SUIT"; readonly playerId: PlayerId; readonly suit: Suit }
  | { readonly type: "PLAYED_CARD"; readonly cardId: CardId; readonly playerId: PlayerId }
  | { readonly type: "BID_SIGNAL"; readonly playerId: PlayerId; readonly strength: number };

export interface BeliefWorldSample {
  readonly world: HiddenWorld;
  readonly weight: number;
}

export function createBeliefState(input: InformationSetInput): BeliefState {
  const known = new Set<CardId>(input.ownHand.map((card) => card.id));

  if (input.exposedCard) known.add(input.exposedCard.id);

  for (const trick of input.game.completedTricks) {
    for (const play of trick.plays) known.add(play.card.id);
  }

  for (const play of input.game.currentTrick) {
    known.add(play.card.id);
  }

  const opponents = Object.keys(input.game.players).filter(
    (id) => id !== input.playerId,
  );

  const voidSuits = inferVoidSuits(input);
  const possibleOwners = Object.fromEntries(
    DECK
      .filter((card) => !known.has(card.id))
      .map((card) => [
        card.id,
        opponents.filter(
          (playerId) => !voidSuits[playerId]?.includes(card.suit),
        ),
      ]),
  ) as Record<CardId, readonly PlayerId[]>;

  return {
    playerId: input.playerId,
    unknownCardIds: DECK
      .filter((card) => !known.has(card.id))
      .map((card) => card.id),
    possibleOwners,
    voidSuits,
    observations: collectObservations(input, voidSuits),
  };
}

export function sampleBeliefWorlds(
  input: InformationSetInput,
  belief: BeliefState,
  count: number,
  seed: string,
): readonly BeliefWorldSample[] {
  if (count <= 0) return [];

  const rng = createSeededRng(seed);
  const worlds: BeliefWorldSample[] = [];
  const maxAttempts = Math.max(100, count * 100);

  for (let attempt = 0; attempt < maxAttempts && worlds.length < count; attempt += 1) {
    const world = sampleHiddenWorld(input, rng);
    if (!worldSatisfiesBelief(world, belief)) continue;
    worlds.push({ world, weight: 1 });
  }

  if (worlds.length === 0) {
    throw new Error("Unable to sample a hidden world consistent with belief constraints");
  }

  const weight = 1 / worlds.length;
  return worlds.map((sample) => ({ ...sample, weight }));
}

function worldSatisfiesBelief(
  world: HiddenWorld,
  belief: BeliefState,
): boolean {
  for (const [cardId, owners] of Object.entries(belief.possibleOwners)) {
    const owner = Object.entries(world.hands).find(([, hand]) =>
      hand.some((card) => card.id === cardId),
    )?.[0];

    if (owner && !owners.includes(owner)) return false;
  }

  return true;
}

function inferVoidSuits(
  input: InformationSetInput,
): Readonly<Record<PlayerId, readonly Suit[]>> {
  const sets = new Map<PlayerId, Set<Suit>>(
    Object.keys(input.game.players).map((playerId) => [
      playerId,
      new Set<Suit>(),
    ]),
  );

  const recordTrick = (
    plays: readonly { readonly playerId: PlayerId; readonly card: { readonly suit: Suit } }[],
  ) => {
    if (plays.length === 0) return;

    const ledSuit = plays[0]!.card.suit;
    for (const play of plays.slice(1)) {
      if (play.card.suit !== ledSuit) {
        sets.get(play.playerId)?.add(ledSuit);
      }
    }
  };

  for (const trick of input.game.completedTricks) recordTrick(trick.plays);
  recordTrick(input.game.currentTrick);

  return Object.fromEntries(
    [...sets.entries()].map(([playerId, suits]) => [
      playerId,
      [...suits].sort(),
    ]),
  ) as Record<PlayerId, readonly Suit[]>;
}

function collectObservations(
  input: InformationSetInput,
  voidSuits: Readonly<Record<PlayerId, readonly Suit[]>>,
): readonly BeliefObservation[] {
  const observations: BeliefObservation[] = [];

  for (const trick of input.game.completedTricks) {
    for (const play of trick.plays) {
      observations.push({
        type: "PLAYED_CARD",
        cardId: play.card.id,
        playerId: play.playerId,
      });
    }
  }

  for (const play of input.game.currentTrick) {
    observations.push({
      type: "PLAYED_CARD",
      cardId: play.card.id,
      playerId: play.playerId,
    });
  }

  for (const [playerId, suits] of Object.entries(voidSuits)) {
    for (const suit of suits) {
      observations.push({ type: "VOID_SUIT", playerId, suit });
    }
  }

  return observations;
}
