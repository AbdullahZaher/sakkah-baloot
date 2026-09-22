# صكّة بلوت — Scoring System Specification

**Document:** `docs/game/06-scoring.md`  
**Status:** Draft for Review — NOT FROZEN  
**Phase:** Foundation / Game Domain  
**Depends on:** `01-game-rules.md`, `02-card-system.md`, `03-dealing.md`, `04-bidding.md`, `05-playing.md`  
**Next dependent documents:** Game State, Actions, State Transitions

---

# 1. Purpose

This document defines the authoritative scoring architecture for صكّة بلوت.

It separates the different meanings of "points" so the implementation does not mix:

```text
Card Raw Points
Project Raw Value
Qaid / Recorded Points
Purchaser Success
Round Result
Match Score
```

It covers:

- card points
- last-trick bonus
- projects
- **سرا**
- خمسين
- مية
- أربعمية
- بلوت
- project eligibility
- project comparison
- purchaser success/failure
- Qaid conversion
- doubling
- triple
- four
- coffee
- kaboot
- ties
- project cancellation
- match progression
- replay
- deterministic calculation
- validation and tests

---

# 2. Naming Correction — Important

The project name for the three-card sequence project is:

```text
سرا
```

NOT:

```text
سيرة
```

This spelling MUST be used consistently throughout:

- game engine
- database
- protocol
- analytics
- UI
- localization
- documentation
- tests

Recommended internal identifier:

```ts
SERA
```

Localized Arabic display name:

```text
سرا
```

Do not create a second project identifier such as:

```text
SEERA
SIRA
SIRA_PROJECT
```

for the same project.

---

# 3. Critical Scoring Principle

The scoring engine MUST be deterministic and pure.

Given:

```text
Rule Profile
Contract
Purchaser
Trick Results
Projects
Doubling State
```

the same inputs must always produce the same result.

The scoring engine MUST NOT depend on:

- UI
- network timing
- animation timing
- database ordering
- localized strings
- client-side calculations
- floating-point arithmetic
- random numbers

---

# 4. Domain Independence

Recommended location:

```text
packages/
└── game-engine/
    └── src/
        └── scoring/
            ├── scoring-types.ts
            ├── card-scoring.ts
            ├── project-scoring.ts
            ├── project-comparison.ts
            ├── purchaser-result.ts
            ├── qayd-conversion.ts
            ├── doubling.ts
            ├── kaboot.ts
            ├── match-score.ts
            └── scoring-engine.ts
```

The scoring package MUST NOT import React, React Native, Expo, Supabase, Redis, WebSocket libraries, or UI modules.

---

# 5. Terminology

## 5.1 Raw Card Points

The value printed by the game rules for cards won in tricks.

Example:

```text
A in Sun = 11
10 in Sun = 10
```

These are not automatically the final recorded points.

---

## 5.2 Raw Project Value

The card-equivalent contribution used when determining the purchaser's success.

Examples in the baseline rules:

```text
سرا
خمسين
مية
أربعمية
بلوت
```

The final adopted Rule Profile must define the exact raw values and when they participate in the success comparison.

---

## 5.3 Qaid

The recorded numerical score awarded to a team for a round.

Examples:

```text
سرا in Hokm → 2
سرا in Sun → 4
خمسين in Hokm → 5
خمسين in Sun → 10
مية in Hokm → 10
مية in Sun → 20
أربعمية in Sun → 40
بلوت → 2
```

These values are commonly documented in current Baloot references, but the final project Rule Profile must be frozen before production. citeturn0search0turn0search4

---

# 6. Why Raw and Qaid Must Be Separate

Never implement:

```ts
project.points
```

as one ambiguous value.

A project needs at least:

```ts
interface ProjectValue {
  readonly rawValue: number;
  readonly qaydValue: number;
}
```

because the project can contribute differently to:

```text
purchaser success comparison
```

and:

```text
recorded Qaid
```

This distinction prevents major scoring bugs.

---

# 7. Card Raw Points

Baseline card values:

## Sun / Non-Trump

| Rank | Raw Points |
|---|---:|
| A | 11 |
| 10 | 10 |
| K | 4 |
| Q | 3 |
| J | 2 |
| 9 | 0 |
| 8 | 0 |
| 7 | 0 |

## Trump

