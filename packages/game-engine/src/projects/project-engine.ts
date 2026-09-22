import type { Card, CardId, Rank, Suit } from "../cards.js";
import { RANKS } from "../cards.js";
import type { Contract, ProjectLifecycle, ProjectType, Seat, TeamId } from "../rules/types.js";
import { PROJECT_LIFECYCLE } from "../rules/types.js";
import { SAUDI_RULE_PROFILE_V1, teamOfSeat, nextCounterClockwise } from "../rules/profile.js";

export interface ProjectCandidate {
  readonly id: string;
  readonly type: Exclude<ProjectType, "BALOOT">;
  readonly cards: readonly CardId[];
  readonly ownerSeat: Seat;
  readonly teamId: TeamId;
  readonly contract: Contract;
  readonly subtype: string;
  readonly highRankIndex: number;
  readonly rawValue: number;
  readonly qaydValue: number;
}

export interface ProjectDeclaration {
  readonly declarationId: string;
  readonly candidate: ProjectCandidate;
  readonly lifecycle: ProjectLifecycle;
  readonly declaredBeforeCard: boolean;
  readonly trickNumber: 1;
}

export interface ProjectResolution {
  readonly projectWinnerTeamId: TeamId | null;
  readonly awardedProjectIds: readonly string[];
  readonly discardedProjectIds: readonly string[];
  readonly projectRaw: Readonly<Record<TeamId, number>>;
  readonly projectQaid: Readonly<Record<TeamId, number>>;
}

const SEQUENCE_INDEX: Readonly<Record<Rank, number>> = {
  "7": 0, "8": 1, "9": 2, "10": 3, J: 4, Q: 5, K: 6, A: 7,
};

function key(cards: readonly Card[]): string {
  return [...cards].map((c) => c.id).sort().join(",");
}

function candidate(
  type: Exclude<ProjectType, "BALOOT">,
  cards: readonly Card[],
  ownerSeat: Seat,
  contract: Contract,
  subtype: string,
): ProjectCandidate {
  const values = SAUDI_RULE_PROFILE_V1.projectValues[contract][type === "FOUR_HUNDRED" ? "fourHundred" : type === "SERA" ? "sera" : type === "FIFTY" ? "fifty" : "hundred"];
  return {
    id: `${type}:${ownerSeat}:${key(cards)}`,
    type,
    cards: cards.map((c) => c.id),
    ownerSeat,
    teamId: teamOfSeat(ownerSeat),
    contract,
    subtype,
    highRankIndex: Math.max(...cards.map((c) => SEQUENCE_INDEX[c.rank])),
    rawValue: values.raw,
    qaydValue: values.qaid,
  };
}

function sequences(hand: readonly Card[], length: 3 | 4 | 5): readonly Card[][] {
  const result: Card[][] = [];
  for (const suit of ["CLUBS","DIAMONDS","HEARTS","SPADES"] as const) {
    const byRank = new Map(hand.filter((c) => c.suit === suit).map((c) => [c.rank, c]));
    for (let start = 0; start <= RANKS.length - length; start += 1) {
      const cards: Card[] = [];
      for (let i = 0; i < length; i += 1) {
        const rank = RANKS[start + i]!;
        const card = byRank.get(rank);
        if (!card) { cards.length = 0; break; }
        cards.push(card);
      }
      if (cards.length === length) result.push(cards);
    }
  }
  return result;
}

function fourOfRank(hand: readonly Card[], rank: Rank): readonly Card[] | null {
  const cards = hand.filter((c) => c.rank === rank);
  return cards.length === 4 ? cards : null;
}

export function detectProjects(
  hand: readonly Card[],
  contract: Contract,
  trumpSuit: Suit | null,
  ownerSeat: Seat,
): readonly ProjectCandidate[] {
  const out: ProjectCandidate[] = [];
  for (const cards of sequences(hand, 3)) out.push(candidate("SERA", cards, ownerSeat, contract, "SEQUENCE_3"));
  for (const cards of sequences(hand, 4)) out.push(candidate("FIFTY", cards, ownerSeat, contract, "SEQUENCE_4"));

  for (const cards of sequences(hand, 5)) out.push(candidate("HUNDRED", cards, ownerSeat, contract, "SEQUENCE_5"));

  for (const rank of ["J","Q","K","10"] as const) {
    const cards = fourOfRank(hand, rank);
    if (cards) out.push(candidate("HUNDRED", cards, ownerSeat, contract, `FOUR_${rank}`));
  }

  const aces = fourOfRank(hand, "A");
  if (aces) {
    out.push(candidate(contract === "SUN" ? "FOUR_HUNDRED" : "HUNDRED", aces, ownerSeat, contract, "FOUR_ACES"));
  }

  // A project with no configured value is not eligible in this contract.
  return out.filter((p) => p.qaydValue > 0 || p.rawValue > 0);
}

function precedence(p: ProjectCandidate): number {
  if (p.type === "FOUR_HUNDRED") return 400;
  if (p.type === "HUNDRED") return 300;
  if (p.type === "FIFTY") return 200;
  return 100;
}

