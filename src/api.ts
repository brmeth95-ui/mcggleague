export type Team = {name:string;players:string[];reserves:string[]};
export type Match = {a:number|null;b:number|null;sa:number;sb:number;picks:string[];pickPlayers:string[]};
export type TournamentState = {teams:Team[];matches:Match[]};
async function request<T>(path:string,init?:RequestInit):Promise<T>{const res=await fetch('/api/'+path,init);if(!res.ok)throw new Error((await res.text()).slice(0,160));return res.json() as Promise<T>}
export const getTournament=()=>request<TournamentState>('tournament');
export const verifyAdmin=(data:{password:string})=>request<boolean>('login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
export const saveTournament=(data:TournamentState&{password:string})=>request<{ok:boolean}>('tournament',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
