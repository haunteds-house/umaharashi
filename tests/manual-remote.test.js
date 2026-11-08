import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyPlan,Engine,placeVeteran,scorePair} from '../core.js';
import {prepareDecks} from '../deck.js';
import {normalizeRemoteProfile,remoteSearchURL,moeGet,legalBorrowPair} from '../remote-parents.js';
const D=Object.fromEntries(['characters','supports','skills','factors','affinity','races','skill-links'].map(n=>[n,JSON.parse(fs.readFileSync(new URL('../data/'+n+'.json',import.meta.url)))]));
const engine=new Engine(D.affinity,D.factors,D.races,D['skill-links']);
const owned=[30028,20031,20033,20012,20002,30052,30011].map(cardId=>({cardId,limitBreak:2,level:30}));
const opts=plan=>({plan,supports:D.supports,ownedSupports:owned,skills:D.skills,links:D['skill-links'],characters:D.characters});
let chosen;
test('manual deck uses exactly the selected five owned cards and one MLB borrow',()=>{
 const p=emptyPlan();p.scenario='URA';chosen=prepareDecks(opts(p))[0].cards.map(c=>c.id);
 p.deckMode='manual';p.manualDeck=chosen;p.maxOutingCards=0;p.deckMinimums={Speed:6};p.minRaceBonus=100;
 const decks=prepareDecks(opts(p));assert.ok(decks.length);for(const d of decks){assert.deepEqual(d.cards.map(c=>c.id),chosen);assert.equal(d.cards.filter(c=>c.borrowed).length,1);assert.equal(d.cards[5].limitBreak,4);assert.equal(d.cards[0].limitBreak,2);}
});
test('manual deck rejects incomplete, duplicate-character, unowned and target-conflicting choices',()=>{
 const p=emptyPlan();p.scenario='URA';p.deckMode='manual';p.manualDeck=[...chosen];
 p.manualDeck[0]=0;assert.throws(()=>prepareDecks(opts(p)),/Choose five/);
 p.manualDeck=[...chosen];p.manualDeck[1]=chosen[0];assert.throws(()=>prepareDecks(opts(p)),/different characters/);
 p.manualDeck=[...chosen];p.manualDeck[0]=999999;assert.throws(()=>prepareDecks(opts(p)),/absent/);
 p.manualDeck=[...chosen];p.nodes[0].cardId=D.supports.find(c=>c.supportCardId===chosen[0]).charaId*100+1;assert.throws(()=>prepareDecks(opts(p)),/not owned|target/);
});
const profile=()=>({trainer:{account_id:'123456789',name:'Example',follower_num:12},inheritance:{inheritance_id:42,main_parent_id:100101,parent_left_id:100201,parent_right_id:100301,main_blue_factors:103,main_pink_factors:1101,main_green_factors:0,main_white_factors:[],left_blue_factors:202,left_pink_factors:0,left_green_factors:0,left_white_factors:[],right_blue_factors:301,right_pink_factors:0,right_green_factors:0,right_white_factors:[],main_win_saddles:[100],left_win_saddles:[],right_win_saddles:[]}});
test('remote profile keeps exact branch sparks, trainer and race provenance through placement',()=>{
 const v=normalizeRemoteProfile(profile(),engine.factors);assert.equal(v.sparks[0].id,10);assert.equal(v.sparks[0].stars,3);assert.equal(v.parents[0].sparks[0].id,20);assert.equal(v.parents[1].sparks[0].stars,1);assert.equal(v.winsKnown,true);assert.equal(v.stats.speed,0);
 const p=placeVeteran(emptyPlan(),1,v);assert.equal(p.nodes[1].trainerId,'123456789');assert.equal(p.nodes[1].remote,true);assert.equal(p.nodes[3].sparks[0].id,20);
 assert.equal(legalBorrowPair(v,v),false);assert.equal(legalBorrowPair(v,{remote:false}),true);
 const r=profile();delete r.inheritance.left_blue_factors;assert.throws(()=>normalizeRemoteProfile(r,engine.factors),/Incomplete/);
});
test('remote search sends desired white factor IDs and numeric trainer filters only',()=>{
 const f=D.factors.find(f=>f.type===3);const url=new URL(remoteSearchURL({wanted:[10,Number(f.id)],factors:engine.factors,page:2}));assert.equal(url.searchParams.get('optional_white_sparks'),f.id);assert.equal(url.searchParams.get('page'),'2');assert.equal(url.searchParams.get('limit'),'20');assert.throws(()=>remoteSearchURL({trainerId:'https://elsewhere',factors:engine.factors}),/numeric/);
});
test('API key goes only in a request header to uma.moe; failures are actionable',async()=>{
 await moeGet('https://uma.moe/api/v3/search','test-key',{fetcher:async(url,options)=>{assert.equal(options.headers['X-API-Key'],'test-key');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.ok(!url.includes('test-key'));return {ok:true,json:async()=>({items:[]})};}});
 await assert.rejects(()=>moeGet('https://example.com/api/search','test-key'),/Invalid/);
 await assert.rejects(()=>moeGet('https://uma.moe/api/v3/search','test-key',{fetcher:async()=>({ok:false,status:403})}),/rejected/);
});
