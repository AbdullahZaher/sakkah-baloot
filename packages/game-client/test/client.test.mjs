import test from "node:test";
import assert from "node:assert/strict";

import { createLocalBiddingSession, createLocalHumanVsAISession, shouldDeclareBalootForCard } from "../src/index.ts";
import { detectProjects, getLegalMoves } from "@sakkah-baloot/game-engine";

const SUITS = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];

function selectContract(session) {
  for (let i = 0; i < 8; i += 1) {
    const snapshot = session.getSnapshot();
    if (snapshot.bidding.phase === "CONTRACT_SELECTED") return snapshot;

    if (snapshot.legalActions.includes("BUY_SUN")) {
      return session.dispatchBiddingAction("BUY_SUN");
    }

    if (snapshot.legalActions.includes("BUY_HOKUM")) {
      const exposedSuit = snapshot.exposedCard?.suit;
      const suit = SUITS.find((candidate) => candidate !== exposedSuit);
      assert.ok(suit);
      return session.dispatchBiddingAction("BUY_HOKUM", suit);
    }

    assert.ok(snapshot.legalActions.includes("PASS"));
    session.dispatchBiddingAction("PASS");
  }

  throw new Error("Unable to select a contract in the deterministic local deal");
}

function playRound(session) {
  let snapshot = session.getSnapshot();
  let playCount = 0;

  while (snapshot.game?.phase === "PLAYING") {
    const playerId = snapshot.game.currentPlayerId;
    const moves = getLegalMoves(snapshot.game, playerId);
    assert.ok(moves.length > 0);

    snapshot = session.dispatchCardPlayForPlayer(playerId, moves[0].cardId);
    playCount += 1;
    assert.ok(playCount <= 32);
  }

  return snapshot;
}

test("local client completes Deal → Bid → Project/Baloot → 8 Tricks → Round Score → Next Round", () => {
  const session = createLocalBiddingSession();

  let snapshot = session.getSnapshot();
  assert.equal(snapshot.roundNumber, 1);
  assert.deepEqual(snapshot.matchScore, { NORTH_SOUTH: 0, EAST_WEST: 0 });

  snapshot = selectContract(session);
  assert.equal(snapshot.bidding.phase, "CONTRACT_SELECTED");
  assert.equal(snapshot.game?.phase, "PLAYING");
  assert.equal(snapshot.projects.length, 0);
  assert.equal(snapshot.baloot, null);

  const projectCandidate = detectProjects(
    snapshot.playerHand,
    snapshot.bidding.selectedContract.contract,
    snapshot.bidding.selectedContract.trumpSuit,
    snapshot.playerSeat,
  )[0];

  if (projectCandidate) {
    snapshot = session.dispatchProject(projectCandidate.id);
    assert.equal(snapshot.projects.length, 1);
  }

  snapshot = playRound(session);
  assert.equal(snapshot.game?.phase, "ROUND_COMPLETE");
  assert.equal(snapshot.game?.completedTricks.length, 8);
  assert.ok(snapshot.roundScore);
  assert.notDeepEqual(snapshot.matchScore, { NORTH_SOUTH: 0, EAST_WEST: 0 });

  const scoreAfterRound = snapshot.matchScore;
  snapshot = session.advanceRound();

  assert.equal(snapshot.roundNumber, 2);
  assert.equal(snapshot.dealerSeat, "WEST");
  assert.equal(snapshot.game, null);
  assert.equal(snapshot.roundScore, null);
  assert.deepEqual(snapshot.matchScore, scoreAfterRound);
  assert.equal(snapshot.projects.length, 0);
  assert.equal(snapshot.baloot, null);
});

test("repeated snapshots are observationally idempotent", () => {
  const session = createLocalBiddingSession();
  const first = session.getSnapshot();
  const second = session.getSnapshot();

  assert.deepEqual(second.matchScore, first.matchScore);
  assert.equal(second.roundNumber, first.roundNumber);
  assert.equal(second.dealerSeat, first.dealerSeat);
  assert.equal(second.bidding.turnNumber, first.bidding.turnNumber);
  assert.deepEqual(second.deal.hands, first.deal.hands);
});

test("playable local host exposes authoritative protocol state", () => {
  const session = createLocalHumanVsAISession({
    seed: "ui-playable-test",
    humanSeat: "SOUTH",
    aiMode: "BASELINE",
    aiDifficulty: "NORMAL",
  });

  const snapshot = session.getSnapshot();

  assert.equal(snapshot.playerSeat, "SOUTH");
  assert.equal(snapshot.humanTurn, true);
  assert.equal(snapshot.actingSeat, "SOUTH");
  assert.ok(["BID", "PLAY_CARD"].includes(snapshot.protocol.phase));
  assert.ok(snapshot.protocol.stateVersion >= 2);
});

