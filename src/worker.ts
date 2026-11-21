import type { Fetcher } from "@cloudflare/workers-types";
export interface Env {ASSETS:Fetcher;}
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers});
export default {async fetch(request:Request,env:Env){
 const u=new URL(request.url);
 if(u.pathname==="/api/tournament"&&request.method==="GET"){
  try{const r=await fetch("https://mcggleaguewws.brmeth95.workers.dev/api/tournament",{headers:{"accept":"application/json"}});if(!r.ok)return json({error:"Snapshot unavailable"},503);return new Response(await r.text(),{headers});}catch{return json({error:"Snapshot unavailable"},503);}
 }
 if(u.pathname==="/api/presence")return json({ok:true});
 if(u.pathname==="/api/login")return json(false);
 if(u.pathname.startsWith("/api/"))return json({error:"Read-only preview"},403);
 return env.ASSETS.fetch(request as unknown as import("@cloudflare/workers-types").Request);
}};
