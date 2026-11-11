# Transfer optimizer

The `#transfer` tab uses the imported local veteran collection. It runs in a
separate worker and produces a review report; it cannot delete roster entries
or transfer veterans in game. Settings and manual protections are included in
workspace backups. Analysis results remain session-only and become stale after
collection, plan or optimizer-setting changes.

## Relation to Uma Legacy Linker

The workflow is informed by the public Transfer Helper specification in
https://github.com/Rom1foucher/UmaLegacyLinker/blob/main/docs/SCORING.md#12-transfer-helper
and its user guide, inspected November 2026. This is original JavaScript, not
a port of the GPL Python implementation. No upstream application code is copied.

This implementation uses a deliberately narrower, auditable coverage model.
It does **not** reproduce upstream contextual utility, race-profile scoring,
regret thresholds, strategic skill packages, upcoming Champion Meetings or the
exhaustive strict-dominance proof. No result is labeled “strictly safe.”

## Comparisons

Groups require the same outfit/card ID, same direct Unique spark IDs and the
same two ancestor card IDs. Ancestors are sorted by identity, so exchanging
left and right does not change a branch. Within each group we compare:

- Every direct spark and its stars, including stat, aptitude, skill, Unique,
  scenario and race sparks.
- Every recorded race win, independently for the veteran and both ancestors.
- Every ancestor spark and its stars, separately for each ancestor identity.
- Optionally all recorded racing stats, aptitudes, learned skill levels and rating.

Comparing all wins rather than only G1 groups is conservative. No race win is
silently dropped. Same ancestor identities preserve compatibility structure;
this restriction deliberately misses potential replacements with different
but equally useful ancestry. Recorded ratings/stats do not prove equal racing
performance, even with the optional preservation setting enabled.

Individual mode requires a retained copy with at least the candidate's value
in every dimension. Collective mode can use a different retained copy for each
dimension. It therefore preserves individual signals but does not preserve
all combinations on a single veteran. Its UI and export identify collective
coverage and the exact witness for each checked value.

We greedily remove redundant copies in deterministic order (protection, number
of dimensions, rating, numeric ID), honoring the configured retained minimum.
This is not guaranteed to find a globally minimum portfolio. Witnesses are
recomputed against the final retained set, preventing cycles or references to
other transfer candidates. Unknown/incomplete records cannot act as witnesses.

## Protections and missing data

In-game `is_locked`, non-empty memos, manual protections, and local
`sourceId` references in the current/saved plans are retained. Import normalization
now preserves lock/saved metadata. Old normalized collections cannot recover
flags discarded by earlier versions; reimport the original veteran JSON.
Missing lock status, missing parents/sparks/race histories or unknown spark IDs
produce Review, never a transfer recommendation.

Old umadump ancestry snapshots can omit original local veteran IDs. The app
cannot infer those references from similar snapshots. Protect any valued racing
team member or breeding material manually if it is not already locked/memoed.
The optimizer has no connection to the game and no current team roster feed.

## Verification

`tests/transfer.test.js` covers import flags, deterministic duplicates, every
protection source, incomplete data, outfit/Unique/ancestry separation, spark and
race preservation, collective witnesses, minimum retained counts, optional
racing values and the real string-ID factor catalog. UI checks cover tab routing,
empty state and settings. Runtime packaging includes both worker and module.

The export’s `is_saved` field is retained as metadata only. It is not a lock or
a manual protection signal and does not prevent transfer recommendations.