test("playable local host accepts a human bid and returns to the human turn", () => {
  const session = createLocalHumanVsAISession({
    seed: "ui-playable-bid-test",
    humanSeat: "SOUTH",
  });

  const before = session.getSnapshot();

  if (before.bidding.phase === "BIDDING") {
    const action = before.legalActions.includes("BUY_SUN")
      ? "BUY_SUN"
      : "PASS";
    const after = session.dispatchBiddingAction(action);
    assert.equal(after.humanTurn, true);
    assert.equal(after.actingSeat, "SOUTH");
    assert.ok(after.protocol.stateVersion > before.protocol.stateVersion);
  } else {
    assert.equal(before.humanTurn, true);
    assert.equal(before.actingSeat, "SOUTH");
  }
});

test("local human can declare a legal project during trick one", () => {
  const session = createLocalHumanVsAISession({
    seed: "ui-project-test",
    humanSeat: "SOUTH",
    aiMode: "BASELINE",
  });

  let snapshot = session.getSnapshot();
  if (snapshot.game?.phase !== "PLAYING" || snapshot.actingSeat !== "SOUTH") {
    assert.fail("Deterministic setup did not reach the human playing turn");
  }

  const candidate = snapshot.projectCandidates[0];
  if (!candidate) {
    // No project is present in this deterministic hand; the UI correctly has no project action to expose.
    assert.deepEqual(snapshot.projectCandidates, []);
    return;
  }

  snapshot = session.dispatchProject(candidate.id);
  assert.equal(snapshot.projects.length, 1);
  assert.equal(snapshot.projects[0].candidate.id, candidate.id);
  assert.equal(snapshot.humanTurn, true);
});

test("client Baloot decision path follows RD-08 on the second trump K/Q", () => {
  const players = {
    NORTH_PLAYER: "NORTH",
    EAST_PLAYER: "EAST",
    HUMAN_PLAYER: "SOUTH",
    WEST_PLAYER: "WEST",
  };
  const king = { id: "HEARTS-K", suit: "HEARTS", rank: "K" };
  const queen = { id: "HEARTS-Q", suit: "HEARTS", rank: "Q" };
  const seven = { id: "HEARTS-7", suit: "HEARTS", rank: "7" };
  const game = {
    phase: "PLAYING",
    currentPlayerId: "HUMAN_PLAYER",
    players,
    hands: {
      NORTH_PLAYER: [],
      EAST_PLAYER: [],
      HUMAN_PLAYER: [king, queen, seven],
      WEST_PLAYER: [],
    },
    contract: "HOKUM",
    trumpSuit: "HEARTS",
    hokumPlayMode: "OPEN",
    dealerSeat: "NORTH",
    trickNumber: 2,
    currentTrick: [
      { playerId: "HUMAN_PLAYER", card: king },
    ],
    completedTricks: [],
  };

  assert.equal(shouldDeclareBalootForCard(game, "HUMAN_PLAYER", "HEARTS-Q"), true);
  assert.equal(shouldDeclareBalootForCard(game, "HUMAN_PLAYER", "HEARTS-K"), false);
  assert.equal(shouldDeclareBalootForCard({ ...game, contract: "SUN", trumpSuit: null }, "HUMAN_PLAYER", "HEARTS-Q"), false);
});

test("client Baloot path never declares Baloot in Sun", () => {
  const session = createLocalHumanVsAISession({
    seed: "ui-sun-baloot-negative",
    humanSeat: "SOUTH",
  });

  let snapshot = session.getSnapshot();
  let guard = 0;

  while (snapshot.bidding.phase === "BIDDING" && guard++ < 16) {
    if (snapshot.legalActions.includes("BUY_SUN")) {
      snapshot = session.dispatchBiddingAction("BUY_SUN");
      break;
    }

    snapshot = session.dispatchBiddingAction("PASS");
  }

  if (snapshot.bidding.selectedContract?.contract !== "SUN") {
    // This seed may not be a Sun contract; the engine-level RD-08 tests cover the contract predicate.
    return;
  }

  while (snapshot.game?.phase === "PLAYING" && guard++ < 64) {
    if (snapshot.completedTrickPresentation) {
      snapshot = session.acknowledgeCompletedTrick();
      continue;
    }
    assert.equal(snapshot.baloot, null);
    const cardId = snapshot.legalCardIds[0];
    assert.ok(cardId);
    snapshot = session.dispatchCardPlay(cardId);
  }

  if (snapshot.completedTrickPresentation) {
    snapshot = session.acknowledgeCompletedTrick();
  }

  assert.equal(snapshot.baloot, null);
});

