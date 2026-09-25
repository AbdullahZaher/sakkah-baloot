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

import {
  chooseBaselineAction,
  chooseISMCTSCard,
  createBeliefState,
  solveEndgame,
  type AIDifficulty,
  type AIRoundObservation,
} from "@sakkah-baloot/game-ai";

export interface SimulationPolicyContext {
  readonly state: GameState;
  readonly playerId: PlayerId;
  readonly legalCardIds: readonly CardId[];
  readonly random: () => number;
}

export type CardPolicy = (context: SimulationPolicyContext) => CardId;

export const firstLegalCard: CardPolicy = ({ legalCardIds }: SimulationPolicyContext): CardId => {
  return legalCardIds[0]!;
};

export const randomCardPolicy: CardPolicy = ({ legalCardIds, random }: SimulationPolicyContext): CardId => {
  const index = Math.floor(random() * legalCardIds.length);
  return legalCardIds[index] ?? legalCardIds[0]!;
};

export function createBaselineCardPolicy(
  difficulty: AIDifficulty = "NORMAL",
  preferInformation = true,
): CardPolicy {
  return ({ state, playerId, legalCardIds }: SimulationPolicyContext): CardId => {
    const observation = buildObservationFromState(state, playerId, legalCardIds);
    const decision = chooseBaselineAction(observation, { difficulty, preferInformation });
    if (decision.action.type !== "PLAY_CARD") {
      throw new Error("Baseline policy did not return a card action during PLAYING phase");
    }
    return decision.action.cardId;
  };
}

export function createISMCTSCardPolicy(config?: {
  readonly iterations?: number;
  readonly seed?: string;
}): CardPolicy {
  const iterations = config?.iterations ?? 32;
  return ({ state, playerId, legalCardIds, random }: SimulationPolicyContext): CardId => {
    const observation = buildObservationFromState(state, playerId, legalCardIds);
    const input = {
      playerId,
      ownHand: state.hands[playerId] ?? [],
      game: {
        players: state.players,
        currentTrick: state.currentTrick,
        completedTricks: state.completedTricks,
      },
      contract: state.contract,
      trumpSuit: state.trumpSuit,
    };
    const belief = createBeliefState(input);
    const seed = config?.seed ?? `mcts:${Math.floor(random() * 1_000_000)}`;
    const decision = chooseISMCTSCard(observation, belief, { iterations, seed });
    return decision.cardId;
  };
}

export function createEndgameEnhancedCardPolicy(config?: {
  readonly maxRemainingCards?: number;
  readonly maxNodes?: number;
  readonly fallback?: CardPolicy;
}): CardPolicy {
  const maxRemainingCards = config?.maxRemainingCards ?? 6;
  const maxNodes = config?.maxNodes ?? 2000;
  const fallback = config?.fallback ?? createBaselineCardPolicy("HARD");

  return (ctx: SimulationPolicyContext): CardId => {
    const decision = solveEndgame(ctx.state, ctx.playerId, {
      maxRemainingCards,
      maxNodes,
    });
    if (decision !== null && ctx.legalCardIds.includes(decision.cardId)) {
      return decision.cardId;
    }
    return fallback(ctx);
  };
}

