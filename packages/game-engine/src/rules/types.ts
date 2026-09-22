export const PLAYER_COUNT = 4 as const;
export const TEAM_COUNT = 2 as const;
export const CARDS_IN_DECK = 32 as const;
export const CARDS_PER_PLAYER = 8 as const;
export const TRICKS_PER_ROUND = 8 as const;
export const MATCH_TARGET_QAID = 152 as const;

export type PlayerId = string;
export type MatchId = string;
export type RoundId = string;
export type MatchSeed = string;

export const SEATS = ["NORTH", "EAST", "SOUTH", "WEST"] as const;
export type Seat = (typeof SEATS)[number];

export const TEAMS = ["NORTH_SOUTH", "EAST_WEST"] as const;
export type TeamId = (typeof TEAMS)[number];

export const CONTRACTS = ["SUN", "HOKUM"] as const;
export type Contract = (typeof CONTRACTS)[number];

export const ESCALATION_LEVELS = ["NORMAL", "DOUBLE", "TRIPLE", "FOUR", "GAHWA"] as const;
export type EscalationLevel = (typeof ESCALATION_LEVELS)[number];

export const HOKUM_PLAY_MODES = ["OPEN", "LOCKED"] as const;
export type HokumPlayMode = (typeof HOKUM_PLAY_MODES)[number];

export const PROJECTS = ["SERA", "FIFTY", "HUNDRED", "FOUR_HUNDRED"] as const;
export type ProjectType = (typeof PROJECTS)[number];

export const PROJECT_LIFECYCLE = [
  "DECLARED",
  "REVEALED",
  "COMPARED",
  "AWARDED",
  "DISCARDED",
] as const;
export type ProjectLifecycle = (typeof PROJECT_LIFECYCLE)[number];

export type TeamQaidScore = Readonly<Record<TeamId, number>>;
export type TeamRawScore = Readonly<Record<TeamId, number>>;

export interface SeatMap {
  readonly team: TeamId;
  readonly partner: Seat;
  readonly nextCounterClockwise: Seat;
  readonly previousCounterClockwise: Seat;
}

export interface ContractThresholds {
  readonly sun: 65;
  readonly hokum: 81;
}

export interface ProjectValue {
  readonly raw: number;
  readonly qaid: number;
}

export interface ProjectValues {
  readonly sera: ProjectValue;
  readonly fifty: ProjectValue;
  readonly hundred: ProjectValue;
  readonly fourHundred: ProjectValue;
}

export interface EscalationMultiplier {
  readonly card: number;
  readonly project: number;
  readonly baloot: 1;
}

export interface ScoringProfile {
  readonly matchTargetQaid: typeof MATCH_TARGET_QAID;
  readonly sunContractThreshold: 65;
  readonly hokumContractThreshold: 81;
  readonly projectMultiplier: Readonly<Record<"NORMAL" | "DOUBLE" | "TRIPLE" | "FOUR", number>>;
  readonly balootMultiplier: 1;
  readonly kabootQaid: Readonly<Record<Contract, Readonly<Record<"NORMAL" | "DOUBLE" | "TRIPLE" | "FOUR", number>>>>;
  readonly reverseKabootQaid: 88;
}

export interface DealProfile {
  readonly initialCardsPerPlayer: 5;
  readonly exposedCardCount: 1;
  readonly completionCardsPerPlayer: 8;
}

export interface TimingProfile {
  readonly biddingTimeoutMs: 8_000;
  readonly playingTimeoutMs: 30_000;
}

export interface RuleProfile {
  readonly id: "saudi-v1";
  readonly version: 1;
  readonly direction: "COUNTER_CLOCKWISE";
  readonly players: typeof PLAYER_COUNT;
  readonly teams: typeof TEAM_COUNT;
  readonly deckSize: typeof CARDS_IN_DECK;
  readonly cardsPerPlayer: typeof CARDS_PER_PLAYER;
  readonly tricksPerRound: typeof TRICKS_PER_ROUND;
  readonly matchTargetQaid: typeof MATCH_TARGET_QAID;
  readonly seatMap: Readonly<Record<Seat, SeatMap>>;
  readonly contracts: readonly Contract[];
  readonly escalationLevels: readonly EscalationLevel[];
  readonly hokumPlayModes: readonly HokumPlayMode[];
  readonly contractThresholds: ContractThresholds;
  readonly projectValues: Readonly<Record<Contract, ProjectValues>>;
  readonly scoring: ScoringProfile;
  readonly deal: DealProfile;
  readonly timing: TimingProfile;
}
