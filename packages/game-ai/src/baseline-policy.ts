import type { BiddingAction, Card, CardId } from "@sakkah-baloot/game-engine";
import { cardRawValue, cardStrength, compareCards, isTrump } from "@sakkah-baloot/game-engine";
import type { AIAction, AIRoundObservation } from "./index.js";
import { createCardMemory } from "./card-memory.js";
import { extractStrategyFeatures } from "./strategy-features.js";
import { rankBiddingContracts } from "./bidding/contract-ranking.js";

export type AIDifficulty = "EASY" | "NORMAL" | "HARD";

export interface BaselinePolicyConfig {
  readonly difficulty?: AIDifficulty;
  readonly preferInformation?: boolean;
}

export interface BaselineDecision {
  readonly action: AIAction;
  readonly trace: {
    readonly selectedAction: AIAction;
    readonly candidates: readonly {
      readonly action: AIAction;
      readonly heuristicScore: number;
    }[];
    readonly reasonCodes: readonly string[];
  };
}

export function chooseBaselineAction(
  observation: AIRoundObservation,
  config: BaselinePolicyConfig = {},
): BaselineDecision {
  if (observation.phase === "BIDDING" && observation.bidding) {
    return chooseBid(observation, config);
  }
  if (observation.phase === "PLAYING" && observation.playing) {
    return chooseCard(observation, config);
  }
  throw new Error("No AI action is available in the current observation phase");
}

function chooseBid(
  observation: AIRoundObservation,
  config: BaselinePolicyConfig = {},
): BaselineDecision {
  const bidding = observation.bidding!;
  if (bidding.legalActions.length === 0) {
    throw new Error("Authoritative bidding action space is empty");
  }

  const ranking = rankBiddingContracts(bidding, {
    difficulty: config.difficulty ?? "NORMAL",
  });

  let selectedType: BiddingAction["type"] = "PASS";
  let selectedSuit: Card["suit"] | null = null;
  const reasonCodes = [...ranking.reasonCodes];

  if (!ranking.shouldPass && ranking.selected) {
    selectedType = ranking.selected.action;
    selectedSuit = ranking.selected.action === "BUY_HOKUM" ? ranking.selected.suit : null;
    reasonCodes.push(...ranking.selected.reasonCodes);
  } else {
    reasonCodes.push("PASS_POLICY");
  }

  const turn = bidding.bidding.turnNumber ?? observation.stateVersion;

  const action: BiddingAction = {
    type: selectedType,
    actionId: `ai-bidding:${observation.roundId}:t${turn}:${observation.playerId}:${selectedType}`,
    ...(selectedType === "BUY_HOKUM" && selectedSuit ? { suit: selectedSuit } : {}),
  } as BiddingAction;

  const candidates = ranking.candidates.map((candidate) => {
    const candidateAction: BiddingAction = {
      type: candidate.action,
      actionId: `ai-bidding:${observation.roundId}:t${turn}:${observation.playerId}:${candidate.action}`,
      ...(candidate.action === "BUY_HOKUM" ? { suit: candidate.suit } : {}),
    } as BiddingAction;

    return {
      action: { type: "BID", action: candidateAction } as AIAction,
      heuristicScore: candidate.score,
    };
  });

  return {
    action: { type: "BID", action } as AIAction,
    trace: {
      selectedAction: { type: "BID", action } as AIAction,
      candidates,
      reasonCodes,
    },
  };
}

function chooseCard(
  observation: AIRoundObservation,
  config: BaselinePolicyConfig,
): BaselineDecision {
  const playing = observation.playing!;
  const hand = playing.game.ownHand;
  const legalIds = playing.game.legalCardIds;
  if (legalIds.length === 0) throw new Error("Authoritative card action space is empty");

  const memory = createCardMemory({
    ownHand: hand,
    completedTricks: playing.game.completedTricks,
    currentTrick: playing.game.currentTrick,
    contract: playing.contract,
    trumpSuit: playing.trumpSuit,
  });

  const features = extractStrategyFeatures({
    ownHand: hand,
    memory,
    contract: playing.contract,
    trumpSuit: playing.trumpSuit,
    playerSeat: observation.seat,
    currentTrick: playing.game.currentTrick,
    completedTrickCount: playing.game.completedTricks.length,
  });

  const legalCards = legalIds.map((id) => {
    const card = hand.find((candidate) => candidate.id === id);
    if (!card) throw new Error(`Authoritative action references card not in own hand: ${id}`);
    return card;
  });

  const ranked = legalCards.map((card) => {
    const heuristicScore = scoreCard(
      card,
      legalCards,
      playing.game.currentTrick,
      playing.contract,
      playing.trumpSuit,
      features.partnerWinning,
      config.preferInformation ?? true,
      config.difficulty ?? "NORMAL",
    );

    return {
      action: { type: "PLAY_CARD", cardId: card.id } as AIAction,
      heuristicScore,
      reasons: reasonCodes(
        card,
        features.partnerWinning,
        features.minimumWinningCardIds,
        playing.contract,
        playing.trumpSuit,
      ),
    };
  });

  const selected = [...ranked].sort(compareCandidate)[0]!;
  return {
    action: selected.action,
    trace: {
      selectedAction: selected.action,
      candidates: ranked.map(({ action, heuristicScore }) => ({ action, heuristicScore })),
      reasonCodes: selected.reasons,
    },
  };
}

