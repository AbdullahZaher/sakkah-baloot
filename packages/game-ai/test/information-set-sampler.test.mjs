import test from "node:test";
import assert from "node:assert/strict";
import { createSeededRng, sampleHiddenWorld } from "../dist/index.js";

const SUITS = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];
const RANKS = ["7", "8", "9", "10", "J", "Q", "K", "A"];

function deck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({ id: `${suit}-${rank}`, suit, rank })),
  );
}

function inputState() {
  const cards = deck();
  const ownHand = cards.slice(0, 8);

  return {
    playerId: "P1",
    ownHand,
    game: {
      players: {
        P1: "NORTH",
        P2: "EAST",
        P3: "SOUTH",
        P4: "WEST",
      },
      hands: {
        P1: ownHand,
        P2: cards.slice(12, 19),
        P3: cards.slice(19, 26),
        P4: cards.slice(26, 32),
      },
      currentTrick: [
        {
          playerId: "P2",
          seat: "EAST",
          card: cards[8],
          ikaDeclared: false,
          sequence: 1,
        },
        {
          playerId: "P3",
          seat: "SOUTH",
          card: cards[9],
          ikaDeclared: false,
          sequence: 2,
        },
        {
          playerId: "P4",
          seat: "WEST",
          card: cards[10],
          ikaDeclared: false,
          sequence: 3,
        },
      ],
      completedTricks: [],
    },
    exposedCard: cards[11],
    contract: "SUN",
    trumpSuit: null,
  };
}

function hiddenHandIds(world, playerId) {
  return world.hands[playerId].map((card) => card.id);
}

test("information-set sampling is deterministic for the same seed", () => {
  const input = inputState();

  const a = sampleHiddenWorld(input, createSeededRng("seed-1"));
  const b = sampleHiddenWorld(input, createSeededRng("seed-1"));

  assert.deepEqual(a, b);
});

test("different seeds produce different hidden worlds", () => {
  const input = inputState();

  const a = sampleHiddenWorld(input, createSeededRng("seed-1"));
  const b = sampleHiddenWorld(input, createSeededRng("seed-2"));

  assert.notDeepEqual(a.hands, b.hands);
});

test("hidden worlds preserve public information and exact remaining hand sizes", () => {
  const input = inputState();
  const world = sampleHiddenWorld(input, createSeededRng("conservation"));

  assert.equal(world.hands.P1.length, 8);
  assert.equal(world.hands.P2.length, 6);
  assert.equal(world.hands.P3.length, 6);
  assert.equal(world.hands.P4.length, 6);

  const knownIds = new Set([
    ...input.ownHand.map((card) => card.id),
    input.exposedCard.id,
    ...input.game.currentTrick.map((play) => play.card.id),
  ]);

  const hiddenIds = [
    ...hiddenHandIds(world, "P2"),
    ...hiddenHandIds(world, "P3"),
    ...hiddenHandIds(world, "P4"),
  ];

  assert.equal(new Set(hiddenIds).size, hiddenIds.length);
  assert.equal(hiddenIds.some((id) => knownIds.has(id)), false);
  assert.equal(new Set([...knownIds, ...hiddenIds]).size, 32);
});

test("sampling keeps the observer hand exact", () => {
  const input = inputState();
  const world = sampleHiddenWorld(input, createSeededRng("observer"));

  assert.deepEqual(world.hands.P1, input.ownHand);
});

test("sampling rejects inconsistent remaining hand sizes", () => {
  const input = inputState();
  const invalid = {
    ...input,
    game: {
      ...input.game,
      hands: {
        ...input.game.hands,
        P4: input.game.hands.P4.slice(0, 5),
      },
    },
  };

  assert.throws(
    () => sampleHiddenWorld(invalid, createSeededRng("invalid")),
    /Hidden-world size mismatch/,
  );
});
