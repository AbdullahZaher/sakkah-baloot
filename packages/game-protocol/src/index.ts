import {
  applyBiddingAction,
  applyCardPlay,
  canDeclareBaloot,
  declareBaloot,
  declareProject,
  isProjectDeclarationWindow,
  isCardLegal,
  completeRoundState,
  completeMatchRound,
  startNextRound,
  rotateDealer,
  DECK,
} from "@sakkah-baloot/game-engine";
import type {
  BiddingAction,
  BiddingHands,
  Card,
  BiddingState,
  DealState,
  GameState,
  MatchEndResult,
  MatchScore,
  MatchState,
  PlayerId,
  ProjectCandidate,
  ProjectDeclaration,
  RoundScoreBreakdown,
  RoundState,
  Seat,
  Suit,
  TeamId,
  EscalationLevel,
  CardId,
  ProjectType,
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
  | BalootEvent
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
  /**
   * Baloot is declared on the second K/Q play, before the card commit.
   * The authoritative bridge validates this flag against the complete round history.
   */
  readonly balootDeclared?: boolean;
}

export interface BalootEvent {
  readonly type: "BALOOT";
  readonly roundId: string;
  readonly playerId: PlayerId;
  readonly cardId: CardId;
  readonly trumpSuit: Suit;
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
    | "BALOOT"
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
  if (bidding.roundId !== event.roundId || deal.roundId !== event.roundId) {
    throw new Error("Bid event belongs to another round");
  }
  const state = applyBiddingAction(
    bidding,
    event.action,
    dealerSeat,
    deal.exposedCardId,
    Object.fromEntries(DECK.map((card) => [card.id, card])) as Readonly<Record<CardId, Card>>,
    deal.hands as BiddingHands,
  );
  return { state, event };
}

export interface AuthoritativeProjectResult {
  readonly project: ReturnType<typeof declareProject>;
  readonly event: ProjectEvent;
}

export function applyAuthoritativeProject(
  game: GameState,
  candidate: ProjectCandidate,
  existing: readonly ProjectDeclaration[],
  event: ProjectEvent,
): AuthoritativeProjectResult {
  if (!isProjectDeclarationWindow(game.phase, game.trickNumber, game.currentTrick.length)) {
    throw new Error("Project declaration window is closed");
  }
  if (game.players[event.playerId] !== candidate.ownerSeat) {
    throw new Error("Project does not belong to the declaring player");
  }
  if (candidate.type !== event.project) {
    throw new Error("Project event does not match candidate");
  }
  if (event.suit !== null && candidate.cards.length > 0) {
    const candidateHasSuit = candidate.cards.some((cardId) => {
      const card = DECK.find((entry) => entry.id === cardId);
      return card?.suit === event.suit;
    });
    if (!candidateHasSuit) throw new Error("Project event suit does not match candidate");
  }
  const project = declareProject(candidate, event.project, "PLAYING", 1, 0, existing);
  return { project, event };
}

export interface AuthoritativePlayResult {
  readonly state: GameState;
  readonly event: PlayCardEvent;
  readonly baloot: ReturnType<typeof declareBaloot> | null;
}

export function applyAuthoritativePlayCard(
  game: GameState,
  event: PlayCardEvent,
  existingBaloot: ReturnType<typeof declareBaloot> | null = null,
): AuthoritativePlayResult {
  if (game.phase !== "PLAYING") throw new Error("Game is not in PLAYING phase");
  if (game.currentPlayerId !== event.playerId) throw new Error("Card play is not for the current player");
  if (event.balootDeclared && existingBaloot !== null) throw new Error("Baloot has already been declared");

  let baloot: ReturnType<typeof declareBaloot> | null = existingBaloot;
  if (event.balootDeclared) {
    const card = game.hands[event.playerId]?.find((entry) => entry.id === event.cardId);
    if (!card) throw new Error("Baloot card is not in the player's hand");

    const alreadyPlayed = [
      ...game.completedTricks.flatMap((trick) => trick.plays),
      ...game.currentTrick,
    ]
      .filter((play) => play.playerId === event.playerId)
      .map((play) => play.card);

    const canDeclare = canDeclareBaloot(
      game.contract,
      game.trumpSuit,
      game.players[event.playerId]!,
      card,
      alreadyPlayed,
      true,
    );
    if (!canDeclare || game.trumpSuit === null) {
      throw new Error("Invalid Baloot declaration");
    }

    const partner = alreadyPlayed.find((played) =>
      ((played.rank === "K" && card.rank === "Q") || (played.rank === "Q" && card.rank === "K")) &&
      played.suit === game.trumpSuit,
    );
    if (!partner) throw new Error("Baloot declaration is missing the K/Q partner");

    const king = card.rank === "K" ? card : partner;
    const queen = card.rank === "Q" ? card : partner;
    baloot = declareBaloot(
      `${event.roundId}:BALOOT:${event.playerId}:${event.cardId}`,
      game.players[event.playerId]!,
      game.trumpSuit,
      king,
      queen,
    );
  }

  if (!isCardLegal(game, event.playerId, event.cardId)) {
    throw new Error("Card play is illegal under game-engine rules");
  }

  return {
    state: applyCardPlay(game, event.playerId, event.cardId, event.ikaDeclared),
    event,
    baloot,
  };
}

