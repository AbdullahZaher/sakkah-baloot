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
  applyRoundToMatch,
  nextCounterClockwise,
  createMatchState,
  completeMatchRound,
  startNextRound,
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
  type BiddingState,
  type Card,
  type CardId,
  type DealState,
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
  readonly deal: DealState;
  readonly bidding: BiddingState;
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
}

export interface LocalBiddingSession {
  readonly getSnapshot: () => LocalPreview;
  readonly dispatchBiddingAction: (type: BiddingAction["type"], suit?: Suit) => LocalPreview;
  readonly dispatchCardPlay: (cardId: CardId, ikaDeclared?: boolean) => LocalPreview;
  readonly dispatchProject: (projectId: string) => LocalPreview;
  readonly advanceRound: () => LocalPreview;
}

function cardMap(): Readonly<Record<CardId, Card>> {
  return Object.fromEntries(DECK.map((card) => [card.id, card])) as Record<CardId, Card>;
}

function cardsById(): Map<CardId, Card> {
  return new Map(DECK.map((card) => [card.id, card]));
}

function buildGameState(deal: DealState, bidding: BiddingState): GameState {
  const selected = bidding.selectedContract;
  if (selected === null) throw new Error("Cannot start playing without a selected contract");

  const hands = Object.fromEntries(
    (Object.keys(PLAYER_BY_SEAT) as Seat[]).map((seat) => [
      PLAYER_BY_SEAT[seat],
      deal.hands[seat].map((id) => cardMap()[id]),
    ]),
  ) as Record<PlayerId, readonly Card[]>;

  return {
    phase: "PLAYING",
    currentPlayerId: PLAYER_BY_SEAT[nextCounterClockwise(deal.dealerSeat)],
    players: PLAYERS,
    hands,
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    hokumPlayMode: "OPEN",
    dealerSeat: deal.dealerSeat,
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };
}

function buyerOriginallyHeldAce(deal: DealState, bidding: BiddingState): boolean {
  const selected = bidding.selectedContract;
  if (selected === null) return false;
  const purchaserHand = deal.transcript.initialHands[selected.purchaserSeat];
  return purchaserHand.some((id) => id.endsWith("-A"));
}

function resolveRound(
  game: GameState,
  deal: DealState,
  bidding: BiddingState,
  projects: readonly ProjectDeclaration[],
  baloot: BalootDeclaration | null,
): RoundScoreBreakdown {
  const selected = bidding.selectedContract;
  if (selected === null) throw new Error("Cannot score without a selected contract");
  if (game.phase !== "ROUND_COMPLETE") throw new Error("Round is not complete");

  const projectResolution = resolveProjects(projects, deal.dealerSeat);
  const balootAbsorbed = baloot !== null && projectResolution.awardedProjectIds.some((id) => {
    const declaration = projects.find((project) => project.candidate.id === id);
    return declaration?.candidate.type === "HUNDRED" && baloot.cards.every((cardId) => declaration.candidate.cards.includes(cardId));
  });
  const balootQaid = baloot && !balootAbsorbed ? { [baloot.teamId]: 2 } : {};
  return scoreRound({
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    purchaserSeat: selected.purchaserSeat,
    dealerSeat: deal.dealerSeat,
    buyerOriginallyHeldAce: buyerOriginallyHeldAce(deal, bidding),
    escalation: "NORMAL",
    tricks: game.completedTricks,
    projectRaw: projectResolution.projectRaw,
    projectQaid: projectResolution.projectQaid,
    balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootQaid: { NORTH_SOUTH: balootQaid.NORTH_SOUTH ?? 0, EAST_WEST: balootQaid.EAST_WEST ?? 0 },
  });
}

function buildPreview(
  dealerSeat: Seat,
  roundNumber: number,
  playerSeat: Seat,
  deal: DealState,
  bidding: BiddingState,
  game: GameState | null,
  roundScore: RoundScoreBreakdown | null,
  projects: readonly ProjectDeclaration[] = [],
  baloot: BalootDeclaration | null = null,
  matchScore: MatchScore,
  matchEnd: MatchEndResult,
): LocalPreview {
  const cards = cardsById();
  const playerId = PLAYER_BY_SEAT[playerSeat];
  const playerHand = game
    ? game.hands[playerId] ?? []
    : deal.hands[playerSeat].map((id) => cards.get(id)).filter((card): card is Card => card !== undefined);
  const exposedCard = deal.exposedCardId === null ? null : cards.get(deal.exposedCardId) ?? null;
  const legalActions = game ? [] : legalBiddingActions(bidding, dealerSeat, exposedCard?.suit ?? null, deal.hands);
  const legalCardIds = game && game.phase === "PLAYING" && game.currentPlayerId === playerId
    ? getLegalMoves(game, game.currentPlayerId).map((move) => move.cardId)
    : [];

  return {
    dealerSeat,
    roundNumber,
    deal,
    bidding,
    playerSeat,
    playerHand,
    exposedCard,
    legalActions,
    game,
    legalCardIds,
    roundScore,
    matchScore,
    matchEnd,
    projects,
    baloot,
  };
}

