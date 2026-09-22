import type { Card } from "../cards.js";
import { cardRawValue } from "../cards.js";
import type { Contract, EscalationLevel, TeamId, Seat } from "../rules/types.js";
import { contractThreshold, SAUDI_RULE_PROFILE_V1, teamOfSeat, nextCounterClockwise } from "../rules/profile.js";
import { escalationCardMultiplier, projectMultiplier } from "../escalation.js";
import type { CompletedTrick } from "../playing/types.js";
import type { MatchEndResult, MatchScore, RoundScoreBreakdown, RoundScoreInput } from "./scoring-types.js";

const TEAMS: readonly TeamId[] = ["NORTH_SOUTH", "EAST_WEST"];

function zeroTeamMap(): Record<TeamId, number> {
  return { NORTH_SOUTH: 0, EAST_WEST: 0 };
}

export function calculateCardRaw(
  tricks: readonly CompletedTrick[],
  contract: Contract,
  trumpSuit: import("../cards.js").Suit | null,
): { cardRaw: Readonly<Record<TeamId, number>>; lastTrickWinner: TeamId } {
  if (tricks.length !== 8) throw new Error("Scoring requires exactly eight tricks");
  const raw = zeroTeamMap();
  for (const trick of tricks) {
    if (trick.plays.length !== 4) throw new Error("Every trick must contain four cards");
    for (const play of trick.plays) raw[teamOfSeat(play.seat)] += cardRawValue(play.card, contract, trumpSuit);
  }
  const finalTrick = tricks[7]!;
  raw[teamOfSeat(finalTrick.winnerSeat)] += 10;
  const total = raw.NORTH_SOUTH + raw.EAST_WEST;
  const expected = contract === "SUN" ? 130 : 162;
  if (total !== expected) throw new Error(`Invalid card raw total: expected ${expected}, got ${total}`);
  return { cardRaw: raw, lastTrickWinner: teamOfSeat(finalTrick.winnerSeat) };
}

export function convertRawToQaid(contract: Contract, raw: number): number {
  if (!Number.isInteger(raw) || raw < 0) throw new Error("Raw score must be a non-negative integer");
  const remainder = raw % 10;
  if (contract === "HOKUM") return Math.floor((raw + (remainder >= 6 ? 10 : 0)) / 10);
  if (remainder === 0) return raw / 5;
  if (remainder === 5) return Math.floor(raw / 5);
  if (remainder <= 4) return Math.floor(raw / 5);
  return Math.floor((raw + (10 - remainder)) / 5);
}

function kabootTeam(tricks: readonly CompletedTrick[]): TeamId | null {
  const wins = zeroTeamMap();
  for (const trick of tricks) wins[teamOfSeat(trick.winnerSeat)] += 1;
  if (wins.NORTH_SOUTH === 8) return "NORTH_SOUTH";
  if (wins.EAST_WEST === 8) return "EAST_WEST";
  return null;
}

function contractRoundQaid(contract: Contract): number {
  return contract === "SUN" ? 26 : 16;
}

function teamTrickCounts(tricks: readonly CompletedTrick[]): Record<TeamId, number> {
  const counts = zeroTeamMap();
  for (const trick of tricks) counts[teamOfSeat(trick.winnerSeat)] += 1;
  return counts;
}

export function isReverseKabootEligible(input: Pick<RoundScoreInput, "contract" | "purchaserSeat" | "dealerSeat" | "buyerOriginallyHeldAce">, tricks: readonly CompletedTrick[]): boolean {
  if (input.contract !== "SUN") return false;
  if (input.purchaserSeat !== nextCounterClockwise(input.dealerSeat)) return false;
  if (!input.buyerOriginallyHeldAce) return false;
  const counts = teamTrickCounts(tricks);
  return counts[teamOfSeat(input.purchaserSeat)] === 0;
}


