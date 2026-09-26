# Phase 20-B — Professional Bidding UX & Human Gameplay Flow

## Status
Implementation slice B1 is in progress on `phase-20b-bidding-ux`.

## Forensic audit baseline

Reviewed the playable client/UI at Phase 20-A head `48a48f4cc2c9b36349aaba3c5ddb50b758dad971`.

### Existing strengths
- Human bidding already receives authoritative `legalBiddingActions` from the game engine.
- AI bidding uses the production `chooseAuthoritativeAIAction` path.
- Bidding history is public and carries action id, turn number, seat, phase, and state version.
- The exposed card is visible during bidding.
- Contract completion and cancellation are resolved through authoritative engine/protocol paths.
- The client already blocks input while the completed-trick presentation barrier is active.

### UX gaps identified
1. Bidding controls were presented as a flat button dock with little hierarchy between contract choices, Hokum suit selection, and PASS.
2. The current bidding phase and exposed-card context were present elsewhere on the table but not colocated with the decision controls.
3. Bidding history was visually separated from the action controls, increasing the amount of visual scanning required before making a decision.
4. Action buttons had basic accessibility metadata but no explicit decision-oriented label/hint.
5. The bidding panel did not clearly communicate that only currently legal engine-provided actions are being offered.

## B1 implementation

The new bidding decision panel:
- groups legal contract actions separately from Hokum suit selection;
- keeps PASS visually separated as the explicit decline action;
- shows the current bidding phase;
- shows the exposed card in compact form during the second round;
- shows the latest public bidding decisions directly beneath the controls;
- uses only the `legalActions` supplied by the authoritative client state;
- preserves the existing callback/action IDs and does not alter bidding rules;
- adds accessibility labels/hints for decision controls;
- preserves the existing dynamic suit ordering and display-only hand sorting.

## Authority invariants

This slice must not:
- calculate bidding legality in UI;
- infer or override AI decisions;
- change contract thresholds;
- change bidding state transitions;
- mutate cards/hands;
- introduce client-side scoring or rule duplication.

The UI is presentation/orchestration only. All actions continue through the existing client dispatch path into authoritative engine/protocol functions.

## Acceptance criteria

### B1 — Decision panel
- [x] Current phase is visible in the bidding panel.
- [x] Exposed card is visible in second-round context.
- [x] Only engine-provided legal actions are rendered.
- [x] Hokum suit choices are rendered only when `BUY_HOKUM` is legal.
- [x] PASS remains available only when legal and is visually separated.
- [x] Recent public bidding history is visible beside the decision flow.
- [x] Accessibility labels/hints identify the selected bidding action.
- [x] No gameplay authority moved into UI.

### Verification gate
Run after the slice:
- `pnpm install --frozen-lockfile`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- mobile playable build/typecheck
- deterministic simulator regression
- Human vs 3 AI smoke test covering first-round bidding, second-round bidding, contract selection, and cancellation/redeal.

## Next slices

### B2 — Bidding state communication
Make turn ownership, dealer position, round transition, and contract-selection feedback explicit without changing engine semantics.

### B3 — Human gameplay flow
Harden the transition from bidding → completion deal → trick 1, including contextual contract announcement and clear input ownership.

### B4 — Gameplay feedback
Unify legal-card highlighting, Baloot/project feedback, trick barrier messaging, and action feedback into one consistent interaction language.

### B5 — Manual acceptance
Run a complete Human vs 3 AI match and record the result against the Phase 20 Definition of Done.