function compareCandidates(a: ProjectCandidate, b: ProjectCandidate): number {
  const p = precedence(a) - precedence(b);
  if (p !== 0) return p;
  if (a.type === "HUNDRED" && b.type === "HUNDRED") {
    const subtypeRank: Record<string, number> = {
      FOUR_ACES: 50, FOUR_K: 40, FOUR_Q: 30, FOUR_J: 20, FOUR_10: 10, SEQUENCE_5: 5,
    };
    const s = (subtypeRank[a.subtype] ?? 0) - (subtypeRank[b.subtype] ?? 0);
    if (s !== 0) return s;
  }
  return a.highRankIndex - b.highRankIndex;
}

function tiePriority(seat: Seat, dealerSeat: Seat): number {
  let current = nextCounterClockwise(dealerSeat);
  for (let i = 0; i < 4; i += 1) {
    if (current === seat) return i;
    current = nextCounterClockwise(current);
  }
  return 99;
}

export function declareProject(
  candidate: ProjectCandidate,
  declarationId: string,
  phase: string,
  trickNumber: number,
  playsInTrick: number,
  existing: readonly ProjectDeclaration[],
): ProjectDeclaration {
  if (!isProjectDeclarationWindow(phase, trickNumber, playsInTrick)) {
    throw new Error("Project declaration window closed");
  }
  if (existing.some((d) => d.declarationId === declarationId)) {
    throw new Error("Duplicate project declaration");
  }
  if (existing.filter((d) => d.candidate.teamId === candidate.teamId).length >= 2) {
    throw new Error("Maximum normal projects per team reached");
  }
  validateProjectDeclaration(
    {
      declarationId,
      candidate,
      lifecycle: "DECLARED",
      declaredBeforeCard: true,
      trickNumber: 1,
    },
    "NORTH",
    existing,
  );
  return {
    declarationId,
    candidate,
    lifecycle: "DECLARED",
    declaredBeforeCard: true,
    trickNumber: 1,
  };
}

export function advanceProjectLifecycle(
  declaration: ProjectDeclaration,
  next: Exclude<ProjectLifecycle, "DECLARED">,
): ProjectDeclaration {
  const order = PROJECT_LIFECYCLE.indexOf(declaration.lifecycle);
  const target = PROJECT_LIFECYCLE.indexOf(next);
  if (target <= order) throw new Error("Project lifecycle cannot move backwards");
  return { ...declaration, lifecycle: next };
}

export function isProjectDeclarationWindow(
  phase: string,
  trickNumber: number,
  playsInTrick: number,
): boolean {
  return phase === "PLAYING" && trickNumber === 1 && playsInTrick === 0;
}

export function validateProjectDeclaration(
  declaration: ProjectDeclaration,
  dealerSeat: Seat,
  existing: readonly ProjectDeclaration[],
): void {
  if (!PROJECT_LIFECYCLE.includes(declaration.lifecycle)) throw new Error("Invalid project lifecycle");
  if (!declaration.declaredBeforeCard || declaration.trickNumber !== 1) throw new Error("Project declaration window closed");
  for (const other of existing) {
    const overlap = declaration.candidate.cards.some((id) => other.candidate.cards.includes(id));
    if (overlap) {
      throw new Error("Project card overlap");
    }
  }
  if (declaration.candidate.teamId !== teamOfSeat(declaration.candidate.ownerSeat)) {
    throw new Error("Invalid project owner team");
  }
  void dealerSeat;
}

export function resolveProjects(
  declarations: readonly ProjectDeclaration[],
  dealerSeat: Seat,
): ProjectResolution {
  const teams: readonly TeamId[] = ["NORTH_SOUTH", "EAST_WEST"];
  const eligible = declarations.filter((d) => d.lifecycle === "DECLARED" || d.lifecycle === "REVEALED" || d.lifecycle === "COMPARED");
  const byTeam = new Map<TeamId, ProjectDeclaration[]>();
  for (const team of teams) byTeam.set(team, []);
  for (const d of eligible) byTeam.get(d.candidate.teamId)!.push(d);

  const best = new Map<TeamId, ProjectDeclaration | null>();
  for (const team of teams) {
    const list = byTeam.get(team)!;
    list.sort((a,b) => compareCandidates(b.candidate, a.candidate));
    best.set(team, list[0] ?? null);
  }

  const a = best.get(teams[0])!;
  const b = best.get(teams[1])!;
  let winner: TeamId | null = null;
  if (a && !b) winner = teams[0];
  else if (b && !a) winner = teams[1];
  else if (a && b) {
    const cmp = compareCandidates(a.candidate, b.candidate);
    winner = cmp > 0 ? a.candidate.teamId : cmp < 0 ? b.candidate.teamId :
      (tiePriority(a.candidate.ownerSeat, dealerSeat) <= tiePriority(b.candidate.ownerSeat, dealerSeat)
        ? a.candidate.teamId : b.candidate.teamId);
  }

  const awarded = winner
    ? (byTeam.get(winner) ?? []).map((d) => d.candidate.id)
    : [];
  const discarded = eligible.map((d) => d.candidate.id).filter((id) => !awarded.includes(id));

  const projectRaw: Record<TeamId, number> = { NORTH_SOUTH: 0, EAST_WEST: 0 };
  const projectQaid: Record<TeamId, number> = { NORTH_SOUTH: 0, EAST_WEST: 0 };
  if (winner) {
    for (const d of byTeam.get(winner) ?? []) {
      projectRaw[winner] += d.candidate.rawValue;
      projectQaid[winner] += d.candidate.qaydValue;
    }
  }
  return { projectWinnerTeamId: winner, awardedProjectIds: awarded, discardedProjectIds: discarded, projectRaw, projectQaid };
}