export interface AuthoritativeBalootResult {
  readonly baloot: ReturnType<typeof declareBaloot>;
  readonly event: BalootEvent;
}

export function applyAuthoritativeBaloot(
  round: RoundState,
  game: GameState,
  event: BalootEvent,
): AuthoritativeBalootResult {
  if (round.roundId !== event.roundId || game.phase !== "PLAYING") {
    throw new Error("Baloot declaration belongs to an inactive round");
  }
  if (round.baloot !== null) throw new Error("Baloot has already been declared");
  if (game.currentPlayerId !== event.playerId) throw new Error("Baloot declaration is not for the current player");
  if (game.trumpSuit !== event.trumpSuit || game.trumpSuit === null) {
    throw new Error("Baloot trump suit does not match the game");
  }

  const card = game.hands[event.playerId]?.find((entry) => entry.id === event.cardId);
  if (!card) throw new Error("Baloot card is not in the player's hand");

  const alreadyPlayed = [
    ...game.completedTricks.flatMap((trick) => trick.plays),
    ...game.currentTrick,
  ]
    .filter((play) => play.playerId === event.playerId)
    .map((play) => play.card);

  if (!canDeclareBaloot(game.contract, game.trumpSuit, game.players[event.playerId]!, card, alreadyPlayed, true)) {
    throw new Error("Invalid Baloot declaration");
  }

  const partner = alreadyPlayed.find((played) =>
    ((played.rank === "K" && card.rank === "Q") || (played.rank === "Q" && card.rank === "K")) &&
    played.suit === event.trumpSuit,
  );
  if (!partner) throw new Error("Baloot declaration is missing the K/Q partner");

  const king = card.rank === "K" ? card : partner;
  const queen = card.rank === "Q" ? card : partner;
  return {
    baloot: declareBaloot(
      `${event.roundId}:BALOOT:${event.playerId}:${event.cardId}`,
      game.players[event.playerId]!,
      event.trumpSuit,
      king,
      queen,
    ),
    event,
  };
}

export interface AuthoritativeTrickCompleteResult {
  readonly state: GameState;
  readonly event: TrickCompleteEvent;
}

export function applyAuthoritativeTrickComplete(
  round: RoundState,
  event: TrickCompleteEvent,
): AuthoritativeTrickCompleteResult {
  if (round.roundId !== event.roundId || round.phase !== "PLAYING" || round.game === null) {
    throw new Error("Trick completion belongs to an inactive round");
  }
  const game = round.game;
  const lastTrick = game.completedTricks[game.completedTricks.length - 1];
  if (!lastTrick || lastTrick.trickNumber !== event.trickNumber || lastTrick.winnerSeat !== event.winnerSeat) {
    throw new Error("TRICK_COMPLETE does not match authoritative trick state");
  }
  if (lastTrick.plays.length !== 4) throw new Error("Completed trick does not contain four plays");
  if (game.currentTrick.length !== 0) throw new Error("Current trick must be empty after completion");
  return { state: game, event };
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
  assertScoreEqual(next.score, event.score);
  assertMatchEndEqual(next.end, event.matchEnd);

  return { state: next, event };
}

export interface AuthoritativeNextRoundResult {
  readonly state: MatchState;
  readonly event: NextRoundEvent;
}

export function applyAuthoritativeNextRound(
  match: MatchState,
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
  return { state: startNextRound(match, nextRound), event };
}

export interface AuthoritativeMatchCompleteResult {
  readonly state: MatchState;
  readonly event: MatchCompleteEvent;
}

export function applyAuthoritativeMatchComplete(
  match: MatchState,
  event: MatchCompleteEvent,
): AuthoritativeMatchCompleteResult {
  if (match.phase !== "MATCH_COMPLETE" || match.end.status !== "FINISHED") {
    throw new Error("Match is not complete");
  }
  assertScoreEqual(match.score, event.score);
  if (match.end.winnerTeamId !== event.winnerTeamId) {
    throw new Error("MATCH_COMPLETE winner does not match authoritative engine state");
  }
  return { state: match, event };
}

