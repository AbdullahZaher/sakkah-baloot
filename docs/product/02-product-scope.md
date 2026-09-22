# صكّة بلوت — Product Scope

**Document:** Product Scope  
**Version:** 0.1.0  
**Status:** Draft for Review  
**Depends On:** `01-product-vision.md`  
**Last Updated:** 2026-09-21

---

## 1. Purpose

هذا المستند يحول Product Vision إلى نطاق تنفيذي واضح.

الهدف منه منع:

- Feature creep
- بناء ميزات مبكرًا
- خلط MVP مع V1/V2
- إدخال أنظمة اجتماعية وتجارية قبل تثبيت Core Gameplay
- اتخاذ قرارات تقنية بسبب ميزات غير ضرورية

هذا المستند لا يحدد تفاصيل قواعد البلوت. قواعد اللعب الرسمية ستكون في `docs/game/`.

---

# 2. Scope Philosophy

صكّة ستُبنى على أربع طبقات:

```text
CORE GAME
    ↓
MULTIPLAYER
    ↓
PLAYER EXPERIENCE
    ↓
LIVE / SOCIAL SYSTEMS
```

لا ننتقل إلى طبقة أعلى إذا كانت الطبقة السابقة غير مستقرة.

---

# 3. Release Definitions

## 3.1 Prototype

الهدف:

إثبات أن:

- Game Engine يعمل.
- قواعد اللعبة قابلة للتنفيذ.
- أربع لاعبين يمكنهم إكمال مباراة.
- Networking الأساسي يعمل.
- Reconnect ممكن.
- Gameplay UI الأساسي يعمل.

Prototype ليس منتجًا قابلًا للإطلاق.

---

## 3.2 MVP

MVP هو أول نسخة يمكن استخدامها فعليًا من مجموعة محدودة من اللاعبين بهدف التحقق من:

- جودة Core Gameplay.
- استقرار Multiplayer.
- وضوح UX.
- قابلية الاستمرار في اللعب.

MVP لا يحتاج كل أنظمة المنتج النهائية.

---

## 3.3 V1

V1 تضيف الأنظمة التي تجعل اللعبة مناسبة للنمو المستمر:

- Friends
- Ranked
- Leaderboards
- Seasons
- Achievements
- Customization
- Better statistics
- Notifications

---

## 3.4 V2

V2 توسع الجانب الاجتماعي والتنافسي:

- Voice
- Tournaments
- Spectator
- Advanced Replay
- Clans
- Events
- Advanced Cosmetics

---

# 4. MVP Feature Matrix

| Feature | MVP | V1 | V2 | Priority |
|---|---:|---:|---:|---|
| App bootstrap | Yes | Yes | Yes | P0 |
| Arabic RTL | Yes | Yes | Yes | P0 |
| English localization foundation | Yes | Yes | Yes | P1 |
| Authentication | Yes | Yes | Yes | P0 |
| Basic profile | Yes | Yes | Yes | P0 |
| Username | Yes | Yes | Yes | P0 |
| Avatar | Basic | Expanded | Expanded | P1 |
| Quick Match | Yes | Yes | Yes | P0 |
| Private Room | Yes | Yes | Yes | P0 |
| 4-player game | Yes | Yes | Yes | P0 |
| Sun | Yes | Yes | Yes | P0 |
| Hokm | Yes | Yes | Yes | P0 |
| Full scoring | Yes | Yes | Yes | P0 |
| Timer | Yes | Yes | Yes | P0 |
| Server authoritative game | Yes | Yes | Yes | P0 |
| Reconnect | Yes | Yes | Yes | P0 |
| Match result | Yes | Yes | Yes | P0 |
| Rematch | Yes | Yes | Yes | P1 |
| Match history | Basic | Expanded | Expanded | P1 |
| Basic chat | Yes | Yes | Yes | P1 |
| Mute | Yes | Yes | Yes | P1 |
| Report | Yes | Yes | Yes | P1 |
| Friends | No | Yes | Yes | P1 |
| Ranked | No | Yes | Yes | P1 |
| Rating | No | Yes | Yes | P1 |
| Leaderboard | No | Yes | Yes | P1 |
| Seasons | No | Yes | Yes | P1 |
| Achievements | No | Yes | Yes | P2 |
| Emotes | Basic/Optional | Yes | Yes | P2 |
| Cosmetic table themes | No | Yes | Yes | P2 |
| Card backs | No | Yes | Yes | P2 |
| Voice chat | No | No | Yes | P2 |
| Tournaments | No | No | Yes | P2 |
| Spectator mode | No | No | Yes | P3 |
| Clans | No | No | Yes | P3 |
| Advanced replay | No | No | Yes | P3 |
| Social spaces | No | No | Future | P3 |

