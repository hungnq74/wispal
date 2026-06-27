# Wispal Gamification Logic

Documented from the current implementation on 2026-06-27.

Wispal's gamification is built around a study companion, a growing world, and
soft rewards for healthy study behavior. The main design rule is that the app
rewards meaningful moments, not raw volume. There is no leaderboard, no
user-vs-user ranking, no runtime LLM dialogue, and no reward multiplier based
on hours or minutes studied.

## Audit Verdict

The foundation is good: companion bond, world growth, reflection, soft currency,
and anti-burnout all reinforce the same product promise. The main issue was
reward integrity, not the concept. Daily goal, rest, reflection, and morning
gift rewards now use explicit daily reward claims so they cannot be repeated or
farmed in normal use.

Resolved decisions:

- Anti-burnout is non-optional.
- Daily goal, rest, reflection, and morning gift are once-per-day rewards.
- Short sessions are logged, but do not mint bond, sparks, or growth.
- Quests, review cards, rooms, focus gate, ambience, and subjects support study
  behavior but do not create extra currency loops in V1.

## Non-Technical Explanation

Phần này giải thích cơ chế gamification theo ngôn ngữ product/business, không
cần biết code vẫn đọc được. Các phần bên dưới giữ nguyên mức chi tiết kỹ thuật
để dev có thể trace lại implementation.

### Wispal đang game hóa điều gì?

Wispal không biến việc học thành cuộc đua xem ai học nhiều giờ hơn. App game
hóa việc "quay lại học một cách lành mạnh": bắt đầu một phiên tập trung, hoàn
thành một block, biết nghỉ đúng lúc, nhìn lại ngày học, và thấy thế giới nhỏ
của mình lớn lên theo thời gian.

Nói ngắn gọn: Wispal thưởng cho khoảnh khắc có ý nghĩa, không thưởng cho việc
cày càng nhiều càng tốt.

### Người dùng sẽ cảm nhận vòng chơi như thế nào?

1. Mở tab mới và thấy bạn đồng hành chào mình.
2. Gõ nhanh hôm nay định làm gì, ví dụ "đọc xong chương sinh học".
3. Bấm bắt đầu một block học, thường là 15, 25, hoặc 45 phút.
4. Nếu người dùng rời máy, đồng hồ học thực tế tạm dừng nhẹ nhàng.
5. Khi hoàn thành block, bạn đồng hành ăn mừng.
6. Thế giới nền trời/garden được thêm một phần tăng trưởng.
7. Người dùng nhận sparks để mở khóa theme, companion, voice pack.
8. Nếu học đủ mục tiêu ngày, app chúc mừng lớn hơn.
9. Nếu học quá lâu, bạn đồng hành mệt và nhắc nghỉ.
10. Cuối ngày, app hỏi "hôm nay thế nào?" như một check-in nhẹ.
11. Hôm sau quay lại, người dùng có thể nhận một món quà nhỏ.

### Các loại tiến trình trong Wispal

| Khái niệm | Người dùng hiểu là gì | Dùng để làm gì |
| --- | --- | --- |
| Bond | Độ thân thiết với companion | Mở câu thoại ấm hơn, thể hiện quan hệ sâu hơn |
| Sparks | Tiền mềm trong app | Mua/mở khóa theme, companion, voice pack |
| Growth | Thế giới của mình lớn lên | Mở thêm sao, moon, lanterns, aurora |
| Streak | Nhịp quay lại nhiều ngày liên tiếp | Nếu bật, tăng nhẹ sparks nhận được |
| Fatigue guard | Chống học quá sức | Nhắc nghỉ khi đã học quá lâu |
| Reflection | Nhật ký cuối ngày dạng check-in | Lưu mood, một điều làm tốt, ghi chú |

### Wispal thưởng cho hành vi nào?

