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
40% of the original energy valuation. This is an explicitly labeled Umaplan
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