---

# 5. Priority Definitions

## P0 — Critical

بدونها لا توجد لعبة قابلة للاختبار.

أمثلة:

- Game Engine
- Rules
- Gameplay
- Multiplayer
- Server authority
- Reconnect
- Core UI

## P1 — Important

مهمة للمنتج لكنها لا تمنع إثبات Core Gameplay.

أمثلة:

- Friends
- Ranked
- Rating
- Leaderboards
- Notifications

## P2 — Growth

ميزات تزيد retention/social engagement/monetization.

## P3 — Future

ميزات كبيرة أو معقدة لا يجب أن تؤثر على الأساس.

---

# 6. MVP Detailed Scope

## 6.1 Application Bootstrap

### Included

- Expo application.
- Environment configuration.
- App initialization.
- Loading state.
- Error boundary.
- RTL initialization.
- Localization initialization.
- Session restoration.

### Acceptance Criteria

- App opens without crash.
- Loading state is deterministic.
- Invalid session is handled.
- Network failure does not crash startup.

---

# 7. Authentication

## Included

- Sign in.
- Sign up where applicable.
- Session persistence.
- Logout.
- Basic account recovery flow.

### Not Required for MVP

- Social login provider expansion beyond selected providers.
- Account linking complexity.
- Advanced account management.

### Acceptance Criteria

- User can authenticate.
- Session survives app restart.
- Invalid/expired sessions are handled.
- User identity is verified server-side.

---

# 8. Profile

## MVP

Profile contains:

- User ID.
- Username.
- Avatar.
- Created date.
- Basic games played.
- Basic wins.
- Basic losses.

### Not MVP

- Advanced badges.
- Titles.
- Extensive customization.
- Social achievements.

---

# 9. Quick Match

## Goal

Allow a player to start a standard game with minimal interaction.

### Flow

```text
Home
  ↓
Quick Match
  ↓
Queue
  ↓
Match Found
  ↓
Game
```

### Requirements

- Queue join.
- Queue leave.
- Match creation.
- Four-player validation.
- Session assignment.
- Timeout handling.

### Failure Cases

- Server unavailable.
- Queue timeout.
- Match cancelled.
- Player disconnect.
- Duplicate queue request.

---

# 10. Private Room

## Goal

Allow players to create/join a private game.

### MVP

- Create room.
- Join room.
- Share room code.
- Player list.
- Ready state.
- Start when valid.

### Not MVP

- Persistent communities.
- Clans.
- Room ownership transfer complexity beyond necessary recovery.
- Advanced room customization.

---

# 11. Core Gameplay

## Included

- Four players.
- Two teams.
- Card deck.
- Dealing.
- Bidding.
- Sun.
- Hokm.
- Turn management.
- Legal card validation.
- Trick resolution.
- Scoring.
- Round transitions.
- Game completion.

### Important

Detailed rules are NOT defined here.

Source of truth:

```text
docs/game/01-game-rules.md
docs/game/02-card-system.md
docs/game/03-dealing.md
docs/game/04-bidding.md
docs/game/05-playing.md
docs/game/06-scoring.md
```

---

# 12. Gameplay Timer

## MVP

Every action requiring a decision may have a server-authoritative deadline.

The client displays the timer.

The server decides timeout.

### Rule

Never use client wall-clock time as authoritative game time.

---

# 13. Reconnect

Reconnect is P0.

### Required Scenarios

1. Temporary network loss.
2. Wi-Fi → cellular transition.
3. App background.
4. App foreground.
5. WebSocket disconnect.
6. Duplicate reconnect.
7. Delayed packets.
8. Player reconnects after another player has acted.

### Expected Behavior

```text
Disconnect
   ↓
Server retains session
   ↓
Client reconnects
   ↓
State synchronization
   ↓
Continue game
```

Exact retention window will be defined in architecture.

---

# 14. Game Result

At the end of the game show:

- Winning team.
- Losing team.
- Final score.
- Player statistics relevant to the match.
- Rematch.
- Return home.

### Not MVP

- Complex celebration animations.
- Share cards.
- Advanced achievements.
- Seasonal rewards.

---

# 15. Rematch

MVP may provide:

```text
Rematch
```

The exact behavior must be defined:

- Same players attempt to form a new room.
- Players can decline.
- Match starts only when requirements are satisfied.

---

# 16. Basic Social