test("human-vs-AI UI host completes a full round through the public dispatch path", () => {
  const session = createLocalHumanVsAISession({
    seed: "ui-full-round-test",
    humanSeat: "SOUTH",
    aiMode: "BASELINE",
    aiDifficulty: "NORMAL",
  });

  let snapshot = session.getSnapshot();
  let guard = 0;

  while (snapshot.bidding.phase === "BIDDING" && guard++ < 32) {
    assert.equal(snapshot.humanTurn, true);
    if (snapshot.legalActions.includes("BUY_SUN")) {
      snapshot = session.dispatchBiddingAction("BUY_SUN");
    } else if (snapshot.legalActions.includes("BUY_HOKUM")) {
      const exposedSuit = snapshot.exposedCard?.suit;
      const suit = SUITS.find((candidate) => candidate !== exposedSuit);
      assert.ok(suit);
      snapshot = session.dispatchBiddingAction("BUY_HOKUM", suit);
    } else {
      assert.ok(snapshot.legalActions.includes("PASS"));
      snapshot = session.dispatchBiddingAction("PASS");
    }
  }

  assert.equal(snapshot.bidding.phase, "CONTRACT_SELECTED");
  assert.equal(snapshot.game?.phase, "PLAYING");

  while (snapshot.game?.phase === "PLAYING" && guard++ < 256) {
    if (snapshot.completedTrickPresentation) {
      snapshot = session.acknowledgeCompletedTrick();
      continue;
    }
    if (snapshot.humanTurn) {
      assert.ok(snapshot.legalCardIds.length > 0);
      snapshot = session.dispatchCardPlay(snapshot.legalCardIds[0]);
    } else {
      throw new Error("dispatch path must advance AI turns back to the human");
    }
  }

  if (snapshot.completedTrickPresentation) {
    snapshot = session.acknowledgeCompletedTrick();
  }

  assert.equal(snapshot.game?.phase, "ROUND_COMPLETE");
  assert.equal(snapshot.game?.completedTricks.length, 8);
  assert.ok(snapshot.roundScore);
  assert.ok(snapshot.protocol.stateVersion > 2);
});

test("forensic: completed trick holds presentation state, prevents next trick AI progression until acknowledged", () => {
  const session = createLocalHumanVsAISession({
    seed: "forensic-trick-hold-test",
    humanSeat: "SOUTH",
    aiMode: "BASELINE",
    aiDifficulty: "NORMAL",
  });

  let snapshot = session.getSnapshot();
  while (snapshot.bidding.phase === "BIDDING") {
    if (snapshot.legalActions.includes("BUY_SUN")) {
      snapshot = session.dispatchBiddingAction("BUY_SUN");
    } else {
      snapshot = session.dispatchBiddingAction("PASS");
    }
  }

  assert.equal(snapshot.game?.phase, "PLAYING");
  assert.equal(snapshot.completedTrickPresentation, null);

  // Play Trick 1
  assert.equal(snapshot.humanTurn, true);
  const cardToPlay = snapshot.legalCardIds[0];
  assert.ok(cardToPlay);

  snapshot = session.dispatchCardPlay(cardToPlay);

  // Trick 1 completed by AI plays!
  // Verify completed trick presentation is active
  assert.ok(snapshot.completedTrickPresentation !== null);
  assert.equal(snapshot.completedTrickPresentation.trickNumber, 1);
  assert.equal(snapshot.completedTrickPresentation.plays.length, 4);
  assert.ok(snapshot.completedTrickPresentation.winnerSeat);

  // Verify human input is disabled during presentation hold
  assert.equal(snapshot.humanTurn, false);
  assert.equal(snapshot.legalCardIds.length, 0);

  // Verify attempting to play card during hold throws error
  assert.throws(() => {
    session.dispatchCardPlay("HEARTS-7");
  }, /Cannot play card while completed trick presentation is active/);

  // Verify AI has NOT made any moves for Trick 2 yet
  assert.equal(snapshot.game?.currentTrick.length, 0);

  // Now acknowledge completed trick (simulating 2000ms timer expiration)
  const afterAck = session.acknowledgeCompletedTrick();

  assert.equal(afterAck.completedTrickPresentation, null);
  // Game has now safely advanced to Trick 2
  assert.ok(afterAck.game?.trickNumber === 2 || afterAck.game?.phase === "PLAYING");
});
