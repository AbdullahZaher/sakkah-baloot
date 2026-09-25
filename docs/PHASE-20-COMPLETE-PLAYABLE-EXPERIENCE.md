# Phase 20 — Complete Playable Experience

## Purpose
Phase 20 moves Sakkah Baloot from a technically playable local Human-vs-3-AI prototype into a complete, readable, teachable, and repeatable gameplay experience.

Core rule: gameplay correctness and clarity come before social, economy, or cosmetic features.

## Research basis — September 2026

External research reviewed current Baloot products and public rule references.

### Observed product patterns
- VIP Baloot advertises online play with friends, private/custom leagues, multiple player levels, text/voice chat, friends, gifts, profiles, leaderboards, customization, daily/weekly challenges, beginner education/training rounds, AI, and a direct Play Now flow.
- بلوت الأصدقاء advertises public tables, private sessions with invite codes, seat reservation, in-table chat, spectator support, notifications, and recent fixes around scoring/projects/multipliers, round-result announcements, card clarity, turn organization, thinking time, joining by code, and stability.
- Baloot AI advertises Arabic-first UI, dark/light themes, animations, statistics, recent match history, win rate, player levels, ranking tiers, smart hints, tutorials, daily tips, and screen-reader accessibility.
- جلسة بلوت advertises online multiplayer, voice chat, public chat, competitive levels, join-table flow, cross-platform play, and leaderboards.
- بلوت المحترفين advertises real-time chat, difficulty levels, tournaments, leaderboards, and private rooms.
- Baloot Majlis demonstrates host + QR/code joining, private hands, partnership play, declarations, built-in scoring, Qaid challenge, and bots filling empty seats.
- Public rule references emphasize four players, eight tricks per deal, Sun/Hokum distinctions, and fixed rule profiles before a Sakka. These references inform education and UX only; the repository engine remains the canonical rules authority.

## Product conclusions
1. Human bidding must be obvious and understandable.
2. Human card selection must clearly communicate legal and unavailable choices.
3. Card play must have strong feedback and no accidental double actions.
4. Turn ownership must always be obvious.
5. Contract, projects, Baloot, trick winner, and score changes must be visible without hiding the table.
6. Round and Sakka lifecycle must be easy to follow.
7. The game must be teachable to a new player.
8. The same gameplay surface must evolve from local AI to authoritative multiplayer without a second UI architecture.

## Phase structure

### 20.1 — Complete Human Gameplay
- Bidding action presentation and public bid history.
- Acting-seat indicator and exposed-card context.
- Contract purchase announcement.
- Human legal-card highlighting and unavailable-card state.
- Selected-card state and explicit play feedback.
- Authoritative card legality.
- Human Baloot declaration through engine authority.
- Project declaration feedback.
- AI response and thinking visibility.
- Human/AI turn transitions.
- End-of-trick presentation barrier.
- Round completion, next-round transition, match completion, and rematch-ready lifecycle.

Acceptance: a human can complete an entire Sakka against three AI players without developer intervention; every human action is authoritative; no action can execute twice from one interaction; AI cannot advance during the completed-trick presentation barrier; the user always knows whose turn it is and the active contract.

### 20.2 — Professional Table UX
- Player pods and team identity.
- Hand layout and trick arena.
- Contract HUD, project chips, Baloot announcement, winner feedback, score HUD.
- Responsive mobile/tablet/web layouts.
- Accessibility-safe visual states.

Acceptance: four played cards remain visible during the authoritative 2-second presentation window; winner is unambiguous; card states remain readable on small screens; important states do not rely only on color.

### 20.3 — Gameplay Feedback
- Deal animation.
- Card movement.
- Bid/contract announcement.
- Project and Baloot announcement.
- Trick winner animation.
- Score transition.
- Round result animation.
- Haptic/sound hooks.

Animations are presentation only and may not mutate authoritative state.

### 20.4 — Round and Match Lifecycle UX
- Round result and score breakdown.
- Next round and match target.
- Match completion and rematch.
- Exit table.
- Reconnect/restore hooks.
- AFK/timeout hooks.

### 20.5 — Learn and Improve
- Interactive tutorial.
- Training match.
- Legal-move explanations.
- Smart hints backed by game AI.
- Beginner mode.
- Rules reference.
- Contextual help.

Hints must be produced by game-AI/engine-compatible observation, not UI-specific strategy rules.

### 20.6 — Replay and Spectator
- Match history.
- Replay timeline.
- Trick-by-trick replay.
- Pause/resume and step forward.
- Spectator-safe public state.
- No private-hand leakage.

Reuse the existing protocol architecture rather than introducing a second replay model.