## Chat

MVP may support lightweight text chat.

Requirements:

- Send.
- Receive.
- Mute.
- Report.
- Rate limit.

### Not MVP

- Voice chat.
- Media messages.
- Rich messaging.
- Direct messaging system.

---

# 17. Moderation

MVP requires minimum safety controls:

- Mute player.
- Block player.
- Report player.
- Report reason.
- Server-side rate limiting.
- Basic admin review capability.

The exact moderation workflows are defined separately.

---

# 18. Basic Statistics

MVP statistics:

- Games played.
- Games completed.
- Wins.
- Losses.
- Abandoned games.
- Basic win rate.

Do not build a large analytics dashboard into the mobile client.

---

# 19. What MVP Does NOT Optimize For

MVP is not intended to maximize:

- Revenue.
- Social complexity.
- Cosmetics.
- Competitive depth.
- Content volume.
- Number of screens.

MVP optimizes for:

```text
Reliable Game
+
Clear UX
+
Stable Multiplayer
+
Correct Rules
```

---

# 20. V1 Detailed Scope

After MVP proves the Core Game, V1 can add:

## Friends

- Friend requests.
- Friend list.
- Online status.
- Invite.
- Remove friend.
- Block.

## Ranked

- Ranked queue.
- Rating.
- Match result impact.
- Placement logic if required.

The exact rating algorithm must be defined before implementation.

## Leaderboards

- Global.
- Seasonal.
- Friends.

## Seasons

- Season lifecycle.
- Start/end dates.
- Season rewards.
- Season statistics.

## Achievements

- Achievement definitions.
- Progress tracking.
- Unlock state.
- Presentation.

## Customization

- Card backs.
- Table themes.
- Avatar frames.
- Emotes.

## Notifications

- Friend request.
- Match invite.
- Season events.
- Relevant account notifications.

---

# 21. V2 Detailed Scope

V2 may include:

## Voice

- Team voice.
- Push-to-talk.
- Mute.
- Voice permission handling.
- Abuse/report controls.

## Tournaments

- Tournament registration.
- Brackets.
- Match scheduling.
- Results.
- Rewards.

## Spectator

- Spectator permissions.
- Hidden information protection.
- Spectator synchronization.

## Replay

- Action history.
- Replay playback.
- Speed controls.
- Shareable replay references.

## Clans

- Clan creation.
- Membership.
- Roles.
- Clan statistics.
- Clan events.

---

# 22. Feature Dependency Rules

Features have dependencies.

Examples:

```text
Ranked
  ↓
Rating
  ↓
Reliable Game Result
  ↓
Reliable Game Engine
```

Therefore:

```text
Ranked cannot precede stable Game Engine.
```

Another example:

```text
Replay
  ↓
Action Log
  ↓
Deterministic Game Engine
```

Another:

```text
Season Rewards
  ↓
Inventory
  ↓
Item System
```

Do not implement the visible feature before its foundation.

---

# 23. Core Dependency Graph

```text
Product Rules
     ↓
Game Engine
     ↓
Server Authority
     ↓
Multiplayer
     ↓
Gameplay UI
     ↓
MVP
     ↓
Ranked / Friends / Seasons
     ↓
Live Operations
```

---

# 24. MVP Milestones

## M0 — Foundation

Deliver:

- Repository.
- Monorepo.
- TypeScript configuration.
- Game Engine package.
- Game Rules package.
- Protocol package.
- Mobile shell.
- Server shell.
- Test infrastructure.

Exit criteria:

- CI passes.
- Packages build.
- Tests run.
- Local development documented.

---

## M1 — Deterministic Game Engine

Deliver:

- Card model.
- Deck.
- Shuffle.
- Deal.
- Players.
- Teams.
- Turns.
- Rules.
- Trick.
- Scoring.
- State transitions.

Exit criteria:

- Core unit tests pass.
- Simulation tests pass.
- No invalid state found in defined test scenarios.

---

## M2 — Local Multiplayer Simulation

Deliver:

- Four simulated players.
- Complete match without UI.
- Timers.
- Actions.
- Rejections.
- Game result.

Exit criteria:

- Large simulation batch completes without invalid state.

---

## M3 — Online Game Server

Deliver:

- WebSocket.
- Rooms.
- Authentication.
- Player sessions.
- Server-side game engine.
- State broadcasts.
- Timers.
- Reconnect.

Exit criteria:

- Four physical clients can complete a match.

---

## M4 — Gameplay Client

Deliver:

- Table.
- Cards.
- Player seats.
- Trick.
- Score.
- Timer.
- Animations.
- Input.
- Error/reconnect UI.

Exit criteria:

- Complete online match with target device matrix.

---

## M5 — MVP Social Layer

Deliver:

- Basic profile.
- Chat.
- Mute.
- Block.
- Report.
- Match history.
- Rematch.

Exit criteria:

- Moderation and failure paths tested.

---

## M6 — MVP Release Candidate

Deliver:

- Analytics.
- Crash/error reporting.
- Production configuration.
- Store build.
- Privacy/terms surfaces.
- Release checklist.
- Load tests.
- Security review.

Exit criteria:

- Release gate approved.

---

# 25. Explicitly Deferred Decisions

The following are not allowed to be invented by implementation agents:

- Exact rating formula.
- Exact matchmaking formula.
- Exact economy.
- Premium pricing.
- Season reward structure.
- Tournament format.
- Voice provider.
- Advertising strategy.
- Final visual identity.
- Final art direction.
- Detailed Baloot rule variants.

Agents must mark these as `OPEN_DECISION` if encountered.

---

# 26. Product Change Control

Any change to a P0 feature after implementation begins requires:

1. Update this document.
2. Identify affected packages.
3. Identify affected tests.
4. Identify migration requirements.
5. Identify network compatibility impact.
6. Identify replay compatibility impact.
7. Identify client/server rollout impact.

For game rule changes, additionally:

- Update `game-rules`.
- Update scoring tests.
- Update simulation tests.
- Review bot behavior.
- Review replay compatibility.

---

# 27. Scope Freeze Rules

Before starting M1:

- MVP feature list is frozen.
- P0 requirements are frozen.
- Core game rules are separately approved.

During M1–M4:

- New P0 requirements require explicit review.
- New P1/P2 features are postponed unless they unblock development.

During M5:

- No new gameplay mechanics.
- Only defects, reliability, moderation, UX, and release-critical work.

---

# 28. Definition of MVP Done

MVP is complete only when all are true:

### Product

- [ ] MVP scope implemented.
- [ ] Core flow documented.
- [ ] Critical UX flows verified.

### Game

- [ ] Sun works.
- [ ] Hokm works.
- [ ] Scoring works.
- [ ] Full game completes.
- [ ] Invalid actions are rejected.
- [ ] Impossible states are prevented.

### Multiplayer

- [ ] Four players can join.
- [ ] Four players can finish.
- [ ] Disconnect/reconnect works.
- [ ] Duplicate actions are safe.
- [ ] Server is authoritative.

### Client

- [ ] Gameplay is readable.
- [ ] Cards are responsive.
- [ ] Timer is understandable.
- [ ] Error states exist.
- [ ] Reconnect state exists.
- [ ] RTL works.

### Safety

- [ ] Mute works.
- [ ] Block works.
- [ ] Report works.
- [ ] Basic rate limiting exists.

### Engineering

- [ ] CI passes.
- [ ] Critical tests pass.
- [ ] Build is reproducible.
- [ ] Production secrets are not in source control.
- [ ] Logs allow investigation of match failures.

---

# 29. Release Blockers

Any of the following blocks release:

- Incorrect scoring.
- Client can manipulate game result.
- Hidden cards leak to client.
- Reconnect can corrupt game state.
- Duplicate actions corrupt state.
- Timer can be manipulated by client.
- Game can reach an undefined state.
- Critical crash in gameplay.
- Data loss of completed matches where persistence is required.
- Authentication/security vulnerability rated release-blocking.
- Critical moderation abuse path without mitigation.

---

# 30. Non-Goals

This project is not currently scoped as:

- A 3D game.
- A virtual world.
- A gambling product.
- A pay-to-win system.
- A generic card-game platform.
- A social network.
- A streaming platform.

The product remains centered on:

**Saudi Baloot + Multiplayer + Social Play + Quality Mobile UX.**

---

# 31. Scope Review Checklist

Before moving to Game Rules, verify:

- [ ] Product Vision exists.
- [ ] MVP boundaries are understood.
- [ ] P0/P1/P2/P3 priorities are defined.
- [ ] Dependencies are documented.
- [ ] Deferred decisions are explicit.
- [ ] Release blockers are known.
- [ ] No implementation agent should invent deferred product decisions.

---

# 32. Status

This document is **Draft for Review**.

It should be reviewed together with:

`docs/product/01-product-vision.md`

before final product scope approval.

Approval of Product Scope does not approve the detailed Baloot rules. Those are defined and approved separately in the Game Rules documentation.
