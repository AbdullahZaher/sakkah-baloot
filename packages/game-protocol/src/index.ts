import {
  applyBiddingAction,
  applyCardPlay,
  declareProject,
  isCardLegal,
  completeRoundState,
  completeMatchRound,
  startNextRound,
  rotateDealer,
  DECK,
} from "@sakkah-baloot/game-engine";
import type {
  BiddingHands,
  BiddingState,
  DealState,
  GameState,
  MatchState,
  ProjectCandidate,
  RoundScoreBreakdown,
  RoundState,
} from "@sakkah-baloot/game-engine";

export interface ClientActionEnvelope<TAction = unknown> {
  readonly matchId: string;
  readonly actionId: string;
  readonly playerId: string;
  readonly expectedStateVersion: number;
  readonly action: TAction;
}

export interface ServerEventEnvelope<TEvent = unknown> {
  readonly matchId: string;
  readonly eventId: string;
  readonly stateVersion: number;
  readonly event: TEvent;
}

export interface StateSnapshot<TState = unknown> {
  readonly matchId: string;
  readonly stateVersion: number;
  readonly state: TState;
}

export type MatchProtocolEvent =
  | DealEvent
  | BidEvent
  | PlayCardEvent
  | ProjectEvent
  | TrickCompleteEvent
  | RoundCompleteEvent
  | NextRoundEvent
  | MatchCompleteEvent;

export interface DealEvent {
  readonly type: "DEAL";
  readonly roundId: string;
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
}

export interface BidEvent {
  readonly type: "BID";
  readonly roundId: string;
  readonly playerId: PlayerId;
  readonly action: BiddingAction;
}

export interface PlayCardEvent {
  readonly type: "PLAY_CARD";
  readonly roundId: string;
  readonly playerId: PlayerId;
  readonly cardId: CardId;
  readonly ikaDeclared: boolean;
}

export interface ProjectEvent {
  readonly type: "PROJECT";
  readonly roundId: string;
  readonly playerId: PlayerId;
  readonly project: ProjectType;
  readonly suit: Suit | null;
}

export interface TrickCompleteEvent {
  readonly type: "TRICK_COMPLETE";
  readonly roundId: string;
  readonly trickNumber: number;
  readonly winnerSeat: Seat;
}

export interface RoundCompleteEvent {
  readonly type: "ROUND_COMPLETE";
  readonly roundId: string;
  readonly score: MatchScore;
  readonly matchEnd: MatchEndResult;
}

export interface NextRoundEvent {
  readonly type: "NEXT_ROUND";
  readonly roundId: string;
  readonly nextRoundNumber: number;
  readonly dealerSeat: Seat;
}

export interface MatchCompleteEvent {
  readonly type: "MATCH_COMPLETE";
  readonly score: MatchScore;
  readonly winnerTeamId: TeamId;
}

export interface MatchProtocolState {
  readonly matchId: string;
  readonly stateVersion: number;
  readonly roundId: string;
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
  readonly phase:
    | "DEAL"
    | "BID"
    | "PLAY_CARD"
    | "PROJECT"
    | "TRICK_COMPLETE"
    | "ROUND_COMPLETE"
    | "NEXT_ROUND"
    | "MATCH_COMPLETE";
  readonly score: MatchScore;
  readonly escalation: EscalationLevel;
}

export interface AuthoritativeBidResult {
  readonly state: BiddingState;
  readonly event: BidEvent;
}

export function applyAuthoritativeBid(
  bidding: BiddingState,
  deal: DealState,
  dealerSeat: Seat,
  event: BidEvent,
): AuthoritativeBidResult {
  const state = applyBiddingAction(
    bidding,
    event.action,
    dealerSeat,
    deal.exposedCardId,
    Object.fromEntries(DECK.map((card) => [card.id, card])),
    deal.hands as BiddingHands,
  );
  return { state, event };
}

export interface AuthoritativeProjectResult {
  readonly project: ReturnType<typeof declareProject>;
  readonly event: ProjectEvent;
}

export function applyAuthoritativeProject(
  candidate: ProjectCandidate,
  existing: readonly ReturnType<typeof declareProject>[],
  event: ProjectEvent,
): AuthoritativeProjectResult {
  const project = declareProject(candidate, event.project, "PLAYING", 1, 0, existing);
  return { project, event };
}

export interface AuthoritativePlayResult {
  readonly state: GameState;
  readonly event: PlayCardEvent;
}

/** Apply a PLAY_CARD protocol event through the canonical game-engine rules. */
export function applyAuthoritativePlayCard(
  game: GameState,
  event: PlayCardEvent,
): AuthoritativePlayResult {
  if (game.phase !== "PLAYING") throw new Error("Game is not in PLAYING phase");
  if (game.currentPlayerId !== event.playerId) throw new Error("Card play is not for the current player");
  if (!isCardLegal(game, event.playerId, event.cardId)) {
    throw new Error("Card play is illegal under game-engine rules");
  }
  return {
    state: applyCardPlay(game, event.playerId, event.cardId, event.ikaDeclared),
    event,
  };
}

export interface AuthoritativeRoundCompleteResult {
  readonly state: MatchState;
  readonly event: RoundCompleteEvent;
}

