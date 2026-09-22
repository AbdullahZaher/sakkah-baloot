import type {
  Contract,
  EscalationLevel,
  ProjectValues,
  RuleProfile,
  Seat,
  SeatMap,
  TeamId,
} from "./types.js";
import {
  CONTRACTS,
  ESCALATION_LEVELS,
  HOKUM_PLAY_MODES,
  MATCH_TARGET_QAID,
  PLAYER_COUNT,
  SEATS,
  TEAM_COUNT,
  TRICKS_PER_ROUND,
  CARDS_IN_DECK,
  CARDS_PER_PLAYER,
} from "./types.js";

const SEAT_MAP: Readonly<Record<Seat, SeatMap>> = {
  NORTH: {
    team: "NORTH_SOUTH",
    partner: "SOUTH",
    nextCounterClockwise: "WEST",
    previousCounterClockwise: "EAST",
  },
  EAST: {
    team: "EAST_WEST",
    partner: "WEST",
    nextCounterClockwise: "NORTH",
    previousCounterClockwise: "SOUTH",
  },
  SOUTH: {
    team: "NORTH_SOUTH",
    partner: "NORTH",
    nextCounterClockwise: "EAST",
    previousCounterClockwise: "WEST",
  },
  WEST: {
    team: "EAST_WEST",
    partner: "EAST",
    nextCounterClockwise: "SOUTH",
    previousCounterClockwise: "NORTH",
  },
};

const PROJECT_VALUES: Readonly<Record<Contract, ProjectValues>> = {
  HOKUM: {
    sera: { raw: 20, qaid: 2 },
    fifty: { raw: 50, qaid: 5 },
    hundred: { raw: 100, qaid: 10 },
    fourHundred: { raw: 0, qaid: 0 },
  },
  SUN: {
    sera: { raw: 20, qaid: 4 },
    fifty: { raw: 50, qaid: 10 },
    hundred: { raw: 100, qaid: 20 },
    fourHundred: { raw: 200, qaid: 40 },
  },
};

const KABOOT_QAID: Readonly<
  Record<Contract, Readonly<Record<"NORMAL" | "DOUBLE" | "TRIPLE" | "FOUR", number>>>
> = {
  HOKUM: { NORMAL: 25, DOUBLE: 25, TRIPLE: 25, FOUR: 25 },
  SUN: { NORMAL: 44, DOUBLE: 44, TRIPLE: 0, FOUR: 0 },
};

const profile: RuleProfile = {
  id: "saudi-v1",
  version: 1,
  direction: "COUNTER_CLOCKWISE",
  players: PLAYER_COUNT,
  teams: TEAM_COUNT,
  deckSize: CARDS_IN_DECK,
  cardsPerPlayer: CARDS_PER_PLAYER,
  tricksPerRound: TRICKS_PER_ROUND,
  matchTargetQaid: MATCH_TARGET_QAID,
  seatMap: SEAT_MAP,
  contracts: CONTRACTS,
  escalationLevels: ESCALATION_LEVELS,
  hokumPlayModes: HOKUM_PLAY_MODES,
  contractThresholds: {
    sun: 65,
    hokum: 81,
  },
  projectValues: PROJECT_VALUES,
  scoring: {
    matchTargetQaid: MATCH_TARGET_QAID,
    sunContractThreshold: 65,
    hokumContractThreshold: 81,
    projectMultiplier: {
      NORMAL: 1,
      DOUBLE: 2,
      TRIPLE: 1,
      FOUR: 1,
    },
    balootMultiplier: 1,
    kabootQaid: KABOOT_QAID,
    reverseKabootQaid: 88,
  },
  timing: {
    biddingTimeoutMs: 8_000,
    playingTimeoutMs: 30_000,
  },
};

export const SAUDI_RULE_PROFILE_V1: RuleProfile = Object.freeze(profile);

export function teamOfSeat(seat: Seat): TeamId {
  return SAUDI_RULE_PROFILE_V1.seatMap[seat].team;
}

export function partnerOfSeat(seat: Seat): Seat {
  return SAUDI_RULE_PROFILE_V1.seatMap[seat].partner;
}

export function nextCounterClockwise(seat: Seat): Seat {
  return SAUDI_RULE_PROFILE_V1.seatMap[seat].nextCounterClockwise;
}

export function previousCounterClockwise(seat: Seat): Seat {
  return SAUDI_RULE_PROFILE_V1.seatMap[seat].previousCounterClockwise;
}

export function contractThreshold(contract: Contract): number {
  return contract === "SUN"
    ? SAUDI_RULE_PROFILE_V1.contractThresholds.sun
    : SAUDI_RULE_PROFILE_V1.contractThresholds.hokum;
}

export function isEscalationLevel(
  value: string,
): value is EscalationLevel {
  return (ESCALATION_LEVELS as readonly string[]).includes(value);
}

export { SEAT_MAP, PROJECT_VALUES, KABOOT_QAID };
