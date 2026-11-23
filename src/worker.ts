import type { Fetcher } from "@cloudflare/workers-types";
export interface Env {ASSETS:Fetcher;}
const snapshot={"teams":[{"name":"CMT-1","players":["CMT | poss","CMT | NISTRIAN","CMT | Terrorblade","AST · Iwy88"],"reserves":["ANTEK ASING",""]},{"name":"BB-1","players":["BB | Twitch:Nurma_jk","BB | Накажу","BB | Super Maffin","BB | bash"],"reserves":["BB | Malvina",""]},{"name":"TTTS","players":["TTTS · Floxy","TTTS · SaaGa","TTTS · GERREE","TTTS · TitPulon"],"reserves":["SUPER FORZE",""]},{"name":"VST","players":["VST • NovaStarML","VST • EvgeniyZXC","VST • AshanOne","VST • KINRE"],"reserves":["VST • Zhan45ZXC",""]},{"name":"BB-2","players":["BB | sosison","BB | Ameksis31","serenata","BB | RUIS/**/"],"reserves":["",""]},{"name":"WWS-1","players":["WWS/Vsem_ku ^_^","WWS/Gribnik","WWS/Riko","WWS/Chaos"],"reserves":["",""]},{"name":"CMT-2","players":["CMT | Paypal_me_$30000","CMT | }|{ona","CMT | nsess","CMT | Nightwing"],"reserves":["",""]},{"name":"WWS-2","players":["WWS/VtorNICK","WWS/KlaraUstala","WWS/Амир","WWS/Coco Zamm"],"reserves":["WWS/GooZ","WWS/Henaksis"]}],"matches":[{"a":0,"b":1,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]},{"a":2,"b":3,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]},{"a":4,"b":5,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]},{"a":6,"b":7,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]},{"a":null,"b":null,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]},{"a":null,"b":null,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]},{"a":null,"b":null,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]},{"a":null,"b":null,"sa":0,"sb":0,"picks":["","","","","","","","","","","","","","","","","","","","","","","",""],"pickPlayers":["","","","","","","","","","","","","","","","","","","","","","","",""]}]};
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers});
export default {async fetch(request:Request,env:Env){
 const u=new URL(request.url);
 if(u.pathname==="/api/tournament"&&request.method==="GET"){
  try{const r=await fetch("https://mcggleaguewws.brmeth95.workers.dev/api/tournament",{headers:{"accept":"application/json"}});if(!r.ok)return json(snapshot);return new Response(await r.text(),{headers});}catch{return json(snapshot);}
 }
 if(u.pathname==="/api/league"&&request.method==="GET"){
   const season=u.searchParams.get("season")||"S8";
   if(!["S6","S7","S8"].includes(season))return json({error:"Invalid season"},400);
   // Preview must remain independent from the production Worker's reachability.
   // The compressed archived baseline is the same read-only backup bundled on main.
   // This mirrors production's fallback and does not modify D1 or the source sheet.
   try{
    const archive=await env.ASSETS.fetch(new Request(new URL("/data/league-"+season+".json.gz",u.origin).toString()) as unknown as import("@cloudflare/workers-types").Request);
    if(!archive.ok||!archive.body)throw new Error("Missing season archive");
    const text=await new Response(archive.body.pipeThrough(new DecompressionStream("gzip"))).text();
    const data=JSON.parse(text) as {season?:string;players?:unknown;clans?:unknown};
    if(data.season!==season||!Array.isArray(data.players)||!Array.isArray(data.clans))throw new Error("Invalid season archive");
    return json({...data,mode:"snapshot"});
   }catch(e){console.error("Preview season archive unavailable",e);return json({error:"Рейтинг временно недоступен"},503);}
 }
 if(u.pathname==="/api/upcoming"&&request.method==="GET"){
   try{const asset=await env.ASSETS.fetch(new Request(new URL("/data/upcoming.json",u.origin).toString()) as unknown as import("@cloudflare/workers-types").Request);
    if(asset.ok){const data=await asset.json() as {tournaments?:unknown};return json({tournaments:Array.isArray(data?.tournaments)?data.tournaments.slice(0,2):[]})}
   }catch{}return json({tournaments:[]});
 }
 if(u.pathname==="/api/presence")return json({ok:true});
 if(u.pathname==="/api/login")return json(false);
 if(u.pathname.startsWith("/api/"))return json({error:"Read-only preview"},403);
 return env.ASSETS.fetch(request as unknown as import("@cloudflare/workers-types").Request);
}};