export function applyAuthoritativeRoundComplete(
  match: MatchState,
  round: RoundState,
  roundScore: RoundScoreBreakdown,
  event: RoundCompleteEvent,
): AuthoritativeRoundCompleteResult {
  if (match.phase !== "ROUND_ACTIVE") throw new Error("Match round is not active");
  if (round.roundId !== event.roundId || round.roundId !== match.roundId) throw new Error("Round completion belongs to another round");
  if (round.phase !== "PLAYING" || round.game?.phase !== "ROUND_COMPLETE") {
    throw new Error("Round cannot complete before all tricks are finished");
  }
  const completedRound = completeRoundState(round, roundScore);
  const next = completeMatchRound(match, roundScore, completedRound);
  if (next.score.NORTH_SOUTH !== event.score.NORTH_SOUTH || next.score.EAST_WEST !== event.score.EAST_WEST) {
    throw new Error("ROUND_COMPLETE score does not match authoritative engine state");
  }
  if (next.end.status !== event.matchEnd.status) throw new Error("ROUND_COMPLETE match-end status does not match engine state");
  return { state: next, event };
}

export interface AuthoritativeNextRoundResult {
  readonly state: import("@sakkah-baloot/game-engine").MatchState;
  readonly event: NextRoundEvent;
}

export function applyAuthoritativeNextRound(
  match: import("@sakkah-baloot/game-engine").MatchState,
  nextRound: RoundState,
  event: NextRoundEvent,
): AuthoritativeNextRoundResult {
  if (match.phase !== "ROUND_COMPLETE") throw new Error("Next round requires a completed round");
  const expectedRoundNumber = match.roundNumber + 1;
  if (event.nextRoundNumber !== expectedRoundNumber) throw new Error("Next round number is not sequential");
  if (nextRound.roundNumber !== expectedRoundNumber || nextRound.roundId !== event.roundId) {
    throw new Error("Next round state does not match protocol event");
  }
  const expectedDealer = rotateDealer(match.dealerSeat);
  if (event.dealerSeat !== expectedDealer || nextRound.dealerSeat !== expectedDealer) {
    throw new Error("Next round dealer does not match engine rotation");
  }
  const next = startNextRound(match, nextRound);
  return { state: next, event };
}

export interface ProtocolReplayResult {
  readonly state: MatchProtocolState;
  readonly appliedEventIds: readonly string[];
}

export function deterministicEventId(
  matchId: string,
  stateVersion: number,
  event: MatchProtocolEvent,
): string {
  const roundId = "roundId" in event ? event.roundId : "MATCH";
  return `${matchId}:v${stateVersion}:${event.type}:${roundId}`;
}

export function applyProtocolEvent(
  state: MatchProtocolState,
  envelope: ServerEventEnvelope<MatchProtocolEvent>,
  processedEventIds: readonly string[] = [],
): ProtocolReplayResult {
  if (envelope.matchId !== state.matchId) {
    throw new Error("Protocol event belongs to another match");
  }

  if (processedEventIds.includes(envelope.eventId)) {
    return { state, appliedEventIds: processedEventIds };
  }

  if (envelope.stateVersion !== state.stateVersion + 1) {
    throw new Error("Protocol event state version is not sequential");
  }

  const event = envelope.event;
  if ("roundId" in event && event.roundId !== state.roundId && event.type !== "NEXT_ROUND") {
    throw new Error("Protocol event belongs to another round");
  }

  assertProtocolTransition(state.phase, event);

  const nextPhase = protocolPhaseForEvent(event);
  const score = event.type === "ROUND_COMPLETE" || event.type === "MATCH_COMPLETE"
    ? event.score
    : state.score;

  const next: MatchProtocolState = {
    ...state,
    stateVersion: envelope.stateVersion,
    phase: nextPhase,
    roundId: event.type === "NEXT_ROUND" ? event.roundId : state.roundId,
    roundNumber: event.type === "NEXT_ROUND" ? event.nextRoundNumber : state.roundNumber,
    dealerSeat: event.type === "DEAL"
      ? event.dealerSeat
      : event.type === "NEXT_ROUND"
        ? event.dealerSeat
        : state.dealerSeat,
    score,
  };

  return {
    state: next,
    appliedEventIds: [...processedEventIds, envelope.eventId],
  };
}

export function replayProtocol(
  initialState: MatchProtocolState,
  events: readonly ServerEventEnvelope<MatchProtocolEvent>[],
): ProtocolReplayResult {
  let result: ProtocolReplayResult = { state: initialState, appliedEventIds: [] };
  for (const event of events) {
    result = applyProtocolEvent(result.state, event, result.appliedEventIds);
  }
  return result;
}

function protocolPhaseForEvent(event: MatchProtocolEvent): MatchProtocolState["phase"] {
  switch (event.type) {
    case "DEAL":
      return "DEAL";
    case "BID":
      return "BID";
    case "PROJECT":
      return "PROJECT";
    case "PLAY_CARD":
      return "PLAY_CARD";
    case "TRICK_COMPLETE":
      return "TRICK_COMPLETE";
    case "ROUND_COMPLETE":
      return "ROUND_COMPLETE";
    case "NEXT_ROUND":
      return "NEXT_ROUND";
    case "MATCH_COMPLETE":
      return "MATCH_COMPLETE";
  }
}