function assertScoreEqual(actual: MatchScore, expected: MatchScore): void {
  if (actual.NORTH_SOUTH !== expected.NORTH_SOUTH || actual.EAST_WEST !== expected.EAST_WEST) {
    throw new Error("Protocol score does not match authoritative engine state");
  }
}

function assertMatchEndEqual(actual: MatchEndResult, expected: MatchEndResult): void {
  if (actual.status !== expected.status) throw new Error("Protocol match-end status does not match authoritative engine state");
  assertScoreEqual(actual.score, expected.score);
  if (actual.status === "FINISHED") {
    if (expected.status !== "FINISHED" || actual.winnerTeamId !== expected.winnerTeamId) {
      throw new Error("Protocol match-end winner does not match authoritative engine state");
    }
  }
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
  if (envelope.matchId !== state.matchId) throw new Error("Protocol event belongs to another match");
  if (processedEventIds.includes(envelope.eventId)) return { state, appliedEventIds: processedEventIds };
  if (envelope.stateVersion !== state.stateVersion + 1) throw new Error("Protocol event state version is not sequential");

  const event = envelope.event;
  if ("roundId" in event && event.roundId !== state.roundId && event.type !== "NEXT_ROUND") {
    throw new Error("Protocol event belongs to another round");
  }

  assertProtocolTransition(state.phase, event);
  if (event.type === "DEAL") {
    if (event.roundNumber !== state.roundNumber) throw new Error("DEAL round number does not match protocol state");
  }
  if (event.type === "ROUND_COMPLETE") {
    assertScoreEqual(event.matchEnd.score, event.score);
  }
  if (event.type === "MATCH_COMPLETE") {
    if (event.winnerTeamId !== "NORTH_SOUTH" && event.winnerTeamId !== "EAST_WEST") {
      throw new Error("MATCH_COMPLETE winner is invalid");
    }
  }

  const nextPhase = protocolPhaseForEvent(event);
  const score = event.type === "ROUND_COMPLETE" || event.type === "MATCH_COMPLETE" ? event.score : state.score;

  const next: MatchProtocolState = {
    ...state,
    stateVersion: envelope.stateVersion,
    phase: nextPhase,
    roundId: event.type === "NEXT_ROUND" ? event.roundId : state.roundId,
    roundNumber: event.type === "NEXT_ROUND" ? event.nextRoundNumber : state.roundNumber,
    dealerSeat: event.type === "DEAL" || event.type === "NEXT_ROUND" ? event.dealerSeat : state.dealerSeat,
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
  for (const event of events) result = applyProtocolEvent(result.state, event, result.appliedEventIds);
  return result;
}

function protocolPhaseForEvent(event: MatchProtocolEvent): MatchProtocolState["phase"] {
  switch (event.type) {
    case "DEAL": return "DEAL";
    case "BID": return "BID";
    case "PLAY_CARD": return "PLAY_CARD";
    case "BALOOT": return "BALOOT";
    case "PROJECT": return "PROJECT";
    case "TRICK_COMPLETE": return "TRICK_COMPLETE";
    case "ROUND_COMPLETE": return "ROUND_COMPLETE";
    case "NEXT_ROUND": return "NEXT_ROUND";
    case "MATCH_COMPLETE": return "MATCH_COMPLETE";
  }
}

function assertProtocolTransition(
  current: MatchProtocolState["phase"],
  event: MatchProtocolEvent,
): void {
  const allowed: Record<MatchProtocolState["phase"], readonly MatchProtocolEvent["type"][]> = {
    DEAL: ["DEAL", "BID"],
    BID: ["BID", "PLAY_CARD"],
    PLAY_CARD: ["PLAY_CARD", "BALOOT", "PROJECT", "TRICK_COMPLETE", "ROUND_COMPLETE"],
    BALOOT: ["PLAY_CARD"],
    PROJECT: ["PROJECT", "PLAY_CARD"],
    TRICK_COMPLETE: ["PLAY_CARD", "ROUND_COMPLETE"],
    ROUND_COMPLETE: ["NEXT_ROUND", "MATCH_COMPLETE"],
    NEXT_ROUND: ["DEAL", "BID"],
    MATCH_COMPLETE: [],
  };
  if (!allowed[current].includes(event.type)) {
    throw new Error(`Invalid protocol transition: ${current} -> ${event.type}`);
  }
}
