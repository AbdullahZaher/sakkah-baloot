import {
  applyBiddingAction,
  applyCardPlay,
  canDeclareBaloot,
  completeDeal,
  completeMatchRound,
  createBiddingState,
  createInitialDeal,
  createMatchState,
  createRoundState,
  createSeededRandom,
  declareBaloot,
  declareProject,
  detectProjects,
  getLegalMoves,
  legalBiddingActions,
  nextCounterClockwise,
  resolveProjects,
  scoreRound,
  startNextRound,
  teamOfSeat,
  type BiddingAction,
  type BiddingHands,
  type Card,
  type CardId,
  type MatchState,
  type PlayerId,
  type ProjectDeclaration,
  type Seat,
  type Suit,
} from "@sakkah-baloot/game-engine";

export interface PlayerSlot {
  readonly playerId: PlayerId;
  readonly seat: Seat;
  readonly connected: boolean;
}

export interface PublicMatchSnapshot {
  readonly matchId: string;
  readonly stateVersion: number;
  readonly phase: MatchState["phase"];
  readonly roundNumber: number;
  readonly dealerSeat: Seat;
  readonly score: MatchState["score"];
  readonly end: MatchState["end"];
  readonly player: {
    readonly playerId: PlayerId;
    readonly seat: Seat;
    readonly hand: readonly Card[];
    readonly legalBiddingActions: readonly BiddingAction["type"][];
    readonly legalCardIds: readonly CardId[];
  };
  readonly exposedCard: Card | null;
  readonly currentTrick: MatchState["round"] extends infer R
    ? R extends { game: infer G }
      ? G extends { currentTrick: infer T } ? T : readonly []
      : readonly []
    : readonly [];
  readonly projects: readonly ProjectDeclaration[];
}

export interface ServerActionResult {
  readonly snapshot: PublicMatchSnapshot;
  readonly acceptedStateVersion: number;
}

export interface AuthoritativeMatchRoom {
  readonly matchId: string;
  readonly getSnapshot: (playerId: PlayerId) => PublicMatchSnapshot;
  readonly setConnection: (playerId: PlayerId, connected: boolean) => void;
  readonly submitBid: (playerId: PlayerId, expectedStateVersion: number, action: BiddingAction) => ServerActionResult;
  readonly submitProject: (playerId: PlayerId, expectedStateVersion: number, projectId: string) => ServerActionResult;
  readonly submitCard: (playerId: PlayerId, expectedStateVersion: number, cardId: CardId, ikaDeclared?: boolean) => ServerActionResult;
  readonly advanceRound: () => void;
}

const SEATS: readonly Seat[] = ["NORTH", "EAST", "SOUTH", "WEST"];
const PLAYER_BY_SEAT: Readonly<Record<Seat, PlayerId>> = {
  NORTH: "NORTH_PLAYER",
  EAST: "EAST_PLAYER",
  SOUTH: "SOUTH_PLAYER",
  WEST: "WEST_PLAYER",
};

const SEAT_BY_PLAYER: Readonly<Record<PlayerId, Seat>> = Object.fromEntries(
  SEATS.map((seat) => [PLAYER_BY_SEAT[seat], seat]),
) as Record<PlayerId, Seat>;

const PLAYERS: Readonly<Record<PlayerId, Seat>> = SEAT_BY_PLAYER;

