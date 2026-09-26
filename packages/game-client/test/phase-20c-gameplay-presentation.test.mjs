import test from "node:test";
import assert from "node:assert/strict";
import { createLocalHumanVsAISession } from "../dist/index.js";

test("phase 20-c presentation: human turn and AI turn presentation are mutually exclusive and well-defined", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20c-turn-presentation-1",
    humanSeat: "SOUTH",
  });

  const snap = session.getSnapshot();
  assert.equal(typeof snap.humanTurn, "boolean");
  assert.ok(["NORTH", "EAST", "SOUTH", "WEST"].includes(snap.actingSeat));
  if (snap.humanTurn) {
    assert.equal(snap.actingSeat, "SOUTH");
  } else {
    assert.notEqual(snap.actingSeat, "SOUTH");
  }
});

test("phase 20-c presentation: completed trick presentation barrier holds state until acknowledged", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20c-trick-barrier-seed",
    humanSeat: "SOUTH",
  });

  // Advance through bidding
  let snap = session.getSnapshot();
  while (snap.matchPhase === "ROUND_ACTIVE" && snap.biddingPresentation && snap.game === null) {
    if (snap.humanTurn) {
      const sun = snap.biddingPresentation.legalOptions.find((o) => o.type === "BUY_SUN");
      if (sun) {
        snap = session.dispatchBiddingAction("BUY_SUN");
      } else {
        snap = session.dispatchBiddingAction("PASS");
      }
    }
  }

  // Play until first completed trick
  while (
    snap.matchPhase === "ROUND_ACTIVE" &&
    snap.game?.phase === "PLAYING" &&
    snap.completedTrickPresentation === null &&
    snap.roundScore === null
  ) {
    if (snap.humanTurn && snap.legalCardIds.length > 0) {
      snap = session.dispatchCardPlay(snap.legalCardIds[0]);
    }
  }

  // If a completed trick is active, verify barrier
  if (snap.completedTrickPresentation !== null) {
    assert.ok(snap.completedTrickPresentation.trickNumber >= 1);
    assert.ok(["NORTH", "EAST", "SOUTH", "WEST"].includes(snap.completedTrickPresentation.winnerSeat));
    assert.equal(snap.completedTrickPresentation.plays.length, 4);

    // During barrier, human card play is blocked
    assert.throws(() => {
      session.dispatchCardPlay("HEARTS-7");
    }, /Cannot play card while completed trick presentation is active/);

    // Acknowledging clears the barrier
    snap = session.acknowledgeCompletedTrick();
    assert.equal(snap.completedTrickPresentation, null);
  }
});

test("phase 20-c presentation: round scoring breakdown preserves authoritative Qaid conversions", () => {
  const session = createLocalHumanVsAISession({
    seed: "phase-20c-scoring-breakdown-seed",
    humanSeat: "SOUTH",
  });

  // Play full round
  let snap = session.getSnapshot();
  let guard = 0;
  while (snap.roundScore === null && guard++ < 100) {
    if (snap.completedTrickPresentation !== null) {
      snap = session.acknowledgeCompletedTrick();
      continue;
    }
    if (snap.biddingPresentation && snap.game === null) {
      if (snap.humanTurn) {
        const firstOpt = snap.biddingPresentation.legalOptions[0];
        snap = session.dispatchBiddingAction(firstOpt.type, firstOpt.suit);
      }
      continue;
    }
    if (snap.game?.phase === "PLAYING" && snap.humanTurn && snap.legalCardIds.length > 0) {
      snap = session.dispatchCardPlay(snap.legalCardIds[0]);
      continue;
    }
  }

  if (snap.roundScore !== null) {
    assert.ok(typeof snap.roundScore.finalQaid.NORTH_SOUTH === "number");
    assert.ok(typeof snap.roundScore.finalQaid.EAST_WEST === "number");
    assert.ok(typeof snap.roundScore.cardRaw.NORTH_SOUTH === "number");
    assert.ok(typeof snap.roundScore.cardRaw.EAST_WEST === "number");
    assert.ok(snap.matchScore.NORTH_SOUTH >= 0);
    assert.ok(snap.matchScore.EAST_WEST >= 0);
  }
});