export function scoreRound(input: RoundScoreInput): RoundScoreBreakdown {
  const card = calculateCardRaw(input.tricks, input.contract, input.trumpSuit);
  const purchaserTeam = teamOfSeat(input.purchaserSeat);
  const opponentTeam = purchaserTeam === "NORTH_SOUTH" ? "EAST_WEST" : "NORTH_SOUTH";
  const projectRaw = { ...input.projectRaw };
  const balootRaw = { ...input.balootRaw };
  const contractRaw = {
    NORTH_SOUTH: card.cardRaw.NORTH_SOUTH + projectRaw.NORTH_SOUTH + balootRaw.NORTH_SOUTH,
    EAST_WEST: card.cardRaw.EAST_WEST + projectRaw.EAST_WEST + balootRaw.EAST_WEST,
  };
  const purchaserSucceeded = contractRaw[purchaserTeam] >= contractThreshold(input.contract);
  const kaboot = kabootTeam(input.tricks);
  const reverseKaboot = isReverseKabootEligible(input, input.tricks);
  if (input.reverseKaboot === true && !reverseKaboot) throw new Error("Invalid Reverse Kaboot predicate");
  if (input.gahwa) {
    return {
      cardRaw: card.cardRaw, projectRaw, balootRaw, contractRaw,
      contractResult: purchaserSucceeded ? "SUCCESS" : "FAILURE",
      convertedQaid: zeroTeamMap(), projectQaid: zeroTeamMap(), balootQaid: zeroTeamMap(),
      finalQaid: zeroTeamMap(), kabootTeamId: kaboot, reverseKaboot, gahwa: true,
    };
  }

  const converted = zeroTeamMap();
  const projects = zeroTeamMap();
  const baloot = zeroTeamMap();

  if (reverseKaboot) {
    const buyerTeam = purchaserTeam;
    const winner = opponentTeam;
    const out = zeroTeamMap();
    out[winner] = SAUDI_RULE_PROFILE_V1.scoring.reverseKabootQaid;
    return {
      cardRaw: card.cardRaw, projectRaw, balootRaw, contractRaw,
      contractResult: "FAILURE", convertedQaid: converted, projectQaid: projects,
      balootQaid: baloot, finalQaid: out, kabootTeamId: kaboot, reverseKaboot: true, gahwa: false,
    };
  }

  if (kaboot !== null) {
    const out = zeroTeamMap();
    const value = SAUDI_RULE_PROFILE_V1.scoring.kabootQaid[input.contract][input.escalation === "GAHWA" ? "NORMAL" : input.escalation];
    out[kaboot] =
      value +
      input.projectQaid[kaboot] * projectMultiplier(input.escalation === "GAHWA" ? "NORMAL" : input.escalation) +
      input.balootQaid[kaboot];
    return {
      cardRaw: card.cardRaw, projectRaw, balootRaw, contractRaw,
      contractResult: purchaserSucceeded ? "SUCCESS" : "FAILURE",
      convertedQaid: converted, projectQaid: projects, balootQaid: baloot,
      finalQaid: out, kabootTeamId: kaboot, reverseKaboot: false, gahwa: false,
    };
  }

  if (purchaserSucceeded) {
    for (const team of TEAMS) {
      converted[team] = convertRawToQaid(input.contract, card.cardRaw[team]) * escalationCardMultiplier(input.escalation);
      projects[team] = input.projectQaid[team] * projectMultiplier(input.escalation === "GAHWA" ? "NORMAL" : input.escalation);
      baloot[team] = input.balootQaid[team];
    }
  } else {
    const fullContract = contractRoundQaid(input.contract) * escalationCardMultiplier(input.escalation);
    converted[opponentTeam] = fullContract;
    projects[opponentTeam] = input.projectQaid.NORTH_SOUTH + input.projectQaid.EAST_WEST;
    baloot[opponentTeam] = input.balootQaid.NORTH_SOUTH + input.balootQaid.EAST_WEST;
  }

  const finalQaid = {
    NORTH_SOUTH: converted.NORTH_SOUTH + projects.NORTH_SOUTH + baloot.NORTH_SOUTH,
    EAST_WEST: converted.EAST_WEST + projects.EAST_WEST + baloot.EAST_WEST,
  };
  return {
    cardRaw: card.cardRaw, projectRaw, balootRaw, contractRaw,
    contractResult: purchaserSucceeded ? "SUCCESS" : "FAILURE",
    convertedQaid: converted, projectQaid: projects, balootQaid: baloot,
    finalQaid, kabootTeamId: null, reverseKaboot: false, gahwa: false,
  };
}

export function applyRoundToMatch(
  before: MatchScore,
  round: Pick<RoundScoreBreakdown, "finalQaid">,
): MatchScore {
  return {
    NORTH_SOUTH: before.NORTH_SOUTH + round.finalQaid.NORTH_SOUTH,
    EAST_WEST: before.EAST_WEST + round.finalQaid.EAST_WEST,
  };
}

export function evaluateMatchEnd(
  score: MatchScore,
  target = SAUDI_RULE_PROFILE_V1.matchTargetQaid,
): MatchEndResult {
  const a = score.NORTH_SOUTH >= target;
  const b = score.EAST_WEST >= target;
  if (!a && !b) return { status: "ONGOING", score };
  if (a && b && score.NORTH_SOUTH === score.EAST_WEST) return { status: "EXTRA_DEAL", score };
  return {
    status: "FINISHED",
    score,
    winnerTeamId: score.NORTH_SOUTH > score.EAST_WEST ? "NORTH_SOUTH" : "EAST_WEST",
  };
}