function buildObservationFromState(
  state: GameState,
  playerId: PlayerId,
  legalCardIds: readonly CardId[],
): AIRoundObservation {
  const seat = state.players[playerId]!;
  const teamId = teamOfSeat(seat);
  const ownHand = state.hands[playerId] ?? [];
  const knownPlayedCards = [
    ...state.completedTricks.flatMap((t) => t.plays.map((p) => p.card)),
    ...state.currentTrick.map((p) => p.card),
  ];
  const { hands: _hiddenHands, ...gameWithoutHands } = state;
  void _hiddenHands;

  return {
    matchId: "sim-match",
    roundId: "sim-round",
    roundNumber: 1,
    playerId,
    seat,
    teamId,
    phase: "PLAYING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    bidding: null,
    playing: {
      phase: "PLAYING",
      game: {
        ...gameWithoutHands,
        ownHand,
        knownPlayedCards,
        legalCardIds,
      },
      contract: state.contract,
      trumpSuit: state.trumpSuit,
    },
    projects: [],
    baloot: null,
    stateVersion: 1,
  };
}


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
  readonly policies?: Readonly<Record<PlayerId, CardPolicy>>;
  readonly biddingDifficulty?: AIDifficulty;
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
  policies?: Readonly<Record<PlayerId, CardPolicy>>,
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

    const bidding = runBidding(
      deal.dealerSeat,
      deal,
      roundSeed,
      "NORMAL",
    );
    if (bidding.phase === "CANCELLED") {
      // ALL_PASS is authoritative: the engine ends the bidding round and the
      // simulator starts the next round with the rotated dealer. No scoring,
      // card play, or contract completion is performed for the cancelled round.
      dealerSeat = rotateDealer(dealerSeat);
      roundDigests.push([
        roundNumber,
        dealerSeat,
        "CANCELLED",
        "NONE",
        "NONE",
      ].join(":"));
      continue;
    }
    if (bidding.phase !== "CONTRACT_SELECTED" || !bidding.selectedContract) {
      throw new Error("Simulation bidding policy ended in an unexpected phase");
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

    const initialGame = cloneGameState(game);
    const played: CardId[] = [];

    while (game.phase === "PLAYING") {
      assertGameConservation(game);
      const playerId = game.currentPlayerId;
      const legalCardIds = getLegalMoves(game, playerId).map((move) => move.cardId);
      if (legalCardIds.length === 0) throw new Error("Simulation reached a state with no legal moves");

      const activePolicy = policies?.[playerId] ?? policy;
      const selected = activePolicy({
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
      assertGameStateConservation(game);
      played.push(selected);
    }

    assertReplayEquivalent(initialGame, played, game);

    assertGameConservation(game);
    if (game.completedTricks.length !== 8) throw new Error("Simulation did not complete exactly 8 tricks");

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
      config.policies,
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
  const random = seededRandom(seed);
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

export function replayCardPlayRound(
  initial: GameState,
  playedCardIds: readonly CardId[],
): GameState {
  let state = cloneGameState(initial);

  for (const cardId of playedCardIds) {
    if (state.phase !== "PLAYING") {
      throw new Error(`Replay has extra card after round completion: ${cardId}`);
    }

    state = applyCardPlay(state, state.currentPlayerId, cardId);
  }

  return state;
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
  difficulty: AIDifficulty = "NORMAL",
) {
  let state = createBiddingState(deal.roundId, dealerSeat);
  let turn = 0;
  const hands = deal.hands as BiddingHands;
  const cards = CARD_BY_ID;

  while (state.phase === "FIRST_ROUND" || state.phase === "SECOND_ROUND") {
    const exposedCard = deal.exposedCardId === null ? null : cards[deal.exposedCardId]!;
    const legal = legalBiddingActions(
      state,
      dealerSeat,
      exposedCard?.suit ?? null,
      hands,
    );
    if (legal.length === 0) {
      throw new Error("Simulator reached a bidding state with no legal actions");
    }

    const actingSeat = state.actingSeat;
    const playerId = PLAYER_BY_SEAT[actingSeat];
    const observation: AIRoundObservation = {
      matchId: `sim:${seed}`,
      roundId: deal.roundId,
      roundNumber: 1,
      playerId,
      seat: actingSeat,
      teamId: teamOfSeat(actingSeat),
      phase: "BIDDING",
      score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      bidding: {
        ...state,
      },
      ownHand: (hands[actingSeat] ?? []).map((id) => cards[id]!),
      exposedCard,
      legalActions: legal,
      projects: [],
      baloot: null,
      stateVersion: turn,
    };

    const decision = chooseBaselineAction(observation, { difficulty });
    if (decision.action.type !== "BID") {
      throw new Error("Baseline bidding policy did not return a BID action");
    }

    const action = decision.action.action;
    if (!legal.includes(action.type)) {
      throw new Error(`Bidding policy selected illegal action ${action.type}`);
    }
    if (action.type === "BUY_HOKUM" && action.suit === exposedCard?.suit) {
      throw new Error("Bidding policy selected exposed suit during second-round Hokum");
    }

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

function assertGameConservation(state: GameState): void {
  const cards = [
    ...Object.values(state.hands).flat(),
    ...state.currentTrick.map((play) => play.card),
    ...state.completedTricks.flatMap((trick) => trick.plays.map((play) => play.card)),
  ];

  const ids = cards.map((card) => card.id);
  if (ids.length !== 32 || new Set(ids).size !== 32) {
    throw new Error("Simulation card conservation invariant failed");
  }

  if (state.completedTricks.some((trick) => trick.plays.length !== 4)) {
    throw new Error("Simulation trick invariant failed");
  }
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


function assertGameStateConservation(state: GameState): void {
  const ids = [
    ...Object.values(state.hands).flat().map((card) => card.id),
    ...state.currentTrick.map((play) => play.card.id),
    ...state.completedTricks.flatMap((trick) => trick.plays.map((play) => play.card.id)),
  ];
  const unique = new Set(ids);
  if (unique.size !== ids.length || ids.length !== 32) {
    throw new Error("Simulation produced an impossible card partition");
  }
}

export function serializeGameStateCanonical(state: GameState): string {
  const normalizedHands = Object.entries(state.hands)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([playerId, hand]) => [playerId, hand.map((c) => c.id).sort()]);

  const normalizedCurrentTrick = state.currentTrick.map((p) => ({
    playerId: p.playerId,
    seat: p.seat,
    cardId: p.card.id,
    ikaDeclared: p.ikaDeclared,
    sequence: p.sequence,
  }));

  const normalizedCompletedTricks = state.completedTricks.map((t) => ({
    trickNumber: t.trickNumber,
    leaderSeat: t.leaderSeat,
    winnerSeat: t.winnerSeat,
    plays: t.plays.map((p) => ({
      playerId: p.playerId,
      seat: p.seat,
      cardId: p.card.id,
      ikaDeclared: p.ikaDeclared,
      sequence: p.sequence,
    })),
  }));

  return JSON.stringify({
    phase: state.phase,
    currentPlayerId: state.currentPlayerId,
    dealerSeat: state.dealerSeat,
    contract: state.contract,
    trumpSuit: state.trumpSuit,
    hokumPlayMode: state.hokumPlayMode,
    trickNumber: state.trickNumber,
    players: Object.entries(state.players).sort(([a], [b]) => a.localeCompare(b)),
    hands: normalizedHands,
    currentTrick: normalizedCurrentTrick,
    completedTricks: normalizedCompletedTricks,
  });
}

export function assertReplayEquivalent(
  initial: GameState,
  played: readonly CardId[],
  expected: GameState,
): void {
  let replay = cloneGameState(initial);
  for (const cardId of played) {
    const playerId = replay.currentPlayerId;
    const legalMoves = getLegalMoves(replay, playerId);
    if (!legalMoves.some((move) => move.cardId === cardId)) {
      throw new Error(`Replay divergence: illegal replay card ${cardId} for player ${playerId}`);
    }
    replay = applyCardPlay(replay, playerId, cardId);
  }

  if (replay.phase !== expected.phase) {
    throw new Error(`Replay divergence: phase mismatch (replayed: ${replay.phase}, expected: ${expected.phase})`);
  }
  if (replay.currentPlayerId !== expected.currentPlayerId) {
    throw new Error(`Replay divergence: currentPlayerId mismatch (replayed: ${replay.currentPlayerId}, expected: ${expected.currentPlayerId})`);
  }
  if (replay.dealerSeat !== expected.dealerSeat) {
    throw new Error(`Replay divergence: dealerSeat mismatch (replayed: ${replay.dealerSeat}, expected: ${expected.dealerSeat})`);
  }
  if (replay.contract !== expected.contract) {
    throw new Error(`Replay divergence: contract mismatch (replayed: ${replay.contract}, expected: ${expected.contract})`);
  }
  if (replay.trumpSuit !== expected.trumpSuit) {
    throw new Error(`Replay divergence: trumpSuit mismatch (replayed: ${replay.trumpSuit}, expected: ${expected.trumpSuit})`);
  }
  if (replay.hokumPlayMode !== expected.hokumPlayMode) {
    throw new Error(`Replay divergence: hokumPlayMode mismatch (replayed: ${replay.hokumPlayMode}, expected: ${expected.hokumPlayMode})`);
  }
  if (replay.trickNumber !== expected.trickNumber) {
    throw new Error(`Replay divergence: trickNumber mismatch (replayed: ${replay.trickNumber}, expected: ${expected.trickNumber})`);
  }
  if (replay.completedTricks.length !== expected.completedTricks.length) {
    throw new Error(`Replay divergence: completedTricks length mismatch (replayed: ${replay.completedTricks.length}, expected: ${expected.completedTricks.length})`);
  }

  const replayCanonical = serializeGameStateCanonical(replay);
  const expectedCanonical = serializeGameStateCanonical(expected);

  if (replayCanonical !== expectedCanonical) {
    throw new Error(`Replay divergence: canonical state mismatch.\nReplayed: ${replayCanonical}\nExpected: ${expectedCanonical}`);
  }
}

