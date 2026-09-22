# RD-09 — Kaboot & Reverse Kaboot Resolution Protocol

**Project:** صكّة بلوت (Sakkah Baloot)  
**Domain:** Game Rules / Scoring / Authoritative Engine  
**Status:** APPROVED — V-04 = A (Saudi Baseline)  
**Depends on:** RD-03, RD-06, RD-07a→RD-07h, RD-08, V-04, V-09, RD-04

---

## 1. Purpose

Define the canonical engine protocol for:

- Normal Kaboot (كبوت)
- Kaboot under Double / Triple / Four
- Reverse Kaboot (كبوت مقلوب)
- Gahwa precedence
- Interaction with Projects and Baloot
- Deterministic server-side detection and scoring

Kaboot is a **derived round outcome**, not a player action.

## 2. Web Research Findings

Current public references agree that normal Kaboot means one team wins all eight tricks. The commonly documented base values are **25 for Hokum** and **44 for Sun**. citeturn1search4turn1search0

A published Saudi rules reproduction states that in doubled Sun/Hokum, Kaboot remains **44/25** and that Reverse Kaboot is **88** when the player to the dealer's right buys Sun, has an Ace, and their team takes no trick. citeturn1search5

Pagat documents a conflicting variant in which doubled Kaboot becomes **50 in Hokum / 88 in Sun**, and also describes 75/100 for tripled/quadrupled Hokum. This conflict is why the project must use a Rule Profile table rather than derive Kaboot by multiplying the ordinary contract value. citeturn1search4

ElBlot's current rulebook explicitly keeps the Saudi-baseline 25/44 values for doubled Kaboot, while marking Triple/Four handling as provisional and recording the 50/88 interpretation as a variant. citeturn1search1turn1search2

## 3. Already-Approved Decisions

### V-04a — Kaboot × Doubling

**Decision: E — Special Table**

Kaboot does **not** inherit the ordinary contract multiplier.

```ts
kabootAward = kabootTable.resolve(contract, escalationLevel)
```

Not:

```ts
kabootAward = baseKaboot * contractMultiplier
```

### V-04b — Gahwa

**Decision: G1 — Gahwa overrides Kaboot**

```text
Gahwa
→ immediate MATCH_WIN
→ no numeric Kaboot award
→ no Kaboot Qaid conversion
```

### V-09 — Reverse Kaboot

Approved:

- Contract = Sun
- Effective buyer = dealer-right seat under the canonical seat mapping
- Buyer has an Ace in the original eight-card hand
- Buyer team wins **zero tricks**
- Opponent wins all eight tricks
- Result = Reverse Kaboot
- Value = **88**
- It is a derived outcome, never an Action

The global table direction is counter-clockwise, so the engine must resolve `dealerRightSeat` through the shared seat-order utility rather than hard-coded seat indexes.

## 4. Normal Kaboot

Normal Kaboot occurs when exactly one team wins all eight tricks:

```text
Team A = 8, Team B = 0
OR
Team A = 0, Team B = 8
```

No `DECLARE_KABOOT` action exists.

## 5. Authoritative Detection

Kaboot is detected only after the eighth trick:

```text
TRICK_RESOLVED
  ↓
update trick counts
  ↓
if trickNumber === 8
  ↓
resolve Gahwa
  ↓
resolve Reverse Kaboot
  ↓
resolve Normal Kaboot
  ↓
resolve Projects
  ↓
resolve Baloot
  ↓
resolve Contract / special allocation
  ↓
convert to Qaid
  ↓
update match
```

The final-trick resolution must be atomic and idempotent.

## 6. Why Kaboot Is Derived

Do not expose:

```ts
DECLARE_KABOOT
```

as a client action.

Benefits:

- deterministic replay
- no client trust
- no timing ambiguity
- no duplicate-action problem
- reconnect safety
- simpler bots
- deterministic E2E tests

## 7. Domain Model

