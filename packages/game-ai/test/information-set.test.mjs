import test from "node:test";
import assert from "node:assert/strict";
import { createBeliefState, createSeededRng, sampleHiddenWorld } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

test("information-set sampling is deterministic and conserves unknown cards", () => {
  const ownHand = ["CLUBS-A", "CLUBS-K", "DIAMONDS-A", "DIAMONDS-K", "HEARTS-A", "HEARTS-K", "SPADES-A", "SPADES-K"].map(card);
  const input = {
    playerId: "SOUTH",
    ownHand,
    exposedCard: null,
    contract: "SUN",
    trumpSuit: null,
    currentTrick: [],
    completedTricks: [],
    game: {
      hands: {
        SOUTH: ownHand,
        NORTH: Array(8),
        EAST: Array(8),
        WEST: Array(8),
      },
      players: { SOUTH: "SOUTH", NORTH: "NORTH", EAST: "EAST", WEST: "WEST" },
      currentTrick: [],
      completedTricks: [],
    },
  };

  const a = sampleHiddenWorld(input, createSeededRng("seed-1"));
  const b = sampleHiddenWorld(input, createSeededRng("seed-1"));
  assert.deepEqual(a, b);

  const ids = Object.values(a.hands).flat().map((c) => c.id);
  assert.equal(new Set(ids).size, 32);
});

test("belief state exposes only unknown cards as candidates", () => {
  const ownHand = ["CLUBS-A", "CLUBS-K"].map(card);
  const input = {
    playerId: "SOUTH",
    ownHand,
    exposedCard: card("HEARTS-A"),
    contract: "HOKUM",
    trumpSuit: "HEARTS",
    currentTrick: [],
    completedTricks: [],
    game: {
      hands: { SOUTH: ownHand, NORTH: [], EAST: [], WEST: [] },
      players: { SOUTH: "SOUTH", NORTH: "NORTH", EAST: "EAST", WEST: "WEST" },
      currentTrick: [],
      completedTricks: [],
    },
  };

  const belief = createBeliefState(input);
  assert.ok(!belief.unknownCardIds.includes("CLUBS-A"));
  assert.ok(!belief.unknownCardIds.includes("HEARTS-A"));
  assert.ok(belief.unknownCardIds.includes("SPADES-J"));
});
