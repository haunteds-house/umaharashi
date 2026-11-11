# Euophrys training-value calculator

Source: https://github.com/Euophrys/umamusume-tierlist
Pinned commit: a405c452f2b086c5d2e5f25626714756a79291a9
License: MIT, Copyright (c) 2021 Amber Flina. See LICENSE (shipped with the app).

Vendored `src/components/tierlist-calc.js`, `src/card-events.js`, and
`src/scenarios.js`. The calculator's event import has an explicit local `.js`
extension. `cards.js` is the Global card dataset from `src/cards/gl.js`, compacted
without changing values. No React code or upstream site assets are included.

Umaplan's adapter is `../../training.js`. It uses actual target growth rates,
common stat valuations across scenario presets, current owned LB levels with
max-level-at-that-LB assumptions, and MLB borrowed cards. It sums six marginal
card scores (each evaluated with the other five fixed) as a relative deck index.
That sum is not a simulated final-stat total. Scenario availability is selected
by the user; a model preset does not establish that a scenario has launched.

Local calculator adaptations: an optional `deckOutingDays` weight reserves the
whole deck's outing turns in every scoring pass; without it the original
per-candidate five-turn deduction remains. Training days cannot be negative,
and bonding days are clamped to the available training window. The adapter uses card-specific MDB outing totals for Pal/Group cards; these
remain an allowance rather than a prediction of the actual training schedule.
The deck search defaults to at most one Pal/Group card (user-adjustable).

The calculator also accepts optional `scenarioLinkIds` and `energyUtilization`
weights. The adapter uses IDs for Global links and can discount energy value
based on Wit-card count. Neither option alters the unadapted upstream default.
See ../../docs/deck-scoring.md for the heuristic and its limitations.

## Automatic Global data refresh

The calculator implementation and scenario presets remain pinned and locally
adapted. Card parameters are now regenerated from the checksum-verified Global
MDB by the checked-in `db-convert.py`, adapted from upstream blob
`7aa48c4ec61425387b1da099f314dfec6259efb0` (same MIT license). Local changes select
catalog IDs, open SQLite read-only, honor Unique unlock levels, use referenced
effect table IDs, and reject unsupported effects instead of merely warning.
The converter retains upstream static assumptions for conditional unique effects.

Event vectors are parsed as data from a commit-pinned upstream URL; downloaded
JavaScript is never executed. The source revision and MDB digest are recorded
in `data/metadata.json`. See `../../docs/data-refresh.md`.
