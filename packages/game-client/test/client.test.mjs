import test from "node:test";
import assert from "node:assert/strict";

import { createLocalBiddingSession } from "../src/index.ts";
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
  assert.equal(snapshot.protocol.phase, "BID");
  assert.ok(snapshot.protocol.stateVersion >= 2);
});

test("playable local host accepts a human bid and returns to the human turn", () => {
  const session = createLocalHumanVsAISession({
    seed: "ui-playable-bid-test",
    humanSeat: "SOUTH",
  });

  const before = session.getSnapshot();
  const action = before.legalActions.includes("BUY_SUN")
    ? "BUY_SUN"
    : "PASS";

  const after = session.dispatchBiddingAction(action);

  assert.equal(after.humanTurn, true);
  assert.equal(after.actingSeat, "SOUTH");
  assert.ok(after.protocol.stateVersion > before.protocol.stateVersion);
});