| Rank | Raw Points |
|---|---:|
| J | 20 |
| 9 | 14 |
| A | 11 |
| 10 | 10 |
| K | 4 |
| Q | 3 |
| 8 | 0 |
| 7 | 0 |

These values are consistent with commonly published Saudi Baloot scoring references. citeturn0search0turn0search3

---

# 8. Total Card Points

Using the baseline card values:

## Sun

The 32 cards contain:

```text
130 card points
```

before the last-trick bonus.

## Hokm

The 32 cards contain:

```text
152 card points
```

before the last-trick bonus.

The last-trick bonus is handled separately.

Some published scorekeeping applications describe the Sun total as 130 and the Hokm total as 162 after including the 10-point final-trick contribution. citeturn0search2turn0search5

The engine MUST represent these as separate components:

```text
cardPoints
lastTrickBonus
```

rather than hard-coding a single total.

---

# 9. Last-Trick Bonus

The baseline rule awards:

```text
+10 raw points
```

to the team winning the eighth/final trick.

Therefore:

```text
final raw card total =
card points
+
last trick bonus
```

The Playing Engine reports:

```text
winner of trick 8
```

The Scoring Engine applies:

```text
lastTrickBonus = 10
```

Do not put this arithmetic in the Trick Engine.

---

# 10. Round Score Components

A round result should be represented as components:

```ts
interface RoundRawScore {
  readonly cardPoints: Record<TeamId, number>;
  readonly lastTrickBonus: Record<TeamId, number>;
  readonly projectRawPoints: Record<TeamId, number>;
  readonly balootRawPoints: Record<TeamId, number>;
  readonly totalRawPoints: Record<TeamId, number>;
}
```

The exact project raw values are Rule Profile configuration.

---

# 11. Projects

The project system recognizes:

```text
سرا
خمسين
مية
أربعمية
بلوت
```

with contract-specific eligibility.

Current public rule references describe:

- **سرا** = three sequential cards of one suit
- خمسين = four sequential cards of one suit
- مية = five sequential cards or qualifying four-of-a-kind combinations
- أربعمية = four Aces in Sun
- بلوت = King + Queen of the Trump suit in Hokm

citeturn0search0turn0search3turn0search10

The final Rule Profile controls exact project detection and comparison.

---

# 12. Project Identifier

Recommended:

```ts
type ProjectType =
  | "SERA"
  | "FIFTY"
  | "HUNDRED"
  | "FOUR_HUNDRED"
  | "BALOOT";
```

Arabic labels:

```text
SERA         → سرا
FIFTY        → خمسين
HUNDRED      → مية
FOUR_HUNDRED → أربعمية
BALOOT       → بلوت
```

Do not use Arabic labels as engine identifiers.

---

# 13. سرا

## Definition

Baseline:

```text
3 sequential cards
of the same suit
```

Example:

```text
7♥ 8♥ 9♥
```

The project is called:

```text
سرا
```

not:

```text
سيرة
```

---

# 14. سرا Values

Baseline Qaid values:

| Contract | Qaid |
|---|---:|
| Hokm | 2 |
| Sun | 4 |

These values are reported by current Baloot references. citeturn0search0turn0search11

The raw success-comparison value is Rule Profile data and MUST NOT be inferred from the Qaid value.

---

# 15. خمسين

## Definition

Baseline:

```text
4 sequential cards
of the same suit
```

Example:

```text
7♣ 8♣ 9♣ 10♣
```

Common Qaid values:

| Contract | Qaid |
|---|---:|
| Hokm | 5 |
| Sun | 10 |

citeturn0search0turn0search11

---

# 16. مية

The project `HUNDRED` requires a qualifying combination.

Common qualifying combinations include:

### Sun

```text
5 sequential cards of one suit
```

or:

```text
4 Jacks
4 Queens
4 Kings
4 Tens
```

while four Aces are treated as:

```text
أربعمية
```

in Sun.

### Hokm

A common rule set treats:

```text
4 Aces
```

as مية in Hokm.

The final Rule Profile MUST freeze the exact qualifying combinations.

citeturn0search0turn0search3

---

# 17. مية Values

Baseline Qaid:

| Contract | Qaid |
|---|---:|
| Hokm | 10 |
| Sun | 20 |

citeturn0search0turn0search11

---

# 18. أربعمية

أربعمية is a Sun-only project.

