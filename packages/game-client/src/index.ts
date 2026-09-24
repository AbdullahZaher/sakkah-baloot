import {
  applyBiddingAction,
  applyCardPlay,
  completeDeal,
  createBiddingState,
  createInitialDeal,
  createSeededRandom,
  getLegalMoves,
  legalBiddingActions,
  scoreRound,
  nextCounterClockwise,
  createMatchState,
  completeMatchRound,
  startNextRound,
  createRoundState,
  withRoundGame,
  withRoundProjects,
  withRoundBaloot,
  completeRoundState,
  type MatchState,
  detectProjects,
  declareProject,
  resolveProjects,
  canDeclareBaloot,
  declareBaloot,
  type ProjectDeclaration,
  type BalootDeclaration,
  type BiddingAction,
  type BiddingHands,
  type Card,
  type CardId,
  type GameState,
  type PlayerId,
  type Seat,
  type Suit,
  type MatchEndResult,
  type MatchScore,
  type RoundScoreBreakdown,
  DECK,
} from "@sakkah-baloot/game-engine";

const PLAYER_BY_SEAT: Readonly<Record<Seat, PlayerId>> = {
  NORTH: "NORTH_PLAYER",
  EAST: "EAST_PLAYER",
  SOUTH: "SOUTH_PLAYER",
  WEST: "WEST_PLAYER",
};

const PLAYERS: Readonly<Record<PlayerId, Seat>> = {
  NORTH_PLAYER: "NORTH",
  EAST_PLAYER: "EAST",
  SOUTH_PLAYER: "SOUTH",
  WEST_PLAYER: "WEST",
};

export interface LocalPreview {
  readonly dealerSeat: Seat;
  readonly roundNumber: number;
  readonly deal: NonNullable<MatchState["round"]>["deal"];
  readonly bidding: NonNullable<MatchState["round"]>["bidding"];
  readonly playerSeat: Seat;
  readonly playerHand: readonly Card[];
  readonly exposedCard: Card | null;
  readonly legalActions: readonly BiddingAction["type"][];
  readonly game: GameState | null;
  readonly legalCardIds: readonly CardId[];
  readonly roundScore: RoundScoreBreakdown | null;
  readonly matchScore: MatchScore;
  readonly matchEnd: MatchEndResult;
  readonly projects: readonly ProjectDeclaration[];
  readonly baloot: BalootDeclaration | null;
  readonly stateVersion: number;
}

export interface LocalBiddingSession {
  readonly getSnapshot: () => LocalPreview;
  readonly dispatchBiddingAction: (type: BiddingAction["type"], suit?: Suit) => LocalPreview;
  readonly dispatchCardPlay: (cardId: CardId, ikaDeclared?: boolean) => LocalPreview;
  readonly dispatchCardPlayForPlayer: (playerId: PlayerId, cardId: CardId, ikaDeclared?: boolean) => LocalPreview;
  readonly dispatchProject: (projectId: string) => LocalPreview;
  readonly advanceRound: () => LocalPreview;
}

function cardMap(): Readonly<Record<CardId, Card>> {
  return Object.fromEntries(DECK.map((card) => [card.id, card])) as Record<CardId, Card>;
}

function cardsById(): Map<CardId, Card> {
  return new Map(DECK.map((card) => [card.id, card]));
}

function buildGameState(round: MatchState["round"]): GameState {
  if (!round) throw new Error("Round state is required");
  const selected = round.bidding.selectedContract;
  if (selected === null) throw new Error("Cannot start playing without a selected contract");

  const hands = Object.fromEntries(
    (Object.keys(PLAYER_BY_SEAT) as Seat[]).map((seat) => [
      PLAYER_BY_SEAT[seat],
      round.deal.hands[seat].map((id) => cardMap()[id]),
    ]),
  ) as Record<PlayerId, readonly Card[]>;

  return {
    phase: "PLAYING",
    currentPlayerId: PLAYER_BY_SEAT[nextCounterClockwise(round.deal.dealerSeat)],
    players: PLAYERS,
    hands,
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    hokumPlayMode: "OPEN",
    dealerSeat: round.deal.dealerSeat,
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };
}

function buyerOriginallyHeldAce(round: NonNullable<MatchState["round"]>): boolean {
  const selected = round.bidding.selectedContract;
  if (selected === null) return false;
  return round.deal.transcript.initialHands[selected.purchaserSeat]
    .some((id) => id.endsWith("-A"));
}

