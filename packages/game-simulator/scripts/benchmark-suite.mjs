import {
  simulateMatchBatch,
  simulateMatch,
  randomCardPolicy,
  firstLegalCard,
  createBaselineCardPolicy,
  createISMCTSCardPolicy,
  createEndgameEnhancedCardPolicy,
} from "../dist/index.js";
import { solveEndgame } from "@sakkah-baloot/game-ai";

console.log("================================================================================");
console.log("         SAKKAH BALOOT — PHASE 18 EMPIRICAL BENCHMARK SUITE");
console.log("================================================================================\n");

// --- 1. 1,000-Match & 10,000-Match Deterministic Stress Validation ---
console.log(">>> [1/4] Running 1,000-Match Deterministic Baseline Gate...");
const t0_1k = performance.now();
const res1k = simulateMatchBatch({
  seed: "phase18-benchmark-1k",
  games: 1000,
  maxRoundsPerGame: 50,
  policy: createBaselineCardPolicy("NORMAL"),
});
const t1_1k = performance.now();

console.log(`  Games: ${res1k.games}`);
console.log(`  Completed Matches: ${res1k.finishedMatches}`);
console.log(`  Max-Round Terminations: ${res1k.maxRoundTerminations}`);
console.log(`  Illegal Actions: ${res1k.illegalActions}`);
console.log(`  Deterministic Digest: ${res1k.deterministicDigest}`);
console.log(`  Execution Time: ${(t1_1k - t0_1k).toFixed(2)} ms (${(res1k.games / ((t1_1k - t0_1k) / 1000)).toFixed(1)} matches/sec)\n`);

console.log(">>> [2/4] Running 10,000-Match Deterministic Stress Benchmark...");
const t0_10k = performance.now();
const res10k = simulateMatchBatch({
  seed: "phase18-benchmark-10k",
  games: 10000,
  maxRoundsPerGame: 50,
  policy: firstLegalCard,
});
const t1_10k = performance.now();

console.log(`  Games: ${res10k.games}`);
console.log(`  Completed Matches: ${res10k.finishedMatches}`);
console.log(`  Max-Round Terminations: ${res10k.maxRoundTerminations}`);
console.log(`  Illegal Actions: ${res10k.illegalActions}`);
console.log(`  Deterministic Digest: ${res10k.deterministicDigest}`);
console.log(`  Execution Time: ${(t1_10k - t0_10k).toFixed(2)} ms (${(res10k.games / ((t1_10k - t0_10k) / 1000)).toFixed(1)} matches/sec)\n`);

// --- 2. Policy Matchup & Performance Comparisons ---
console.log(">>> [3/4] Running Policy Matchup Benchmarks (100 Matches per Matchup)...");

function runMatchupBenchmark(label, northSouthPolicy, eastWestPolicy, count = 100) {
  let nsWins = 0;
  let ewWins = 0;
  let totalRounds = 0;
  let totalNSQaid = 0;
  let totalEWQaid = 0;
  let illegalActions = 0;

  const tStart = performance.now();
  for (let i = 0; i < count; i += 1) {
    const seed = `matchup:${label}:${i}`;
    const policies = {
      NORTH_PLAYER: northSouthPolicy,
      SOUTH_PLAYER: northSouthPolicy,
      EAST_PLAYER: eastWestPolicy,
      WEST_PLAYER: eastWestPolicy,
    };

    const res = simulateMatch(seed, northSouthPolicy, 50, policies);
    totalRounds += res.rounds;
    totalNSQaid += res.score.NORTH_SOUTH;
    totalEWQaid += res.score.EAST_WEST;
    illegalActions += res.illegalActions;

    if (res.score.NORTH_SOUTH > res.score.EAST_WEST) {
      nsWins += 1;
    } else if (res.score.EAST_WEST > res.score.NORTH_SOUTH) {
      ewWins += 1;
    }
  }
  const tEnd = performance.now();

  const durationMs = tEnd - tStart;
  const avgRounds = (totalRounds / count).toFixed(2);
  const avgNSQaid = (totalNSQaid / count).toFixed(1);
  const avgEWQaid = (totalEWQaid / count).toFixed(1);
  const nsWinRate = ((nsWins / count) * 100).toFixed(1);

  console.log(`  Matchup: [${label}] (${count} matches)`);
  console.log(`    NS Wins: ${nsWins} (${nsWinRate}%) | EW Wins: ${ewWins}`);
  console.log(`    Avg Score: NS ${avgNSQaid} vs EW ${avgEWQaid}`);
  console.log(`    Avg Rounds/Match: ${avgRounds}`);
  console.log(`    Illegal Actions: ${illegalActions}`);
  console.log(`    Duration: ${durationMs.toFixed(1)} ms (${(count / (durationMs / 1000)).toFixed(1)} matches/sec)\n`);

  return {
    label,
    count,
    nsWins,
    ewWins,
    nsWinRate,
    avgNSQaid,
    avgEWQaid,
    avgRounds,
    illegalActions,
    durationMs,
  };
}

