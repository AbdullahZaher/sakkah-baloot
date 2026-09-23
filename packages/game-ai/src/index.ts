import type {
  BalootDeclaration,
  BiddingAction,
  BiddingState,
  Card,
  CardId,
  CompletedTrick,
  Contract,
  GameState,
  MatchScore,
  MatchState,
  PlayerId,
  ProjectDeclaration,
  ProjectType,
  RoundState,
  Seat,
  Suit,
  TeamId,
  TrickPlay,
} from "@sakkah-baloot/game-engine";

export type AIObservationPhase = "BIDDING" | "PLAYING" | "ROUND_COMPLETE" | "MATCH_COMPLETE";

export interface AIBiddingObservation {
  readonly phase: "BIDDING";
  readonly bidding: BiddingState;
  readonly ownHand: readonly Card[];
  readonly exposedCard: Card | null;
}

export interface AIPlayingObservation {
  readonly phase: "PLAYING";
  readonly game: Omit<GameState, "hands"> & {
    readonly ownHand: readonly Card[];
    readonly knownPlayedCards: readonly Card[];
  };
  readonly contract: Contract;
  readonly trumpSuit: Suit | null;
}

export interface AIRoundObservation {
  readonly matchId: string;
  readonly roundId: string;
  readonly roundNumber: number;
  readonly playerId: PlayerId;
  readonly seat: Seat;
  readonly teamId: TeamId;
  readonly phase: AIObservationPhase;
  readonly score: MatchScore;
  readonly bidding: AIBiddingObservation | null;
  readonly playing: AIPlayingObservation | null;
  readonly projects: readonly ProjectDeclaration[];
  readonly baloot: BalootDeclaration | null;
  readonly stateVersion: number;
}

export type AIAction =
  | { readonly type: "BID"; readonly action: BiddingAction }
  | { readonly type: "PLAY_CARD"; readonly cardId: CardId; readonly ikaDeclared?: boolean }
  | { readonly type: "DECLARE_PROJECT"; readonly projectType: ProjectType; readonly declarationId: string }
  | { readonly type: "DECLARE_BALOOT"; readonly declarationId: string };

export interface AIDecisionContext {
  readonly observation: AIRoundObservation;
  readonly randomSeed: string;
}

export interface AIDecisionTrace {
  readonly selectedAction: AIAction;
  readonly candidates: readonly {
    readonly action: AIAction;
    readonly heuristicScore: number;
    readonly searchValue?: number;
    readonly simulations?: number;
  }[];
  readonly reasonCodes: readonly string[];
}

function cardMap(): Readonly<Record<CardId, Card>> {
  return Object.fromEntries(
    [
      "CLUBS","DIAMONDS","HEARTS","SPADES",
    ].flatMap((suit) =>
      ["7","8","9","10","J","Q","K","A"].map((rank) => {
        const id = `${suit}-${rank}` as CardId;
        return [id, { id, suit, rank }] as const;
      }),
    ),
  ) as Readonly<Record<CardId, Card>>;
}

const CARDS = cardMap();

function cardsFromIds(ids: readonly CardId[]): readonly Card[] {
  return ids.map((id) => {
    const card = CARDS[id];
    if (!card) throw new Error(`Unknown card: ${id}`);
    return card;
  });
}

function roundFor(match: MatchState): RoundState {
  if (!match.round) throw new Error("Match has no active round");
  return match.round;
}

export function createAIObservation(match: MatchState, playerId: PlayerId): AIRoundObservation {
  const round = roundFor(match);
  const seat = round.game?.players[playerId]
    ?? Object.entries(match.round?.game?.players ?? {}).find(([id]) => id === playerId)?.[1]
    ?? seatForPlayerFromRound(round, playerId);
  const teamId = teamForSeat(seat);

  if (round.phase === "BIDDING") {
    return {
      matchId: match.matchId,
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      playerId,
      seat,
      teamId,
      phase: "BIDDING",
      score: match.score,
      bidding: {
        phase: "BIDDING",
        bidding: round.bidding,
        ownHand: cardsFromIds(round.deal.hands[seat] ?? []),
        exposedCard: round.deal.exposedCardId ? CARDS[round.deal.exposedCardId] ?? null : null,
      },
      playing: null,
      projects: round.projects,
      baloot: round.baloot,
      stateVersion: match.stateVersion,
    };
  }

  if (round.game) {
    const game = round.game;
    const ownHand = game.hands[playerId] ?? [];
    const knownPlayedCards = [
      ...game.completedTricks.flatMap((trick) => trick.plays.map((play) => play.card)),
      ...game.currentTrick.map((play) => play.card),
    ];
    const publicGame: Omit<GameState, "hands"> & {
      readonly ownHand: readonly Card[];
      readonly knownPlayedCards: readonly Card[];
    } = {
      ...game,
      hands: undefined as never,
      ownHand,
      knownPlayedCards,
    };
    return {
      matchId: match.matchId,
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      playerId,
      seat,
      teamId,
      phase: round.phase === "ROUND_COMPLETE" ? "ROUND_COMPLETE" : "PLAYING",
      score: match.score,
      bidding: null,
      playing: round.phase === "ROUND_COMPLETE" ? null : {
        phase: "PLAYING",
        game: publicGame,
        contract: game.contract,
        trumpSuit: game.trumpSuit,
      },
      projects: round.projects,
      baloot: round.baloot,
      stateVersion: match.stateVersion,
    };
  }

  throw new Error("Match round has no playable state");
}

function seatForPlayerFromRound(round: RoundState, playerId: PlayerId): Seat {
  throw new Error(`Unable to resolve seat for player ${playerId}; player-to-seat mapping must be supplied by the match host`);
}

function teamForSeat(seat: Seat): TeamId {
  return seat === "NORTH" || seat === "SOUTH" ? "NORTH_SOUTH" : "EAST_WEST";
}

export function listKnownPlayedCards(observation: AIRoundObservation): readonly Card[] {
  return observation.playing?.game.knownPlayedCards ?? [];
}

export function legalActionCandidates(observation: AIRoundObservation): readonly AIAction[] {
  if (observation.phase === "BIDDING" && observation.bidding) {
    const b = observation.bidding;
    const hands: Readonly<Record<Seat, readonly CardId[]>> = {
      NORTH: observation.seat === "NORTH" ? b.ownHand.map((c) => c.id) : [],
      EAST: observation.seat === "EAST" ? b.ownHand.map((c) => c.id) : [],
      SOUTH: observation.seat === "SOUTH" ? b.ownHand.map((c) => c.id) : [],
      WEST: observation.seat === "WEST" ? b.ownHand.map((c) => c.id) : [],
    };
    // The engine requires complete hands for bidding legality. This adapter is intentionally
    // not a legality oracle yet; the match host must supply the complete authoritative
    // bidding context without exposing it to the policy. See Phase 18 review R18-02.
    void hands;
    return [];
  }

  if (observation.phase === "PLAYING" && observation.playing) {
    // Card legality is resolved by the engine at the integration boundary. The observation
    // intentionally does not contain opponent hands.
    return [];
  }

  return [];
}