Baseline combination:

```text
A♣ A♦ A♥ A♠
```

Qaid:

```text
40
```

Current public references explicitly distinguish four Aces in Sun as أربعمية rather than مية. citeturn0search0turn0search4

There is no normal Hokm value for أربعمية in the baseline model.

---

# 19. بلوت

بلوت is a special project associated with Hokm.

Baseline combination:

```text
K(trump) + Q(trump)
```

Example:

```text
K♥ + Q♥
```

when:

```text
HEARTS = Trump
```

Current references describe its Qaid contribution as:

```text
2
```

and distinguish it from the normal project multiplication. citeturn0search0

---

# 20. بلوت Timing

بلوت is not merely a project discovered after all tricks.

It has a declaration timing rule.

The final Rule Profile must define:

- when it can be declared
- which card sequence triggers declaration
- what happens if declaration is missed
- whether the cards must be visible
- whether it can coexist with another project
- whether it is doubled

Current public references describe declaration around playing the second King/Queen card of the Trump suit. citeturn0search0turn0search10

---

# 21. Project Detection

Recommended API:

```ts
detectProjects(
  hand: readonly Card[],
  contract: Contract,
  ruleProfile: RuleProfile
): readonly ProjectCandidate[];
```

Detection should be deterministic.

It must not modify:

```text
hand
game state
contract
score
```

---

# 22. Project Candidate

Recommended:

```ts
interface ProjectCandidate {
  readonly type: ProjectType;
  readonly cards: readonly CardId[];
  readonly rawValue: number;
  readonly qaydValue: number;
}
```

Do not immediately award a project merely because a candidate exists.

The project may still need:

```text
announcement
reveal
comparison
eligibility
```

---

# 23. Project Announcement

The project lifecycle should be separate from detection:

```text
DETECTED
   ↓
ANNOUNCED
   ↓
REVEALED / VERIFIED
   ↓
COMPARED
   ↓
AWARDED or DISCARDED
```

This prevents hidden-hand information from automatically becoming public scoring information.

---

# 24. Project Declaration Timing

The Rule Profile must define exactly when projects are announced.

A common rule set uses the beginning of the first trick for declaration, with later reveal/comparison behavior. citeturn0search0turn0search10

The engine must treat timing as state, not UI behavior.

---

# 25. Project Visibility

A detected project is private information until its allowed declaration/reveal point.

The client must not automatically reveal:

```text
all detected projects
```

to opponents.

The server owns project visibility.

---

# 26. Project Comparison

If both teams have projects, the engine must determine which team's project has priority according to the Rule Profile.

Baseline ordering commonly places:

```text
أربعمية
مية
أربع Aces / qualifying higher combinations
خمسين
سرا
```

with additional distinctions between types of مية.

The final comparison algorithm MUST be explicit.

Current public references document project precedence and tie-breaking rules. citeturn0search0

---

# 27. Same Project Type

If both teams have the same project type, additional comparison rules may apply.

The comparison can depend on:

- highest card
- project subtype
- sequence position
- seat proximity
- dealer-relative order

Do not use array order or database order.

The Rule Profile must define exact tie-breakers.

---

# 28. Only One Team's Projects

If only one team has an eligible project:

```text
that team's eligible project value is awarded
```

subject to:

- valid declaration
- valid reveal
- project priority rules
- project non-overlap

---

# 29. Multiple Projects in One Hand

A player may possess multiple project candidates.

The engine must distinguish:

```text
detected candidates
```

from:

```text
projects that actually count
```

A project may be excluded because:

- a higher project consumes the same cards
- a project is not eligible under the contract
- the Rule Profile disallows stacking
- it was not announced
- it was not revealed in time

---

# 30. Project Non-Overlap

The final Rule Profile must define whether overlapping combinations can both count.

The safe architecture is:

```ts
resolveProjectSet(candidates, ruleProfile)
```

rather than:

```ts
sum(allDetectedProjects)
```

Never blindly add every candidate.

---

# 31. Raw Project Values

The engine should store project raw values separately from Qaid.

For example:

```ts
interface ScoringProject {
  readonly type: ProjectType;
  readonly rawValue: number;
  readonly qaydValue: number;
  readonly multiplierEligible: boolean;
}
```

The exact `rawValue` table must be frozen with the Rule Profile.

---

# 32. Project Qaid Values

