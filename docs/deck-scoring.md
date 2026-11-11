# Scenario-aware deck scoring — 2 November 2026

## Corrected behavior

Global scenario links are matched by support-card ID, not translated names.
The old Unity list contained Japanese names while the card model used English,
so its intended +40 index bonus never reached Riko or the other linked cards.
The existing Grand Concert +75 allowance applies to its linked cards only.
These inherited constants are relative index allowances, not measured stat gains.
No additional token-to-stat conversion or invented event multiplier is added.

The owned-card beam now reserves alternatives for each Pal/Group identity.
Completed deck profiles include that identity, and retain up to eight profiles
per identity (plus up to 32 no-Pal profiles) before full-deck evaluation.
This prevents Light Hello from deleting all same-type Riko alternatives simply
because she has a higher standalone score. Search remains bounded and can miss
other better combinations.

## Recovery valuation

By default the complete-deck model multiplies energy recovery and energy-saving
value by `1 / (1 + 0.5 × number of Wit cards)`. Three Wit cards therefore use
40% of the original energy valuation. This is an explicitly labeled Umaharashi
heuristic for reduced recovery demand, NOT an observed event probability or
an energy-cap simulation. It applies equally to all cards and all scenarios.
The user can disable it under Support deck settings. Raw stats, skill chances,
race bonuses and ordinary event availability are unchanged.

Per-card results show scenario-link status and the link allowance. The deck
summary displays recovery utilization. Historical saved decks must be searched
again to obtain the new calculation.

## What the sources establish — and what is still approximate

- [Riko card effects](https://gametora.com/umamusume/supports/30036-riko-kashimoto)
  include normal event recovery, stat effectiveness and training effects.
- [Unity deckbuilding](https://uma.guide/guides/unity-cup-deckbuilding-guide)
  explains her Stamina/Guts contribution and normal outing benefits; those
  benefits are not all exclusive to Unity.
- [Riko event details](https://gamewith.jp/uma-musume/article/show/292758)
  distinguish increased Unity rewards in initial training, New Year and
  career-end events. The existing aggregated event vector cannot safely be
  decomposed into exact conditional event paths. Its ordinary rewards remain;
  Unity's coarse link allowance represents the extra value rather than a
  fabricated universal multiplier. Exact scenario-event totals remain unmodeled.
- [Grand Concert](https://uma.guide/guides/grand-concert) describes Light Hello's
  conditional grant of 20 points in the lowest performance category. Her normal
  outings remain usable outside Grand Concert; the performance mechanic does
  not. The Grand Concert link allowance is a proxy, not a prediction of tokens,
  lesson purchases, or event frequency. No such allowance applies to Hello in Unity.

The earlier conversational claim that recreation rewards are all scenario-only
was too broad. Neither card is banned outside its linked scenario. Strong desired
skill coverage can still legitimately outweigh the training index.

## Regression comparison

Neutral growth, MLB Kitasan Black (30028), Tokai Teio (30003), Fine Motion (30010),
Nice Nature (30054), Seiun Sky (30055), plus one MLB Pal:

| Scenario | Riko SSR | Light Hello SSR |
| --- | ---: | ---: |
| Unity | 1870.28 | 1829.82 |
| Grand Concert | 2008.20 | 2080.34 |

These are relative indices, not final stat predictions. This fixture verifies
scenario differentiation, not universal superiority for either card. Trainee
growth, desired skills, owned limit breaks and user constraints still affect the
recommendation. Course-specific Stamina targets, inheritance stat totals, mood
scheduling, recovery overflow and event-chain completion remain outside the model.

## 9 November: search correctness and stamina requirements

Two selection defects were separate from the limitations of the training model:
identical skill/type profiles retained only one deck based on standalone card
scores, and equal skill outcomes were finally tied by the same standalone sum.
Profiles now retain up to four concrete decks. Up to four representative
skill-coverage/outing-count seeds receive two rounds of full-deck single-slot
swap evaluation. Swaps preserve every skill-source tier, ownership, character
restrictions, scenario availability, type minima, race bonus and the Pal cap.
Equal final outcome scores now prefer the actual complete-deck training score.
This is still bounded local search, not exhaustive deck optimization; two-card
changes with an initially worse intermediate step can still be missed.

The new `Unity Cup · 2 Speed / 3 Wit / Riko` template and separate
`Require Riko in automatic Unity decks` option treat Riko as a deck requirement,
not a fabricated score bonus. An owned R or SSR, or a legal borrowed SSR,
qualifies. Automatic multi-scenario search applies it only to Unity results.
Manual decks retain their exact six choices. Conflicting constraints produce
an error rather than silently substituting Aoi. Old plans are not modified.

Per-card details now show initial stamina, modeled event stamina/guts and event
skill points separately. Riko's raw ordinary event-stamina vector is 95 before
Event Effectiveness (128.25 at MLB SSR), plus 30 initial stamina. This is the
inherited aggregate model, not a verified sum of all Unity-specific conditional
event routes. Energy discounting never discounts those stamina rewards.

The equal-stat balanced heuristic still credits Fukukitaru's 150 initial stats,
event stats, race bonus and coarse scenario-link allowance. Aoi's large event
skill-point vector can compete with Riko's stamina if those values are weighted
equally. Maruzensky's facility-level unique is represented by a static 15%
training bonus (level 3), not a modeled Unity facility progression (5% per
facility level). These limitations are not fixed by widening the search.
Do not interpret this index as proof that Fukukitaru beats Maruzensky in an
actual career, or that any deck can survive its medium/long race schedule.

Sources checked 9 November:
- https://uma.guide/guides/unity-cup-deckbuilding-guide
- https://gametora.com/umamusume/supports/30107-maruzensky
- https://gametora.com/umamusume/supports/30036-riko-kashimoto

The screenshot does not provide the whole owned collection, Kitasan/Riko limit
breaks, filters or all objective settings. Regression fixtures use explicitly
chosen collections; they do not claim to reproduce the user's complete save.

## 11 November: borrowed/owned exchanges

Refinement now permits improved skill-source tiers, while still rejecting a loss
in any existing source. Candidate changes are compared using the configured
skill/training balance instead of training alone. It also evaluates coordinated
changes that bring the currently borrowed character into an owned slot while
choosing another borrow. This avoids an illegal duplicate-character intermediate
or a temporary loss of skill access blocking both changes. Ownership limits,
scenario restrictions, type minima and Pal requirements still apply. The search
remains bounded; this does not resolve the training model's documented limits.