const baselineEasy = createBaselineCardPolicy("EASY");
const baselineNormal = createBaselineCardPolicy("NORMAL");
const baselineHard = createBaselineCardPolicy("HARD");
const isMctsPolicy = createISMCTSCardPolicy({ iterations: 16 });
const endgameEnhancedPolicy = createEndgameEnhancedCardPolicy({ maxRemainingCards: 6, maxNodes: 1000 });

const matchupResults = [
  runMatchupBenchmark("Baseline Normal (NS) vs Random (EW)", baselineNormal, randomCardPolicy, 100),
  runMatchupBenchmark("Baseline Hard (NS) vs Baseline Easy (EW)", baselineHard, baselineEasy, 100),
  runMatchupBenchmark("Baseline Hard (NS) vs Baseline Normal (EW)", baselineHard, baselineNormal, 100),
  runMatchupBenchmark("IS-MCTS (NS) vs Baseline Normal (EW)", isMctsPolicy, baselineNormal, 50),
  runMatchupBenchmark("Endgame Enhanced (NS) vs Baseline Normal (EW)", endgameEnhancedPolicy, baselineNormal, 50),
];

// --- 3. Endgame Threshold Sweeps (4, 6, 8, 10, 12 cards) ---
console.log(">>> [4/4] Running Endgame Solver Threshold Sweeps (4, 6, 8, 10, 12 cards)...");

function runEndgameThresholdSweep() {
  const thresholds = [4, 6, 8, 10, 12];
  const maxNodesLimit = 5000;
  const results = [];

  for (const threshold of thresholds) {
    let totalNodes = 0;
    let exactCount = 0;
    let totalCalls = 0;
    const tStart = performance.now();

    for (let i = 0; i < 50; i += 1) {
      const sampleState = {
        phase: "PLAYING",
        currentPlayerId: "NORTH_PLAYER",
        players: {
          NORTH_PLAYER: "NORTH",
          EAST_PLAYER: "EAST",
          SOUTH_PLAYER: "SOUTH",
          WEST_PLAYER: "WEST",
        },
        hands: {
          NORTH_PLAYER: [{ id: "SPADES-A", suit: "SPADES", rank: "A" }],
          EAST_PLAYER: [{ id: "SPADES-10", suit: "SPADES", rank: "10" }],
          SOUTH_PLAYER: [{ id: "SPADES-K", suit: "SPADES", rank: "K" }],
          WEST_PLAYER: [{ id: "SPADES-Q", suit: "SPADES", rank: "Q" }],
        },
        contract: "SUN",
        trumpSuit: null,
        hokumPlayMode: "OPEN",
        dealerSeat: "WEST",
        trickNumber: 8,
        currentTrick: [],
        completedTricks: [],
      };

      const decision = solveEndgame(sampleState, "NORTH_PLAYER", {
        maxRemainingCards: threshold,
        maxNodes: maxNodesLimit,
      });

      if (decision) {
        totalCalls += 1;
        totalNodes += decision.nodes;
        if (decision.exact) exactCount += 1;
      }
    }

    const tEnd = performance.now();
    const durationMs = tEnd - tStart;
    const avgNodes = totalCalls > 0 ? (totalNodes / totalCalls).toFixed(1) : "0";
    const exactRate = totalCalls > 0 ? ((exactCount / totalCalls) * 100).toFixed(1) : "0";

    console.log(`  Threshold: ${threshold} cards | Total Calls: ${totalCalls} | Exact: ${exactRate}% | Avg Nodes: ${avgNodes} | Time: ${durationMs.toFixed(2)} ms`);
    results.push({ threshold, totalCalls, exactRate, avgNodes, durationMs });
  }

  return results;
}

const sweepResults = runEndgameThresholdSweep();

console.log("\n================================================================================");
console.log("                     BENCHMARK SUITE COMPLETE");
console.log("================================================================================");