Baseline:

| Project | Hokm | Sun |
|---|---:|---:|
| سرا | 2 | 4 |
| خمسين | 5 | 10 |
| مية | 10 | 20 |
| أربعمية | — | 40 |
| بلوت | 2 | — |

citeturn0search0turn0search4

---

# 33. Project Multipliers

Baseline multiplication model:

```text
لا دبل = ×1
دبل    = ×2
ثري    = ×3
فور    = ×4
```

Projects are generally multiplier-sensitive.

بلوت is a special exception in the baseline model and remains:

```text
2 Qaid
```

rather than multiplying with the round multiplier.

Current references explicitly describe project multiplication while keeping بلوت at 2. citeturn0search0

---

# 34. Four-Hundred Under Multipliers

The Rule Profile must define exactly which multiplier states allow أربعمية.

A current published rules reference describes أربعمية as:

```text
Sun ×1 = 40
Sun ×2 = 80
```

and does not assign normal Hokm values. citeturn0search0

The implementation must use configuration rather than hard-coded assumptions.

---

# 35. Baloot Under Multipliers

Baseline:

```text
بلوت = 2
```

regardless of:

```text
دبل
ثري
فور
```

This must be represented explicitly:

```ts
multiplierEligible = false
```

rather than relying on a special-case subtraction after multiplication.

---

# 36. Doubling State

Recommended:

```ts
type MultiplierLevel =
  | "NORMAL"
  | "DOUBLE"
  | "TRIPLE"
  | "QUADRUPLE"
  | "COFFEE";
```

Numeric multiplier:

```text
NORMAL   = 1
DOUBLE   = 2
TRIPLE   = 3
QUADRUPLE = 4
```

Coffee is not simply:

```text
×5
```

It is a distinct match-result state and must be modeled separately.

---

# 37. Coffee

Coffee/coup-like terminal doubling behavior must be represented as a state, not a numeric multiplier.

Conceptually:

```ts
type DoublingState =
  | { level: "NORMAL" }
  | { level: "DOUBLE"; caller: TeamId }
  | { level: "TRIPLE"; caller: TeamId }
  | { level: "QUADRUPLE"; caller: TeamId }
  | { level: "COFFEE"; caller: TeamId };
```

The exact Coffee win condition is a Rule Profile decision.

---

# 38. Purchaser Success

The purchaser's team does not automatically receive the round score.

The engine must first determine:

```text
Did the purchaser succeed?
```

This is based on the final raw/qualified result defined by the Rule Profile.

Recommended:

```ts
resolvePurchaserOutcome(
  contract,
  rawScore,
  projectResult,
  doublingState,
  ruleProfile
)
```

---

# 39. Purchaser Comparison

The architecture should separate:

```text
raw team result
```

from:

```text
recorded Qaid
```

Conceptually:

```text
1. calculate card raw points
2. add last-trick raw bonus
3. resolve eligible projects
4. add valid project raw contribution
5. add valid Baloot raw contribution
6. compare purchaser vs opponent
7. determine success/failure
8. convert to Qaid
9. apply multiplier rules
10. update match score
```

The exact project raw contribution table must be frozen.

---

# 40. Failure / Qaid Transfer

When the purchaser fails, the Rule Profile may award the round's recorded Qaid to the opponent instead of splitting the score according to ordinary conversion.

This is a critical distinction.

Example pattern:

```text
Purchaser fails
→ purchaser receives 0 Qaid
→ opponent receives configured round Qaid
```

The exact values depend on:

- Sun/Hokm
- projects
- doubling
- kaboot
- special rules

Do not implement failure as:

```ts
normalConvert(purchaserRaw)
normalConvert(opponentRaw)
```

without checking the purchaser-failure rule.

---

# 41. Kaboot

Kaboot means one team wins all eight tricks.

Therefore:

```text
one team = 8 tricks
other team = 0 tricks
```

The Rule Profile may award special Qaid values.

A current public reference describes:

```text
Hokm Kaboot = 25
Sun Kaboot = 44
```

and notes that the value itself is not multiplied while projects follow their own multiplier rules. citeturn0search0

These values remain Draft until Rule Freeze.

---

# 42. Kaboot Project Treatment

When Kaboot occurs:

- the team winning all eight tricks receives the Kaboot round value
- the losing team's ordinary projects may be invalidated according to the Rule Profile
- winning team's eligible projects may still count
- بلوت handling remains separate
- multiplier behavior follows the Rule Profile

Do not automatically add both teams' projects to a Kaboot result.

---

# 43. Tie — Normal Hand

The Rule Profile must define what happens when the purchaser and opponent reach the same final raw comparison.

A current public Saudi-rule reference describes the ordinary tie as favoring the purchaser. citeturn0search0

This must be configured rather than assumed.

Recommended:

```ts
tiePolicy: "PURCHASER_WINS"
```

if that is the adopted Rule Profile.

---

# 44. Tie — Doubled Hand

A current published rule reference describes a special tie rule for a doubled hand:

```text
if raw scores tie,
the team that called the initial double loses
```

even if the sequence later becomes:

```text
DOUBLE → TRIPLE → QUADRUPLE
```

This is a high-impact rule and must be explicitly configured if adopted. citeturn0search0

Recommended state field:

```ts
initialDoublerTeamId?: TeamId;
```

Do not infer it from the last multiplier caller.

---

# 45. Qaid Conversion

The conversion from raw points to Qaid is contract-specific.

It MUST be implemented as a Rule Profile service:

```ts
convertRawToQaid(
  contract,
  rawPoints,
  ruleProfile
): number;
```

Do not write:

```ts
Math.floor(rawPoints / 5)
```

as a universal conversion.

---

# 46. Sun Conversion

A commonly used simplified Qaid representation for Sun is:

```text
raw points ÷ 5
```

with the relevant rounding/threshold rules.

However, purchaser success and project-adjusted outcomes must be resolved before the final Qaid is assigned.

Current scorekeeping references describe Sun as being divided by 5 for the normal score calculation. citeturn0search2

---

# 47. Hokm Conversion

A commonly used Qaid representation for Hokm is:

```text
raw points ÷ 10
```

with final-round and purchaser rules affecting the actual recorded result.

Current scorekeeping references describe Hokm as being divided by 10. citeturn0search2

The final Rule Profile must define exact rounding and purchaser-failure behavior.

---

# 48. Do Not Use Floating Point

Scoring must use integer arithmetic.

Bad:

```ts
raw / 5.0
```

followed by floating-point rounding.

Preferred:

```ts
integerDivisionWithExplicitRule(...)
```

or a lookup/table-based conversion.

All scoring outputs should be integers.

---

# 49. Score Components

Recommended final result:

```ts
interface RoundScore {
  readonly raw: {
    readonly cardPoints: Record<TeamId, number>;
    readonly lastTrickBonus: Record<TeamId, number>;
    readonly projects: Record<TeamId, number>;
    readonly baloot: Record<TeamId, number>;
    readonly total: Record<TeamId, number>;
  };

  readonly qayd: {
    readonly teamA: number;
    readonly teamB: number;
  };

  readonly purchaser: {
    readonly teamId: TeamId;
    readonly succeeded: boolean;
  };

  readonly multiplier: MultiplierLevel;

  readonly kaboot: boolean;
}
```

---

# 50. Scoring Pipeline

The complete scoring pipeline should be:

```text
TRICKS COMPLETE
      ↓
CARD POINTS
      ↓
LAST TRICK BONUS
      ↓
PROJECT DETECTION
      ↓
PROJECT ANNOUNCEMENT/VALIDATION
      ↓
PROJECT COMPARISON
      ↓
BALOOT VALIDATION
      ↓
RAW TOTAL
      ↓
PURCHASER SUCCESS
      ↓
KABOOT CHECK
      ↓
QAID CONVERSION
      ↓
MULTIPLIER APPLICATION
      ↓
ROUND SCORE
      ↓
MATCH SCORE
      ↓
MATCH END CHECK
```

---

# 51. Order Is Important

Do not reorder the pipeline casually.

For example:

```text
convert to Qaid
then determine purchaser success
```

can produce incorrect results.

The engine should determine the raw outcome first.

---

# 52. Project Priority vs Project Addition

There are two separate concepts:

### Project priority

Which team's project is recognized when projects compete.

### Project addition

How the recognized project contributes to scoring.

Do not implement:

```ts
winningProject = highestProject
score += winningProject.qayd
```

without also determining:

```text
raw contribution
multiplier eligibility
purchaser success impact
```

---

