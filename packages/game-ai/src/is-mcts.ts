import {
  cardRawValue,
  getLegalMoves,
  applyCardPlay,
  teamOfSeat,
  type CardId,
  type GameState,
  type PlayerId,
} from "@sakkah-baloot/game-engine";
import type { AIRoundObservation } from "./index.js";
import type { BeliefState } from "./belief-state.js";
import { createSeededRng, sampleHiddenWorld } from "./information-set-sampler.js";

export interface ISMCTSConfig {
  readonly iterations: number;
  readonly seed: string;
}

export interface ISMCTSDecision {
  readonly cardId: CardId;
  readonly visits: number;
  readonly value: number;
}

interface RootStat {
  visits: number;
  value: number;
}

export function chooseISMCTSCard(
  observation: AIRoundObservation,
  belief: BeliefState,
  config: ISMCTSConfig,
): ISMCTSDecision {
  if (!observation.playing) throw new Error("IS-MCTS requires PLAYING observation");
  if (observation.playing.game.legalCardIds.length === 0) throw new Error("No legal card actions");

  const rng = createSeededRng(config.seed);
  const stats = new Map<CardId, RootStat>(
    observation.playing.game.legalCardIds.map((id) => [id, { visits: 0, value: 0 }]),
  );

  const input = {
    playerId: observation.playerId,
    ownHand: observation.playing.game.ownHand,
    game: {
      hands: Object.fromEntries(
        Object.entries(observation.playing.game.players).map(([id]) => [id, observation.playing!.game.ownHand]),
      ),
      players: observation.playing.game.players,
      currentTrick: observation.playing.game.currentTrick,
      completedTricks: observation.playing.game.completedTricks,
    },
    currentTrick: observation.playing.game.currentTrick,
    completedTricks: observation.playing.game.completedTricks,
    contract: observation.playing.contract,
    trumpSuit: observation.playing.trumpSuit,
  };

  const iterations = Math.max(1, config.iterations);
  for (let i = 0; i < iterations; i += 1) {
    const world = sampleHiddenWorld(input, rng);
    const actionIds = [...stats.keys()];
    const selected = selectRoot(actionIds, stats, i + 1);
    const state = buildSimulationState(observation, world.hands);
    const next = applyCardPlay(state, observation.playerId, selected);
    const value = rolloutValue(next, observation.playerId, rng);
    const stat = stats.get(selected)!;
    stat.visits += 1;
    stat.value += value;
  }

  return [...stats.entries()]
    .sort((a, b) => {
      const av = a[1].value / Math.max(1, a[1].visits);
      const bv = b[1].value / Math.max(1, b[1].visits);
      return bv - av || a[0].localeCompare(b[0]);
    })
    .map(([cardId, stat]) => ({
      cardId,
      visits: stat.visits,
      value: stat.value / Math.max(1, stat.visits),
    }))[0]!;
}

function selectRoot(ids: readonly CardId[], stats: Map<CardId, RootStat>, total: number): CardId {
  for (const id of ids) if (stats.get(id)!.visits === 0) return id;
  const logTotal = Math.log(total);
  return [...ids].sort((a, b) => ucb(stats.get(b)!, logTotal) - ucb(stats.get(a)!, logTotal) || a.localeCompare(b))[0]!;
}

function ucb(stat: RootStat, logTotal: number): number {
  return stat.value / stat.visits + Math.sqrt((2 * logTotal) / stat.visits);
}

function buildSimulationState(
  observation: AIRoundObservation,
  hands: Readonly<Record<PlayerId, readonly import("@sakkah-baloot/game-engine").Card[]>>,
): GameState {
  const playing = observation.playing!;
  return {
    phase: "PLAYING",
    currentPlayerId: playing.game.currentPlayerId,
    players: playing.game.players,
    hands,
    contract: playing.contract,
    trumpSuit: playing.trumpSuit,
    hokumPlayMode: playing.game.hokumPlayMode,
    dealerSeat: playing.game.dealerSeat,
    trickNumber: playing.game.trickNumber,
    currentTrick: playing.game.currentTrick,
    completedTricks: playing.game.completedTricks,
  };
}

function rolloutValue(state: GameState, rootPlayerId: PlayerId, rng: ReturnType<typeof createSeededRng>): number {
  const rootTeam = teamOfSeat(state.players[rootPlayerId]!);
  let current = state;

  while (current.phase === "PLAYING") {
    const playerId = current.currentPlayerId;
    const legal = getLegalMoves(current, playerId);
    if (legal.length === 0) break;
    const move = legal[Math.floor(rng.next() * legal.length)]!;
    current = applyCardPlay(current, playerId, move.cardId);
  }

  return current.completedTricks.reduce((score, trick) => {
    const winnerTeam = teamOfSeat(trick.winnerSeat);
    const points = trick.plays.reduce(
      (sum, play) => sum + cardRawValue(play.card, current.contract, current.trumpSuit),
      0,
    );
    return score + (winnerTeam === rootTeam ? points : -points);
  }, 0);
}
