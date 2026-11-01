# Planning research review — 1 November 2026

The public uma.guide sitemap supplied 85 English guide/article pages, including
beginner subpages, archived CM guides, release schedules and esports articles.
All 85 pages were retrieved successfully. Detailed implementation review focused
on parenting, decks, scenarios, inheritance and CM9–CM21; this is not a claim that
every table or formula in the full archive has been independently verified.

## Implemented

| Finding | Umaplan change | Source |
|---|---|---|
| Parent farming needs skill access as well as training strength | Four starter loop packages; editable skill/training balance | [Parenting](https://uma.guide/guides/parenting-in-umamusume) |
| Scenario deck structures are starting frameworks | Editable type minimums and race bonus; Unity, Trackblazer and Grand Concert templates | [Unity](https://uma.guide/guides/unity-cup-deckbuilding-guide), [Trackblazer](https://uma.guide/guides/trackblazer), [Grand Concert](https://uma.guide/guides/grand-concert) |
| Group cards represent several characters and have scenario restrictions | Full member conflicts, scenario exclusions and card-specific outing allowances | [Group cards](https://uma.guide/guides/group-cards), MDB tables below |
| Trackblazer disables character-specific career events | Remove character-event skill sources from that scenario's evaluation | [Trackblazer](https://uma.guide/guides/trackblazer) |
| Updated URA/Unity provide their own spirit hints | Conditional white-tier Racing Spirit/Ignited Spirit sources; individually overridable with Inspiration only | [Updated scenarios](https://uma.guide/guides/updated-ura-unity) |
| Independent Training should not assume reliable event-chain completion | Optional exclusion of card/character event skill sources; no invented completion probability | [Independent Training](https://uma.guide/guides/independent-training) |
| CM recommendations depend on course geometry and patch | Four named CM21 white-spark packages, with separate guidance for direct-parent uniques | [CM21](https://uma.guide/guides/cm21-guide) |
| Current Global course data is publicly available | 119-course context selector, late-race boundary and final straight | [uma.moe resources](https://uma.moe/resources/) |

Presets add skills without deleting existing goals and save the previous plan.
The 90/10 weighting and scenario starting choices are Umaplan planning defaults,
not values claimed to come from a guide. CM presets are for farming parents;
they do not prescribe the gold skills to buy on the final racer.

## Conflicts and limits

- Older spark guidance uses additive lineage boosts; the newer parenting article
  and Hakuraku's observed data support the exponential model already in Umaplan.
  No change to that model was needed.
- Mid-rank star distributions differ between the parenting article and observed
  spark-generation research. No new star-distribution calculator was introduced.
- Grand Concert guidance quotes a 45% Light Hello event rate; Hakuraku's newer
  sample reports about 40%, with qualifications about the test setup. The
  existing training index is not a full scenario simulation; it was not silently
  replaced with an empirical placement model.
- Normal/+ spirit families remain interchangeable in the existing approximation.
  Separate variant rolls and their joint probability need further validation.
- CM9 and CM21 share a nominal course but have different timing context. The new
  preset explicitly names CM21 and uses the current course export.
- Full race simulation, stamina survival, skill-point budgets, source hint RNG,
  and actual Independent Training outcomes remain outside the training index.
- Race bonus uses the vendored model at the imported limit break's maximum level,
  rather than pretending an underleveled card already has those effects.
- Card hints/events may contain mutually exclusive choices; conditional access
  is not a promise that every listed skill can be obtained together.

## Data provenance and refresh

`python scripts/planning_data.py` downloads the public resource manifest, verifies
the decompressed MDB/course SHA-256 values, and exports only factual game fields.
The MDB stays temporary; no user upload, API key, browser credential, or server is
needed for these features on GitHub Pages.

Tables: `support_card_data` (outing count), `support_card_group` (members and
member outings), `single_mode_restrict_support` (scenario exclusions), `text_data`
category 35 (track names). Course geometry comes from `simulator_courses.json`.
Each output includes the resource version. Current exports were checked against
MDB version `1.35.3:10008400`. The existing character/skill catalog was not replaced.

Public code/research inspected at uma-moe/umamoe-frontend commit `b38b9ad`,
particularly the research catalog, inheritance notes, spark-generation analysis,
Light Hello observations, CM data tools and master-data browser. No upstream UI
or article text is bundled in the app.

## Useful next integrations

1. Race schedules that compare shared G1 wins across the selected lineage and
   flag aptitude problems, with separate manual/Independent assumptions.
2. Skill-cost and hint budgets, constrained by mutually exclusive event rewards.
3. A source-aware target finder that ranks owned trainees by innate gold coverage.
4. CM observations with visible sample size, date, region and selection bias,
   separate from modeled performance. A live API integration needs a credential
   design appropriate for a public static app; no shared key should be embedded.
5. Research-backed normal/+ outcome probabilities once their joint model is
   validated. A course-context display is not a replacement for race simulation.

The archived CM, beginner, currency, gacha, release and esports material is
context, not a universal prescription for the current planner.