# 53. Project Announcement Failure

If a project was not announced/revealed according to the selected Rule Profile:

```text
project may not count
```

This is not necessarily equivalent to:

```text
player cheated
```

unless the rules explicitly impose a penalty.

The scoring engine should represent:

```ts
ProjectStatus =
  | "DETECTED"
  | "ANNOUNCED"
  | "VALIDATED"
  | "DISCARDED"
  | "FORFEITED"
```

---

# 54. Invalid Mئة / Project Claim

If a player claims a project they do not actually possess:

```text
invalid project
```

The Rule Profile must determine whether this causes:

- project removal
- round loss
- penalty
- disqualification
- another action

Do not invent the penalty in the UI.

---

# 55. Project Comparison Data

A project comparison object may contain:

```ts
interface ProjectComparisonKey {
  readonly projectType: ProjectType;
  readonly subtype?: string;
  readonly highestCardRank?: Rank;
  readonly sequenceLength?: number;
  readonly declarationOrder?: number;
  readonly seatPriority?: number;
}
```

This makes comparison deterministic.

---

# 56. Seat Priority

When two projects are otherwise identical, some rule sets use dealer-relative seat priority.

If adopted:

```text
first seat to dealer's right
→ next
→ opposite
→ dealer
```

The engine should calculate this through:

```ts
getProjectTiePriority(seat, dealerSeat)
```

not hard-code player IDs.

---

# 57. Doubling Architecture

Doubling should be its own domain state:

```ts
interface DoublingState {
  readonly level: MultiplierLevel;
  readonly initialDoublerTeamId?: TeamId;
  readonly history: readonly DoublingAction[];
}
```

Scoring consumes this state.

Bidding/Playing should not mutate score directly.

---

# 58. Doubling History

Recommended:

```ts
interface DoublingAction {
  readonly actionId: string;
  readonly teamId: TeamId;
  readonly action:
    | "DOUBLE"
    | "TRIPLE"
    | "QUADRUPLE"
    | "COFFEE";
  readonly stateVersion: number;
}
```

This supports:

- replay
- dispute resolution
- tie handling
- anti-cheat
- analytics

---

# 59. Multiplier Eligibility

Not every scoring component necessarily multiplies.

Recommended:

```ts
interface ScoreComponentRule {
  readonly multiplierEligible: boolean;
}
```

Examples in the baseline model:

```text
Sera       → yes
Fifty      → yes
Hundred    → yes
FourHundred → yes where allowed
Baloot     → no
Kaboot base value → no
```

The final Rule Profile controls exceptions.

---

# 60. Match Score

The match score is the accumulated Qaid:

```ts
interface MatchScore {
  readonly teamA: number;
  readonly teamB: number;
}
```

Every completed round produces:

```text
RoundScore
```

which is applied atomically to:

```text
MatchScore
```

---

# 61. Target Score

The project baseline uses:

```text
152
```

as the match target referenced by the initial Game Rules document.

However, the exact match-end condition must be reconciled with the final Rule Profile, especially when:

- both teams cross the target
- one team reaches the target during a round
- a round produces an unusually large score
- tie-break rules apply

The match target must be configuration, not a magic number.

---

# 62. Match End

Recommended:

```ts
evaluateMatchEnd(
  matchScore,
  ruleProfile
)
```

Possible result:

```ts
{
  status: "ONGOING"
}
```

or:

```ts
{
  status: "FINISHED",
  winningTeamId: TeamId
}
```

The scoring engine determines the result; the UI only displays it.

---

# 63. Both Teams Crossing Target

This is a critical edge case.

The final Rule Profile must define whether:

```text
Team A = 160
Team B = 158
```

ends immediately,

or whether a tie-break/round rule applies.

Do not infer this from generic "first to 152" logic.

---

# 64. Round Result Snapshot

After scoring, store a complete immutable snapshot:

```text
roundId
ruleProfileId
contract
purchaser
cardPoints
lastTrickBonus
projects
baloot
raw totals
purchaser success
kaboot
doubling
qayd awarded
match score before
match score after
```

This makes support and replay dramatically easier.

---

# 65. Replay

The replay system should reproduce the score from:

```text
initial state
+
actions
+
Rule Profile
```

The replay validator should independently verify:

```text
raw totals
project validity
purchaser success
qayd
match score
```

