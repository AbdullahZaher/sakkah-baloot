import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  executeAITurn,
} from "../src/index.ts";

const PLAYER_BINDINGS = {
  NORTH: "ai-north",
  EAST: "ai-east",
  SOUTH: "ai-south",
  WEST: "ai-west",
};

test("AI seats use unified submitCommand path and complete full round automatically", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "ai-unified-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "ai-deterministic-seed-1",
  });

  const seatOrder = ["ai-east", "ai-south", "ai-west", "ai-north"];

  // 1. Execute bidding turns with AI
  let biddingTurns = 0;
  while (
    host.getMatchState().round.phase === "BIDDING" &&
    biddingTurns < 20
  ) {
    const actingSeat = host.getMatchState().round.bidding.actingSeat;
    const actingPlayerId = PLAYER_BINDINGS[actingSeat];

    const result = await executeAITurn(host, actingPlayerId, {
      mode: "BASELINE",
      baseline: { difficulty: "NORMAL" },
    });

    assert.ok(result);
    assert.equal(result.success, true);
    biddingTurns++;
  }

  const stateAfterBidding = host.getMatchState();
  assert.equal(stateAfterBidding.round.phase, "PLAYING");
  assert.ok(stateAfterBidding.round.game);

  // 2. Execute playing turns (8 tricks = 32 plays) with AI
  let playTurns = 0;
  while (
    host.getMatchState().round.phase === "PLAYING" &&
    playTurns < 40
  ) {
    const activePlayerId = host.getMatchState().round.game.currentPlayerId;

    const result = await executeAITurn(host, activePlayerId, {
      mode: "BASELINE",
      baseline: { difficulty: "NORMAL" },
    });

    assert.ok(result);
    assert.equal(result.success, true);
    playTurns++;
  }

  const finalMatch = host.getMatchState();
  assert.equal(finalMatch.round.phase, "ROUND_COMPLETE");
  assert.ok(finalMatch.lastRoundScore);
  assert.equal(finalMatch.round.game.completedTricks.length, 8);
});
