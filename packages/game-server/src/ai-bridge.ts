import type {
  Card,
  CardId,
  PlayerId,
  Seat,
  TeamId,
} from "@sakkah-baloot/game-engine";
import { teamOfSeat } from "@sakkah-baloot/game-engine";
import type {
  AIAction,
  AIControllerConfig,
  AIRoundObservation,
} from "@sakkah-baloot/game-ai";
import { decideAIAction } from "@sakkah-baloot/game-ai";
import { ServerBoundaryError, ServerErrorCode } from "./errors.js";
import type {
  AuthoritativeMatchHost,
  ClientCommand,
  ClientCommandPayload,
  CommandResult,
  PlayerScopedSnapshot,
} from "./types.js";

export function snapshotToAIObservation(
  snapshot: PlayerScopedSnapshot,
): AIRoundObservation {
  const teamId = teamOfSeat(snapshot.playerSeat);

  if (snapshot.roundPhase === "BIDDING") {
    if (!snapshot.biddingState) {
      throw new ServerBoundaryError(
        ServerErrorCode.INTERNAL_ERROR,
        "Snapshot in BIDDING phase missing biddingState",
      );
    }

    return {
      matchId: snapshot.matchId,
      roundId: snapshot.roundId,
      roundNumber: snapshot.roundNumber,
      playerId: snapshot.playerId,
      seat: snapshot.playerSeat,
      teamId,
      phase: "BIDDING",
      score: snapshot.score,
      bidding: {
        phase: "BIDDING",
        bidding: snapshot.biddingState,
        ownHand: snapshot.ownHand,
        exposedCard: snapshot.exposedCard,
        legalActions: snapshot.legalBiddingActions,
      },
      playing: null,
      projects: snapshot.projects,
      baloot: snapshot.baloot,
      stateVersion: snapshot.stateVersion,
    };
  }

  const knownPlayedCards = [
    ...snapshot.completedTricks.flatMap((t) => t.plays.map((p) => p.card)),
    ...snapshot.publicPlays.map((p) => p.card),
  ];

  const trickNumber =
    snapshot.completedTricks.length < 8
      ? snapshot.completedTricks.length + 1
      : 8;

  const playerMap: Record<PlayerId, Seat> = {} as any;
  for (const [seat, pid] of Object.entries(snapshot.playerSeats)) {
    playerMap[pid as PlayerId] = seat as Seat;
  }

  const currentPlayerId =
    snapshot.roundPhase === "PLAYING"
      ? snapshot.publicPlays.length === 0
        ? snapshot.completedTricks.length === 0
          ? snapshot.playerSeats[snapshot.dealerSeat] // Will be updated by trick leader
          : snapshot.playerSeats[
              snapshot.completedTricks[snapshot.completedTricks.length - 1]!
                .winnerSeat
            ]
        : snapshot.playerId // Acting player
      : snapshot.playerId;

  const publicGame = {
    phase:
      snapshot.roundPhase === "ROUND_COMPLETE"
        ? ("ROUND_COMPLETE" as const)
        : ("PLAYING" as const),
    currentPlayerId,
    players: playerMap,
    contract: snapshot.contract ?? "SUN",
    trumpSuit: snapshot.trumpSuit,
    hokumPlayMode: "OPEN" as const,
    dealerSeat: snapshot.dealerSeat,
    trickNumber,
    currentTrick: snapshot.publicPlays,
    completedTricks: snapshot.completedTricks,
    ownHand: snapshot.ownHand,
    knownPlayedCards,
    legalCardIds: snapshot.legalCardIds,
  };

  return {
    matchId: snapshot.matchId,
    roundId: snapshot.roundId,
    roundNumber: snapshot.roundNumber,
    playerId: snapshot.playerId,
    seat: snapshot.playerSeat,
    teamId,
    phase:
      snapshot.roundPhase === "ROUND_COMPLETE"
        ? "ROUND_COMPLETE"
        : snapshot.matchPhase === "MATCH_COMPLETE"
          ? "MATCH_COMPLETE"
          : "PLAYING",
    score: snapshot.score,
    bidding: null,
    playing:
      snapshot.roundPhase === "ROUND_COMPLETE"
        ? null
        : {
            phase: "PLAYING",
            game: publicGame,
            contract: snapshot.contract ?? "SUN",
            trumpSuit: snapshot.trumpSuit,
          },
    projects: snapshot.projects,
    baloot: snapshot.baloot,
    stateVersion: snapshot.stateVersion,
  };
}

export function aiActionToCommandPayload(
  action: AIAction,
): ClientCommandPayload {
  switch (action.type) {
    case "BID":
      return { type: "BID", action: action.action };
    case "PLAY_CARD":
      return {
        type: "PLAY_CARD",
        cardId: action.cardId,
        ...(action.ikaDeclared !== undefined
          ? { ikaDeclared: action.ikaDeclared }
          : {}),
        ...(action.balootDeclared !== undefined
          ? { balootDeclared: action.balootDeclared }
          : {}),
      };
    case "DECLARE_PROJECT":
      return {
        type: "DECLARE_PROJECT",
        projectId: action.declarationId,
      };
    case "DECLARE_BALOOT":
      return {
        type: "DECLARE_BALOOT",
        cardId: action.declarationId as CardId,
      };
  }
}

export async function executeAITurn(
  host: AuthoritativeMatchHost,
  aiPlayerId: PlayerId,
  config?: Partial<AIControllerConfig>,
): Promise<CommandResult | null> {
  const snapshot = host.getSnapshot(aiPlayerId);

  // If not AI's turn, do nothing
  if (
    snapshot.roundPhase === "BIDDING" &&
    snapshot.legalBiddingActions.length === 0
  ) {
    return null;
  }
  if (
    snapshot.roundPhase === "PLAYING" &&
    snapshot.legalCardIds.length === 0
  ) {
    return null;
  }
  if (snapshot.roundPhase === "ROUND_COMPLETE" || snapshot.matchPhase === "MATCH_COMPLETE") {
    return null;
  }

  const observation = snapshotToAIObservation(snapshot);
  const controllerConfig: AIControllerConfig = {
    mode: config?.mode ?? "BASELINE",
    seed: config?.seed ?? `${host.matchId}:${snapshot.roundId}:v${snapshot.stateVersion}`,
    baseline: config?.baseline ?? { difficulty: "NORMAL" },
    ...(config?.mcts ? { mcts: config.mcts } : {}),
  };

  const decision = decideAIAction(observation, controllerConfig);
  const payload = aiActionToCommandPayload(decision.action);

  const command: ClientCommand = {
    matchId: host.matchId,
    roundId: snapshot.roundId,
    playerId: aiPlayerId,
    actionId: `ai:${host.matchId}:${snapshot.roundId}:v${snapshot.stateVersion}:${payload.type}`,
    expectedStateVersion: snapshot.stateVersion,
    payload,
  };

  // Submit via the exact same authoritative boundary
  return host.submitCommand(command);
}
