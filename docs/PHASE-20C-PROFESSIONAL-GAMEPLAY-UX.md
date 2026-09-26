# Phase 20-C: Professional Gameplay UX & Table Experience — Forensic Audit & Implementation Plan

## 1. Current State & Baseline
- **Authoritative Verified HEAD:** `d7352f4` (on branch `phase-20b-bidding-ux`, PR #21).
- **CI Status:** 19/19 GitHub Actions checks GREEN.
- **Engine/Protocol/AI/Client/Server/Simulator Tests:** 209/209 unit tests PASS.
- **Simulation Gate:** 10,000 full AI matches PASS with 0 illegal actions, 0 failures, digest `2cf56662`.
- **Mobile Playable Experience:** Clean build & web export on Expo SDK 57 / React 19.2.3.

---

## 2. Existing Implementation Analysis
The current codebase has solid foundational gameplay mechanics and bidding UX from Phase 20-A & Phase 20-B:
- **Bidding Decision Flow:** `BiddingPanel.tsx` renders engine-projected options (`BUY_SUN`, `BUY_HOKUM_EXPOSED`, `BUY_ASHKAL`, `BUY_HOKUM` with non-exposed suits, `DECLARE_KASHO`, `PASS`), single-submit guard, and RTL Arabic styling.
- **Trick Arena:** 4-compass layout in `GameTable.tsx` with seat avatars, active turn highlights, and played card display.
- **Trick Freeze Barrier:** Authoritative 2-second completed trick presentation hold (`completedTrickPresentation`), preventing human card dispatch and AI progression until acknowledged.
- **Scoring & Projects:** Trick 1 project declaration panel, persistent declared project tags, Baloot notification banner, and round score breakdown recap dialog.

---

## 3. Existing Branches & PRs Audit
- `main` (`5645b3a`): Merged baseline through Phase 17/18.
- `phase-20a-bidding-intelligence` (`48a48f4`, PR #19): Authoritative bidding AI and observation models (CI Green).
- `phase-20b-bidding-ux` (`d7352f4`, PR #21): Bidding action projection, `BiddingPanel`, Arabic RTL bidding flow (CI Green).
- `phase-20b-professional-bidding-ux` (PR #20): Older pre-remediation exploration branch (superseded by #21).
- **Phase 20-C Branches:** No existing `phase-20c` branches or pull requests currently exist.

---

## 4. UX Gaps & Enhancement Opportunities

### Gap 1: Card Play Fan & Sizing Rhythm
- When hand size diminishes from 8 to 1 cards, the fanning angle and spread currently recalculate dynamically, but card touch targets on mobile can feel small on 320-375pt wide devices.
- Cards elevated on legal highlight (`translateY: -10`) could benefit from subtle haptic/visual glow enhancements.

### Gap 2: AI Turn Pacing & Thinking Rhythm
- AI players currently dispatch synchronously during `runAI()`. While deterministic and instant, a small configurable pacing/presentation barrier (or thinking pulse indicator) makes trick-play readable for humans rather than instantly dumping 3 cards onto the table.

### Gap 3: Round Result Dialog & Match Over Transitions
- The `RoundResult` dialog currently overlays the table immediately after the final trick freeze clears.
- It displays Abnat, Projects, Baloot, and Final Qaid, but can be visually polished with clearer distinction between *Lana* (green/gold) and *Lahum* (ruby/slate) and a prominent victory badge for match completion.

### Gap 4: Mobile Screen Real Estate & Project Bar Squeeze
- On smaller mobile viewports, having the top HUD, declared projects chip list, Baloot banner, and 4-seat trick arena simultaneously active can cause vertical crowding.
- Layout needs guaranteed minimum height budgeting so trick cards never overlap player avatars or the South card fan.

---

## 5. Authority Constraints
- **Card Legality:** Exclusively computed by `@sakkah-baloot/game-engine` `getLegalMoves()`. UI must never filter or validate card rules.
- **Trick Resolution:** Exclusively computed by `@sakkah-baloot/game-engine` `resolveTrick()`. UI only displays the authoritative winner from `CompletedTrick.winnerSeat`.
- **Round & Match Scoring:** Exclusively computed by `@sakkah-baloot/game-engine` `scoreCompletedRound()`. UI only renders the breakdown.
- **Project & Baloot Rules:** Exclusively detected and validated by engine `detectProjects()`, `resolveProjects()`, and `canDeclareBaloot()`.
- **Lifecycle Phases:** Exclusively driven by `MatchState` and `RoundState`.

---

## 6. Information Boundaries
- **Human Hand Only:** Snapshot only contains full card data for `humanSeat`.
- **AI Hands:** Exposed strictly as remaining card count `cardCountForSeat(game, seat)` — card ranks and suits are never leaked.
- **Undealt Deck:** Hidden in engine deal state; never exposed in public client preview.
- **AI Reasoning / MCTS / Evaluation Trees:** Kept strictly inside `@sakkah-baloot/game-ai`; never sent to UI snapshot.

---

## 7. Proposed Phase 20-C Slices

### Slice 20-C1: Trick Arena Polish & Spatial Geometry
- Refine 4-compass card layout with consistent proportions across mobile screens (standard/compact breakpoints).
- Ensure trick slots maintain clear visual association with player seats (`NORTH` top, `EAST` right, `WEST` left, `SOUTH` bottom).
- Ensure winning card glow (`#F59E0B`, gold border) and crown pill are unmistakably visible during the 2-second hold.

### Slice 20-C2: Card Interaction & Legal Feedback
- Polish `CardButton` elevation, fanning angles, and touch targets ($\ge 44 \times 44$ pt).
- Ensure distinct visual states: Legal (elevated + gold border + full opacity), Illegal (grounded + dimmed 45% opacity + disabled touch), Pressed (active feedback).
- Implement single-tap play with anti-spam tap locking during card play dispatch.

### Slice 20-C3: Turn & Thinking Presentation
- Refine South turn ribbon and AI seat turn badges.
- When an AI seat is active, display clear "يفكّر..." (Thinking) pulse.
- When human turn is active, display clear action ribbon ("دورك — اختر ورقة").

### Slice 20-C4: HUD, Projects & Baloot Display Refinement
- Maintain top HUD for contract (`حكم [Suit]` / `صن` / `أشكال`), buyer name, and trick counter (`الأكلة X من 8`).
- Clean inline chips for declared projects and Baloot banner without obscuring the central trick arena on compact mobile viewports.

### Slice 20-C5: Round Result & Match Victory Dialog
- Refine `RoundResult.tsx` breakdown card:
  - Abnat (أبناط) row
  - Project Qaid (مشاريع) row
  - Baloot Qaid (بلوت) row
  - Final Round Qaid (قيد الجولة)
  - Match Total (مجموع الصكة)
  - Kaboot / Reverse Kaboot badges
  - Match Completion announcement (`انتهت الصكة — فاز فريق لنا!`)
  - "الجولة التالية" / "توزيع إضافي" button with touch target $\ge 48$ pt.

### Slice 20-C6: Mobile Responsiveness, RTL & Accessibility
- Verify touch targets and spacing across portrait and landscape viewports.
- Verify full Arabic RTL layout orientation and screen reader accessibility labels (`accessibilityLabel`, `accessibilityHint`).

### Slice 20-C7: Full Workspace Verification Gate
- Monorepo build and typecheck (`pnpm build`, `pnpm typecheck`).
- 6-package test verification (`pnpm -r test`).
- 10,000-match simulation gate (`SIMULATION_GAMES=10000`).
- Mobile web export (`pnpm --filter @sakkah-baloot/mobile build`).
- End-to-end Human vs 3 AI verification.

---

## 8. Acceptance Criteria
1. **Rule Purity:** 0 game logic or card rules duplicated in UI.
2. **Trick Flow:** Every trick displays 4 played cards with seat attribution, holds for 2 seconds on trick completion with clear winner glow, and clears before next trick.
3. **Turn Clarity:** Active seat is unambiguously highlighted at all times.
4. **Information Security:** AI hidden cards and search trees remain 100% unexposed.
5. **Round & Match Completion:** All round scores and match ends present exact engine-calculated Qaid breakdown with clear restart/continue buttons.
6. **Performance & Stability:** 10,000 AI matches run with 0 illegal moves and 0 unhandled exceptions.

---

## 9. Test & Verification Strategy
- **Unit Tests:** Package tests in `game-engine`, `game-protocol`, `game-ai`, `game-client`, `game-server`, `game-simulator`.
- **Typecheck:** `pnpm typecheck` passing across all 9 workspaces with 0 errors.
- **Simulator Gate:** 10,000-match deterministic batch validation passing with 0 illegal actions.
- **Mobile Build:** `expo export --platform web` producing clean static bundle without errors.
- **Human vs 3 AI Smoke Test:** Manual and scripted CLI interaction from Deal $\to$ Bidding $\to$ 8 Tricks $\to$ Round Scoring $\to$ Next Round.

---

## 10. Risks & Mitigations
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Mobile viewport crowding | Overlapping HUD and trick cards | Dynamic vertical budgeting & compact card scaling on small screens |
| Rapid tap double play | Client state desync / illegal action error | Single-dispatch lock during action execution |
| Information leakage in props | AI card exposure | Strict type separation: `playerHand` only for South; other seats receive only `cardCount` |

---

## 11. Definition of Done
- All 7 slices reviewed and implemented.
- `pnpm build` and `pnpm typecheck` pass with 0 errors.
- All 6 package test suites pass (209+ tests).
- 10,000 full match simulation gate passes with 0 illegal actions.
- PR opened with clean git history and full green remote CI checks.
