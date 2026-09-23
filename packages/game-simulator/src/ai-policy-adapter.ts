import {
  createMatchState,
  createRoundState,
  withRoundBaloot,
  withRoundGame,
  withRoundProjects,
  type BiddingState,
  type CardId,
  type CardPolicy as _Unused,
  type DealState,
  type GameState,
  type MatchScore,
  type PlayerId,
  type ProjectDeclaration,
  type Seat,
} from "@sakkah-baloot/game-engine";
import { chooseAuthoritativeAIAction, type AIControllerConfig } from "@sakkah-baloot/game-ai";
import type { CardPolicy } from "./index.js";

export interface AISimulationPlayer {
  readonly playerId: PlayerId;
  readonly seat: Seat;
  readonly config: AIControllerConfig;
}

export interface AISimulationContext {
  readonly matchId: string;
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
  readonly deal: DealState;
  readonly bidding: BiddingState;
  readonly game: GameState;
  readonly projects: readonly ProjectDeclaration[];
  readonly baloot: import("@sakkah-baloot/game-engine").BalootDeclaration | null;
  readonly score: MatchScore;
}

export interface AISimulationPolicySet {
  readonly policies: Readonly<Record<PlayerId, CardPolicy>>;
  update(context: AISimulationContext): void;
}

export function createAISimulationPolicySet(
  players: readonly AISimulationPlayer[],
): AISimulationPolicySet {
  let current: AISimulationContext | null = null;

  const policies: Record<PlayerId, CardPolicy> = {};
  for (const player of players) {
    policies[player.playerId] = ({ state, playerId }) => {
      if (!current) throw new Error("AI simulation context is not initialized");
      if (state !== current.game) {
        current = { ...current, game: state };
      }

      const roundBase = withRoundGame(
        withRoundProjects(
          createRoundState(current.deal, current.bidding, current.roundNumber),
          current.projects,
        ),
        current.game,
      );
      const round = current.baloot
        ? withRoundBaloot(roundBase, current.baloot)
        : roundBase;

      const matchBase = createMatchState(
        current.matchId,
        current.dealerSeat,
        current.roundNumber,
        round,
      );
      const match = {
        ...matchBase,
        score: current.score,
        end: { status: "ONGOING", score: current.score } as const,
        roundId: current.deal.roundId,
      };

      const decision = chooseAuthoritativeAIAction(
        match,
        playerId,
        player.seat,
        {
          ...player.config,
          seed: `${player.config.seed}:${current.roundNumber}:${state.trickNumber}:${state.currentTrick.length}`,
        },
      );

      if (decision.action.type !== "PLAY_CARD") {
        throw new Error(
          `AI controller produced ${decision.action.type} during card-play simulation`,
        );
      }

      if (!current.game.hands[playerId]?.some((card) => card.id === decision.action.cardId)) {
        throw new Error(`AI controller selected a card outside ${playerId}'s hand`);
      }

      return decision.action.cardId;
    };
  }

  return {
    policies,
    update(context) {
      current = context;
    },
  };
}