function resolveRound(round: NonNullable<MatchState["round"]>): RoundScoreBreakdown {
  const selected = round.bidding.selectedContract;
  const game = round.game;
  if (selected === null) throw new Error("Cannot score without a selected contract");
  if (game?.phase !== "ROUND_COMPLETE") throw new Error("Round is not complete");

  const projectResolution = resolveProjects(round.projects, round.deal.dealerSeat);
  const balootAbsorbed = round.baloot !== null && projectResolution.awardedProjectIds.some((id) => {
    const declaration = round.projects.find((project) => project.candidate.id === id);
    return declaration?.candidate.type === "HUNDRED" &&
      round.baloot!.cards.every((cardId) => declaration.candidate.cards.includes(cardId));
  });
  const balootQaid = round.baloot && !balootAbsorbed ? { [round.baloot.teamId]: 2 } : {};

  return scoreRound({
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    purchaserSeat: selected.purchaserSeat,
    dealerSeat: round.deal.dealerSeat,
    buyerOriginallyHeldAce: buyerOriginallyHeldAce(round),
    escalation: "NORMAL",
    tricks: game.completedTricks,
    projectRaw: projectResolution.projectRaw,
    projectQaid: projectResolution.projectQaid,
    balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootQaid: {
      NORTH_SOUTH: balootQaid.NORTH_SOUTH ?? 0,
      EAST_WEST: balootQaid.EAST_WEST ?? 0,
    },
  });
}

function buildPreview(match: MatchState, playerSeat: Seat): LocalPreview {
  const round = match.round;
  if (!round) throw new Error("Match has no active round");
  const cards = cardsById();
  const playerId = PLAYER_BY_SEAT[playerSeat];
  const playerHand = round.game
    ? round.game.hands[playerId] ?? []
    : round.deal.hands[playerSeat]
        .map((id) => cards.get(id))
        .filter((card): card is Card => card !== undefined);
  const exposedCard = round.deal.exposedCardId === null
    ? null
    : cards.get(round.deal.exposedCardId) ?? null;
  const legalActions = round.game
    ? []
    : legalBiddingActions(round.bidding, round.dealerSeat, exposedCard?.suit ?? null, round.deal.hands);
  const legalCardIds = round.game?.phase === "PLAYING" &&
    round.game.currentPlayerId === playerId
    ? getLegalMoves(round.game, playerId).map((move) => move.cardId)
    : [];

  return {
    dealerSeat: match.dealerSeat,
    roundNumber: match.roundNumber,
    deal: round.deal,
    bidding: round.bidding,
    playerSeat,
    playerHand,
    exposedCard,
    legalActions,
    game: round.game,
    legalCardIds,
    roundScore: round.score,
    matchScore: match.score,
    matchEnd: match.end,
    projects: round.projects,
    baloot: round.baloot,
    stateVersion: match.stateVersion,
  };
}

function createRound(matchId: string, roundNumber: number, dealerSeat: Seat) {
  const roundId = `${matchId}:round:${roundNumber}`;
  const deal = createInitialDeal(roundId, dealerSeat, createSeededRandom(roundId));
  return createRoundState(deal, createBiddingState(roundId, dealerSeat), roundNumber);
}

export function createLocalPreview(): LocalPreview {
  const playerSeat: Seat = "SOUTH";
  const matchId = "ui-preview-match";
  const match = createMatchState(matchId, "NORTH", 1, createRound(matchId, 1, "NORTH"));
  return buildPreview(match, playerSeat);
}

