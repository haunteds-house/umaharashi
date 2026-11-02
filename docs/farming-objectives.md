# Farming objectives and reusable presets

The original ranking remains the default (`legacy`). Without supports it orders by minimum requested chance, then sum, then affinity. With supports it retains the existing equal minimum/mean blend and training weight. Per-spark priorities do not affect legacy mode.

For distinct outcomes with probabilities p and positive priorities w:

- Balanced: 0.5 × min(p) + 0.5 × sum(w × p) / sum(w).
- Yield: maximize sum(w × p). The unweighted expected count is sum(p); this expectation does not require independence. Normalize weighted yield by sum(w) when combining it with training value.
- Complete package: product(p), assuming independent outcomes. Priorities are ignored. Expected attempts are 1/product(p), assuming identical independent attempts. A zero probability gives infinite expected attempts.

The new preference score is 100 × [(1 − t) × objective utility + t × training/(training + 3000)]. t is zero without a deck. With a deck, it is the selected training weight. This score is not a probability. A small package probability can be outweighed by training; use 0% training to rank strictly by the package. No requested outcomes yields unavailable probability summaries and zero skill utility.

Probabilities retain the selected outcome: inheritance, or end-of-career creation for white skills. Other factor types remain inheritance outcomes. A mixed package is not the chance of generating all factors on a new veteran. Targetless scores omit affinity. Existing source access and training-model limitations still apply.

Aliases share one distinct outcome, with the minimum estimated probability and maximum priority when assumptions differ. Original per-request columns and the arithmetic average remain available. Priorities are bounded to 0.1–100. Multiplying all priorities by the same factor does not change normalized scores, within these bounds.

Deck preparation remains bounded and approximate: priorities affect preliminary skill coverage and the objective scores complete candidate decks. It is not an exhaustive optimization or a full career simulation.

Farming presets are versioned JSON containing an explicit settings whitelist and cleaned planner candidate filters. They exclude collection data, lineage, pins and applied decks. Loading retains the current tree and pins, resets omitted settings to defaults, clears the applied deck and invalidates results. Presets are included in workspace backups and can be exported/imported independently. Existing goal presets and search-only presets remain available.

Each result keeps its original plan and candidate snapshot for explanations and comparisons. Changes mark results outdated and prevent applying them. A new search replaces the snapshot. Comparisons use the same run, show right-minus-left deltas and do not compare unrelated contexts.

Compact help bubbles open on hover, keyboard focus or tap, dismiss with Escape or an outside click, and retain visible warnings. Detailed formulas remain in an expandable calculation section.

These features are independently implemented. UmaLegacyLinker's normalized weighting, diagnostic contributions and comparison design informed the approach; its source code and contextual race-priority tables were not copied. Its generation heuristic does not replace Umaplan's creation model.
