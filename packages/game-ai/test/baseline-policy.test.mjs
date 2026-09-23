import test from "node:test";
import assert from "node:assert/strict";
import { chooseBaselineAction } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

function playingObservation({
  hand,
  legalCardIds,
  currentTrick = [],
  contract = "HOKUM",
  trumpSuit = "HEARTS",
  seat = "SOUTH",
}) {
  return {
    matchId: "match-1",
    roundId: "round-1",
    roundNumber: 1,
    playerId: "PLAYER-SOUTH",
    seat,
    teamId: "NORTH_SOUTH",
    phase: "PLAYING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    bidding: null,
    playing: {
      phase: "PLAYING",
      contract,
      trumpSuit,
      game: {
        phase: "PLAYING",
        currentPlayerId: "PLAYER-SOUTH",
        players: { "PLAYER-SOUTH": seat },
        contract,
        trumpSuit,
        hokumPlayMode: "OPEN",
        dealerSeat: "NORTH",
        trickNumber: 1,
        currentTrick,
        completedTricks: [],
        ownHand: hand.map(card),
        knownPlayedCards: currentTrick.map((play) => play.card),
        legalCardIds,
      },
    },
    projects: [],
    baloot: null,
    stateVersion: 1,
  };
}

test("baseline card policy never selects outside authoritative legal cards", () => {
  const observation = playingObservation({
    hand: ["HEARTS-J", "HEARTS-9", "CLUBS-A", "DIAMONDS-10"],
    legalCardIds: ["CLUBS-A", "DIAMONDS-10"],
  });

  const decision = chooseBaselineAction(observation);
  assert.ok(["CLUBS-A", "DIAMONDS-10"].includes(decision.action.cardId));
});

test("baseline policy prefers minimum sufficient winner over unnecessary stronger trump", () => {
  const observation = playingObservation({
    hand: ["HEARTS-J", "HEARTS-9", "CLUBS-7", "CLUBS-A"],
    legalCardIds: ["HEARTS-J", "HEARTS-9", "CLUBS-A"],
    currentTrick: [
      { seat: "NORTH", card: card("CLUBS-K") },
      { seat: "EAST", card: card("CLUBS-7") },
    ],
  });

  const decision = chooseBaselineAction(observation);
  assert.equal(decision.action.cardId, "HEARTS-9");
  assert.ok(decision.trace.reasonCodes.includes("MINIMUM_WINNER"));
});

test("baseline policy does not waste trump when partner already wins", () => {
  const observation = playingObservation({
    hand: ["HEARTS-J", "CLUBS-7", "DIAMONDS-10"],
    legalCardIds: ["HEARTS-J", "CLUBS-7", "DIAMONDS-10"],
    currentTrick: [
      { seat: "NORTH", card: card("CLUBS-A") },
      { seat: "EAST", card: card("CLUBS-7") },
    ],
  });

  const decision = chooseBaselineAction(observation);
  assert.notEqual(decision.action.cardId, "HEARTS-J");
});

test("baseline bidding policy chooses only an authoritative bidding action", () => {
  const observation = {
    matchId: "match-1",
    roundId: "round-1",
    roundNumber: 1,
    playerId: "PLAYER-NORTH",
    seat: "NORTH",
    teamId: "NORTH_SOUTH",
    phase: "BIDDING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    bidding: {
      phase: "BIDDING",
      bidding: {
        roundId: "round-1",
        phase: "FIRST_ROUND",
        actingSeat: "NORTH",
        turnNumber: 0,
        passCount: 0,
        stateVersion: 0,
        selectedContract: null,
        history: [],
        processedActionIds: [],
        cancellationReason: "NONE",
        nextDealerSeat: null,
      },
      ownHand: ["HEARTS-J", "HEARTS-9", "HEARTS-A", "CLUBS-A", "DIAMONDS-10"].map(card),
      exposedCard: card("HEARTS-8"),
      legalActions: ["PASS", "BUY_HOKUM_EXPOSED", "BUY_SUN"],
    },
    playing: null,
    projects: [],
    baloot: null,
    stateVersion: 1,
  };

  const decision = chooseBaselineAction(observation);
  assert.deepEqual(decision.action.action.type, "BUY_HOKUM_EXPOSED");
});