| Hành vi | Vì sao đáng thưởng? | Người dùng nhận được |
| --- | --- | --- |
| Mở app mỗi ngày | Ghi nhận việc quay lại | Một chút bond |
| Hoàn thành block học | Đây là core action | Bond, sparks, growth |
| Vào trạng thái flow | Ghi nhận tập trung liên tục | Bond và sparks |
| Đạt mục tiêu ngày | Đủ rồi, có thể dừng không áy náy | Bond và nhiều sparks hơn |
| Nghỉ khi cần | Nghỉ cũng là một hành vi tốt | Bond và sparks |
| Reflection cuối ngày | Giúp học có cảm xúc và ký ức | Bond và sparks |
| Quay lại hôm sau | Tạo cảm giác companion chờ mình | Morning gift bằng sparks |

Ví dụ dễ hiểu:

- Hoàn thành một block: nhận `+2` bond, `+10` sparks, và `+1` growth.
- Đạt mục tiêu ngày: nhận thêm `+5` bond và `+25` sparks.
- Nghỉ: nhận `+4` bond và `+8` sparks.
- Viết reflection cuối ngày: nhận `+6` bond và `+15` sparks.
- Hôm sau quay lại sau khi close day: nhận morning gift `+20` sparks.

### Wispal cố tình không thưởng cho điều gì?

Wispal không có:

- leaderboard
- xếp hạng người dùng
- phần thưởng theo số giờ càng nhiều càng tốt
- multiplier theo tổng phút/tổng giờ học
- phạt khi bỏ lỡ một ngày
- phạt khi kết thúc sớm
- câu thoại tạo bằng AI runtime

Điều này giữ Wispal khác với productivity app kiểu ép chỉ tiêu. App muốn người
dùng thấy mình được chăm sóc, không bị quản lý.

### Vì sao "resting" cũng được thưởng?

Đây là điểm khác biệt lớn nhất của Wispal. Nhiều app chỉ thưởng khi người dùng
làm thêm. Wispal thưởng cả lúc người dùng nghỉ đúng lúc, vì sản phẩm muốn chống
burnout.

Product meaning: nghỉ không phải thất bại. Nghỉ là một phần của chu kỳ học bền.

### Streak hoạt động nhẹ như thế nào?

Streak đang tắt mặc định. Nếu người dùng bật "Gentle streaks", sparks nhận được
sẽ tăng nhẹ theo số ngày quay lại liên tiếp, tối đa `1.5x`.

Streak không dùng để xếp hạng, không so với người khác, và không làm mất tiến
trình khi lỡ một ngày. Nó chỉ là bonus nhỏ cho nhịp đều đặn.

### Thế giới lớn lên ra sao?

Mỗi block học hoàn thành thêm `+1 growth`. Growth làm bầu trời/thế giới có thêm
sao và mở các milestone như constellation, pine grove, moon, pond, lanterns,
shooting star, aurora.

Ý nghĩa product: người dùng không chỉ thấy số liệu. Họ thấy một không gian cảm
xúc được xây từ các lần mình quay lại học.

### Shop đang bán gì?

Shop chỉ bán/mở khóa biểu đạt cá nhân:

- theme/ambience
- companion mới
- voice pack
- cosmetic trong tương lai

Shop không bán core loop, không bán fatigue guard, không bán khả năng học tốt
hơn. Monetization hiện tại đi theo hướng "expression, not pressure".

### Các quyết định product đã khóa

Những điểm từng là rủi ro reward-farming hiện đã được khóa lại:

1. Anti-burnout luôn bật, không có toggle tắt hoàn toàn.
2. Daily goal reward chỉ trả một lần mỗi ngày.
3. Rest reward chỉ trả một lần mỗi ngày và cần ít nhất 10 phút active, hoặc
   fatigue guard đã được kích hoạt.
4. Reflection có thể sửa nhiều lần, nhưng reward chỉ trả lần submit đầu tiên
   trong ngày.
5. Morning gift chỉ được queue nếu ngày đó có một session đủ điều kiện hoặc đã
   submit reflection.

Nhờ vậy economy chắc hơn trước khi thêm nhiều item, premium pack, hoặc
marketplace.

## Source Of Truth

Core game logic lives in these files:

| Area | File |
| --- | --- |
| Data model | `web/lib/types.ts` |
| Defaults | `web/lib/store/defaults.ts` |
| Companion state machine | `web/features/companion/fsm.ts` |
| FSM side effects and dialogue | `web/features/companion/useCompanionFSM.ts` |
| Session timer and signals | `web/features/session/useSessionEngine.ts` |
| Local persistent store | `web/lib/store/useWispalStore.ts` |
| Bond progression | `web/lib/bond.ts` |
| Currency economy | `web/lib/economy.ts` |
| Reward claims + daily cap | `web/lib/rewards.ts` |
| Streak calculation | `web/lib/streak.ts` |
| World growth and unlocks | `web/lib/world.ts` |
| Shop catalog | `web/content/catalog.json` |
| Entitlements | `web/features/entitlement/canAccess.ts` |
| Product invariant scanner | `scripts/guardrails.mjs` |

## Core Loop

1. User opens Wispal.
2. The companion greets them once per local day.
3. User sets an optional intention and starts a focus block.
4. The session engine counts active seconds only while presence is active.
5. Idle time pauses progress instead of penalizing the user.
6. Sustained active focus can trigger a flow reward.
7. Completing the planned active time completes the block.
8. Qualifying completed blocks award bond, sparks, and one growth point.
9. Growth points paint the world and unlock visual milestones.
10. Hitting the daily goal awards a larger bounded reward once per day.
11. Fatigue thresholds push the companion into a tired/rest state.
12. Taking a break awards rest rewards.
13. Closing the day opens reflection and queues a morning gift.
14. Submitting reflection stores the daily journal entry and pays a bounded reward.

## Starting State

New local guests are seeded with:

| State | Default |
| --- | --- |
| Companion pack | `wisp` |
| Voice pack | `gentle` |
| Theme | `tokyo-night` |
| Mood | `idle` |
| Bond points | `0` |
| Bond tier | `new` |
| Sparks | `0` |
| Growth points | `0` |
| Streaks | disabled |
| Push reminders | disabled |
| Daily goal | `90` minutes |
| Fatigue guard | enabled and non-optional |
| Preferred session length | `25` minutes |

The session start UI offers `15`, `25`, and `45` minute presets. Settings allow
editing the preferred session length and daily goal.

## Session Timing Rules

The session engine has these constants:

| Constant | Value | Meaning |
| --- | ---: | --- |
| `FLOW_MINUTES` | `15` | Continuous active focus needed for one flow event in a block |
| `CONTINUOUS_FATIGUE_MIN` | `90` | One continuous active block this long trips fatigue |
| `DAILY_FATIGUE_MIN` | `180` | Total active minutes today trips fatigue |
| `MIN_REWARDED_SESSION_MINUTES` | `10` | Minimum active time for session/rest rewards |
| `CELEBRATE_SETTLE_MS` | `3000` | Celebration mood auto-settles after completion/goal |

Important behavior:

- `elapsedSec` increments every second while a session is running.
- `activeSec` increments only when presence is active.
- Completion is based on `activeSec >= plannedMinutes * 60`.
- Idle presence sets the session to idle and can move the companion from
  `studying` to `sleepy`.
- Returning from idle moves the companion from `sleepy` back to `studying`.
- Idle time has no penalty and does not count toward completion.
- Sessions under 10 active minutes can be logged, but they do not mint bond,
  sparks, or growth.
- Runtime tick state is kept local and is not synced to the server.

## Companion Signals And Effects

The pure FSM maps `FocusSignal` plus current mood into a new mood, optional
dialogue trigger, and side effects. The hook applies the side effects to the
store.

