import type { D1Database, Fetcher } from "@cloudflare/workers-types";
export interface Env {DB:D1Database;ASSETS:Fetcher;}
const teams=Array.from({length:8},(_,i)=>({name:'Команда '+(i+1),players:Array.from({length:4},(_,j)=>'Игрок '+(j+1)),reserves:['','']}));
const blank=(a:number|null=null,b:number|null=null)=>({a,b,sa:0,sb:0,picks:Array(24).fill(''),pickPlayers:Array(24).fill('')});
const initial={teams,matches:[blank(0,1),blank(2,3),blank(4,5),blank(6,7),blank(),blank(),blank(),blank()]};
function json(value:unknown,status=200):Response{return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
let initPromise:Promise<unknown>|undefined;
function initialize(db:D1Database){return initPromise??=(async()=>{await db.batch([db.prepare('CREATE TABLE IF NOT EXISTS tournament_state (id INTEGER PRIMARY KEY, content TEXT NOT NULL)'),db.prepare('CREATE TABLE IF NOT EXISTS tournament_admin (id INTEGER PRIMARY KEY, password_hash TEXT NOT NULL)'),db.prepare("INSERT OR IGNORE INTO tournament_admin (id,password_hash) VALUES (1,'3dd3372442a7bf61d236587299bce3ee7d691bedcce24fb6b799052510e32739')")]);})().catch(e=>{initPromise=undefined;throw e;});}
let analyticsInit:Promise<unknown>|undefined;
function initAnalytics(db:D1Database){return analyticsInit??=db.batch([
 db.prepare("CREATE TABLE IF NOT EXISTS site_visitors (id TEXT PRIMARY KEY, first_seen INTEGER NOT NULL, last_seen INTEGER NOT NULL)"),
 db.prepare("CREATE INDEX IF NOT EXISTS site_visitors_last_seen ON site_visitors(last_seen)"),
 db.prepare("CREATE TABLE IF NOT EXISTS site_daily (day TEXT NOT NULL, visitor TEXT NOT NULL, PRIMARY KEY(day,visitor))"),
 db.prepare("CREATE TABLE IF NOT EXISTS site_analytics (id INTEGER PRIMARY KEY, peak INTEGER NOT NULL)"),
 db.prepare("INSERT OR IGNORE INTO site_analytics(id,peak) VALUES(1,0)")
]).catch(e=>{analyticsInit=undefined;throw e;});}
const moscowDay=(now:number)=>new Date(now+3*60*60*1000).toISOString().slice(0,10);
async function heartbeat(db:D1Database,id:string){
 const now=Date.now();const day=moscowDay(now);await initAnalytics(db);
 await db.batch([
 db.prepare("INSERT INTO site_visitors(id,first_seen,last_seen) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen WHERE site_visitors.last_seen < excluded.last_seen-15000").bind(id,now,now),
 db.prepare("INSERT OR IGNORE INTO site_daily(day,visitor) VALUES(?,?)").bind(day,id),
 db.prepare("UPDATE site_analytics SET peak=MAX(peak,(SELECT COUNT(*) FROM site_visitors WHERE last_seen>=?)) WHERE id=1").bind(now-60000)
 ]);
}
async function readAnalytics(db:D1Database){
 await initAnalytics(db);const now=Date.now();
 const [online,today,total,peak]=await db.batch([
 db.prepare("SELECT COUNT(*) AS n FROM site_visitors WHERE last_seen>=?").bind(now-60000),
 db.prepare("SELECT COUNT(*) AS n FROM site_daily WHERE day=?").bind(moscowDay(now)),
 db.prepare("SELECT COUNT(*) AS n FROM site_visitors"),
 db.prepare("SELECT peak AS n FROM site_analytics WHERE id=1")
 ]);
 const value=(x:any)=>Number(x.results?.[0]?.n||0);
 return {online:value(online),today:value(today),total:value(total),peak:value(peak),updatedAt:now};
}
async function digest(password:string){const bytes=new TextEncoder().encode(password);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}
async function authed(db:D1Database,password:string){const row=await db.prepare('SELECT password_hash FROM tournament_admin WHERE id=1').first<{password_hash:string}>();return !!row&&await digest(password)===row.password_hash}

type Season="S8"|"S7"|"S6";
const SOURCE_SHEET="1-wjsXxAEC9jLhJvyqNh-sw95GKrIx9dc-QAW0RU33GQ";
const SEASON_GIDS:Record<Season,{ranking:number;history:number|null}>={S8:{ranking:1,history:2},S7:{ranking:3,history:4},S6:{ranking:5,history:null}};
type SeasonData={season:Season;players:any[];clans:any[];history:any[];headings:{games:string;clanGames:string};fetchedAt:string;source:string};
const publicCache=new Map<Season,{value:SeasonData;expires:number}>();
function csvCells(input:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],field="",quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'){if(quoted&&input[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(field);field="";}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&input[i+1]==='\n')i++;
   row.push(field);field="";if(row.some(v=>v.trim()))rows.push(row);
   row=[];
  }else field+=c;
 }
 row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 if(rows.length)rows[0][0]=rows[0][0].replace(/^\uFEFF/,"");
 return rows;
}
function numericValue(value:unknown):number{
 const n=Number(String(value??"").trim().replace(",",".").replace("%",""));
 return Number.isFinite(n)?n:0;
}
function percentage(value:unknown):number{
 const text=String(value??"").trim();
 if(!text)return 0;
 const val=numericValue(text);
 return text.includes("%")?val/100:val;
}
function excelDate(value:unknown):string{
 const text=String(value??"").trim();
 if(!text)return "";
 const n=Number(text.replace(",","."));
 if(Number.isFinite(n)&&n>35000&&n<80000)return new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000).toISOString().slice(0,10);
 const match=text.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
 if(match)return match[3]+"-"+match[2].padStart(2,"0")+"-"+match[1].padStart(2,"0");
 return text;
}
async function sheetRows(gid:number):Promise<string[][]>{
 const url="https://docs.google.com/spreadsheets/d/"+SOURCE_SHEET+"/export?format=csv&gid="+gid;
 const r=await fetch(url,{headers:{accept:"text/csv"}});
 if(!r.ok)throw new Error("Google Sheets export failed: "+r.status);
 const text=await r.text();
 if(!text||text.length>4_000_000||text.startsWith("<!DOCTYPE")||text.startsWith("<html"))throw new Error("Invalid Google Sheets CSV");
 return csvCells(text);
}
async function fetchSeason(season:Season):Promise<SeasonData>{
 const found=publicCache.get(season);
 if(found&&found.expires>Date.now())return found.value;
 const ids=SEASON_GIDS[season];
 const [rank,history]=await Promise.all([sheetRows(ids.ranking),ids.history===null?Promise.resolve([]):sheetRows(ids.history)]);
 const players=rank.slice(1).filter(r=>r[1]?.trim()).map(r=>({
  rank:numericValue(r[0]),nick:r[1].trim(),pts:numericValue(r[2]),games:numericValue(r[3]),
  clan:season==="S6"?(r[8]||"").trim():(r[7]||"").trim(),
  final:season==="S6"?numericValue(r[4]):undefined,
  top3:season==="S6"?numericValue(r[5]):numericValue(r[4]),
  top1:season==="S6"?numericValue(r[6]):numericValue(r[5]),
  wr:season==="S6"?percentage(r[7]):percentage(r[6])
 })).filter(p=>p.nick&&p.nick.toLowerCase()!=="ник");
 const clans=rank.slice(1).filter(r=>r[10]?.trim()).map(r=>({
  rank:numericValue(r[9]),name:r[10].trim(),pts:numericValue(r[11]),players:numericValue(r[12]),
  games:numericValue(r[13]),top3:numericValue(r[14]),wr:percentage(r[15])
 })).filter(c=>c.name&&c.name.toLowerCase()!=="клан");
 const records=history.slice(1).filter(r=>(r[3]||"").trim()).map((r,i)=>({
  id:i+2,date:excelDate(r[0]),type:(r[1]||"").trim(),
  original:(r[2]||"").trim(),nick:(r[3]||"").trim(),
  place:r[4]!==undefined&&r[4].trim()!==""?numericValue(r[4]):null,
  pts:numericValue(r[5])
 })).filter(r=>r.nick);
 const value={season,players,clans,history:records,headings:{games:rank[0]?.[3]||"Игры",clanGames:rank[0]?.[13]||"Сыгранные турниры"},fetchedAt:new Date().toISOString(),source:"Google Sheets · MCGG LEAGUE"};
 publicCache.set(season,{value,expires:Date.now()+10*60*1000});
 return value;
}