A client-provided final score must never be accepted as authoritative.

---

# 66. Server Authority

The client may display:

```text
estimated score
```

for UX purposes.

The server decides:

```text
final score
```

The client must never send:

```json
{
  "teamA": 12,
  "teamB": 4
}
```

as an authoritative scoring result.

---

# 67. Scoring Event

Conceptual:

```ts
interface RoundScoredEvent {
  readonly roundId: string;
  readonly rawScore: RoundRawScore;
  readonly qayd: Record<TeamId, number>;
  readonly purchaserSucceeded: boolean;
  readonly kaboot: boolean;
  readonly multiplier: MultiplierLevel;
  readonly matchScoreAfter: MatchScore;
}
```

The exact protocol schema belongs to the Game Protocol document.

---

# 68. Error Conditions

Recommended stable errors:

```text
SCORING_NOT_READY
INVALID_TRICK_TOTAL
INVALID_CARD_POINTS
INVALID_PROJECT
PROJECT_NOT_ELIGIBLE
PROJECT_NOT_REVEALED
INVALID_MULTIPLIER
INVALID_KABOOT
INVALID_PURCHASER_RESULT
INVALID_SCORE_CONVERSION
INVALID_MATCH_STATE
```

---

# 69. Scoring Invariants

At every valid scoring state:

1. Every card belongs to exactly one completed trick.
2. Every trick has exactly four cards.
3. There are exactly eight completed tricks.
4. Card totals equal the configured contract total.
5. Last-trick bonus is awarded exactly once.
6. A project cannot be awarded twice.
7. Baloot cannot be awarded twice.
8. Multiplier is applied only to eligible components.
9. Purchaser success is evaluated before final Qaid assignment.
10. Round Qaid is immutable after commit.
11. Match score changes atomically.
12. Replay reproduces the same result.

---

# 70. Card-Point Tests

Minimum tests:

### Sun

```text
A = 11
10 = 10
K = 4
Q = 3
J = 2
9/8/7 = 0
```

### Hokm

```text
J = 20
9 = 14
A = 11
10 = 10
K = 4
Q = 3
8/7 = 0
```

Every suit must be tested.

---

# 71. Project Tests

### سرا

```text
7-8-9 same suit → valid
```

### خمسين

```text
7-8-9-10 same suit → valid
```

### مية

Test every accepted subtype.

### أربعمية

```text
A♣ A♦ A♥ A♠ under Sun → valid
```

### بلوت

```text
K(trump) + Q(trump) → valid
```

Also test invalid contracts.

---

# 72. Project Name Test

The localization/domain test should explicitly assert:

```text
Arabic display = "سرا"
```

and never:

```text
"سيرة"
```

This prevents accidental reintroduction of the naming error.

---

# 73. Multiplication Tests

Minimum:

```text
NORMAL
DOUBLE
TRIPLE
QUADRUPLE
COFFEE
```

Test:

```text
سرا
خمسين
مية
أربعمية
بلوت
```

independently.

Verify that:

```text
بلوت
```

does not accidentally multiply.

---

# 74. Purchaser Success Tests

Test:

```text
purchaser wins raw comparison
purchaser loses raw comparison
purchaser ties
purchaser ties under double
purchaser with project
opponent with project
purchaser with Baloot
Kaboot
```

---

# 75. Property-Based Tests

### Conservation

The sum of all raw card points awarded across teams equals the configured card total.

### Project uniqueness

A project cannot be counted twice.

### Determinism

Same input:

```text
same scoring result
```

### Replay

Same trick/project/multiplier history:

```text
same RoundScore
```

### Match accumulation

Applying the same sequence of round scores produces the same final match score.

---

# 76. Golden Fixtures

Create canonical fixtures for:

1. Sun normal hand.
2. Hokm normal hand.
3. Sun + سرا.
4. Hokm + سرا.
5. Sun + خمسين.
6. Hokm + خمسين.
7. Sun + مية.
8. Hokm + مية.
9. Sun + أربعمية.
10. Hokm + بلوت.
11. Purchaser failure.
12. Purchaser success.
13. Kaboot.
14. Double.
15. Triple.
16. Four.
17. Coffee.
18. Tie normal.
19. Tie after initial double.

Every fixture must store expected:

```text
raw score
project result
purchaser result
qayd
match score
```

---

# 77. Open Decisions