### 20.7 — Social / Multiplayer
- Public matchmaking.
- Private rooms and invite code.
- Seat reservation.
- Friends.
- In-table text chat.
- Quick reactions.
- Voice boundary.
- Reconnect.
- Spectator mode.

Start this only after core local gameplay is stable.

### 20.8 — Competitive / Personalization
- Profile, statistics, history, rating, leaderboards.
- Ranked mode and tournaments.
- Card backs, table themes, accessibility settings.

## Architecture constraints

### Rules authority
The game engine remains the sole authority for card identity, dealing, legal moves, bidding legality, trick winner, projects, Baloot, scoring, round/match completion, and invariants.

The UI must never implement a second copy of these rules.

### Client orchestration
The game client may coordinate human input, AI invocation, transient presentation barriers, local session state, protocol projection, and UI-facing snapshots.

### Protocol
The game protocol remains authoritative for public event ordering, state versions, event identity, and replayable public transitions.

### Server
The game server remains the future authority for multiplayer command validation, room/session lifecycle, concurrency, idempotency, reconnect, persistence, and authoritative AI seating.

## Phase 20.1 implementation slices

### Slice A — Bidding UX
- Bid history model/view.
- Acting-seat emphasis.
- Exposed-card context.
- Legal action filtering.
- Contract-selection announcement.
- Transition into PLAYING.
- Tests for all currently supported bidding branches.

### Slice B — Card interaction — COMPLETE
- Legal/unavailable card states.
- Press-state feedback on legal cards.
- Selected card state.
- Safe single dispatch.
- Explicit play affordance where needed.
- Authoritative error feedback.
- No interaction during trick presentation.
- Tests for legal, illegal, and duplicate interaction.

### Slice C — Turn flow — COMPLETE
- Thinking state.
- AI action feedback.
- Clean human return.
- Turn indicator consistency.
- No stale legal actions.
- No AI progression during presentation.
- Tests for human and AI transitions.

### Slice D — Round lifecycle — COMPLETE
- Final-trick presentation.
- Round result.
- Score breakdown.
- Next round.
- Match completion.
- Rematch-ready state.
- Tests for ordinary round, match-winning round, and tie/extra-deal behavior supported by the engine.

### Slice E — Playtest hardening
- Deterministic full-match tests.
- Repeated matches with multiple seeds.
- No-illegal-action gate.
- Mobile build.
- Workspace typecheck.
- Manual gameplay verification.

## Definition of done for Phase 20.1
- [x] Human can bid.
- [x] Human can play every legal card.
- [x] Illegal cards cannot be played.
- [x] Projects can be declared when legal.
- [x] Baloot declaration is engine-authoritative.
- [x] All four cards remain visible during the completed-trick presentation window.
- [x] The next trick cannot start before the presentation window ends.
- [x] Final-trick presentation completes before round scoring is surfaced.
- [x] Round result is understandable.
- [x] Next round can be started.
- [x] Match completion is understandable.
- [x] AI never advances through a presentation barrier.
- [x] UI contains no duplicated game rules.
- [x] Client tests pass.
  - 15 game-client tests pass, including multi-round lifecycle and terminal `advanceRound()` idempotence.
- [x] Workspace typecheck passes.
- [x] Mobile playable build passes.
- [ ] A complete Human-vs-3-AI match has been manually played.
- [ ] Implementation is submitted as a reviewable PR and is not merged automatically.

## Execution policy
Start from the latest main. Create focused branches/PRs for coherent gameplay slices. Avoid mixed commits.

Every slice follows: inspect → implement → tests → typecheck → build → manual play → forensic review → PR.

Do not add social, economy, or cosmetic features to 20.1 unless required to unblock gameplay.

If an authoritative capability is missing, add the smallest engine API required and add an authority-boundary test.

## Research sources
- Apple App Store — VIP Baloot
- Apple App Store — بلوت الأصدقاء
- Google Play — Baloot AI
- Apple App Store — جلسة بلوت
- Apple App Store — بلوت المحترفين
- Apple App Store — تربيعة بلوت
- Google Play — تربيعة بلوت
- Apple App Store — Baloot Majlis
- ElBlot — How to Play
- ElBlot — Rulebook

---

## Slice — Deal Randomization & Hand Presentation

### Problem

The playable game dealt the same cards to the same players on every session. The human hand was also displayed in arbitrary deal-order rather than by suit.

**Root cause:** `createLocalHumanVsAISession` defaulted `seed` to the hard-coded string `"sakkah-local"`. The client's `createRound` helper then derived a fully deterministic RNG from `createSeededRandom("sakkah-local:round:1")`, producing identical hands on every browser session.