function scoreCard(
  card: Card,
  legalCards: readonly Card[],
  currentTrick: readonly { readonly card: Card }[],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
  partnerWinning: boolean,
  preferInformation: boolean,
  difficulty: AIDifficulty,
): number {
  const profile = difficultyProfile(difficulty);
  let score = cardRawValue(card, contract, trumpSuit) * profile.rawValueWeight;
  score += cardStrength(card, contract, trumpSuit) * profile.strengthWeight;

  if (currentTrick.length > 0) {
    const ledSuit = currentTrick[0]!.card.suit;
    const winner = currentWinner(currentTrick, contract, trumpSuit);

    if (partnerWinning) {
      // Once the partner is already winning, overtrumping is normally wasted control.
      // Preserve trump unless it is required by a future authoritative legality decision.
      score -= isTrump(card, contract, trumpSuit) ? 25 : 0;
    } else if (winner && compareCards(card, winner.card, contract, trumpSuit, ledSuit) > 0) {
      score += 20;
      if (card.id === minimumWinningCard(legalCards, winner.card, ledSuit, contract, trumpSuit)?.id) {
        score += 30;
      } else {
        score -= 5;
      }
    }
  } else {
    if (isTrump(card, contract, trumpSuit)) score -= 2;
    if (card.rank === "A") score += 6;
    if (card.rank === "10") score += 4;
  }

  if (preferInformation && currentTrick.length === 0) score += profile.informationWeight;
  return score;
}

function difficultyProfile(difficulty: AIDifficulty): {
  readonly rawValueWeight: number;
  readonly strengthWeight: number;
  readonly informationWeight: number;
} {
  switch (difficulty) {
    case "EASY":
      return { rawValueWeight: 0.65, strengthWeight: 0.12, informationWeight: 0.02 };
    case "HARD":
      return { rawValueWeight: 0.95, strengthWeight: 0.28, informationWeight: 0.2 };
    case "NORMAL":
    default:
      return { rawValueWeight: 0.8, strengthWeight: 0.2, informationWeight: 0.1 };
  }
}

function currentWinner(
  plays: readonly { readonly card: Card }[],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
) {
  const ledSuit = plays[0]!.card.suit;
  let winner = plays[0]!;
  for (const play of plays.slice(1)) {
    if (compareCards(play.card, winner.card, contract, trumpSuit, ledSuit) > 0) winner = play;
  }
  return winner;
}

function minimumWinningCard(
  cards: readonly Card[],
  winner: Card,
  ledSuit: Card["suit"],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
): Card | null {
  return cards
    .filter((card) => compareCards(card, winner, contract, trumpSuit, ledSuit) > 0)
    .sort((a, b) => cardStrength(a, contract, trumpSuit) - cardStrength(b, contract, trumpSuit))[0] ?? null;
}

function reasonCodes(
  card: Card,
  partnerWinning: boolean,
  minimumWinningIds: readonly string[],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
): readonly string[] {
  const reasons: string[] = [];
  if (partnerWinning && isTrump(card, contract, trumpSuit)) reasons.push("PROTECT_PARTNER");
  if (minimumWinningIds.includes(card.id)) reasons.push("MINIMUM_WINNER");
  if (card.rank === "A") reasons.push("ACE_CONTROL");
  if (isTrump(card, contract, trumpSuit) && (card.rank === "J" || card.rank === "9")) reasons.push("TRUMP_CONTROL");
  return reasons.length ? reasons : ["BASELINE_VALUE"];
}

function actionSortKey(action: AIAction): string {
  switch (action.type) {
    case "PLAY_CARD": return action.cardId;
    case "BID": return action.action.type;
    case "DECLARE_PROJECT": return `PROJECT:${action.projectType}:${action.declarationId}`;
    case "DECLARE_BALOOT": return `BALOOT:${action.declarationId}`;
  }
}

function compareCandidate(
  a: { readonly action: AIAction; readonly heuristicScore: number },
  b: { readonly action: AIAction; readonly heuristicScore: number },
): number {
  if (b.heuristicScore !== a.heuristicScore) return b.heuristicScore - a.heuristicScore;
  const aId = actionSortKey(a.action);
  const bId = actionSortKey(b.action);
  return aId.localeCompare(bId);
}
