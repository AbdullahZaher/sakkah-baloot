import test from "node:test";
import assert from "node:assert/strict";
import {
  createBiddingState,
  createInitialDeal,
  createMatchState,
  createRoundState,
  createSeededRandom,
  type MatchState,
} from "@sakkah-baloot/game-engine";
import { createAIObservation, legalCardActions } from "../dist/index.js";

test("AI bidding observation exposes only its own hand", () => {
  const dealerSeat = "NORTH";
  const deal = createInitialDeal("round-1", dealerSeat, createSeededRandom("ai-observation"));
  const bidding = createBiddingState("round-1", dealerSeat);
  const round = createRoundState(deal, bidding, 1);
  const match = createMatchState("match-1", dealerSeat, 1, round);

  const observation = createAIObservation({
    match,
    playerId: "PLAYER-NORTH",
    playerSeat: "NORTH",
    legalBiddingActions: ["PASS"],
  });

  assert.equal(observation.bidding?.ownHand.length, 5);
  assert.deepEqual(observation.bidding?.legalActions, ["PASS"]);

  const serialized = JSON.stringify(observation);
  for (const seat of ["EAST", "SOUTH", "WEST"]) {
    assert.doesNotMatch(serialized, new RegExp(`${seat}`));
  }
  assert.doesNotMatch(serialized, /initialHands|initialDeckOrder|completionHands/);
});

test("AI card action candidates come only from the authoritative redacted action space", () => {
  const match = {
    matchId: "match-1",
    roundId: "round-1",
    roundNumber: 1,
    dealerSeat: "NORTH",
    phase: "ROUND_ACTIVE",
    stateVersion: 1,
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    lastRoundScore: null,
    end: { status: "ONGOING", score: { NORTH_SOUTH: 0, EAST_WEST: 0 } },
    round: null,
  } as unknown as MatchState;

  const observation = createAIObservation;
  void observation;
  const actions = legalCardActions({
    matchId: match.matchId,
    roundId: match.roundId,
    roundNumber: match.roundNumber,
    playerId: "PLAYER-NORTH",
    seat: "NORTH",
    teamId: "NORTH_SOUTH",
    phase: "PLAYING",
    score: match.score,
    bidding: null,
    playing: {
      phase: "PLAYING",
      contract: "SUN",
      trumpSuit: null,
      game: {
        phase: "PLAYING",
        currentPlayerId: "PLAYER-NORTH",
        players: { "PLAYER-NORTH": "NORTH" },
        contract: "SUN",
        trumpSuit: null,
        hokumPlayMode: "OPEN",
        dealerSeat: "NORTH",
        trickNumber: 1,
        currentTrick: [],
        completedTricks: [],
        ownHand: [],
        knownPlayedCards: [],
        legalCardIds: ["SPADES-A"],
      } as never,
    },
    projects: [],
    baloot: null,
    stateVersion: 1,
  });

  assert.deepEqual(actions, [{ type: "PLAY_CARD", cardId: "SPADES-A" }]);
});