const CARD_BY_ID: Readonly<Record<CardId, Card>> = Object.fromEntries(
  (["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const).flatMap((suit) =>
    (["7", "8", "9", "10", "J", "Q", "K", "A"] as const).map((rank) => {
      const id = `${suit}-${rank}` as CardId;
      return [id, { id, suit, rank }];
    }),
  ),
) as Readonly<Record<CardId, Card>>;

export function createAuthoritativeMatch(
  matchId: string,
  dealerSeat: Seat = "NORTH",
): AuthoritativeMatchRoom {
  let match = createMatchState(
    matchId,
    dealerSeat,
    1,
    createRound(matchId, 1, dealerSeat),
  );
  let connections = new Set<PlayerId>();

  const requirePlayer = (playerId: PlayerId): Seat => {
    const seat = SEAT_BY_PLAYER[playerId];
    if (!seat) throw new Error("Unknown player");
    return seat;
  };

  const requireVersion = (expected: number): void => {
    if (expected !== match.stateVersion) {
      throw new Error(`STALE_STATE_VERSION:${match.stateVersion}`);
    }
  };

  const getSnapshot = (playerId: PlayerId): PublicMatchSnapshot => {
    const seat = requirePlayer(playerId);
    const round = match.round;
    if (!round) throw new Error("Match has no active round");

    const game = round.game;
    const playerHand = game
      ? game.hands[playerId] ?? []
      : round.deal.hands[seat].map((id) => CARD_BY_ID[id]!);

    const legalBids = !game
      ? legalBiddingActions(
          round.bidding,
          round.dealerSeat,
          round.deal.exposedCardId === null ? null : CARD_BY_ID[round.deal.exposedCardId]!.suit,
          round.deal.hands,
        )
      : [];

    const legalCards =
      game?.phase === "PLAYING" && game.currentPlayerId === playerId
        ? getLegalMoves(game, playerId).map((move) => move.cardId)
        : [];

    return {
      matchId: match.matchId,
      stateVersion: match.stateVersion,
      phase: match.phase,
      roundNumber: match.roundNumber,
      dealerSeat: match.dealerSeat,
      score: match.score,
      end: match.end,
      player: {
        playerId,
        seat,
        hand: playerHand,
        legalBiddingActions: legalBids,
        legalCardIds: legalCards,
      },
      exposedCard:
        round.deal.exposedCardId === null
          ? null
          : CARD_BY_ID[round.deal.exposedCardId] ?? null,
      currentTrick: game?.currentTrick ?? [],
      projects: round.projects,
    };
  };

  const submitBid = (playerId: PlayerId, expectedStateVersion: number, action: BiddingAction): ServerActionResult => {
    const seat = requirePlayer(playerId);
    requireVersion(expectedStateVersion);
    const round = match.round;
    if (!round || round.game) throw new Error("Bidding is not active");
    if (round.bidding.currentSeat !== seat) throw new Error("Not this player's bidding turn");

    const legal = legalBiddingActions(
      round.bidding,
      round.dealerSeat,
      round.deal.exposedCardId === null ? null : CARD_BY_ID[round.deal.exposedCardId]!.suit,
      round.deal.hands,
    );
    if (!legal.includes(action.type)) throw new Error("Illegal bidding action");

    const bidding = applyBiddingAction(
      round.bidding,
      action,
      round.dealerSeat,
      round.deal.exposedCardId,
      CARD_BY_ID,
      round.deal.hands as BiddingHands,
    );

    let nextRound = { ...round, bidding };
    if (bidding.phase === "CONTRACT_SELECTED" && bidding.selectedContract) {
      const deal = completeDeal(
        round.deal,
        bidding.selectedContract.exposedCardReceiverSeat,
      );
      const hands = Object.fromEntries(
        SEATS.map((s) => [
          PLAYER_BY_SEAT[s],
          deal.hands[s].map((id) => CARD_BY_ID[id]!),
        ]),
      ) as Record<PlayerId, readonly Card[]>;

      const nextGame = {
        phase: "PLAYING" as const,
        currentPlayerId: PLAYER_BY_SEAT[nextCounterClockwise(deal.dealerSeat)],
        players: PLAYERS,
        hands,
        contract: bidding.selectedContract.contract,
        trumpSuit: bidding.selectedContract.trumpSuit,
        hokumPlayMode: "OPEN" as const,
        dealerSeat: deal.dealerSeat,
        trickNumber: 1,
        currentTrick: [],
        completedTricks: [],
      };
      nextRound = { ...nextRound, deal, game: nextGame };
    }

    match = { ...match, round: nextRound, stateVersion: match.stateVersion + 1 };
    return { snapshot: getSnapshot(playerId), acceptedStateVersion: match.stateVersion };
  };

  const submitProject = (playerId: PlayerId, expectedStateVersion: number, projectId: string): ServerActionResult => {
    const seat = requirePlayer(playerId);
    const round = match.round;
    const game = round?.game;
    if (!round || !game || game.phase !== "PLAYING") throw new Error("Project window is closed");
    if (game.trickNumber !== 1 || game.currentTrick.length !== 0) throw new Error("Project window is closed");

    const selected = round.bidding.selectedContract;
    if (!selected) throw new Error("Contract is not selected");

    const candidates = detectProjects(
      game.hands[playerId] ?? [],
      selected.contract,
      selected.trumpSuit,
      seat,
    );
    const candidate = candidates.find((item) => item.id === projectId);
    if (!candidate) throw new Error("Project is not owned by player");

    const declaration = declareProject(
      candidate,
      `project:${match.roundId}:${playerId}:${projectId}`,
      game.phase,
      game.trickNumber,
      game.currentTrick.length,
      round.projects,
    );

    match = {
      ...match,
      round: { ...round, projects: [...round.projects, declaration] },
      stateVersion: match.stateVersion + 1,
    };
    return { snapshot: getSnapshot(playerId), acceptedStateVersion: match.stateVersion };
  };

  const submitCard = (playerId: PlayerId, expectedStateVersion: number, cardId: CardId, ikaDeclared = false): ServerActionResult => {
    const seat = requirePlayer(playerId);
    requireVersion(expectedStateVersion);
    const round = match.round;
    const game = round?.game;
    if (!round || !game || game.phase !== "PLAYING") throw new Error("Card play is not active");
    if (game.currentPlayerId !== playerId) throw new Error("Not this player's turn");

    const card = game.hands[playerId]?.find((item) => item.id === cardId);
    if (!card) throw new Error("Card is not in player's hand");

    let nextRound = round;

    if (game.contract === "HOKUM" && game.trumpSuit) {
      const priorPlayed = [
        ...game.completedTricks.flatMap((trick) => trick.plays),
        ...game.currentTrick,
      ].filter((play) => play.playerId === playerId).map((play) => play.card);

      if (canDeclareBaloot(game.contract, game.trumpSuit, seat, card, priorPlayed, true)) {
        const partner = priorPlayed.find(
          (played) =>
            played.suit === game.trumpSuit &&
            ((played.rank === "K" && card.rank === "Q") ||
              (played.rank === "Q" && card.rank === "K")),
        );
        if (partner) {
          nextRound = {
            ...round,
            baloot: declareBaloot(
              `baloot:${match.roundId}:${playerId}:${cardId}`,
              seat,
              game.trumpSuit,
              card.rank === "K" ? card : partner,
              card.rank === "Q" ? card : partner,
            ),
          };
        }
      }
    }

    const nextGame = applyCardPlay(game, playerId, cardId, ikaDeclared);
    nextRound = { ...nextRound, game: nextGame };

    if (nextGame.phase === "ROUND_COMPLETE") {
      const selected = round.bidding.selectedContract;
      if (!selected) throw new Error("Contract is missing at scoring");

      const projects = resolveProjects(nextRound.projects, round.deal.dealerSeat);
      const baloot = nextRound.baloot;
      const balootQaid =
        baloot && !projects.awardedProjectIds.some((id) => {
          const declaration = nextRound.projects.find((item) => item.candidate.id === id);
          return declaration?.candidate.type === "HUNDRED" &&
            baloot.cards.every((card) => declaration.candidate.cards.includes(card));
        })
          ? { NORTH_SOUTH: baloot.teamId === "NORTH_SOUTH" ? 2 : 0, EAST_WEST: baloot.teamId === "EAST_WEST" ? 2 : 0 }
          : { NORTH_SOUTH: 0, EAST_WEST: 0 };

      const score = scoreRound({
        contract: selected.contract,
        trumpSuit: selected.trumpSuit,
        purchaserSeat: selected.purchaserSeat,
        dealerSeat: round.deal.dealerSeat,
        buyerOriginallyHeldAce: round.deal.transcript.initialHands[selected.purchaserSeat].some((id) => id.endsWith("-A")),
        escalation: "NORMAL",
        tricks: nextGame.completedTricks,
        projectRaw: projects.projectRaw,
        projectQaid: projects.projectQaid,
        balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
        balootQaid: balootQaid,
      });

      const completedRound = { ...nextRound, phase: "ROUND_COMPLETE" as const, score };
      match = completeMatchRound(match, score, completedRound);
    } else {
      match = { ...match, round: nextRound, stateVersion: match.stateVersion + 1 };
    }

    return { snapshot: getSnapshot(playerId), acceptedStateVersion: match.stateVersion };
  };

  const advanceRound = (): void => {
    if (match.phase !== "ROUND_COMPLETE") throw new Error("Round is not complete");
    if (match.end.status === "FINISHED") throw new Error("Match is finished");

    match = startNextRound(
      match,
      createRound(match.matchId, match.roundNumber + 1, nextCounterClockwise(match.dealerSeat)),
    );
  };

  return {
    matchId,
    getSnapshot,
    setConnection: (playerId, connected) => {
      requirePlayer(playerId);
      if (connected) connections.add(playerId);
      else connections.delete(playerId);
    },
    submitBid,
    submitProject,
    submitCard,
    advanceRound,
  };
}

function createRound(matchId: string, roundNumber: number, dealerSeat: Seat) {
  const roundId = `${matchId}:round:${roundNumber}`;
  const deal = createInitialDeal(roundId, dealerSeat, createSeededRandom(roundId));
  return createRoundState(deal, createBiddingState(roundId, dealerSeat), roundNumber);
}
