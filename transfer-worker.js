import {optimizeTransfers} from './transfer.js';
self.onmessage=({data})=>{try{const result=optimizeTransfers(data.veterans,data.factors,data.settings,data.planIds,(done,total)=>{if(done%10===0||done===total)self.postMessage({type:'progress',done,total});});self.postMessage({type:'result',result});}catch(error){self.postMessage({type:'error',message:error.message});}};
