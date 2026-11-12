# Scenario skill acquisition

Scenario selection alone no longer grants all Racing Spirit or Ignited Spirit
sources. Under support settings → Deck templates & requirements → Scenario skill
goals, select the career achievements the plan will pursue. Old plans with no goals
now have no assumed scenario sources. These controls persist in farming presets.

The planner adds only matching scenario rewards, with their actual white/gold tier.
The same sources inform the initial deck search when shared by all compared
scenarios, and each final scenario comparison receives only its own rewards.
Inspiration-only bypasses these sources; a manual learned-tier cap still applies.

Supported routes:

- URA: selected successful Happy Meek contest categories. Energy gives Mood.
  Winning five duels and the strengthened final is a separate Past My Limits goal.
- Unity: selected Extreme Burst facilities give white hints. The November reward
  uses the total normal + Extreme Bursts and highest team stat rank: 4–9 white,
  10+ gold. 13+ changes hint level, not learned rarity. Unknown/tied highest ranks
  are conservatively excluded rather than awarding every possible tied reward.
- Trackblazer: a year-end award gives Glittering Star; overall Climax victory gives
  Radiant Star.
- Grand Concert: completion gives the white reward; 18 songs before GIRLS’ LEGEND U
  (excluding that song) and Great Success give I Wanna Win with You.

Goals are conditional inputs, not simulated achievements. The model does not infer
team rank from support types, simulate event completion, or assign success odds.
Other scenario routes (team-name/lyrics choices, random hints, epithets, and Grand
Masters rewards) remain unmodeled and are not automatically granted.

Normal/+ scenario sparks still share an outcome-family estimate. In Unity,
beating an elite team in race four opens strengthened Zenith; winning that final
unlocks the + outcome. Gold skill access is not this unlock. Variant probabilities
are not estimated. URA + eligibility is not asserted by these controls because
source documentation is less definitive.

Sources checked 2026-11-12:

- https://gametora.com/umamusume/unity-cup (updated Global mechanics)
- https://umamusu.wiki/Game:Unity_Cup (random selection on tied highest ranks)
- https://uma.guide/guides/updated-ura-unity (duel categories, final, Unity +)
- https://gametora.com/umamusume/ura-finals
- https://uma.guide/guides/trackblazer (Climax reward)
- https://gametora.com/umamusume/trackblazer (year-end white reward)
- https://uma.guide/guides/grand-concert (18-song milestone)
- https://gametora.com/umamusume/our-grand-concert
- https://umamusu.wiki/Game:Grand_Live (Great Success condition)
