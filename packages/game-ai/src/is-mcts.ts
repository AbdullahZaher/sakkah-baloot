import {
  CARDS_PER_PLAYER,
  cardRawValue,
  getLegalMoves,
  applyCardPlay,
  teamOfSeat,
  type Card,
  type CardId,
  type GameState,
  type PlayerId,
} from "@sakkah-baloot/game-engine";
import type { AIRoundObservation } from "./index.js";
import type { BeliefState } from "./belief-state.js";
import { createSeededRng } from "./information-set-sampler.js";
import { sampleBeliefWorlds } from "./belief-state.js";

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

  const input = buildInformationSetInput(observation);
  const rng = createSeededRng(`${config.seed}:rollout`);
  const stats = new Map<CardId, RootStat>(
    observation.playing.game.legalCardIds.map((id) => [id, { visits: 0, value: 0 }]),
  );

  const iterations = Math.max(1, Math.floor(config.iterations));
  for (let i = 0; i < iterations; i += 1) {
    const world = sampleHiddenWorld(input, rng);
    if (!worldMatchesBelief(world, belief)) continue;

    const selected = selectRoot([...stats.keys()], stats, i + 1);
    const state = buildSimulationState(observation, world.hands);
    const next = applyCardPlay(state, observation.playerId, selected);
    const value = rolloutValue(next, observation.playerId, rng);

    const stat = stats.get(selected)!;
    stat.visits += 1;
    stat.value += value;
  }

  const decisions = [...stats.entries()]
    .map(([cardId, stat]) => ({
      cardId,
      visits: stat.visits,
      value: stat.value / Math.max(1, stat.visits),
    }))
    .sort((a, b) => b.value - a.value || b.visits - a.visits || a.cardId.localeCompare(b.cardId));

  const selected = decisions[0]!;
  return selected;
}

function buildInformationSetInput(observation: AIRoundObservation) {
  const playing = observation.playing!;
  const allPlayerIds = Object.keys(playing.game.players);
  const playedCounts = Object.fromEntries(
    allPlayerIds.map((playerId) => [
      playerId,
      [
        ...playing.game.completedTricks.flatMap((trick) => trick.plays),
        ...playing.game.currentTrick,
      ].filter((play) => play.playerId === playerId).length,
    ]),
  ) as Record<PlayerId, number>;

  const hands = Object.fromEntries(
    allPlayerIds.map((playerId) => [
      playerId,
      playerId === observation.playerId
        ? playing.game.ownHand
        : Array.from({ length: CARDS_PER_PLAYER - playedCounts[playerId]! }, (_, index) =>
            placeholderCard(`HIDDEN-${playerId}-${index}`),
          ),
    ]),
  ) as Readonly<Record<PlayerId, readonly Card[]>>;

  return {
    playerId: observation.playerId,
    ownHand: playing.game.ownHand,
    game: {
      hands,
      players: playing.game.players,
      currentTrick: playing.game.currentTrick,
      completedTricks: playing.game.completedTricks,
    },
    contract: playing.contract,
    trumpSuit: playing.trumpSuit,
  };
}

function placeholderCard(id: string): Card {
  return {
    id: id as CardId,
    suit: "CLUBS",
    rank: "7",
  };
}

function worldMatchesBelief(
  world: { readonly hands: Readonly<Record<PlayerId, readonly Card[]>> },
  belief: BeliefState,
): boolean {
  for (const [cardId, owners] of Object.entries(belief.possibleOwners)) {
    const owner = Object.entries(world.hands).find(([, hand]) =>
      hand.some((card) => card.id === cardId),
    )?.[0];

    if (owner && !owners.includes(owner)) return false;
  }
  return true;
}

function selectRoot(ids: readonly CardId[], stats: Map<CardId, RootStat>, total: number): CardId {
  for (const id of ids) {
    if (stats.get(id)!.visits === 0) return id;
  }

  const logTotal = Math.log(Math.max(2, total));
  return [...ids]
    .sort(
      (a, b) =>
        ucb(stats.get(b)!, logTotal) -
        ucb(stats.get(a)!, logTotal) ||
        a.localeCompare(b),
    )[0]!;
}

function ucb(stat: RootStat, logTotal: number): number {
  return stat.value / stat.visits + Math.sqrt((2 * logTotal) / stat.visits);
}

function buildSimulationState(
  observation: AIRoundObservation,
  hands: Readonly<Record<PlayerId, readonly Card[]>>,
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

function rolloutValue(
  state: GameState,
  rootPlayerId: PlayerId,
  rng: ReturnType<typeof createSeededRng>,
): number {
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