export function createLocalPreview(): LocalPreview {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "SOUTH";
  return buildPreview(
    dealerSeat,
    1,
    playerSeat,
    createInitialDeal("ui-preview-round-1", dealerSeat, createSeededRandom("ui-preview-round-1")),
    createBiddingState("ui-preview-round-1", dealerSeat),
    null,
    null,
    [],
    null,
    createMatchState("ui-preview-match", dealerSeat).score,
    createMatchState("ui-preview-match", dealerSeat).end,
  );
}

export function createLocalBiddingSession(): LocalBiddingSession {
  let dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "WEST";
  let roundNumber = 1;
  let deal = createInitialDeal(
    "ui-preview-round-1",
    dealerSeat,
    createSeededRandom("ui-preview-round-1"),
  );
  let bidding = createBiddingState("ui-preview-round-1", dealerSeat);
  let game: GameState | null = null;
  let roundScore: RoundScoreBreakdown | null = null;
  let match: MatchState = createMatchState("ui-preview-match", dealerSeat);
  let projects: ProjectDeclaration[] = [];
  let baloot: BalootDeclaration | null = null;

  const getSnapshot = () => buildPreview(
    dealerSeat,
    roundNumber,
    playerSeat,
    deal,
    bidding,
    game,
    roundScore,
    match.score,
    match.end,
    projects,
    baloot,
  );

  return {
    getSnapshot,

    dispatchBiddingAction: (type, suit) => {
      if (game !== null) throw new Error("Bidding is already complete");
      if (matchEnd.status === "FINISHED") throw new Error("Match is already finished");

      const snapshot = getSnapshot();
      if (!snapshot.legalActions.includes(type)) throw new Error(`Illegal bidding action: ${type}`);

      const action: BiddingAction = type === "BUY_HOKUM"
        ? {
            type,
            actionId: `ui-${roundNumber}-${bidding.turnNumber + 1}-${type}-${suit ?? "NONE"}`,
            suit: suit ?? "CLUBS",
          }
        : {
            type,
            actionId: `ui-${roundNumber}-${bidding.turnNumber + 1}-${type}`,
          };

      bidding = applyBiddingAction(
        bidding,
        action,
        dealerSeat,
        deal.exposedCardId,
        cardMap(),
        deal.hands as BiddingHands,
      );

      if (bidding.phase === "CONTRACT_SELECTED") {
        deal = completeDeal(deal, bidding.selectedContract!.exposedCardReceiverSeat);
        game = buildGameState(deal, bidding);
        const contract = bidding.selectedContract!.contract;
        const trump = bidding.selectedContract!.trumpSuit;
        projects = [];
        for (const seat of Object.keys(PLAYER_BY_SEAT) as Seat[]) {
          for (const candidate of detectProjects(deal.hands[seat].map((id) => cardMap()[id]!), contract, trump, seat)) {
            try {
              projects.push(declareProject(candidate, candidate.id, "PLAYING", 1, 0, projects));
            } catch {
              // Overlapping and excess projects are discarded by canonical declaration rules.
            }
          }
        }
        baloot = null;
        roundScore = null;
      }

      return getSnapshot();
    },

    dispatchProject: (projectId) => {
      if (game === null || game.phase !== "PLAYING") throw new Error("Projects require an active playing round");
      const project = projects.find((d) => d.declarationId === projectId);
      if (!project) throw new Error("Unknown project declaration");
      if (projects.some((d) => d.candidate.cards.some((id) => project.candidate.cards.includes(id)) && d.declarationId !== projectId)) throw new Error("Project card overlap");
      return getSnapshot();
    },

    dispatchCardPlay: (cardId, ikaDeclared = false) => {
      if (game === null) throw new Error("Playing has not started");
      if (game.phase === "ROUND_COMPLETE") throw new Error("Round is already complete");

      const playerId = PLAYER_BY_SEAT[playerSeat];
      const selected = bidding.selectedContract;
      if (selected?.contract === "HOKUM" && selected.trumpSuit) {
        const handBefore = game.hands[playerId] ?? [];
        const card = handBefore.find((c) => c.id === cardId);
        if (card && canDeclareBaloot(selected.contract, selected.trumpSuit, playerSeat, card, handBefore, true)) {
          const king = handBefore.find((c) => c.rank === "K" && c.suit === selected.trumpSuit);
          const queen = handBefore.find((c) => c.rank === "Q" && c.suit === selected.trumpSuit);
          if (king && queen) baloot = declareBaloot(`baloot:${match.roundId}:${playerId}`, playerSeat, selected.trumpSuit, king, queen);
        }
      }
      game = applyCardPlay(game, playerId, cardId, ikaDeclared);

      if (game.phase === "ROUND_COMPLETE") {
        roundScore = resolveRound(game, deal, bidding, projects, baloot);
        match = completeMatchRound(match, roundScore);
      }

      return getSnapshot();
    },

    advanceRound: () => {
      if (game === null || game.phase !== "ROUND_COMPLETE") {
        throw new Error("Next round is only available after round completion");
      }
      if (match.end.status === "FINISHED") {
        throw new Error("Cannot start another round after match completion");
      }

      match = startNextRound(match);
      dealerSeat = match.dealerSeat;
      roundNumber = match.roundNumber;
      const roundId = match.roundId;
      deal = createInitialDeal(roundId, dealerSeat, createSeededRandom(roundId));
      bidding = createBiddingState(roundId, dealerSeat);
      game = null;
      roundScore = null;
      projects = [];
      baloot = null;
      return getSnapshot();
    },
  };
}