| Signal | Main condition | Resulting mood | Dialogue | Rewards/effects |
| --- | --- | --- | --- | --- |
| `app_open` | First app open for the day | `greeting` | `greeting` | `+1` bond |
| `app_open` | Missed one or more days | `welcomeBack` | `welcome_back` | `+1` bond |
| `session_start` | Not already active | `studying` | `session_start` | none |
| `heartbeat_idle` | Current mood is `studying` | `sleepy` | none | none |
| `heartbeat_active` | Current mood is `sleepy` | `studying` | none | none |
| `flow_detected` | Mood is `studying` or `sleepy` | `studying` | `flow` | `+3` bond, `+5` sparks before streak bonus |
| `session_complete` | Planned active time reached and at least 10 active minutes | `celebrating` | `session_complete` | `+2` bond, `+10` sparks before streak bonus, `+1` growth |
| `session_complete` | Planned active time reached but under 10 active minutes | `celebrating` | `session_complete` | logged only; no bond, sparks, or growth |
| `daily_goal_hit` | Daily active minutes reaches goal for the first time today | `celebrating` | `goal_hit` | `+5` bond, `+25` sparks before streak bonus |
| `fatigue_threshold` | Fatigue threshold reached | `tired` | `fatigue_rest` | none immediately |
| `break_started` | User rests after 10 active minutes or fatigue fired, first rest reward today | `resting` | none | `+4` bond, `+8` sparks before streak bonus |
| `break_started` | User rests too quickly or already claimed rest today | `resting` | none | logged only; no reward |
| `day_closed` | User ends the day | `resting` | `reflection_prompt` | opens reflection; queues morning gift only after eligible work/reflection |
| `session_abandoned` | User ends early without rest | `idle` | none | no penalty |

## Reward Table

### Bond

Bond points are monotonic and never decrease.

| Event | Bond |
| --- | ---: |
| Greeting / welcome back | `1` |
| Completed session | `2` |
| Flow detected | `3` |
| Rest taken | `4` |
| Daily goal hit | `5` |
| Reflection submitted | `6` |

### Sparks

Sparks are soft currency. They are awarded for moments, then optionally scaled
by the consistency multiplier.

| Event | Base sparks |
| --- | ---: |
| Flow detected | `5` |
| Rest taken | `8` |
| Completed session | `10` |
| Reflection submitted | `15` |
| Morning gift | `20` |
| Daily goal hit | `25` |

Morning gift is added directly and does not use the consistency multiplier.

In-day earned sparks are capped at `100` through `dailyEarnedSparks`. Morning
gift is exempt from this cap because it is a next-day return gift, not a reward
for doing more work today.

### Daily Reward Claims

Daily reward claims prevent repeat payouts for once-per-day rewards.

| Claim | Pays once for |
| --- | --- |
| `daily_goal` | first daily goal hit of the local day |
| `rest` | first qualifying rest reward of the local day |
| `reflection` | first reflection submission of the local day |
| `morning_gift` | first eligible next-day gift delivery |

The claim can be recorded even if the spark cap leaves `0` sparks available, so
bond and emotional acknowledgement still happen once while currency remains
bounded.

## Bond Tiers

Bond tiers gate warmer dialogue lines and can be used later for rarer
animations.

| Tier | Minimum bond points |
| --- | ---: |
| `new` | `0` |
| `familiar` | `40` |
| `trusted` | `120` |
| `attached` | `280` |
| `bonded` | `600` |

The UI shows the current tier and progress toward the next tier in the top bar.

## Streaks And Consistency

Streaks are opt-in. By default, `streaksEnabled` is `false`.

An active day is any day with at least one of:

- `totalActiveMinutes > 0`
- `sessionsCompleted > 0`
- a submitted reflection

`currentStreak()` counts consecutive active days ending today, or ending
yesterday if today is not active yet.

When streaks are enabled, sparks use this multiplier:

```ts
1 + min(max(streakDays, 0), 5) * 0.1
```

That means:

| Streak days | Multiplier |
| ---: | ---: |
| `0` | `1.0x` |
| `1` | `1.1x` |
| `2` | `1.2x` |
| `3` | `1.3x` |
| `4` | `1.4x` |
| `5+` | `1.5x` |

This is a consistency bonus, not a volume bonus. It does not care how many
minutes or hours were studied in a day.

