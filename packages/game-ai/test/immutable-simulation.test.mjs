import test from "node:test";
import assert from "node:assert/strict";
import { createImmutableSimulation } from "../dist/index.js";

function card(id) {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
}

function gameState() {
  const hands = {
    NORTH: [],
    EAST: [],
    SOUTH: [card("CLUBS-A")],
    WEST: [],
  };
  return {
    phase: "PLAYING",
    currentPlayerId: "SOUTH",
    players: { NORTH: "NORTH", EAST: "EAST", SOUTH: "SOUTH", WEST: "WEST" },
    hands,
    contract: "SUN",
    trumpSuit: null,
    hokumPlayMode: "OPEN",
    dealerSeat: "NORTH",
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };
}

test("immutable simulation never mutates its source state", () => {
  const source = gameState();
  const simulation = createImmutableSimulation(source);
  const before = JSON.stringify(simulation.initial.game);

  const next = simulation.apply(simulation.initial, {
    playerId: "SOUTH",
    cardId: "CLUBS-A",
  });

  assert.equal(JSON.stringify(simulation.initial.game), before);
  assert.equal(next.game.hands.SOUTH.length, 0);
  assert.equal(source.hands.SOUTH.length, 1);
});

test("simulation branches independently from the same state", () => {
  const simulation = createImmutableSimulation(gameState());
  const a = simulation.apply(simulation.initial, {
    playerId: "SOUTH",
    cardId: "CLUBS-A",
  });
  const b = simulation.apply(simulation.initial, {
    playerId: "SOUTH",
    cardId: "CLUBS-A",
  });

  assert.notStrictEqual(a, b);
  assert.deepEqual(a.game, b.game);
});
