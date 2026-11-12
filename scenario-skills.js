// Global scenario reward routes. See docs/scenario-skills.md for sources.
export const scenarioStats=['Speed','Stamina','Power','Guts','Wit'];
export function cleanScenarioGoals(value={}){
 const g=value&&typeof value==='object'?value:{};
 const list=(v,allowed)=>Array.isArray(v)?[...new Set(v.filter(x=>allowed.includes(x)))]:[];
 const count=(v,max)=>Number.isInteger(v)?Math.max(0,Math.min(max,v)):0;
 return {uraDuels:list(g.uraDuels,[...scenarioStats,'Energy']),uraFinal:g.uraFinal===true,
  unityExtreme:list(g.unityExtreme,scenarioStats),unityBursts:count(g.unityBursts,100),unityHighest:scenarioStats.includes(g.unityHighest)?g.unityHighest:'',
  concertSongs:count(g.concertSongs,22),concertComplete:g.concertComplete===true,concertGreat:g.concertGreat===true,
  trackAward:g.trackAward===true,trackWin:g.trackWin===true};
}
export function scenarioSkillSources(plan,scenario,skills){
 if(plan.scenarioHints===false)return [];
 const g=cleanScenarioGoals(plan.scenarioGoals),byId=new Map(skills.map(s=>[s.skillId,s])),out=[];
 const add=(id,detail)=>{const s=byId.get(id);if(s)out.push({skillId:id,skillName:s.skillName,tier:s.rarity===2?3:1,kind:'scenario',detail:detail+'; planned reward, must earn and purchase during this career'});};
 if(scenario==='URA'){
  for(const stat of g.uraDuels){const i=[...scenarioStats,'Energy'].indexOf(stat);add(210091+10*i,`Win a Happy Meek ${stat} duel (the chosen contest, not necessarily the training facility). Normal/+ spark odds are not separated`);}
  if(g.uraFinal)add(210081,'Win five Happy Meek duels, then defeat strengthened Happy Meek in the URA final');
 }
 if(scenario==='Aoharu'){
  for(const stat of g.unityExtreme)add(210012+10*scenarioStats.indexOf(stat),`Trigger an Extreme Spirit Burst on ${stat} training. A normal burst alone does not unlock this hint. + sparks require defeating strengthened Team Zenith; family odds do not predict the + variant`);
  if(g.unityHighest&&g.unityBursts>=4){const gold=g.unityBursts>=10;add((gold?210011:210012)+10*scenarioStats.indexOf(g.unityHighest),`Senior late November: ${g.unityBursts} total normal + Extreme Bursts, ${g.unityHighest} uniquely highest team stat rank. ${gold?'Burning':'Ignited'} Spirit hint; tied highest ranks give a random stat, not all tied skills. + sparks require defeating strengthened Team Zenith; family odds do not predict the + variant`);}
 }
 if(scenario==='MANT'){
  if(g.trackAward)add(210062,'Earn an Umamusume of the Year award at year end (fan and chairman-bond requirements)');
  if(g.trackWin)add(210061,'Win the Twinkle Star Climax overall points standings');
 }
 if(scenario==='GL'&&g.concertComplete){
  const gold=g.concertSongs>=18&&g.concertGreat;
  add(gold?210071:210072,gold?'Learn at least 18 songs before unlocking GIRLS’ LEGEND U (excluding that song), then achieve a Great Success at the Grand Concert':'Complete the Grand Concert without meeting the gold reward requirements');
 }
 return out;
}

export function scenarioGoalControls(plan){
 const g=cleanScenarioGoals(plan.scenarioGoals),checked=v=>v?'checked':'',show=s=>plan.scenario==='auto'||!plan.scenario||plan.scenario===s;
 const boxes=(key,stats)=>stats.map(stat=>`<label class="check"><input id="goal-${key}-${stat}" type="checkbox" data-scenario-goal="${key}" data-goal-stat="${stat}" ${checked(g[key].includes(stat))}> ${stat}</label>`).join('');
 const flag=(key,label)=>`<label class="check"><input type="checkbox" data-scenario-goal="${key}" ${checked(g[key])}> ${label}</label>`;
 return `<details id="scenario-skill-goals"><summary>Scenario skill goals</summary><p class="tiny">Only selected goals count as scenario sources. These are planned achievements, not predictions from your deck. All rewards still need to be earned and purchased. Inspiration only and learned-tier caps still apply.</p>
 ${show('URA')?`<h4>URA Finale</h4><p class="tiny">Happy Meek duel categories you plan to win. Energy grants Racing Spirit: Mood.</p><div class="filter-grid">${boxes('uraDuels',[...scenarioStats,'Energy'])}</div>${flag('uraFinal','Win five duels and beat strengthened Happy Meek in the final (Past My Limits)')}<p class="tiny">Normal/+ Racing Spirit sparks share a family estimate; the + outcome is not guaranteed.</p>`:''}
 ${show('Aoharu')?`<h4>Unity Cup</h4><p class="tiny">Facilities where you plan to trigger an Extreme Spirit Burst (white Ignited Spirit hints):</p><div class="filter-grid">${boxes('unityExtreme',scenarioStats)}</div><label>Total normal + Extreme Bursts by Senior late November<input type="number" min="0" max="100" step="1" data-scenario-goal="unityBursts" value="${g.unityBursts}"></label><label>Uniquely highest team stat rank at that event<select data-scenario-goal="unityHighest"><option value="">Unknown / tied (do not assume event hint)</option>${scenarioStats.map(s=>`<option ${g.unityHighest===s?'selected':''}>${s}</option>`).join('')}</select></label><p class="tiny">4–9 bursts: white Ignited Spirit. 10+: gold Burning Spirit. 13+ improves hint discount, not gold spark tier. The event awards one stat; ties are random. This uses the team’s stat ranks, not your trainee’s stats or number of trainings in one facility.</p><p class="tiny">For + sparks: defeat the elite team in the fourth team race, then strengthened Team Zenith in the final. Earning a Burning Spirit hint does not itself unlock + sparks.</p>`:''}
 ${show('MANT')?`<h4>Trackblazer</h4>${flag('trackAward','Earn a year-end Umamusume of the Year award (Glittering Star)')}${flag('trackWin','Win the Twinkle Star Climax overall (Radiant Star)')}`:''}
 ${show('GL')?`<h4>Grand Concert</h4>${flag('concertComplete','Complete the Grand Concert (On the Way to Our Dream)')}<label>Songs before unlocking GIRLS’ LEGEND U, excluding that song<input type="number" min="0" max="22" step="1" data-scenario-goal="concertSongs" value="${g.concertSongs}"></label>${flag('concertGreat','Achieve Great Success at the Grand Concert')}<p class="tiny">18+ songs and Great Success upgrades the reward to I Wanna Win with You.</p>`:''}
 <p class="tiny">Other scenario rewards, random hints and linked team-name/lyrics rewards are not assumed. <a href="https://gametora.com/umamusume/unity-cup" target="_blank" rel="noopener">Unity rules</a> · <a href="https://uma.guide/guides/updated-ura-unity" target="_blank" rel="noopener">URA duels</a> · <a href="https://gametora.com/umamusume/our-grand-concert" target="_blank" rel="noopener">Concert rules</a> · <a href="https://uma.guide/guides/trackblazer" target="_blank" rel="noopener">Trackblazer</a></p></details>`;
}