```ts
type KabootType = "NONE" | "NORMAL" | "REVERSE";

type KabootResolution = {
  type: KabootType;
  winningTeamId: TeamId | null;
  contract: ContractType;
  trickCounts: {
    teamA: number;
    teamB: number;
  };
  baseAward: number;
  projectContributionAllowed: boolean;
  eligibility: {
    allEightTricks: boolean;
    reverseConditionsMet: boolean;
  };
};
```

`baseAward` must come from the Rule Profile.

## 8. Normal Kaboot Predicate

```ts
const isNormalKaboot =
  teamATricks === 8 ||
  teamBTricks === 8;
```

Invariant:

```ts
teamATricks + teamBTricks === 8
```

Therefore:

```text
8–0 → Kaboot
7–1 → no Kaboot
6–2 → no Kaboot
5–3 → no Kaboot
4–4 → no Kaboot
```

## 9. Reverse Kaboot Predicate

```ts
const isReverseKaboot =
  contract === "SUN" &&
  effectiveBuyerSeat === dealerRightSeat &&
  buyerTeamTricks === 0 &&
  buyerHeldAceInOriginalEight === true;
```

`buyerHeldAceInOriginalEight` must use the original final eight-card hand, not the current hand at trick 8.

Recommended state:

```ts
round.initialHands[playerId]
```

This hidden information remains server-authoritative and must never be exposed to opponents.

## 10. Seat Mapping

Never implement Reverse Kaboot as a fixed numeric seat:

```ts
buyerSeat === 0
```

Use a shared relative-seat utility:

```ts
getRelativeSeat(dealerSeat, "RIGHT")
```

This keeps the rule independent from UI seat numbering and preserves the project's counter-clockwise convention.

## 11. Gahwa Precedence

Gahwa has absolute precedence:

```ts
if (roundOutcome === "GAHWA") {
  return MATCH_WIN;
}
```

Do not create a second numeric Kaboot result after Gahwa.

Replay may preserve the final-trick facts for audit, but the scoring result is the Gahwa match win.

## 12. Project Interaction

Normal Kaboot does not erase eligible winning-team projects.

The existing RD-07 project pipeline remains authoritative:

```text
Project Resolution
→ winning project team
→ awarded project pool
```

Do not replace it with `allDeclaredProjects` or `allProjectsOfKabootTeam`.

## 13. Baloot Interaction

Baloot remains independent under RD-08.

```text
ProjectResolution
     ↕
KabootResolution
     ↕
BalootResolution
```

Kaboot detection does not depend on Baloot.

## 14. Kaboot × Escalation

Use a dedicated Rule Profile table:

```ts
type KabootAwardTable = {
  HOKUM: {
    NORMAL: number;
    DOUBLE: number;
    TRIPLE: number | null;
    FOUR: number | null;
  };
  SUN: {
    NORMAL: number;
    DOUBLE: number;
    TRIPLE: number | null;
    FOUR: number | null;
  };
};
```

Frozen today:

```text
Normal Hokum = 25
Normal Sun   = 44
Reverse Sun  = 88
```

Open:

```text
Double Hokum
Double Sun
Triple Hokum
Four Hokum
```

These values must not be inferred mathematically.

## 15. Reverse Kaboot Is Independent

Never implement:

```ts
reverseKaboot = normalKaboot * 2;
```

Use:

```ts
reverseKaboot = ruleProfile.reverseKabootAward;
```

Canonical:

```text
Sun Reverse Kaboot = 88
```

## 16. Round Outcome Model

```ts
type RoundOutcome =
  | { type: "NORMAL"; contractResult: ContractResult }
  | {
      type: "KABOOT";
      winningTeamId: TeamId;
      contract: ContractType;
      kabootAward: number;
    }
  | {
      type: "REVERSE_KABOOT";
      winningTeamId: TeamId;
      kabootAward: 88;
    }
  | {
      type: "GAHWA";
      winningTeamId: TeamId;
    };
```

This prevents downstream systems from reconstructing special outcomes from scattered booleans.

