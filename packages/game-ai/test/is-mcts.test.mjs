import test from "node:test";
import assert from "node:assert/strict";
import { createBeliefState, chooseISMCTSCard } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

function observation() {
  const ownHand = [
    "CLUBS-A",
    "CLUBS-10",
    "CLUBS-7",
    "DIAMONDS-A",
    "DIAMONDS-10",
    "HEARTS-A",
    "SPADES-A",
    "SPADES-10",
  ].map(card);

  const game = {
    phase: "PLAYING",
    currentPlayerId: "SOUTH",
    players: {
      NORTH: "NORTH",
      EAST: "EAST",
      SOUTH: "SOUTH",
      WEST: "WEST",
    },
    currentTrick: [],
    completedTricks: [],
    ownHand,
    knownPlayedCards: [],
    legalCardIds: ["CLUBS-A", "CLUBS-10"],
    hokumPlayMode: "OPEN",
    dealerSeat: "NORTH",
    trickNumber: 1,
  };

  return {
    matchId: "match-1",
    roundId: "round-1",
    roundNumber: 1,
    playerId: "SOUTH",
    seat: "SOUTH",
    teamId: "NORTH_SOUTH",
    phase: "PLAYING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    bidding: null,
    playing: {
      phase: "PLAYING",
      game,
      contract: "SUN",
      trumpSuit: null,
    },
    projects: [],
    baloot: null,
    stateVersion: 1,
  };
}

test("IS-MCTS returns one of the authoritative legal cards", () => {
  const obs = observation();
  const belief = createBeliefState({
    playerId: obs.playerId,
    ownHand: obs.playing.game.ownHand,
    game: {
      players: obs.playing.game.players,
      currentTrick: [],
      completedTricks: [],
    },
    contract: "SUN",
    trumpSuit: null,
  });

  const decision = chooseISMCTSCard(obs, belief, {
    iterations: 8,
    seed: "mcts-seed",
  });

  assert.ok(obs.playing.game.legalCardIds.includes(decision.cardId));
  assert.ok(decision.visits > 0);
});

test("IS-MCTS is deterministic for the same observation and seed", () => {
  const obs = observation();
  const input = {
    playerId: obs.playerId,
    ownHand: obs.playing.game.ownHand,
    game: {
      players: obs.playing.game.players,
      currentTrick: [],
      completedTricks: [],
    },
    contract: "SUN",
    trumpSuit: null,
  };
  const belief = createBeliefState(input);

  const a = chooseISMCTSCard(obs, belief, { iterations: 12, seed: "deterministic" });
  const b = chooseISMCTSCard(obs, belief, { iterations: 12, seed: "deterministic" });

  assert.deepEqual(a, b);
});