Missed days do not reduce bond, currency, world growth, or inventory. They only
change the next greeting into a `welcome_back` line when the most recent active
day is more than one day before today.

## Daily Goal

The daily goal defaults to `90` active minutes. The top bar shows today's active
minutes and goal progress.

In the session engine, the daily goal signal fires when:

```ts
dayBaselineMinutes + floor(activeSec / 60) >= dailyGoalMinutes
```

The daily log stores:

- `totalActiveMinutes`
- `sessionsCompleted`
- `goalHit`
- `reflection`
- `rewardClaims`
- `dailyEarnedSparks`

`goalHit` persists as `true` once hit for that local day.

The engine seeds each new session with today's persisted `goalHit`, so later
sessions cannot fire another daily goal payout after the goal has already been
claimed.

## Fatigue And Rest

The fatigue guard is enabled and non-optional.

Fatigue triggers if either condition becomes true during a running session:

- continuous active focus reaches `90` minutes
- today's active minutes reaches `180` minutes

When fatigue triggers, the companion moves to `tired` and says a `fatigue_rest`
line. The session UI then surfaces a prominent "Rest now" action.

Taking a break calls `break_started` and moves the companion to `resting`.
Rest rewards pay only once per day and only if the session had at least 10
active minutes or fatigue already fired. Ending early without choosing rest
calls `session_abandoned`, returns to `idle`, and applies no penalty.

## Reflection And Morning Gift

Closing the day dispatches `day_closed`.

Effects:

- companion mood becomes `resting`
- `reflection_prompt` line is shown
- reflection modal opens
- today's date is stored in `localStorage` as a queued morning gift date

Submitting reflection stores:

- mood score `1` to `5`
- required win text, defaulting to `showed up`
- optional note
- submitted timestamp

The first reflection submission of a local day awards:

- `+6` bond
- `+15` base sparks, with the consistency multiplier if enabled

Later edits update the journal but do not pay again.

The morning gift is delivered on a later day during greeting if a previous
queued gift date exists. It awards `+20` sparks and then clears the queued gift.

Morning gift is queued only when the closed day had a qualifying completed
session or a submitted reflection. Closing an empty day opens the reflection
prompt but does not queue a gift.

## World Growth

The world grows from `growthPoints`. Completed sessions add exactly `+1`
growth. Rest, reflection, flow, and daily goals do not add growth.

`nightUnlocks(growthPoints)` unlocks every milestone at or below the current
growth.

| Growth | Unlock |
| ---: | --- |
| `1` | First star |
| `3` | Constellation |
| `6` | Pine grove |
| `10` | Crescent moon |
| `15` | Still pond |
| `22` | Fireflies |
| `30` | Lanterns |
| `45` | Shooting star |
| `60` | Aurora |

The rendered sky also derives a continuous star count:

```ts
min(90, 6 + growthPoints * 3)
```

Star placement is deterministic from seeded math, so the scene is stable across
reloads.

## Shop And Inventory

Sparks are spent in the shop. Purchases call `spendCurrency(price)`; spending
fails if the user has insufficient sparks or if the price is not positive.
Currency cannot go negative through the store API.

Owned items are stored in `inventory`. Equipping changes companion pack, voice
pack, cosmetic list, or active theme.

Current catalog:

| Item | Type | Price | Plus required | Status in V1 |
| --- | --- | ---: | --- | --- |
| Dawn | Theme | `120` | no | buyable |
| Pastel Pixel | Theme | `150` | no | buyable |
| Lofi Cafe | Theme | `0` | yes | locked |
| Dark Academia | Theme | `0` | yes | locked |
| Lumen the Ghost | Companion | `300` | no | buyable |
| Mote the Orb | Companion | `300` | no | buyable |
| Ember the Lantern | Companion | `0` | yes | locked |
| Sassy voice pack | Voice pack | `0` | yes | locked |
| Tiny lantern | Decor | `90` | no | buyable |
| Rest cushion | Decor | `110` | no | buyable |

`hasPlus()` always returns `false` in V1, so every `requiresPlus` item is
currently locked. The entitlement seam is intentionally isolated in
`canAccess()`.

