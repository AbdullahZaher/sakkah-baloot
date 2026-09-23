import test from "node:test";
import assert from "node:assert/strict";
import { createSeededRng, sampleHiddenWorld } from "../dist/index.js";

function card(id) {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
}

function inputState() {
  const players = {
    P1: "NORTH",
    P2: "EAST",
    P3: "SOUTH",
    P4: "WEST",
  };

  return {
    playerId: "P1",
    ownHand: [
      card("CLUBS-A"),
      card("CLUBS-K"),
      card("DIAMONDS-A"),
      card("DIAMONDS-10"),
      card("HEARTS-A"),
      card("HEARTS-K"),
      card("SPADES-A"),
      card("SPADES-K"),
    ],
    game: {
      players,
      currentTrick: [
        {
          playerId: "P2",
          seat: "EAST",
          card: card("CLUBS-10"),
          ikaDeclared: false,
          sequence: 1,
        },
      ],
      completedTricks: [],
    },
    exposedCard: null,
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

  assert.notDeepEqual(a, b);
});

test("hidden worlds preserve public information and exact remaining hand sizes", () => {
  const input = inputState();
  const world = sampleHiddenWorld(input, createSeededRng("conservation"));

  assert.equal(world.hands.P1.length, 8);
  assert.equal(world.hands.P2.length, 7);
  assert.equal(world.hands.P3.length, 8);
  assert.equal(world.hands.P4.length, 8);

  const knownIds = new Set([
    ...input.ownHand.map((card) => card.id),
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

test("sampling rejects an inconsistent own-hand size", () => {
  const input = inputState();
  const invalid = {
    ...input,
    ownHand: input.ownHand.slice(0, 7),
  };

  assert.throws(
    () => sampleHiddenWorld(invalid, createSeededRng("invalid")),
    /Own hand size does not match observed play history/,
  );
});

test("exposed card may overlap the observer hand without leaking twice", () => {
  const input = inputState();
  const exposed = input.ownHand[0];

  const world = sampleHiddenWorld(
    { ...input, exposedCard: exposed },
    createSeededRng("exposed"),
  );

  assert.equal(world.hands.P1.length, 8);
  assert.equal(new Set([
    ...world.hands.P1.map((card) => card.id),
    ...hiddenHandIds(world, "P2"),
    ...hiddenHandIds(world, "P3"),
    ...hiddenHandIds(world, "P4"),
  ]).size, 32);
});
