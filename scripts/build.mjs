import {mkdir,rm,cp,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
const files=['scenario-skills.js','deck-refinement.js','transfer.js','transfer-ui.js','transfer-worker.js','remote-parents.js','assets/umaplan-mark.svg','appearance.js','ui-state.js','farming.js','help.js','index.html','styles.css','themes.css','app.js','reference.js','core.js','storage.js','search-worker.js','veteran-search.js','search-ui.js','deck.js','training.js','training-options.js','planning.js','support-rules.js','picker.js','scenario-supports.js'];
const vendorFiles=(await readdir(new URL('vendor/tierlist/',root))).filter(n=>n.endsWith('.js')).sort().map(n=>'vendor/tierlist/'+n);
files.push(...vendorFiles);
const dataFiles=(await readdir(new URL('data/',root))).filter(n=>n.endsWith('.json')).sort();
const dataContents=await Promise.all(dataFiles.map(n=>readFile(new URL('data/'+n,root),'utf8')));
const sources=await Promise.all(files.map(async name=>[name,await readFile(new URL(name,root),'utf8')]));
// One content-derived version for the entire runtime dependency graph, including
// worker imports. New HTML cannot reuse an older cached planner or stylesheet.
const version=createHash('sha256').update(dataContents.join('\0')).update(sources.map(([name,source])=>name+'\0'+source).join('\0')).digest('hex').slice(0,16);
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await cp(new URL('vendor/',root),new URL('vendor/',dist),{recursive:true,filter:source=>!source.endsWith('.py')});
for(const [name,source] of sources){
  const output=source.replace('./data/${n}.json','./data/${n}.json?v='+version).replace(/(\.\/[\w./-]+\.(?:js|css|svg))(?=['"`])/g,`$1?v=${version}`);
  await mkdir(new URL('.',new URL(name,dist)),{recursive:true});
  await writeFile(new URL(name,dist),output);
}
await cp(new URL('data/',root),new URL('data/',dist),{recursive:true});

console.log(`Built dist/ — static GitHub Pages app (${version}).`);