export function createLocalBiddingSession(): LocalBiddingSession {
  const playerSeat: Seat = "WEST";
  const matchId = "ui-preview-match";
  let match: MatchState = createMatchState(
    matchId,
    "NORTH",
    1,
    createRound(matchId, 1, "NORTH"),
  );

  const getSnapshot = () => buildPreview(match, playerSeat);

  const dispatchCardPlayForPlayer = (
    playerId: PlayerId,
    cardId: CardId,
    ikaDeclared = false,
  ): LocalPreview => {
    const round = match.round;
    const game = round?.game;
    if (!round || !game) throw new Error("Playing has not started");
    if (game.phase === "ROUND_COMPLETE") throw new Error("Round is already complete");
    if (game.currentPlayerId !== playerId) throw new Error("Card play is not for the current player");

    const selected = round.bidding.selectedContract;
    const playerSeatForPlay = game.players[playerId];
    if (!playerSeatForPlay) throw new Error("Player seat is missing");

    let nextRound = round;

    if (selected?.contract === "HOKUM" && selected.trumpSuit) {
      const handBefore = game.hands[playerId] ?? [];
      const card = handBefore.find((c) => c.id === cardId);
      const alreadyPlayedByPlayer = [
        ...game.completedTricks.flatMap((trick) => trick.plays),
        ...game.currentTrick,
      ]
        .filter((play) => play.playerId === playerId)
        .map((play) => play.card);

      if (
        card &&
        canDeclareBaloot(
          selected.contract,
          selected.trumpSuit,
          playerSeatForPlay,
          card,
          alreadyPlayedByPlayer,
          true,
        )
      ) {
        const partner = alreadyPlayedByPlayer.find(
          (played) =>
            played.suit === selected.trumpSuit &&
            ((played.rank === "K" && card.rank === "Q") ||
              (played.rank === "Q" && card.rank === "K")),
        );
        if (partner) {
          const king = card.rank === "K" ? card : partner;
          const queen = card.rank === "Q" ? card : partner;
          nextRound = withRoundBaloot(
            nextRound,
            declareBaloot(
              `baloot:${match.roundId}:${playerId}:${cardId}`,
              playerSeatForPlay,
              selected.trumpSuit,
              king,
              queen,
            ),
          );
        }
      }
    }

    const nextGame = applyCardPlay(game, playerId, cardId, ikaDeclared);
    nextRound = { ...nextRound, game: nextGame };

    if (nextGame.phase === "ROUND_COMPLETE") {
      const score = resolveRound(nextRound);
      nextRound = completeRoundState(nextRound, score);
      match = completeMatchRound(match, score, nextRound);
    } else {
      match = { ...match, round: nextRound };
    }

    return getSnapshot();
  };

  return {
    getSnapshot,

    dispatchBiddingAction: (type, suit) => {
      const round = match.round;
      if (!round) throw new Error("Match has no active round");
      if (round.game !== null) throw new Error("Bidding is already complete");
      if (match.end.status === "FINISHED") throw new Error("Match is already finished");

      const snapshot = getSnapshot();
      if (!snapshot.legalActions.includes(type)) throw new Error(`Illegal bidding action: ${type}`);

      const action: BiddingAction = type === "BUY_HOKUM"
        ? {
            type,
            actionId: `ui-${match.roundNumber}-${round.bidding.turnNumber + 1}-${type}-${suit ?? "NONE"}`,
            suit: suit ?? "CLUBS",
          }
        : {
            type,
            actionId: `ui-${match.roundNumber}-${round.bidding.turnNumber + 1}-${type}`,
          };

      const bidding = applyBiddingAction(
        round.bidding,
        action,
        round.dealerSeat,
        round.deal.exposedCardId,
        cardMap(),
        round.deal.hands as BiddingHands,
      );

      let nextRound = { ...round, bidding };

      if (bidding.phase === "CONTRACT_SELECTED") {
        const deal = completeDeal(
          round.deal,
          bidding.selectedContract!.exposedCardReceiverSeat,
        );
        nextRound = { ...nextRound, deal };
        nextRound = withRoundGame(nextRound, buildGameState(nextRound));
      }

      match = { ...match, round: nextRound };
      return getSnapshot();
    },

    dispatchProject: (projectId) => {
      const round = match.round;
      if (!round?.game || round.game.phase !== "PLAYING") {
        throw new Error("Projects require an active playing round");
      }
      const selected = round.bidding.selectedContract;
      if (!selected) throw new Error("Cannot declare project without a contract");

      const candidates = detectProjects(
        round.deal.hands[playerSeat].map((id) => cardMap()[id]!),
        selected.contract,
        selected.trumpSuit,
        playerSeat,
      );
      const candidate = candidates.find((item) => item.id === projectId);
      if (!candidate) throw new Error("Unknown project candidate");

      match = {
        ...match,
        round: withRoundProjects(
          round,
          [...round.projects, declareProject(candidate, projectId, "PLAYING", 1, 0, round.projects)],
        ),
      };
      return getSnapshot();
    },

    dispatchCardPlay: (cardId, ikaDeclared = false) =>
      dispatchCardPlayForPlayer(PLAYER_BY_SEAT[playerSeat], cardId, ikaDeclared),

    dispatchCardPlayForPlayer,

    advanceRound: () => {
      if (!match.round || match.round.phase !== "ROUND_COMPLETE") {
        throw new Error("Next round is only available after round completion");
      }
      if (match.end.status === "FINISHED") {
        throw new Error("Cannot start another round after match completion");
      }

      match = startNextRound(match, createRound(
        match.matchId,
        match.roundNumber + 1,
        nextCounterClockwise(match.dealerSeat),
      ));
      return getSnapshot();
    },
  };
}

export { createAIClientAction } from "./ai-controller.js";
export type { AIClientActionEnvelope } from "./ai-controller.js";

export { createLocalHumanVsAISession, shouldDeclareBalootForCard } from "./local-human-vs-ai.js";
export type { LocalPlayableConfig, LocalPlayablePreview, LocalPlayableSession } from "./local-human-vs-ai.js";

export { createHumanVsAIController } from "./human-vs-ai.js";
export type { HumanVsAIConfig, HumanVsAIDecision } from "./human-vs-ai.js";

// Phase 18 CI synchronization: authoritative AI integration remains engine-owned.
