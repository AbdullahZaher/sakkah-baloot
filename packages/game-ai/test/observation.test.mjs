import test from "node:test";
import assert from "node:assert/strict";
import {
  createBiddingState,
  createInitialDeal,
  createMatchState,
  createRoundState,
  createSeededRandom,
  legalBiddingActions,
} from "@sakkah-baloot/game-engine";
import {
  createAIObservation,
  createAuthoritativeActionSpace,
  legalCardActions,
} from "../dist/index.js";

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
  assert.doesNotMatch(serialized, /EAST:|SOUTH:|WEST:/);
  assert.doesNotMatch(serialized, /hands|initialHands|initialDeckOrder|completionHands/);
  assert.doesNotMatch(serialized, /initialHands|initialDeckOrder|completionHands/);
});

test("authoritative bidding adapter computes legal actions from full state before redaction", () => {
  const dealerSeat = "NORTH";
  const deal = createInitialDeal("round-1", dealerSeat, createSeededRandom("action-space"));
  const bidding = createBiddingState("round-1", dealerSeat);
  const round = createRoundState(deal, bidding, 1);
  const match = createMatchState("match-1", dealerSeat, 1, round);

  const actionSpace = createAuthoritativeActionSpace(
    match,
    "PLAYER-NORTH",
    "NORTH",
  );

  const expected = legalBiddingActions(
    bidding,
    dealerSeat,
    deal.exposedCardId === null ? null : deal.exposedCardId.split("-")[0],
    deal.hands,
  );

  assert.deepEqual(actionSpace.bidding, expected);
  assert.equal(actionSpace.cards.length, 0);
  assert.equal(actionSpace.projects.length, 0);
  assert.equal(actionSpace.baloot, false);

  const serialized = JSON.stringify(actionSpace);
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
  };

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
      },
    },
    projects: [],
    baloot: null,
    stateVersion: 1,
  });

  assert.deepEqual(actions, [{ type: "PLAY_CARD", cardId: "SPADES-A" }]);
});

test("adversarial security test: no hidden opponent cards exist in serialized or inspectable AI observation", () => {
  const dealerSeat = "NORTH";
  const deal = createInitialDeal("round-sec-1", dealerSeat, createSeededRandom("security-seed-123"));
  
  // Complete 8-card hands for 4 players in PLAYING phase
  const allCardIds = {
    NORTH: ["SPADES-A", "SPADES-K", "SPADES-Q", "SPADES-J", "SPADES-10", "SPADES-9", "SPADES-8", "SPADES-7"],
    EAST: ["HEARTS-A", "HEARTS-K", "HEARTS-Q", "HEARTS-J", "HEARTS-10", "HEARTS-9", "HEARTS-8", "HEARTS-7"],
    SOUTH: ["DIAMONDS-A", "DIAMONDS-K", "DIAMONDS-Q", "DIAMONDS-J", "DIAMONDS-10", "DIAMONDS-9", "DIAMONDS-8", "DIAMONDS-7"],
    WEST: ["CLUBS-A", "CLUBS-K", "CLUBS-Q", "CLUBS-J", "CLUBS-10", "CLUBS-9", "CLUBS-8", "CLUBS-7"],
  };

  const toCards = (ids) => ids.map((id) => {
    const [suit, rank] = id.split("-");
    return { id, suit, rank };
  });

  const authoritativeGame = {
    phase: "PLAYING",
    currentPlayerId: "PLAYER-NORTH",
    players: {
      "PLAYER-NORTH": "NORTH",
      "PLAYER-EAST": "EAST",
      "PLAYER-SOUTH": "SOUTH",
      "PLAYER-WEST": "WEST",
    },
    hands: {
      "PLAYER-NORTH": toCards(allCardIds.NORTH),
      "PLAYER-EAST": toCards(allCardIds.EAST),
      "PLAYER-SOUTH": toCards(allCardIds.SOUTH),
      "PLAYER-WEST": toCards(allCardIds.WEST),
    },
    contract: "HOKUM",
    trumpSuit: "SPADES",
    hokumPlayMode: "OPEN",
    dealerSeat: "WEST",
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };

  const bidding = createBiddingState("round-sec-1", dealerSeat);
  const match = {
    matchId: "sec-match",
    roundId: "round-sec-1",
    roundNumber: 1,
    dealerSeat: "WEST",
    phase: "ROUND_ACTIVE",
    stateVersion: 12,
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    lastRoundScore: null,
    end: { status: "ONGOING", score: { NORTH_SOUTH: 0, EAST_WEST: 0 } },
    round: {
      roundId: "round-sec-1",
      roundNumber: 1,
      phase: "PLAYING",
      deal,
      bidding,
      game: authoritativeGame,
      projects: [],
      baloot: null,
      score: null,
    },
  };

  const observation = createAIObservation({
    match,
    playerId: "PLAYER-NORTH",
    playerSeat: "NORTH",
    legalCardIds: ["SPADES-A", "SPADES-K"],
  });

  // Verify own hand is present
  assert.equal(observation.playing?.game.ownHand.length, 8);
  assert.deepEqual(
    observation.playing?.game.ownHand.map((c) => c.id),
    allCardIds.NORTH,
  );

  // Collect every string in the entire observation tree
  const extractedStrings = [];
  function recursivelyExtractStrings(obj) {
    if (obj === null || obj === undefined) return;
    if (typeof obj === "string") {
      extractedStrings.push(obj);
      return;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) recursivelyExtractStrings(item);
      return;
    }
    if (typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        extractedStrings.push(key);
        recursivelyExtractStrings(value);
      }
    }
  }
  recursivelyExtractStrings(observation);

  const serialized = JSON.stringify(observation);

  // Adversarial assertion: NONE of the opponent cards should ever appear in strings or serialized JSON
  const opponentCardIds = [
    ...allCardIds.EAST,
    ...allCardIds.SOUTH,
    ...allCardIds.WEST,
  ];

  for (const hiddenCardId of opponentCardIds) {
    assert.equal(
      extractedStrings.includes(hiddenCardId),
      false,
      `Hidden opponent card ${hiddenCardId} was leaked in observation object tree!`,
    );
    assert.equal(
      serialized.includes(hiddenCardId),
      false,
      `Hidden opponent card ${hiddenCardId} was leaked in serialized JSON observation!`,
    );
  }

  // Verify no hidden hands map exists
  assert.equal(observation.playing?.game.hands, undefined);
  assert.doesNotMatch(serialized, /"hands":/);
});

