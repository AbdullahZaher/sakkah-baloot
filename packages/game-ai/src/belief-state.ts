import type { Card, CardId, PlayerId, Seat, Suit } from "@sakkah-baloot/game-engine";
import { DECK } from "@sakkah-baloot/game-engine";
import type { HiddenWorld, InformationSetInput, SeededRng } from "./information-set-sampler.js";
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
  const known = new Set(input.ownHand.map((card) => card.id));
  if (input.exposedCard) known.add(input.exposedCard.id);
  for (const trick of input.completedTricks) for (const play of trick.plays) known.add(play.card.id);
  for (const play of input.currentTrick) known.add(play.card.id);

  const opponents = Object.keys(input.game.players).filter((id) => id !== input.playerId);
  const possibleOwners = Object.fromEntries(
    DECK
      .filter((card) => !known.has(card.id))
      .map((card) => [card.id, opponents]),
  ) as Record<CardId, readonly PlayerId[]>;

  const voidSuits = Object.fromEntries(opponents.map((id) => [id, []])) as Record<PlayerId, readonly Suit[]>;

  return {
    playerId: input.playerId,
    unknownCardIds: Object.keys(possibleOwners) as CardId[],
    possibleOwners,
    voidSuits,
    observations: collectObservations(input),
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
  for (let i = 0; i < count; i += 1) {
    const world = sampleHiddenWorld(input, rng);
    worlds.push({
      world,
      weight: scoreWorld(world, belief),
    });
  }
  const total = worlds.reduce((sum, sample) => sum + sample.weight, 0);
  return worlds.map((sample) => ({
    ...sample,
    weight: total > 0 ? sample.weight / total : 1 / worlds.length,
  }));
}

function scoreWorld(world: HiddenWorld, belief: BeliefState): number {
  let score = 1;
  for (const [cardId, owners] of Object.entries(belief.possibleOwners)) {
    const owner = Object.entries(world.hands).find(([, hand]) => hand.some((card) => card.id === cardId))?.[0];
    if (owner && owners.includes(owner)) score += 0.001;
  }
  return score;
}

function collectObservations(input: InformationSetInput): readonly BeliefObservation[] {
  const observations: BeliefObservation[] = [];
  for (const trick of input.completedTricks) {
    for (const play of trick.plays) {
      observations.push({ type: "PLAYED_CARD", cardId: play.card.id, playerId: play.playerId });
    }
  }
  for (const play of input.currentTrick) {
    observations.push({ type: "PLAYED_CARD", cardId: play.card.id, playerId: play.playerId });
  }
  return observations;
}
