import type { Seat, TeamId } from "./rules/types.js";
import { teamOfSeat } from "./rules/profile.js";

export type IntegrityIncidentType =
  | "ACCIDENTAL_EXPOSURE"
  | "WRONG_CARD_COUNT"
  | "DUPLICATE_OR_IMPOSSIBLE_DECK"
  | "PURCHASE_BEFORE_COMPLETION_OR_OUT_OF_TURN"
  | "ILLEGAL_DOUBLE_OR_ASHKAL_COMMITTED"
  | "UNRECOVERABLE_INTEGRITY";

export type IncidentAuthority = "AFFECTED_OPPOSING_TEAM" | "SERVER";

export type IncidentDecision = "CONTINUE" | "CANCEL";

export type IncidentPhase =
  | "DETECTED"
  | "DECISION_REQUIRED"
  | "CONTINUED"
  | "CANCELLED";

export interface IntegrityIncident {
  readonly incidentId: string;
  readonly type: IntegrityIncidentType;
  readonly phase: IncidentPhase;
  readonly authority: IncidentAuthority;
  readonly affectedTeamId: TeamId | null;
  readonly recoverable: boolean;
  readonly decisionRequired: boolean;
  readonly autoCancel: boolean;
}

export interface IncidentResolution {
  readonly incident: IntegrityIncident;
  readonly outcome: "CONTINUED" | "HAND_CANCELLED";
  readonly score: { readonly NORTH_SOUTH: 0; readonly EAST_WEST: 0 };
  readonly matchScoreUnchanged: true;
  readonly nextDealerSeat: Seat | null;
}

const INCIDENT_POLICY: Readonly<Record<IntegrityIncidentType, {
  authority: IncidentAuthority;
  recoverable: boolean;
  decisionRequired: boolean;
  autoCancel: boolean;
}>> = {
  ACCIDENTAL_EXPOSURE: {
    authority: "AFFECTED_OPPOSING_TEAM",
    recoverable: true,
    decisionRequired: true,
    autoCancel: false,
  },
  WRONG_CARD_COUNT: {
    authority: "AFFECTED_OPPOSING_TEAM",
    recoverable: true,
    decisionRequired: true,
    autoCancel: false,
  },
  DUPLICATE_OR_IMPOSSIBLE_DECK: {
    authority: "SERVER",
    recoverable: false,
    decisionRequired: false,
    autoCancel: true,
  },
  PURCHASE_BEFORE_COMPLETION_OR_OUT_OF_TURN: {
    authority: "AFFECTED_OPPOSING_TEAM",
    recoverable: true,
    decisionRequired: true,
    autoCancel: false,
  },
  ILLEGAL_DOUBLE_OR_ASHKAL_COMMITTED: {
    authority: "SERVER",
    recoverable: false,
    decisionRequired: false,
    autoCancel: true,
  },
  UNRECOVERABLE_INTEGRITY: {
    authority: "SERVER",
    recoverable: false,
    decisionRequired: false,
    autoCancel: true,
  },
};

function rotateRight(seat: Seat): Seat {
  return ({ NORTH: "WEST", WEST: "SOUTH", SOUTH: "EAST", EAST: "NORTH" } as const)[seat];
}

export function createIntegrityIncident(
  incidentId: string,
  type: IntegrityIncidentType,
  affectedTeamId: TeamId | null = null,
): IntegrityIncident {
  const policy = INCIDENT_POLICY[type];
  if (policy.authority === "AFFECTED_OPPOSING_TEAM" && affectedTeamId === null) {
    throw new Error("Affected opposing team is required");
  }
  return {
    incidentId,
    type,
    phase: policy.decisionRequired ? "DECISION_REQUIRED" : "DETECTED",
    authority: policy.authority,
    affectedTeamId,
    recoverable: policy.recoverable,
    decisionRequired: policy.decisionRequired,
    autoCancel: policy.autoCancel,
  };
}

export function resolveIntegrityIncident(
  incident: IntegrityIncident,
  decision: IncidentDecision | null,
  dealerSeat: Seat,
  processedIncidentIds: readonly string[] = [],
): IncidentResolution {
  if (processedIncidentIds.includes(incident.incidentId)) {
    throw new Error("Duplicate integrity incident resolution");
  }

  if (incident.phase === "CONTINUED" || incident.phase === "CANCELLED") {
    throw new Error("Integrity incident is already resolved");
  }

  if (incident.autoCancel) {
    if (decision !== null) throw new Error("Auto-cancel incident does not accept a decision");
    return {
      incident: { ...incident, phase: "CANCELLED" },
      outcome: "HAND_CANCELLED",
      score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      matchScoreUnchanged: true,
      nextDealerSeat: rotateRight(dealerSeat),
    };
  }

  if (!incident.decisionRequired) {
    throw new Error("Incident does not accept a decision");
  }
  if (decision === null) throw new Error("Incident decision is required");

  if (decision === "CONTINUE") {
    return {
      incident: { ...incident, phase: "CONTINUED" },
      outcome: "CONTINUED",
      score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
      matchScoreUnchanged: true,
      nextDealerSeat: null,
    };
  }

  return {
    incident: { ...incident, phase: "CANCELLED" },
    outcome: "HAND_CANCELLED",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    matchScoreUnchanged: true,
    nextDealerSeat: rotateRight(dealerSeat),
  };
}

export function affectedTeamForSeat(seat: Seat): TeamId {
  return teamOfSeat(seat);
}