## 17. Replay Events

Kaboot needs no player action event.

Recommended derived event:

```ts
type KabootResolvedEvent = {
  type: "KABOOT_RESOLVED";
  kabootType: "NORMAL" | "REVERSE";
  winningTeamId: TeamId;
  contract: ContractType;
  trickCounts: {
    teamA: number;
    teamB: number;
  };
  award: number;
};
```

Gahwa:

```ts
type GahwaResolvedEvent = {
  type: "GAHWA_RESOLVED";
  winningTeamId: TeamId;
};
```

## 18. Idempotency

Final-trick resolution must execute exactly once.

Use the project's deterministic event sequencing / resolution version:

```text
roundId + resolutionVersion
```

A reconnect or duplicate final-card submission must never award Kaboot twice.

## 19. Minimum Test Matrix

### Normal

```text
Hokum 8–0 → Kaboot
Sun   8–0 → Kaboot
```

### Non-Kaboot

```text
7–1, 6–2, 5–3, 4–4 → no Kaboot
```

### Reverse

```text
Sun
dealer-right buys
buyer has original Ace
buyer team = 0 tricks
→ Reverse Kaboot 88
```

Reject Reverse Kaboot when any condition fails:

```text
Hokum
buyer not dealer-right
no original Ace
buyer team wins ≥1 trick
```

### Gahwa

```text
Gahwa + 8–0
→ MATCH_WIN
→ no numeric Kaboot award
```

### Replay

Replaying the final trick must not duplicate the round award.

## 20. Rule Profile Requirement

```ts
type KabootRuleProfile = {
  normal: {
    hokum: number;
    sun: number;
  };
  escalation: {
    hokum: {
      double: number;
      triple: number | null;
      four: number | null;
    };
    sun: {
      double: number;
    };
  };
  reverse: {
    sun: number;
  };
};
```

## 21. Rule-Owner Decision — V-04 CLOSED

### V-04 = B — Multiplied Kaboot

The Rule Owner has explicitly approved the multiplied Kaboot table.

| Contract | Normal | Double | Triple | Four |
|---|---:|---:|---:|---:|
| Hokum | 25 | **50** | **75** | **100** |
| Sun | 44 | **88** | N/A | N/A |

Reverse Kaboot remains a separate special result:

| Result | Value |
|---|---:|
| Reverse Kaboot — Sun | **88** |

### Canonical implementation rule

Kaboot values are resolved through the dedicated Kaboot Rule Profile table:

```ts
kabootAward = ruleProfile.kaboot[contract][escalationLevel];
```

Do **not** calculate Kaboot through the generic contract multiplier at runtime. The table is canonical and explicit, even though the selected values are numerically equivalent to multiplying the normal Kaboot value for the supported levels.

### Important distinction

Normal Kaboot:

```text
Hokum = 25
Sun   = 44
```

Escalated Kaboot:

```text
Hokum Double = 50
Hokum Triple = 75
Hokum Four   = 100

Sun Double   = 88
```

Reverse Kaboot:

```text
Sun Reverse Kaboot = 88
```

The normal doubled Sun Kaboot and Reverse Kaboot therefore have the same numeric value, but they remain **different domain outcomes with different eligibility predicates and audit semantics**.

## 22. Status

**RD-09: READY / V-04 CLOSED**

- Normal Kaboot: defined
- Reverse Kaboot: defined
- Gahwa precedence: defined
- Project interaction: defined
- Baloot interaction: defined
- Authoritative detection: defined
- Replay/idempotency: defined
- Kaboot escalation numeric table: **CLOSED**
- V-04: **B — Multiplied Kaboot**

## Sources

- ElBlot — current public rulebook and scoring guide. citeturn1search1turn1search2
- Pagat — Baloot reference and documented scoring variant. citeturn1search4
- Saudi rules reproduction / Saudi Mind Sports Federation reference. citeturn1search5
- BalootAI — Saudi Baloot rules reference. citeturn0search5
