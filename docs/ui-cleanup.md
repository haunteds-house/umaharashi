# UI cleanup — November 2026

The current palette is retained while the Okinawa-inspired design direction is chosen separately.

- Results render from an explicit search snapshot; rendering never replaces the live plan. Sorting uses the live controls, repeats the full candidate search, preserves the selection and does not jump the viewport.
- Worker completion is checked against the active search instance. Superseded and cancelled jobs cannot replace newer results or terminate another worker. Progress and cancellation survive route redraws.
- Settings redraws retain expanded panels, focus and unfinished plan/preset/search drafts. Explicit new/load/restore operations reset old plan drafts.
- Gold/normal choices survive toggling Inspiration only. In inheritance mode, a visible message explains that learning settings affect career generation and offers a Spark % switch.
- Support mode exposes Automatic or an explicit learned-tier cap. The cap can lower an available gold tier to normal; choosing gold cannot create a source that the deck does not contain. Source diagnostics report the modeled learned tier.
- Farm this skill on reference/variant cards maps the chosen version to its farmable white spark, selects the corresponding learned tier, and opens the planner in Spark % mode. Sources and variants support Back navigation within the dialog.
- Collection filters save their own state without invalidating planner results. Removing a desired spark resets the sort to avoid stale per-spark indexes.
- Tooltips use the browser's top layer so they can appear over dialogs, dismiss with Escape or outside click, and do not toggle enclosing labels or disclosure panels. Links from condensed notes remain usable. Help buttons are outside form labels.
- Pair actions are beside the pair name and remain accessible while horizontally scrolling. Decks are collapsed initially; dialogs, small-screen controls, disabled states and table boundaries are tidied.

Validation: pure transition tests cover sort state, remembered learning tiers, variant-to-factor mapping and worker ownership; a deck regression checks explicit tier caps. Browser checks exercise variants → sources → Back → Farm, tier round-trips, rapid sort/order changes, numeric order, retained drafts/panels, and help visibility. Existing import, worker, search, model and preset tests remain in the full suite.
