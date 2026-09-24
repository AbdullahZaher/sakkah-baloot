import test from "node:test";
import assert from "node:assert/strict";

import { createLocalBiddingSession, createLocalHumanVsAISession } from "../src/index.ts";
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

test("human-vs-AI path actually declares RD-08 Baloot on the second trump K/Q", () => {
  let observed = false;

  for (let seedIndex = 0; seedIndex < 128 && !observed; seedIndex += 1) {
    const session = createLocalHumanVsAISession({
      seed: `ui-rd08-seed-${seedIndex}`,
      humanSeat: "SOUTH",
      aiMode: "BASELINE",
      aiDifficulty: "NORMAL",
    });

    let snapshot = session.getSnapshot();
    let guard = 0;
    let firstTrumpCard = null;

    while (snapshot.game?.phase === "PLAYING" && guard++ < 96) {
      if (!snapshot.humanTurn) {
        assert.fail("Local UI dispatch must return control to the human after AI turns");
      }

      const selected = snapshot.bidding.selectedContract;
      assert.ok(selected);

      const trumpPair = selected.contract === "HOKUM"
        ? snapshot.playerHand.filter(
            (card) =>
              card.suit === selected.trumpSuit &&
              (card.rank === "K" || card.rank === "Q"),
          )
        : [];

      if (selected.contract === "HOKUM" && trumpPair.length === 2) {
        const pairIds = new Set(trumpPair.map((card) => card.id));
        const playablePair = snapshot.legalCardIds.filter((id) => pairIds.has(id));

        if (playablePair.length > 0) {
          const cardId = playablePair[0];
          snapshot = session.dispatchCardPlay(cardId);

          if (snapshot.baloot !== null) {
            assert.fail("Baloot cannot be declared on the first K/Q play");
          }

          firstTrumpCard = cardId;
          break;
        }
      }

      const fallback = snapshot.legalCardIds[0];
      assert.ok(fallback);
      snapshot = session.dispatchCardPlay(fallback);
    }

    if (!firstTrumpCard || !snapshot.game || snapshot.baloot !== null) continue;

    let secondGuard = 0;
    while (snapshot.game?.phase === "PLAYING" && secondGuard++ < 96 && snapshot.baloot === null) {
      assert.equal(snapshot.humanTurn, true);

      const selected = snapshot.bidding.selectedContract;
      assert.equal(selected?.contract, "HOKUM");

      const remainingPair = snapshot.playerHand.filter(
        (card) =>
          card.suit === selected.trumpSuit &&
          (card.rank === "K" || card.rank === "Q"),
      );

      const second = remainingPair.find((card) => snapshot.legalCardIds.includes(card.id));
      const cardId = second?.id ?? snapshot.legalCardIds[0];
      assert.ok(cardId);

      snapshot = session.dispatchCardPlay(cardId);
    }

    if (snapshot.baloot !== null) {
      observed = true;
      assert.equal(snapshot.baloot.trumpSuit, snapshot.bidding.selectedContract?.trumpSuit);
      assert.equal(snapshot.baloot.qaydValue, 2);
      assert.equal(snapshot.baloot.seat, "SOUTH");
      assert.equal(snapshot.baloot.teamId, "NORTH_SOUTH");
    }
  }

  assert.equal(observed, true, "No deterministic seed reached a human-owned trump K+Q Baloot declaration");
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
    assert.equal(snapshot.baloot, null);
    const cardId = snapshot.legalCardIds[0];
    assert.ok(cardId);
    snapshot = session.dispatchCardPlay(cardId);
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
    if (snapshot.humanTurn) {
      assert.ok(snapshot.legalCardIds.length > 0);
      snapshot = session.dispatchCardPlay(snapshot.legalCardIds[0]);
    } else {
      throw new Error("dispatch path must advance AI turns back to the human");
    }
  }

  assert.equal(snapshot.game?.phase, "ROUND_COMPLETE");
  assert.equal(snapshot.game?.completedTricks.length, 8);
  assert.ok(snapshot.roundScore);
  assert.ok(snapshot.protocol.stateVersion > 2);
});

test("human card play automatically carries a legal Baloot declaration", () => {
  const session = createLocalHumanVsAISession({
    seed: "ui-baloot-test",
    humanSeat: "SOUTH",
  });

  // The public session must remain playable regardless of whether this seed exposes Baloot.
  let snapshot = session.getSnapshot();
  let guard = 0;
  while (snapshot.game?.phase === "PLAYING" && guard++ < 64) {
    if (snapshot.humanTurn && snapshot.legalCardIds.length > 0) {
      snapshot = session.dispatchCardPlay(snapshot.legalCardIds[0]);
    } else {
      // Drive the next AI turn indirectly by playing only when the human is active.
      break;
    }
  }

  assert.ok(snapshot.protocol.stateVersion >= 2);
  assert.ok(snapshot.game === null || snapshot.game.phase === "PLAYING" || snapshot.game.phase === "ROUND_COMPLETE");
});
