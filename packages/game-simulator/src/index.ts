import {
  applyBiddingAction,
  applyCardPlay,
  canDeclareBaloot,
  completeDeal,
  createBiddingState,
  createInitialDeal,
  createSeededRandom as createEngineRandom,
  declareBaloot,
  declareProject,
  detectProjects,
  evaluateMatchEnd,
  getFirstDealer,
  getLegalMoves,
  legalBiddingActions,
  resolveProjects,
  rotateDealer,
  scoreRound,
  teamOfSeat,
  type BiddingAction,
  type BiddingHands,
  type Card,
  type CardId,
  type GameState,
  type MatchEndResult,
  type MatchScore,
  type PlayerId,
  type ProjectDeclaration,
  type Seat,
  type Suit,
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

const CARD_BY_ID: Readonly<Record<CardId, Card>> = Object.fromEntries(
  (["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const).flatMap((suit) =>
    (["7", "8", "9", "10", "J", "Q", "K", "A"] as const).map((rank) => {
      const id = `${suit}-${rank}` as CardId;
      return [id, { id, suit, rank }];
    }),
  ),
) as Readonly<Record<CardId, Card>>;

export interface SimulationPolicyContext {
  readonly state: GameState;
  readonly playerId: PlayerId;
  readonly legalCardIds: readonly CardId[];
  readonly random: () => number;
}

export type CardPolicy = (context: SimulationPolicyContext) => CardId;

export interface SimulationBatchResult {
  readonly games: number;
  readonly completed: number;
  readonly illegalActions: number;
  readonly deterministicDigest: string;
}

export interface SimulationConfig {
  readonly seed: string;
  readonly games: number;
  readonly maxRoundsPerGame?: number;
  readonly policy?: CardPolicy;
}

export interface MatchSimulationResult {
  readonly score: MatchScore;
  readonly end: MatchEndResult;
  readonly rounds: number;
  readonly illegalActions: number;
  readonly deterministicDigest: string;
}

export interface MatchBatchResult extends SimulationBatchResult {
  readonly finishedMatches: number;
  readonly maxRoundTerminations: number;
}

export function simulateMatch(
  seed: string,
  policy: CardPolicy = firstLegalCard,
  maxRounds = 200,
): MatchSimulationResult {
  let score: MatchScore = { NORTH_SOUTH: 0, EAST_WEST: 0 };
  let dealerSeat = getFirstDealer(seed);
  let end: MatchEndResult = { status: "ONGOING", score };
  let illegalActions = 0;
  const roundDigests: string[] = [];

  for (let roundNumber = 1; roundNumber <= maxRounds; roundNumber += 1) {
    const roundSeed = `${seed}:round:${roundNumber}`;
    const deal = createInitialDeal(
      `${seed}:round:${roundNumber}`,
      dealerSeat,
      createEngineRandom(roundSeed),
    );

    const bidding = runBidding(deal.dealerSeat, deal, roundSeed);
    if (bidding.phase !== "CONTRACT_SELECTED" || !bidding.selectedContract) {
      throw new Error("Simulation bidding policy failed to select a contract");
    }

    const completedDeal = completeDeal(
      deal,
      bidding.selectedContract.exposedCardReceiverSeat,
    );
    let game = createGameState(completedDeal, bidding.selectedContract.contract, bidding.selectedContract.trumpSuit, dealerSeat);

    const projects = selectProjects(
      completedDeal.hands,
      bidding.selectedContract.contract,
      bidding.selectedContract.trumpSuit,
    );
    let baloot = null as ReturnType<typeof declareBaloot> | null;

    const played: CardId[] = [];

    while (game.phase === "PLAYING") {
      const playerId = game.currentPlayerId;
      const legalCardIds = getLegalMoves(game, playerId).map((move) => move.cardId);
      if (legalCardIds.length === 0) throw new Error("Simulation reached a state with no legal moves");

      const selected = policy({
        state: game,
        playerId,
        legalCardIds,
        random: seededRandom(`${roundSeed}:play:${played.length}`),
      });

      if (!legalCardIds.includes(selected)) {
        illegalActions += 1;
        throw new Error(`Policy selected illegal card ${selected}`);
      }

      const card = game.hands[playerId]?.find((candidate) => candidate.id === selected);
      if (!card) throw new Error(`Selected card ${selected} is not in player hand`);

      const playerSeat = game.players[playerId]!;
      const priorPlayed = [
        ...game.completedTricks.flatMap((trick) => trick.plays),
        ...game.currentTrick,
      ]
        .filter((play) => play.playerId === playerId)
        .map((play) => play.card);

      if (
        !baloot &&
        canDeclareBaloot(
          game.contract,
          game.trumpSuit,
          playerSeat,
          card,
          priorPlayed,
          true,
        )
      ) {
        const partner = priorPlayed.find(
          (playedCard) =>
            playedCard.suit === game.trumpSuit &&
            ((playedCard.rank === "K" && card.rank === "Q") ||
              (playedCard.rank === "Q" && card.rank === "K")),
        );

        if (partner && game.trumpSuit !== null) {
          const king = card.rank === "K" ? card : partner;
          const queen = card.rank === "Q" ? card : partner;
          baloot = declareBaloot(
            `baloot:${roundSeed}:${playerId}:${selected}`,
            playerSeat,
            game.trumpSuit,
            king,
            queen,
          );
        }
      }

      game = applyCardPlay(game, playerId, selected);
      played.push(selected);
    }

    const projectResolution = resolveProjects(projects, dealerSeat);
    const purchaserSeat = bidding.selectedContract.purchaserSeat;
    const purchaserTeam = teamOfSeat(purchaserSeat);
    const buyerOriginallyHeldAce = deal.transcript.initialHands[purchaserSeat]
      .some((id) => id.endsWith("-A"));

    const scoreRoundResult = scoreRound({
      contract: bidding.selectedContract.contract,
      trumpSuit: bidding.selectedContract.trumpSuit,
      purchaserSeat,
      dealerSeat,
      buyerOriginallyHeldAce,
      escalation: "NORMAL",
      tricks: game.completedTricks,
      projectRaw: projectResolution.projectRaw,
      projectQaid: projectResolution.projectQaid,
      balootRaw: baloot
        ? {
            NORTH_SOUTH: baloot.teamId === "NORTH_SOUTH" ? 20 : 0,
            EAST_WEST: baloot.teamId === "EAST_WEST" ? 20 : 0,
          }
        : { NORTH_SOUTH: 0, EAST_WEST: 0 },
      balootQaid: baloot
        ? {
            NORTH_SOUTH: baloot.teamId === "NORTH_SOUTH" ? 2 : 0,
            EAST_WEST: baloot.teamId === "EAST_WEST" ? 2 : 0,
          }
        : { NORTH_SOUTH: 0, EAST_WEST: 0 },
    });

    score = {
      NORTH_SOUTH: score.NORTH_SOUTH + scoreRoundResult.finalQaid.NORTH_SOUTH,
      EAST_WEST: score.EAST_WEST + scoreRoundResult.finalQaid.EAST_WEST,
    };
    end = evaluateMatchEnd(score);
    roundDigests.push([
      roundNumber,
      dealerSeat,
      bidding.selectedContract.contract,
      bidding.selectedContract.trumpSuit ?? "NONE",
      purchaserTeam,
      ...played,
      score.NORTH_SOUTH,
      score.EAST_WEST,
    ].join(":"));

    if (end.status === "FINISHED") {
      return {
        score,
        end,
        rounds: roundNumber,
        illegalActions,
        deterministicDigest: hashDigest(roundDigests.join("|")),
      };
    }

    dealerSeat = rotateDealer(dealerSeat);
  }

  return {
    score,
    end,
    rounds: maxRounds,
    illegalActions,
    deterministicDigest: hashDigest(roundDigests.join("|")),
  };
}

export function simulateMatchBatch(config: SimulationConfig): MatchBatchResult {
  const games = Math.max(0, Math.floor(config.games));
  const maxRounds = Math.max(1, Math.floor(config.maxRoundsPerGame ?? 200));
  let completed = 0;
  let illegalActions = 0;
  let finishedMatches = 0;
  let maxRoundTerminations = 0;
  const digests: string[] = [];

  for (let i = 0; i < games; i += 1) {
    const result = simulateMatch(
      `${config.seed}:match:${i}`,
      config.policy ?? firstLegalCard,
      maxRounds,
    );
    if (result.end.status === "FINISHED") {
      completed += 1;
      finishedMatches += 1;
    } else {
      maxRoundTerminations += 1;
    }
    illegalActions += result.illegalActions;
    digests.push(result.deterministicDigest);
  }

  return {
    games,
    completed,
    illegalActions,
    deterministicDigest: hashDigest(digests.join("|")),
    finishedMatches,
    maxRoundTerminations,
  };
}

export function simulateCardPlayRound(
  initial: GameState,
  policy: CardPolicy,
  seed: string,
): { readonly initial: GameState; readonly final: GameState; readonly playedCardIds: readonly CardId[]; readonly illegalActionCount: number } {
  let state = cloneGameState(initial);
  const initialSnapshot = cloneGameState(initial);
  const random = createEngineRandom(seed);
  const playedCardIds: CardId[] = [];
  let illegalActionCount = 0;

  while (state.phase === "PLAYING") {
    const playerId = state.currentPlayerId;
    const legalCardIds = getLegalMoves(state, playerId).map((move) => move.cardId);
    if (legalCardIds.length === 0) break;

    const selected = policy({
      state,
      playerId,
      legalCardIds,
      random,
    });

    if (!legalCardIds.includes(selected)) {
      illegalActionCount += 1;
      throw new Error(`Policy selected illegal card ${selected} for ${playerId}`);
    }

    state = applyCardPlay(state, playerId, selected);
    playedCardIds.push(selected);
  }

  return {
    initial: initialSnapshot,
    final: state,
    playedCardIds,
    illegalActionCount,
  };
}

export function simulateBatch(
  initialFactory: (index: number) => GameState,
  config: SimulationConfig,
): SimulationBatchResult {
  const games = Math.max(0, Math.floor(config.games));
  let completed = 0;
  let illegalActions = 0;
  const digests: string[] = [];

  for (let i = 0; i < games; i += 1) {
    const result = simulateCardPlayRound(
      initialFactory(i),
      config.policy ?? firstLegalCard,
      `${config.seed}:game:${i}`,
    );

    if (result.final.phase === "ROUND_COMPLETE") completed += 1;
    illegalActions += result.illegalActionCount;
    digests.push(result.playedCardIds.join(","));
  }

  return {
    games,
    completed,
    illegalActions,
    deterministicDigest: hashDigest(digests.join("|")),
  };
}

function runBidding(
  dealerSeat: Seat,
  deal: ReturnType<typeof createInitialDeal>,
  seed: string,
) {
  let state = createBiddingState(deal.roundId, dealerSeat);
  let turn = 0;
  const hands = deal.hands as BiddingHands;
  const cards = CARD_BY_ID;

  while (state.phase === "FIRST_ROUND" || state.phase === "SECOND_ROUND") {
    const exposedSuit = deal.exposedCardId === null ? null : cards[deal.exposedCardId]!.suit;
    const legal = legalBiddingActions(state, dealerSeat, exposedSuit, hands);
    const actionType = chooseBiddingAction(legal, turn, seed);
    const action: BiddingAction = actionType === "BUY_HOKUM"
      ? {
          type: actionType,
          actionId: `sim:${seed}:bid:${turn}`,
          suit: chooseHokumSuit(legal, exposedSuit, turn),
        }
      : {
          type: actionType,
          actionId: `sim:${seed}:bid:${turn}`,
        };

    state = applyBiddingAction(
      state,
      action,
      dealerSeat,
      deal.exposedCardId,
      cards,
      hands,
    );
    turn += 1;
  }

  return state;
}

function chooseBiddingAction(
  legal: readonly BiddingAction["type"][],
  turn: number,
  seed: string,
): BiddingAction["type"] {
  const preferred: readonly BiddingAction["type"][] = turn % 2 === 0
    ? ["BUY_HOKUM_EXPOSED", "BUY_SUN", "BUY_ASHKAL", "BUY_HOKUM"]
    : ["BUY_SUN", "BUY_HOKUM", "BUY_HOKUM_EXPOSED", "BUY_ASHKAL"];
  return preferred.find((type) => legal.includes(type)) ?? legal[0]!;
}

function chooseHokumSuit(
  legal: readonly BiddingAction["type"][],
  exposedSuit: Suit | null,
  turn: number,
): Suit {
  void turn;
  const suits: readonly Suit[] = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"];
  return suits.find((suit) => legal.includes("BUY_HOKUM") && suit !== exposedSuit) ?? suits[0]!;
}

function selectProjects(
  hands: Readonly<Record<Seat, readonly CardId[]>>,
  contract: "SUN" | "HOKUM",
  trumpSuit: Suit | null,
): readonly ProjectDeclaration[] {
  const declarations: ProjectDeclaration[] = [];

  for (const seat of ["NORTH", "EAST", "SOUTH", "WEST"] as const) {
    const candidates = [...detectProjects(
      hands[seat].map((id) => CARD_BY_ID[id]!),
      contract,
      trumpSuit,
      seat,
    )].sort((a, b) => b.qaydValue - a.qaydValue || b.rawValue - a.rawValue || a.id.localeCompare(b.id));

    for (const candidate of candidates) {
      const overlaps = declarations.some((declaration) =>
        declaration.candidate.teamId === candidate.teamId &&
        declaration.candidate.cards.some((id) => candidate.cards.includes(id)),
      );
      const teamCount = declarations.filter(
        (declaration) => declaration.candidate.teamId === candidate.teamId,
      ).length;
      if (overlaps || teamCount >= 2) continue;

      try {
        declarations.push(
          declareProject(
            candidate,
            `project:${candidate.id}`,
            "PLAYING",
            1,
            0,
            declarations,
          ),
        );
      } catch {
        // Candidate conflicts are discarded deterministically.
      }
    }
  }

  return declarations;
}

function createGameState(
  deal: ReturnType<typeof completeDeal>,
  contract: "SUN" | "HOKUM",
  trumpSuit: Suit | null,
  dealerSeat: Seat,
): GameState {
  const hands = Object.fromEntries(
    (Object.keys(PLAYER_BY_SEAT) as Seat[]).map((seat) => [
      PLAYER_BY_SEAT[seat],
      deal.hands[seat].map((id) => CARD_BY_ID[id]!),
    ]),
  ) as Record<PlayerId, readonly Card[]>;

  const firstPlayerSeat = dealerSeat === "NORTH"
    ? "EAST"
    : dealerSeat === "EAST"
      ? "SOUTH"
      : dealerSeat === "SOUTH"
        ? "WEST"
        : "NORTH";

  return {
    phase: "PLAYING",
    currentPlayerId: PLAYER_BY_SEAT[firstPlayerSeat],
    players: PLAYERS,
    hands,
    contract,
    trumpSuit,
    hokumPlayMode: "OPEN",
    dealerSeat,
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };
}

function firstLegalCard({ legalCardIds }: SimulationPolicyContext): CardId {
  return legalCardIds[0]!;
}

function seededRandom(seed: string): () => number {
  const source = createEngineRandom(seed);
  return () => source.next();
}

function hashDigest(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    hands: Object.fromEntries(
      Object.entries(state.hands).map(([playerId, hand]) => [
        playerId,
        hand.map((card) => ({ ...card })),
      ]),
    ),
    currentTrick: state.currentTrick.map((play) => ({
      ...play,
      card: { ...play.card },
    })),
    completedTricks: state.completedTricks.map((trick) => ({
      ...trick,
      plays: trick.plays.map((play) => ({
        ...play,
        card: { ...play.card },
      })),
    })),
  };
}