The following MUST be finalized before scoring is frozen:

1. Official Rule Profile.
2. Exact raw project values used in purchaser success comparison.
3. Exact project comparison hierarchy.
4. Exact project overlap rules.
5. Exact project announcement timing.
6. Exact reveal timing.
7. Exact invalid-project penalty.
8. Exact بلوت declaration timing.
9. Exact بلوت raw/Qaid treatment.
10. Exact multiplier rules.
11. Exact Coffee behavior.
12. Exact Kaboot values.
13. Exact Kaboot project behavior.
14. Exact tie behavior.
15. Exact tie-after-double behavior.
16. Exact Sun conversion.
17. Exact Hokm conversion.
18. Exact rounding rules.
19. Exact match target and match-end condition.
20. Exact behavior when both teams cross the target.

---

# 78. Rule Freeze Gate

Before implementation:

- [ ] Project name is frozen as **سرا**.
- [ ] Card raw points frozen.
- [ ] Last-trick bonus frozen.
- [ ] Project definitions frozen.
- [ ] Project Qaid values frozen.
- [ ] Project raw values frozen.
- [ ] Project priority frozen.
- [ ] Project overlap frozen.
- [ ] Project declaration/reveal frozen.
- [ ] بلوت timing frozen.
- [ ] Doubling frozen.
- [ ] Multiplier eligibility frozen.
- [ ] Kaboot frozen.
- [ ] Purchaser success frozen.
- [ ] Tie behavior frozen.
- [ ] Qaid conversion frozen.
- [ ] Match-end rules frozen.

---

# 79. Implementation Checklist

### Domain

- [ ] `RoundRawScore`
- [ ] `RoundQaidScore`
- [ ] `ProjectType`
- [ ] `ProjectCandidate`
- [ ] `ProjectResult`
- [ ] `DoublingState`
- [ ] `resolveProjects`
- [ ] `calculateRawScore`
- [ ] `resolvePurchaserOutcome`
- [ ] `convertToQaid`
- [ ] `applyMultiplier`
- [ ] `resolveKaboot`
- [ ] `evaluateMatchEnd`
- [ ] `scoreRound`

### Server

- [ ] authoritative scoring
- [ ] atomic score commit
- [ ] immutable round snapshot
- [ ] replay validation
- [ ] idempotency
- [ ] event publication

### Client

- [ ] score display
- [ ] project display
- [ ] multiplier display
- [ ] round summary
- [ ] match score
- [ ] Arabic localization

### Tests

- [ ] card points
- [ ] سرا
- [ ] خمسين
- [ ] مية
- [ ] أربعمية
- [ ] بلوت
- [ ] project comparison
- [ ] purchaser success
- [ ] Qaid conversion
- [ ] double/triple/four
- [ ] Coffee
- [ ] Kaboot
- [ ] ties
- [ ] replay
- [ ] property-based tests

---

# 80. Relationship to Other Documents

```text
01-game-rules.md
       ↓
02-card-system.md
       ↓
03-dealing.md
       ↓
04-bidding.md
       ↓
05-playing.md
       ↓
06-scoring.md
       ↓
07-game-state.md
       ↓
08-actions.md
       ↓
09-state-transitions.md
```

Playing produces:

```text
8 completed tricks
```

Scoring consumes those tricks and produces:

```text
RoundScore
```

The Game State system then commits:

```text
RoundScore
+
MatchScore
```

and determines whether the match continues.

---

# 81. Final Engineering Rule

**Never reduce Baloot scoring to one integer.**

The engine must preserve the chain:

```text
Card Points
    ↓
Last Trick
    ↓
Projects
    ↓
بلوت
    ↓
Raw Team Totals
    ↓
Purchaser Success
    ↓
Qaid Conversion
    ↓
Multiplier
    ↓
Round Score
    ↓
Match Score
```

Each stage must be independently testable.

And the project name is permanently:

```text
سرا
```

not:

```text
سيرة
```

---

## Document Status

**Current status:** Draft for Review — NOT FROZEN

This document uses current public Baloot references as research inputs. Some scoring, project, doubling, and tie rules vary between published descriptions; therefore the final implementation must use one explicitly adopted Rule Profile rather than mixing variants. citeturn0search0turn0search2turn0search4

Final approval should occur only after the complete foundation specification has been reviewed together.
