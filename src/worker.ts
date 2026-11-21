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
export default {async fetch(request:Request,env:Env){try{const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request as unknown as import('@cloudflare/workers-types').Request);if(!env.DB)return json({error:'D1 is not configured'},503);await initialize(env.DB);if(url.pathname==='/api/presence'&&request.method==='POST'){
 if(request.headers.get('origin')!==url.origin)return json({error:'Forbidden'},403);
 const body=await request.json() as {id?:string};if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.id))return json({error:'Invalid visitor'},400);
 await heartbeat(env.DB,body.id);return json({ok:true});
}if(url.pathname==='/api/analytics'&&request.method==='POST'){
 const body=await request.json() as {password?:string};if(typeof body.password!=='string'||!await authed(env.DB,body.password))return json({error:'Forbidden'},403);
 return json(await readAnalytics(env.DB));
}if(url.pathname==='/api/tournament'&&request.method==='GET'){const row=await env.DB.prepare('SELECT content FROM tournament_state WHERE id=1').first<{content:string}>();return json(row?{...JSON.parse(row.content),teams:JSON.parse(row.content).teams.map((t:any)=>({...t,reserves:Array.isArray(t.reserves)?t.reserves.slice(0,2):['','']})),matches:JSON.parse(row.content).matches.map((m:any)=>({...m,pickPlayers:Array.isArray(m.pickPlayers)?m.pickPlayers.slice(0,24):Array(24).fill('')}))}:initial)}if(url.pathname==='/api/login'&&request.method==='POST'){const b=await request.json() as {password?:string};return json(await authed(env.DB,String(b.password||'')))}if(url.pathname==='/api/tournament'&&request.method==='POST'){const b=await request.json() as any;if(typeof b.password!=='string'||!await authed(env.DB,b.password))return json({error:'Forbidden'},403);if(!Array.isArray(b.teams)||b.teams.length!==8||!b.teams.every((t:any)=>typeof t.name==='string'&&t.name.length<=100&&Array.isArray(t.players)&&t.players.length===4&&t.players.every((p:any)=>typeof p==='string'&&p.length<=100)&&Array.isArray(t.reserves)&&t.reserves.length===2&&t.reserves.every((p:any)=>typeof p==='string'&&p.length<=100))||!Array.isArray(b.matches)||b.matches.length!==8||!b.matches.every((m:any)=>[m.a,m.b].every((v:any)=>v===null||Number.isInteger(v)&&v>=0&&v<8)&&[m.sa,m.sb].every((v:any)=>Number.isInteger(v)&&v>=0&&v<=2)&&Array.isArray(m.picks)&&m.picks.length===24&&m.picks.every((p:any)=>typeof p==='string'&&p.length<=100)&&Array.isArray(m.pickPlayers)&&m.pickPlayers.length===24&&m.pickPlayers.every((p:any)=>typeof p==='string'&&p.length<=100)))return json({error:'Invalid tournament data'},400);await env.DB.prepare('INSERT INTO tournament_state(id,content) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET content=excluded.content').bind(JSON.stringify({teams:b.teams,matches:b.matches})).run();return json({ok:true})}return json({error:'Not found'},404)}catch(e){console.error(e);return json({error:'Server error'},500)}}};