export default {async fetch(request:Request,env:Env){try{const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request as unknown as import('@cloudflare/workers-types').Request);if(url.pathname==='/api/league'&&request.method==='GET'){
 const season=url.searchParams.get('season')||'S8';
 if(!Object.prototype.hasOwnProperty.call(SEASON_GIDS,season))return json({error:'Unsupported season'},400);
 try{return json(await fetchSeason(season as Season));}
 catch(e){console.error('League source unavailable',e);return json({error:'Google Sheets temporarily unavailable',source:'Google Sheets'},503);}
}
if(!env.DB)return json({error:'D1 is not configured'},503);await initialize(env.DB);if(url.pathname==='/api/presence'&&request.method==='POST'){
 if(request.headers.get('origin')!==url.origin)return json({error:'Forbidden'},403);
 const body=await request.json() as {id?:string};if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.id))return json({error:'Invalid visitor'},400);
 await heartbeat(env.DB,body.id);return json({ok:true});
}if(url.pathname==='/api/analytics'&&request.method==='POST'){
 const body=await request.json() as {password?:string};if(typeof body.password!=='string'||!await authed(env.DB,body.password))return json({error:'Forbidden'},403);
 return json(await readAnalytics(env.DB));
}if(url.pathname==='/api/game-stats'&&request.method==='GET'){
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS tournament_map_stats(id INTEGER PRIMARY KEY, content TEXT NOT NULL)').run();
 const row=await env.DB.prepare('SELECT content FROM tournament_map_stats WHERE id=1').first<{content:string}>();
 return json({games:row?JSON.parse(row.content):[]});
}if(url.pathname==='/api/game-stats'&&request.method==='POST'){
 const body=await request.json() as any;
 if(typeof body?.password!=='string'||!await authed(env.DB,body.password))return json({error:'Forbidden'},403);
 const games=body.games;
 if(!Array.isArray(games)||games.length>24||!games.every((g:any)=>{
  if(!g||!Number.isInteger(g.match)||g.match<0||g.match>7||!Number.isInteger(g.game)||g.game<1||g.game>3||g.key!==g.match+'-'+g.game||!Number.isInteger(g.winner)||g.winner<0||g.winner>7||!Array.isArray(g.players)||g.players.length!==8)return false;
  return g.players.every((p:any)=>p&&Number.isInteger(p.team)&&p.team>=0&&p.team<8&&typeof p.nick==='string'&&p.nick.length<=100&&typeof p.commander==='string'&&p.commander.length<=100&&typeof (p.level??'')==='string'&&/^\d{0,3}$/.test(p.level??'')&&['','MVP','CARRY','TANK'].includes(p.medal));
 }))return json({error:'Invalid map statistics'},400);
 if(new Set(games.map((g:any)=>g.key)).size!==games.length)return json({error:'Duplicate maps'},400);
 const state=await env.DB.prepare('SELECT content FROM tournament_state WHERE id=1').first<{content:string}>();
 const current=state?JSON.parse(state.content):initial;
 if(!games.every((g:any)=>{const m=current.matches[g.match];return m&&[m.a,m.b].includes(g.winner)&&g.players.filter((p:any)=>p.team===m.a).length===4&&g.players.filter((p:any)=>p.team===m.b).length===4;}))return json({error:'Team or winner does not match bracket'},400);
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS tournament_map_stats(id INTEGER PRIMARY KEY, content TEXT NOT NULL)').run();
 await env.DB.prepare('INSERT INTO tournament_map_stats(id,content) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET content=excluded.content').bind(JSON.stringify(games)).run();
 return json({ok:true,count:games.length});
}if(url.pathname==='/api/tournament'&&request.method==='GET'){const row=await env.DB.prepare('SELECT content FROM tournament_state WHERE id=1').first<{content:string}>();return json(row?{...JSON.parse(row.content),teams:JSON.parse(row.content).teams.map((t:any)=>({...t,reserves:Array.isArray(t.reserves)?t.reserves.slice(0,2):['','']})),matches:JSON.parse(row.content).matches.map((m:any)=>({...m,pickPlayers:Array.isArray(m.pickPlayers)?m.pickPlayers.slice(0,24):Array(24).fill('')}))}:initial)}if(url.pathname==='/api/login'&&request.method==='POST'){const b=await request.json() as {password?:string};return json(await authed(env.DB,String(b.password||'')))}if(url.pathname==='/api/tournament'&&request.method==='POST'){const b=await request.json() as any;if(typeof b.password!=='string'||!await authed(env.DB,b.password))return json({error:'Forbidden'},403);if(!Array.isArray(b.teams)||b.teams.length!==8||!b.teams.every((t:any)=>typeof t.name==='string'&&t.name.length<=100&&Array.isArray(t.players)&&t.players.length===4&&t.players.every((p:any)=>typeof p==='string'&&p.length<=100)&&Array.isArray(t.reserves)&&t.reserves.length===2&&t.reserves.every((p:any)=>typeof p==='string'&&p.length<=100))||!Array.isArray(b.matches)||b.matches.length!==8||!b.matches.every((m:any)=>[m.a,m.b].every((v:any)=>v===null||Number.isInteger(v)&&v>=0&&v<8)&&[m.sa,m.sb].every((v:any)=>Number.isInteger(v)&&v>=0&&v<=2)&&Array.isArray(m.picks)&&m.picks.length===24&&m.picks.every((p:any)=>typeof p==='string'&&p.length<=100)&&Array.isArray(m.pickPlayers)&&m.pickPlayers.length===24&&m.pickPlayers.every((p:any)=>typeof p==='string'&&p.length<=100)))return json({error:'Invalid tournament data'},400);await env.DB.prepare('INSERT INTO tournament_state(id,content) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET content=excluded.content').bind(JSON.stringify({teams:b.teams,matches:b.matches})).run();return json({ok:true})}return json({error:'Not found'},404)}catch(e){console.error(e);return json({error:'Server error'},500)}}};
