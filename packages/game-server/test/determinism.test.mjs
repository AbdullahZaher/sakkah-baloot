import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  executeAITurn,
} from "../src/index.ts";

const PLAYER_BINDINGS = {
  NORTH: "p-north",
  EAST: "p-east",
  SOUTH: "p-south",
  WEST: "p-west",
};

test("two independent match hosts with the same seed produce identical trajectories", async () => {
  const seed = "deterministic-repro-seed-999";

  const hostA = createAuthoritativeMatchHost({
    matchId: "match-A",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed,
  });

  const hostB = createAuthoritativeMatchHost({
    matchId: "match-B",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed,
  });

  // Verify initial deals match
  assert.deepEqual(
    hostA.getSnapshot("p-north").ownHand,
    hostB.getSnapshot("p-north").ownHand,
  );
  assert.deepEqual(
    hostA.getSnapshot("p-east").ownHand,
    hostB.getSnapshot("p-east").ownHand,
  );

  // Run full round with AI on both hosts
  while (hostA.getMatchState().round.phase === "BIDDING") {
    const seatA = hostA.getMatchState().round.bidding.actingSeat;
    const seatB = hostB.getMatchState().round.bidding.actingSeat;
    assert.equal(seatA, seatB);

    await executeAITurn(hostA, PLAYER_BINDINGS[seatA], { mode: "BASELINE" });
    await executeAITurn(hostB, PLAYER_BINDINGS[seatB], { mode: "BASELINE" });
  }

  assert.equal(hostA.getStateVersion(), hostB.getStateVersion());

  while (hostA.getMatchState().round.phase === "PLAYING") {
    const activeA = hostA.getMatchState().round.game.currentPlayerId;
    const activeB = hostB.getMatchState().round.game.currentPlayerId;
    assert.equal(activeA, activeB);

    await executeAITurn(hostA, activeA, { mode: "BASELINE" });
    await executeAITurn(hostB, activeB, { mode: "BASELINE" });
  }

  assert.equal(hostA.getStateVersion(), hostB.getStateVersion());
  assert.deepEqual(hostA.getMatchState().score, hostB.getMatchState().score);
  assert.deepEqual(
    hostA.getMatchState().lastRoundScore,
    hostB.getMatchState().lastRoundScore,
  );
});
