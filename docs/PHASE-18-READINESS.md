# صكّة بلوت — Phase 18 Readiness Certificate

**Phase:** 18 — Competitive AI & Single-Player Match  
**Branch:** `phase-18-competitive-ai`  
**Baseline:** `main` after Phase 17  
**Status:** DOCUMENTATION / ARCHITECTURE PLANNING — IMPLEMENTATION NOT AUTHORIZED

## 1. Purpose

Phase 18 proves that the complete game is playable by one human player against three computer-controlled players without violating the canonical game rules or leaking hidden information.

The phase is deliberately positioned before the authoritative network/server phase.

The target runtime is:

`Human Player + AI + AI + AI -> complete match`

The AI must use the same authoritative game engine as the human player and must not introduce a second rules implementation.

## 2. Primary Goal

Produce a production-oriented competitive AI foundation capable of:

- observing only information available to its seat;
- making bidding decisions;
- evaluating and declaring eligible projects;
- evaluating and declaring Baloot when legal;
- selecting legal card plays;
- reasoning about partner and opponents;
- reasoning under hidden information;
- searching plausible information sets;
- solving sufficiently small endgames exactly or near-exactly;
- completing full matches deterministically when supplied with deterministic seeds;
- running large AI-vs-AI simulation batches.

## 3. Non-Goals

Phase 18 does not implement:

- WebSocket networking;
- Supabase/PostgreSQL persistence;
- Redis;
- matchmaking;
- authentication;
- production server hosting;
- client-server transport;
- online multiplayer;
- neural-network training as a prerequisite;
- changing canonical Baloot rules.

## 4. Architectural Authority

The following remain authoritative:

1. `packages/game-engine` — game rules, state transitions, legality, scoring and replay.
2. `packages/game-protocol` — protocol-level transition semantics.
3. Rule Freeze v1 and subsequent approved rule revisions.
4. RD-08 Baloot Declaration & Resolution Protocol.
5. Existing project, scoring, bidding, timeout, replay and match lifecycle rules.

The AI is a decision-maker only. It does not own truth.

## 5. Core Invariant

The AI follows:

**Observe -> Generate legal actions -> Evaluate/search -> Select action -> Submit action to engine -> Observe resulting state.**

It must never:

- mutate hidden state;
- invent a legal move;
- calculate authoritative score independently;
- declare a winner independently;
- bypass project/Baloot legality;
- inspect another player's hidden hand;
- use future information.

## 6. Phase Gates

### Gate A — AI observation model

A player-specific information view exists and contains exactly the information available to that seat.

### Gate B — Action generation

Every AI action is generated from authoritative engine legality.

### Gate C — Decision quality

Bidding, project, Baloot and card-play policies have deterministic tests and explainable evaluations.

### Gate D — Hidden-information integrity

Automated tests prove that an AI decision cannot depend on redacted opponent cards.

### Gate E — Search

Information-set search is deterministic under a supplied seed and bounded by explicit budgets.

### Gate F — Endgame

A small-state exact/near-exact solver is available and verified against exhaustive engine search.

### Gate G — Full match

One human seat plus three AI seats can complete a full match through the existing lifecycle.

### Gate H — Simulation

Large AI-vs-AI simulation batches complete without illegal transitions, impossible states, replay divergence or score divergence.

## 7. Exit Criterion

Phase 18 is complete only when:

- Human vs 3 AI can complete a match;
- AI uses no privileged hidden information;
- all submitted actions pass the same authoritative engine validation as human actions;
- deterministic replay succeeds;
- large simulation runs remain stable;
- AI diagnostics can explain why an action was selected;
- CI is green;
- architecture and acceptance documentation are updated.

**Until all gates pass, Phase 18 remains open.**
