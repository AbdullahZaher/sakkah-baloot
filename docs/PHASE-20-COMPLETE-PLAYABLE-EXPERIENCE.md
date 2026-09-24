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

### Slice D — Round lifecycle — IN PROGRESS
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
- [ ] Final-trick presentation completes before round scoring is surfaced.
- [ ] Round result is understandable.
- [ ] Next round can be started.
- [ ] Match completion is understandable.
- [x] AI never advances through a presentation barrier.
- [x] UI contains no duplicated game rules.
- [x] Client tests pass.
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