Additionally, `GameTableScreen` hard-coded `seed: "local-human-vs-ai"`, making even the session matchId identical between launches.

### Architecture

The deal engine already accepted a `RandomSource` injection interface. The fix is minimal: add a `createFreshRandom()` backed by `Math.random` and route production callers through it.

#### Production gameplay
- `createLocalHumanVsAISession()` with no `seed` → `createFreshRandom()` → different deal each launch
- `matchId` includes `Date.now()` + random suffix to guarantee a unique identifier even if two tabs open simultaneously
- `GameTableScreen` passes no `seed` — fresh random is the default

#### Deterministic tests / simulator
- All tests pass an explicit `seed` string (e.g. `seed: "ui-playable-test"`) → `createSeededRandom(seed)` → reproducible deal
- The 10,000-match simulator gate remains fully deterministic
- Server (`game-server`) uses its own seed derived from `matchId` for authorized replay

### Hand Presentation Ordering

A `sortHandForDisplay(hand)` helper is implemented in `packages/game-client/src/local-human-vs-ai.ts` and re-exported from the client index.

**Suit order:** `SPADES → HEARTS → DIAMONDS → CLUBS`  
**Rank order within each suit:** `A → K → Q → J → 10 → 9 → 8 → 7` (high-to-low)

`sortHandForDisplay` creates a **sorted copy** via `[...hand].sort(...)`. The authoritative hand array is never mutated. Card identity (`card.id`) is used for all dispatch calls.

### Separation: display order ≠ game-rule order

| Context | Ordering |
|---|---|
| `sortHandForDisplay` | High-to-low, SHDC — **display only** |
| `cardStrength()` | SUN_ORDER / HOKUM_ORDER — **engine authority** |
| `compareCards()` | Trump/led-suit rules — **engine authority** |
| `getLegalMoves()` | Engine legality — **engine authority** |
| AI hand | Never sorted for display — authoritative only |

### Validation

**Tests added:**
- Engine `Test A–F` (6 tests): determinism, different-seed divergence, 10-deal uniqueness, 32-card integrity, completion deal integrity, redeal freshness
- Client: same-seed determinism, different-seed divergence, 5-session uniqueness, suit/rank sort correctness, sort-is-copy, card ID dispatch through sort, round-transition freshness (7 tests)

**Runtime verification (seeded, 5 sessions):**
```
Deal #1 (South): KS 10S  7H  QD JD 9D 10C 7C
Deal #2 (South): JS JH   7H  AD QD JD  JC 9C
Deal #3 (South): QS JS  10S  7S 9H 7D 10C 7C
Deal #4 (South): QH 9H   8H  QD 10D 7D  AC 7C
Deal #5 (South): 10S AH  QH 10H 9H    AC 10C 9C
Unique: 5/5 — PASS ✅
```

**Production no-seed integration verification:**

`createLocalHumanVsAISession({ humanSeat: "SOUTH" })` — no seed, exact GameTableScreen call.
10 independent sessions → 10 distinct SOUTH hands (verified by `scripts/verify-production-no-seed.mjs`):

```
Session # 1: [AS QS AH AD 10D QC 9C 8C]
Session # 2: [9S 8S 7S KH QH 8H 9C 7C]
Session # 3: [AS JS QH AD 9D 7D KC 8C]
Session # 4: [AS 9S 8S KH 10H 9D 8D 9C]
Session # 5: [9S AH KH 9H JD 8D AC KC]
Session # 6: [AS 10S JH 8H 7D KC QC 10C]
Session # 7: [AS KS 10S 7S QH 9D 7D 8C]
Session # 8: [AS JS 10S 9S 7H AD JD QC]
Session # 9: [QS 8S AH 10H 8D 7D AC KC]
Session #10: [KS 9S 8S AD 8D 7D JC 10C]

Assertions:
✅ [1] All 10 hands are distinct (10/10 unique)
✅ [2] All 10 hands have valid card count (all returned 8 — post-completion deal)
✅ [3] No duplicate card IDs in any hand
✅ [4] Session uniqueness proved by distinct hands
✅ [5] sortHandForDisplay returns a new array (no reference mutation)
✅ [6] Suit order: SPADES → HEARTS → DIAMONDS → CLUBS
✅ [7] Rank order within suit: A K Q J 10 9 8 7
✅ [8] All card IDs present and unchanged after sort
✅ [9] GameTableScreen call site confirmed: no 'seed:' property
```

**Test totals after slice:**
| Package | Tests | Pass |
|---|---|---|
| `game-engine` | 61 | 61 |
| `game-client` | 22 | 22 |
| `game-simulator` | 11 | 11 |
| `game-server` | 34 | 34 |
| **Total** | **128** | **128** |