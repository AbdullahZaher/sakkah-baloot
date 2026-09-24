import type {
  BalootDeclaration,
  BiddingAction,
  BiddingState,
  Card,
  CardId,
  CompletedTrick,
  Contract,
  MatchEndResult,
  MatchScore,
  MatchSeed,
  MatchState,
  PlayerId,
  ProjectDeclaration,
  ProjectType,
  RoundScoreBreakdown,
  RoundState,
  Seat,
  Suit,
  TrickPlay,
} from "@sakkah-baloot/game-engine";
import type {
  MatchProtocolEvent,
  ServerEventEnvelope,
} from "@sakkah-baloot/game-protocol";
import type { ServerErrorCode } from "./errors.js";

export type ConnectionStatus = "CONNECTED" | "DISCONNECTED";

export type ClientCommandPayload =
  | { readonly type: "BID"; readonly action: BiddingAction }
  | {
      readonly type: "PLAY_CARD";
      readonly cardId: CardId;
      readonly ikaDeclared?: boolean;
      readonly balootDeclared?: boolean;
    }
  | { readonly type: "DECLARE_PROJECT"; readonly projectId: string }
  | { readonly type: "DECLARE_BALOOT"; readonly cardId: CardId }
  | { readonly type: "ADVANCE_ROUND" };

export interface ClientCommand<
  TPayload extends ClientCommandPayload = ClientCommandPayload,
> {
  readonly matchId: string;
  readonly roundId?: string;
  readonly playerId: PlayerId;
  readonly actionId: string;
  readonly expectedStateVersion: number;
  readonly payload: TPayload;
}

export interface PlayerScopedSnapshot {
  readonly matchId: string;
  readonly roundId: string;
  readonly roundNumber: number;
  readonly stateVersion: number;
  readonly dealerSeat: Seat;
  readonly matchPhase: MatchState["phase"];
  readonly roundPhase: RoundState["phase"] | "NONE";
  readonly score: MatchScore;
  readonly lastRoundScore: RoundScoreBreakdown | null;
  readonly matchEnd: MatchEndResult;
  readonly playerSeat: Seat;
  readonly playerId: PlayerId;
  readonly ownHand: readonly Card[];
  readonly opponentCardCounts: Readonly<Record<Seat, number>>;
  readonly exposedCard: Card | null;
  readonly biddingState: BiddingState | null;
  readonly legalBiddingActions: readonly BiddingAction["type"][];
  readonly publicPlays: readonly TrickPlay[];
  readonly completedTricks: readonly CompletedTrick[];
  readonly legalCardIds: readonly CardId[];
  readonly contract: Contract | null;
  readonly trumpSuit: Suit | null;
  readonly projects: readonly ProjectDeclaration[];
  readonly baloot: BalootDeclaration | null;
  readonly playerSeats: Readonly<Record<Seat, PlayerId>>;
  readonly connectionStatus: Readonly<Record<PlayerId, ConnectionStatus>>;
}

export interface CommandResult {
  readonly success: boolean;
  readonly matchId: string;
  readonly stateVersion: number;
  readonly events: readonly ServerEventEnvelope<MatchProtocolEvent>[];
  readonly snapshot: PlayerScopedSnapshot;
  readonly cached?: boolean;
}

export interface ResumeResult {
  readonly matchId: string;
  readonly playerId: PlayerId;
  readonly currentVersion: number;
  readonly snapshot: PlayerScopedSnapshot;
  readonly missedEvents: readonly ServerEventEnvelope<MatchProtocolEvent>[];
}

export interface MatchHostConfig {
  readonly matchId: string;
  readonly initialDealerSeat?: Seat;
  readonly playerBindings: Readonly<Record<Seat, PlayerId>>;
  readonly seed?: MatchSeed;
  readonly persistence?: MatchPersistence;
}

export interface MatchPersistence {
  saveSnapshot(
    matchId: string,
    stateVersion: number,
    state: MatchState,
  ): Promise<void>;
  appendEvents(
    matchId: string,
    events: readonly ServerEventEnvelope<MatchProtocolEvent>[],
  ): Promise<void>;
  loadSnapshot(matchId: string): Promise<MatchState | null>;
  loadEventsAfter(
    matchId: string,
    stateVersion: number,
  ): Promise<readonly ServerEventEnvelope<MatchProtocolEvent>[]>;
}

export interface AuthoritativeMatchHost {
  readonly matchId: string;
  getStateVersion(): number;
  getSnapshot(playerId: PlayerId): PlayerScopedSnapshot;
  submitCommand(command: ClientCommand): Promise<CommandResult>;
  reconnect(playerId: PlayerId, resumeFromVersion?: number): Promise<ResumeResult>;
  disconnect(playerId: PlayerId): void;
  getMatchState(): MatchState;
  getPlayerSeat(playerId: PlayerId): Seat;
  getAllBindings(): Readonly<Record<Seat, PlayerId>>;
}