The core loop, default companion, basic world, and fatigue guard are not
monetized.

## Support Systems

These systems make the study loop richer, but they do not create extra sparks in
V1. This keeps the economy from rewarding self-declared or easily spammed
actions.

| System | Product role | Reward policy |
| --- | --- | --- |
| Quests | Helps the user pick the next thing to study | Organizes intent; no direct sparks |
| Subjects | Groups time by class/topic | Reporting and color context only |
| Review garden | Active recall cards bloom when remembered | Uses `bloom`; no sparks per card |
| Focus gate | Blocks or soft-warns distracting sites | Support tool; no rewards |
| Ambience studio | Saves study sound/theme presets | Expression and comfort; no rewards |
| Quiet rooms | Invite-only shared study context | Uses normal session rewards only |
| Decor | Placeable world expression | Bought with sparks; no productivity advantage |

## Dialogue And Content Gating

All companion words come from JSON voice packs in `web/content/voices/`.

The dialogue pipeline:

1. FSM emits a dialogue trigger.
2. `pickLine()` loads the active voice pack.
3. Lines are filtered by trigger and `minBondTier`.
4. One eligible line is picked randomly.
5. Simple `{var}` placeholders are filled.

Current dialogue triggers:

- `greeting`
- `session_start`
- `session_complete`
- `goal_hit`
- `flow`
- `fatigue_rest`
- `welcome_back`
- `reflection_prompt`
- `morning_gift`

There is no runtime LLM. Dialogue is data-driven and marketplace-ready.

## Visual Feedback

The UI reinforces game state in these ways:

- Top bar shows bond tier, bond progress, daily goal progress, and sparks.
- Companion sprite mood changes between idle, greeting, studying, sleepy, tired,
  resting, celebrating, and welcome-back states.
- Sleepy/tired moods show sleep overlays.
- Celebrating mood shows sparkles and auto-settles after three seconds.
- Completion card shows total sparks and the next world milestone hint.
- World canvas renders growth-derived stars and milestone objects.
- Journal/wrapped view summarizes days shown up, blocks finished, time with
  companion, goals reached, flow count, bond tier, milestones, and recent wins.

## Persistence And Sync

Wispal is local-first. Game state is persisted immediately to IndexedDB.

IndexedDB tables:

- `profile`
- `companion`
- `world`
- `wallet`
- `sessions`
- `dailyLogs`
- `inventory`
- `subjects`
- `quests`
- `ambiencePresets`
- `focusGateProfiles`
- `reviewDecks`
- `reviewCards`
- `reviewEvents`
- `studyRooms`
- `roomMembers`
- `roomSessions`
- `syncQueue`

Only finalized sessions and daily logs are persisted. Per-second heartbeat state
stays local runtime state. Cloud sync is env-gated and debounced at meaningful
checkpoints such as session finalization and reflection submission.

## Guardrails

`pnpm guardrails` scans the app for product-invariant violations:

- no leaderboard or user-vs-user ranking
- no volume-based reward multiplier
- no runtime LLM/frontier model dependency

The scan covers app, feature, lib, content, and extension source directories.

## Dev-Only Controls

In non-production builds, the dev panel can:

- start a six-second block
- complete the current block
- dispatch daily goal, flow, fatigue, idle, and active signals
- close the day
- add `+50` sparks
- add `+5` growth

The dev panel is useful for testing the loop but can bypass normal bounds in
development.

## Current Product Decisions

These decisions should remain true unless the product direction changes:

1. Anti-burnout is always on; stored legacy settings are coerced back to enabled.
2. Daily goal, rest, reflection, and morning gift rewards are claim-based and
   pay once per local day.
3. Short sessions are still logged, but sessions under 10 active minutes do not
   pay bond, sparks, or world growth.
4. In-day earned sparks cap at `100`; morning gift is the only cap-exempt spark
   reward.
5. Quests, review cards, rooms, focus gate, ambience, and subjects do not add
   extra currency in V1.
