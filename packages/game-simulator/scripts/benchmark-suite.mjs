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

// --- 3. Endgame Threshold Sweeps (4, 6, 8, 10, 12 cards) & Oracle Agreement ---
console.log(">>> [4/4] Running Endgame Solver Threshold Sweeps (4, 6, 8, 10, 12 cards) with Oracle Comparison...\n");

import {
  applyCardPlay,
  getLegalMoves,
  createSeededRandom,
  teamOfSeat,
  cardRawValue,
} from "@sakkah-baloot/game-engine";

function cardHelper(id) {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
}

function generateEndgameStatesForSize(targetCards, count = 20) {
  const states = [];
  let seedNum = 1;
  const SUITS = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];
  const RANKS = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  const ALL_CARDS = SUITS.flatMap((s) => RANKS.map((r) => `${s}-${r}`));

  while (states.length < count && seedNum < 500) {
    const roundId = `endgame-bench-${targetCards}-${seedNum++}`;
    const rng = createSeededRandom(roundId);
    
    const shuffled = [...ALL_CARDS].sort(() => rng.next() - 0.5);
    const selected = shuffled.slice(0, targetCards);
    
    const hands = {
      NORTH_PLAYER: [],
      EAST_PLAYER: [],
      SOUTH_PLAYER: [],
      WEST_PLAYER: [],
    };
    const playerIds = ["NORTH_PLAYER", "EAST_PLAYER", "SOUTH_PLAYER", "WEST_PLAYER"];
    selected.forEach((id, idx) => {
      hands[playerIds[idx % 4]].push(cardHelper(id));
    });

    const isSun = seedNum % 2 === 0;
    const trumpSuit = isSun ? null : SUITS[Math.floor(rng.next() * 4)];

    const state = {
      phase: "PLAYING",
      currentPlayerId: playerIds[Math.floor(rng.next() * 4)],
      players: {
        NORTH_PLAYER: "NORTH",
        EAST_PLAYER: "EAST",
        SOUTH_PLAYER: "SOUTH",
        WEST_PLAYER: "WEST",
      },
      hands,
      contract: isSun ? "SUN" : "HOKUM",
      trumpSuit,
      hokumPlayMode: "OPEN",
      dealerSeat: "WEST",
      trickNumber: 8 - Math.floor(targetCards / 4),
      currentTrick: [],
      completedTricks: [],
    };

    const legal = getLegalMoves(state, state.currentPlayerId);
    if (legal.length > 0) {
      states.push(state);
    }
  }
  return states;
}

function exhaustiveOracle(state, rootPlayerId) {
  const rootTeam = teamOfSeat(state.players[rootPlayerId]);
  const memo = new Map();

  function minimaxOracle(st) {
    if (st.phase !== "PLAYING") {
      return st.completedTricks.reduce((score, trick) => {
        const points = trick.plays.reduce(
          (sum, play) => sum + cardRawValue(play.card, st.contract, st.trumpSuit),
          0,
        );
        return score + (teamOfSeat(trick.winnerSeat) === rootTeam ? points : -points);
      }, 0);
    }

    const legal = getLegalMoves(st, st.currentPlayerId);
    if (legal.length === 0) return 0;

    const key = JSON.stringify({
      cp: st.currentPlayerId,
      h: Object.entries(st.hands).map(([k, v]) => [k, v.map((c) => c.id).sort()]),
      ct: st.currentTrick.map((p) => p.card.id),
      tr: st.completedTricks.length,
    });
    if (memo.has(key)) return memo.get(key);

    const maximizing = teamOfSeat(st.players[st.currentPlayerId]) === rootTeam;
    let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (const move of legal) {
      const next = applyCardPlay(st, st.currentPlayerId, move.cardId);
      const val = minimaxOracle(next);
      best = maximizing ? Math.max(best, val) : Math.min(best, val);
    }

    memo.set(key, best);
    return best;
  }

  const legal = getLegalMoves(state, state.currentPlayerId);
  let bestCard = legal[0]?.cardId;
  let bestVal = Number.NEGATIVE_INFINITY;
  for (const move of legal) {
    const next = applyCardPlay(state, state.currentPlayerId, move.cardId);
    const val = minimaxOracle(next);
    if (val > bestVal || (val === bestVal && move.cardId.localeCompare(bestCard) < 0)) {
      bestVal = val;
      bestCard = move.cardId;
    }
  }

  return { cardId: bestCard, value: bestVal };
}

function runEndgameThresholdSweep() {
  const thresholds = [4, 6, 8, 10, 12];
  const maxNodesLimit = 2000;
  const results = [];

  console.log("  Threshold | States | Exact | Cutoff | Oracle Agreement | Avg Nodes | Max Nodes | Time (ms) | Avg Latency");
  console.log("  ----------|--------|-------|--------|------------------|-----------|-----------|-----------|------------");

  for (const threshold of thresholds) {
    const states = generateEndgameStatesForSize(threshold, 20);
    let totalNodes = 0;
    let maxNodes = 0;
    let exactCount = 0;
    let cutoffCount = 0;
    let oracleMatches = 0;
    const tStart = performance.now();

    for (const st of states) {
      const decision = solveEndgame(st, st.currentPlayerId, {
        maxRemainingCards: threshold,
        maxNodes: maxNodesLimit,
      });
      const oracle = exhaustiveOracle(st, st.currentPlayerId);

      if (decision) {
        totalNodes += decision.nodes;
        maxNodes = Math.max(maxNodes, decision.nodes);
        if (decision.exact) exactCount += 1;
        else cutoffCount += 1;
        if (decision.cardId === oracle.cardId || decision.value === oracle.value) {
          oracleMatches += 1;
        }
      }
    }

    const tEnd = performance.now();
    const durationMs = tEnd - tStart;
    const avgNodes = (totalNodes / states.length).toFixed(1);
    const avgLatency = (durationMs / states.length).toFixed(3) + " ms";
    const oracleAgreePct = ((oracleMatches / states.length) * 100).toFixed(0);
    const agreementStr = `${oracleMatches}/${states.length} (${oracleAgreePct}%)`;

    console.log(`  ${threshold.toString().padEnd(9)} | ${states.length.toString().padEnd(6)} | ${exactCount.toString().padEnd(5)} | ${cutoffCount.toString().padEnd(6)} | ${agreementStr.padEnd(16)} | ${avgNodes.padEnd(9)} | ${maxNodes.toString().padEnd(9)} | ${durationMs.toFixed(2).padEnd(9)} | ${avgLatency}`);
    results.push({ threshold, statesCount: states.length, exactCount, cutoffCount, oracleMatches, oracleAgreePct, avgNodes, maxNodes, durationMs, avgLatency });
  }

  return results;
}

const sweepResults = runEndgameThresholdSweep();

console.log("\n================================================================================");
console.log("                     BENCHMARK SUITE COMPLETE");
console.log("================================================================================");

