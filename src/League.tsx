import {useEffect,useMemo,useState} from "react";
import "./League.css";
type Season="S8"|"S7"|"S6";
type Ranking={rank:number;nick:string;pts:number;games:number;top3:number;top1:number;wr:number;clan:string;final?:number};
type Clan={rank:number;name:string;pts:number;players:number;games:number;top3:number;wr:number};
type Entry={id:number;date:string;type:string;original:string;nick:string;place:number|null;pts:number};
type LeagueData={season:Season;players:Ranking[];clans:Clan[];history:Entry[];headings:{games:string;clanGames:string};fetchedAt:string;mode?:"live"|"snapshot"};
const source="https://docs.google.com/spreadsheets/d/1-wjsXxAEC9jLhJvyqNh-sw95GKrIx9dc-QAW0RU33GQ/edit?usp=sharing";
function rate(value:number){return Number.isFinite(value)?(value*100).toFixed(2).replace(".",",")+"%":"—";}
function day(value:string){if(!value)return "—";const m=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+"."+m[2]+"."+m[1]:value;}
export default function League(){
 const [season,setSeason]=useState<Season>("S8");
 const [view,setView]=useState<"players"|"clans"|"history">("players");
 const [data,setData]=useState<LeagueData|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [query,setQuery]=useState(""),[typeFilter,setTypeFilter]=useState(""),[dateFilter,setDateFilter]=useState("");
 const [page,setPage]=useState(0);
 useEffect(()=>{let live=true;setLoading(true);setError("");setPage(0);setTypeFilter("");setDateFilter("");
  fetch("/api/league?season="+season,{headers:{accept:"application/json"}}).then(async r=>{if(!r.ok)throw Error("Данные Google-таблицы временно недоступны");return r.json() as Promise<LeagueData>}).then(v=>{if(live){setData(v);setLoading(false)}}).catch(e=>{if(live){setData(null);setError(String(e));setLoading(false)}});
  return()=>{live=false};},[season]);
 useEffect(()=>{setPage(0)},[query,view,typeFilter,dateFilter]);
 const types=useMemo(()=>[...new Set((data?.history||[]).map(x=>x.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ru")),[data]);
 const days=useMemo(()=>[...new Set((data?.history||[]).map(x=>x.date).filter(Boolean))].sort().reverse(),[data]);
 const rows=useMemo(()=>{
  const q=query.trim().toLocaleLowerCase("ru");
  if(view==="players")return (data?.players||[]).filter(x=>!q||[x.nick,x.clan].join(" ").toLocaleLowerCase("ru").includes(q)).sort((a,b)=>b.pts-a.pts||b.games-a.games||a.nick.localeCompare(b.nick,"ru"));
  if(view==="clans")return (data?.clans||[]).filter(x=>!q||x.name.toLocaleLowerCase("ru").includes(q)).sort((a,b)=>b.pts-a.pts||b.games-a.games||a.name.localeCompare(b.name,"ru"));
  return (data?.history||[]).filter(x=>(!q||[x.nick,x.original,x.type].join(" ").toLocaleLowerCase("ru").includes(q))&&(!typeFilter||x.type===typeFilter)&&(!dateFilter||x.date===dateFilter)).slice().reverse();
 },[data,view,query,typeFilter,dateFilter]);
 const maxPage=Math.max(0,Math.ceil(rows.length/50)-1);
 const visible=rows.slice(Math.min(page,maxPage)*50,(Math.min(page,maxPage)+1)*50);
 return <section className="lgRoot" aria-label="История турниров и рейтинги MCGG LEAGUE">
 <div className="lgHero"><div><span>MCGG LEAGUE BY WWS</span><h2>ЛИГА WWS · АРХИВ И РЕЙТИНГ</h2><p>Результаты турниров, сезонные очки игроков и кланов</p></div><div className="lgCrown" aria-hidden="true">★</div></div>
 <div className="lgSeason" role="group" aria-label="Выбор сезона">{(["S8","S7","S6"] as const).map(s=><button key={s} className={season===s?"selected":""} onClick={()=>setSeason(s)}>СЕЗОН {s.slice(1)}</button>)}</div>
 {loading?<div className="lgMessage">Загружаю данные сезона {season} из Google-таблицы…</div>:error?<div className="lgMessage" role="alert">{error}. <a href={source} target="_blank" rel="noopener noreferrer">Посмотреть таблицу</a></div>:data&&<>
 <div className="lgInfo"><span>Источник: <a href={source} target="_blank" rel="noopener noreferrer">официальная Google-таблица MCGG LEAGUE</a></span><span>{data.mode==="live"?"Данные Google Sheets обновляются с задержкой до 10 минут.":"Архивная копия от 22.11.2026 · автоматическое обновление недоступно."}</span></div>
 <div className="lgMetrics">{[{name:"Игроки в рейтинге",value:data.players.length},{name:"Кланы",value:data.clans.length},{name:"Записи результатов",value:data.history.length},{name:"Сезон",value:season}].map(x=><div key={x.name}><span>{x.name}</span><strong>{x.value}</strong></div>)}</div>
 <div className="lgTabs">{([["players","Рейтинг игроков"],["clans","Рейтинг кланов"],["history","История игр"]] as const).map(([k,label])=><button key={k} className={view===k?"active":""} onClick={()=>setView(k)}>{label}</button>)}</div>
 <div className="lgFilters"><label className="lgSearch">Поиск<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={view==="history"?"Ник, тип турнира…":view==="clans"?"Название клана…":"Ник или клан…"}/></label>
 {view==="history"&&<><label>Тип турнира<select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="">Все типы</option>{types.map(t=><option key={t} value={t}>{t}</option>)}</select></label><label>Дата<select value={dateFilter} onChange={e=>setDateFilter(e.target.value)}><option value="">Все даты</option>{days.map(t=><option key={t} value={t}>{day(t)}</option>)}</select></label></>}</div>
 <div className="lgResultCount">Найдено: {rows.length} {view==="history"?"записей":view==="players"?"игроков":"кланов"} {view==="history"&&season==="S6"&&<span> · История игр S6 отсутствует в исходной таблице</span>}</div>
 <div className="lgScroll"><table><thead>{view==="players"?<tr><th>№</th><th>Игрок</th><th>Клан</th><th>PTS</th><th>{data.headings.games||"Игры"}</th><th>ТОП 1–3</th><th>ТОП 1</th><th>WR</th></tr>:view==="clans"?<tr><th>№</th><th>Клан</th><th>PTS</th><th>Игроки</th><th>{data.headings.clanGames||"Сыгранные турниры"}</th><th>ТОП 1–3</th><th>WR</th></tr>:<tr><th>Дата</th><th>Турнир</th><th>Игрок</th><th>Место</th><th>PTS</th></tr>}</thead><tbody>
 {view==="players"&&(visible as Ranking[]).map((p,i)=><tr key={p.nick+":"+i}><td className="lgRank">{page*50+i+1}</td><td className="lgName">{p.nick}</td><td>{p.clan||"—"}</td><td className="lgPts">{p.pts}</td><td>{p.games}</td><td>{p.top3}</td><td>{p.top1}</td><td>{rate(p.wr)}</td></tr>)}
 {view==="clans"&&(visible as Clan[]).map((c,i)=><tr key={c.name+":"+i}><td className="lgRank">{page*50+i+1}</td><td className="lgName">{c.name}</td><td className="lgPts">{c.pts}</td><td>{c.players}</td><td>{c.games}</td><td>{c.top3}</td><td>{rate(c.wr)}</td></tr>)}
 {view==="history"&&(visible as Entry[]).map(h=><tr key={h.id}><td>{day(h.date)}</td><td>{h.type}</td><td className="lgName">{h.nick}</td><td>{h.place===null?"—":h.place}</td><td className="lgPts">{h.pts}</td></tr>)}
 </tbody></table>{!rows.length&&<div className="lgEmpty">По этим фильтрам записей нет.</div>}</div>
 {rows.length>50&&<div className="lgPager"><button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Назад</button><span>Страница {Math.min(page,maxPage)+1} из {maxPage+1}</span><button disabled={page>=maxPage} onClick={()=>setPage(p=>Math.min(maxPage,p+1))}>Вперёд</button></div>}
 <div className="lgBottom">Рейтинги и PTS берутся из Google-таблицы без изменения её формул. Архив отображает записи результатов игроков, а не автоматически восстановленные отдельные матчи. {data.mode==="live"?"Новые записи появятся после синхронизации Google Sheets.":"Для обновления архива после изменений в таблице потребуется повторная загрузка данных на сайт."}</div>
 </>}
 </section>;
}
