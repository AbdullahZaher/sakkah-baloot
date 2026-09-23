import test from "node:test";
import assert from "node:assert/strict";
import {
  createAIPlayerController,
  isAIActionCardLegal,
  isAIActionBiddingLegal,
} from "../dist/index.js";

test("AI controller only returns a legal observed card", () => {
  const observation = {
    matchId: "m1",
    roundId: "r1",
    roundNumber: 1,
    playerId: "P1",
    seat: "NORTH",
    teamId: "NORTH_SOUTH",
    phase: "PLAYING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    bidding: null,
    projects: [],
    baloot: null,
    stateVersion: 1,
    playing: {
      phase: "PLAYING",
      contract: "SUN",
      trumpSuit: null,
      game: {
        phase: "PLAYING",
        currentPlayerId: "P1",
        players: { P1: "NORTH" },
        contract: "SUN",
        trumpSuit: null,
        hokumPlayMode: "OPEN",
        dealerSeat: "WEST",
        trickNumber: 1,
        currentTrick: [],
        completedTricks: [],
        ownHand: [{ id: "SPADES-A", suit: "SPADES", rank: "A" }],
        knownPlayedCards: [],
        legalCardIds: ["SPADES-A"],
      },
    },
  };

  const controller = createAIPlayerController({ difficulty: "NORMAL" });
  const action = controller.decide(observation, "controller-seed");

  assert.equal(action.type, "PLAY_CARD");
  assert.equal(isAIActionCardLegal(observation, action), true);
});

test("AI controller preserves the authoritative bidding vocabulary", () => {
  const observation = {
    matchId: "m1",
    roundId: "r1",
    roundNumber: 1,
    playerId: "P1",
    seat: "NORTH",
    teamId: "NORTH_SOUTH",
    phase: "BIDDING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    projects: [],
    baloot: null,
    stateVersion: 1,
    playing: null,
    bidding: {
      phase: "BIDDING",
      bidding: {
        roundId: "r1",
        dealerSeat: "NORTH",
        phase: "FIRST_ROUND",
        currentSeat: "EAST",
        passedSeats: [],
        selectedContract: null,
        kashoDeclaredBySeat: null,
      },
      ownHand: [],
      exposedCard: null,
      legalActions: ["PASS"],
    },
  };

  const controller = createAIPlayerController({ difficulty: "EASY" });
  const action = controller.decide(observation, "bid-seed");

  assert.equal(action.type, "BID");
  assert.equal(isAIActionBiddingLegal(observation, action), true);
  assert.equal(action.action.type, "PASS");
});
