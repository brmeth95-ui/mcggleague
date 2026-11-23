import {useCallback,useEffect,useMemo,useState} from "react";
import "./HomeLanding.css";
type Page="home"|"tournaments"|"ranking"|"players"|"clans"|"calendar"|"organizers"|"profile"|"event";
type Player={rank:number;nick:string;pts:number;games:number;top3:number;wr:number;clan:string};
type Clan={rank:number;name:string;pts:number;players:number;games:number;wr:number};
type League={season:string;players:Player[];clans:Clan[];mode?:"live"|"snapshot";fetchedAt?:string;source?:string};
type Upcoming={id:string;title:string;startsAt:string;format?:string;status?:"open"|"soon";participants?:number;url?:string};
const icons={
 trophy:<path d="M18 8h28v17c0 12-7 20-14 20s-14-8-14-20V8ZM18 14H8v7c0 11 7 17 15 17m23-24h10v7c0 11-7 17-15 17M32 45v11m-13 0h26"/>,
 ranking:<path d="M7 53h50M14 47V30h9v17M28 47V17h9v30M42 47V8h9v39"/>,
 players:<><circle cx="32" cy="16" r="8"/><path d="M18 53V43a14 14 0 0 1 28 0v10ZM13 24a7 7 0 0 1 0 14M12 40c-5 2-7 6-7 12h8M51 24a7 7 0 0 0 0 14M52 40c5 2 7 6 7 12h-8"/></>,
 clans:<path d="M5 20 16 25 24 12 32 24 40 12 48 25 59 20 51 47H13L5 20ZM13 53h38"/>,
 calendar:<><rect x="8" y="12" width="48" height="45" rx="5"/><path d="M8 24h48M21 6v12M43 6v12M19 35h9m9 0h9m-27 11h9"/></>,
 organizer:<><path d="m9 9 42 46m4-46L13 55"/><path d="M12 11 31 17 24 31 9 25ZM52 11 33 17l7 14 15-6Z"/></>,
 trophySmall:<path d="M19 12h26v15a13 13 0 0 1-26 0V12ZM19 16h-9v8c0 8 5 11 12 11M45 16h9v8c0 8-5 11-12 11M32 40v11m-12 3h24"/>
};
const menu:{id:Page;label:string;caption:string;icon:keyof typeof icons}[]=[
 {id:"tournaments",label:"Турниры",caption:"Актуальные и завершённые турниры",icon:"trophy"},
 {id:"ranking",label:"Рейтинг",caption:"Топ игроков и кланов сезона",icon:"ranking"},
 {id:"players",label:"Игроки",caption:"Профили, статистика и достижения",icon:"players"},
 {id:"clans",label:"Кланы",caption:"Составы, результаты и история",icon:"clans"},
 {id:"calendar",label:"Расписание",caption:"Ближайшие турниры и события",icon:"calendar"},
 {id:"organizers",label:"Организаторам",caption:"Создание и управление турнирами",icon:"organizer"},
];
const asset="/assets/";
function Icon({name,size=42}:{name:keyof typeof icons;size?:number}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4.3" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>}
const dateRu=(v:string)=>{const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric",timeZone:"Europe/Moscow"}):"Дата уточняется"};
export default function HomeLanding({go}:{go:(v:Page)=>void}){
 const [view,setView]=useState<"players"|"clans">("players");
 const [data,setData]=useState<League|null>(null);
 const [pending,setPending]=useState(true),[failed,setFailed]=useState(false);
 const [upcoming,setUpcoming]=useState<Upcoming[]>([]);
 const [upcomingFailed,setUpcomingFailed]=useState(false);
 const [lastChecked,setLastChecked]=useState("");
 const refresh=useCallback(async()=>{
  try{
   const res=await fetch("/api/league?season=S8&refresh="+Date.now(),{cache:"no-store",headers:{accept:"application/json"}});
   if(!res.ok)throw Error("League unavailable");
   const value=await res.json() as League;
   if(!Array.isArray(value.players)||!Array.isArray(value.clans))throw Error("Wrong data");
   setData(value);setFailed(false);setLastChecked(new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}));
  }catch{setFailed(true)}finally{setPending(false)}
  try{
   const response=await fetch("/api/upcoming?refresh="+Date.now(),{cache:"no-store"});
   if(!response.ok)throw Error("Upcoming unavailable");
   const value=await response.json() as {tournaments?:Upcoming[]};
   if(!Array.isArray(value.tournaments))throw Error("Unexpected schedule");
   const items=value.tournaments.filter(x=>x&&typeof x.title==="string"&&typeof x.startsAt==="string"&&Date.parse(x.startsAt)>=Date.now()-86400000);
   items.sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
   setUpcoming(items.slice(0,2));setUpcomingFailed(false);
  }catch{setUpcoming([]);setUpcomingFailed(true)}
 },[]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh()},60000);const onVisible=()=>{if(document.visibilityState==="visible")void refresh()};document.addEventListener("visibilitychange",onVisible);return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",onVisible)}},[refresh]);
 const leaders=useMemo(()=>view==="players"?(data?.players||[]).slice().sort((a,b)=>b.pts-a.pts||b.games-a.games).slice(0,5):(data?.clans||[]).slice().sort((a,b)=>b.pts-a.pts||b.games-a.games).slice(0,5),[data,view]);
 return <div className="hlRoot">
  <section className="hlHero" aria-label="Главный экран MCGG LEAGUE">
   <div className="hlHeroInner">
    <div className="hlGameBrand"><img src={asset+"official-game-logo.webp"} alt="Magic Chess Go Go" /></div>
    <span className="hlOverline">MCGG · СЕЗОН 8</span>
    <h1>«ВЕЛИКОЕ<br/>МАГИЧЕСКОЕ<br/>СТОЛКНОВЕНИЕ»</h1>
    <p>Магия соревнований начинается здесь. Участвуй в турнирах MCGG LEAGUE by WWS!</p>
    <div className="hlHeroActions"><button className="hlPrimary" onClick={()=>go("tournaments")}>К турнирам <b>→</b></button><button className="hlGhost" onClick={()=>go("ranking")}>Рейтинг сезона <b>↗</b></button></div>
   </div>
  </section>
  <nav className="hlQuick" aria-label="Разделы платформы">{menu.map(item=><button key={item.id} onClick={()=>go(item.id)} className="hlQuickItem"><span className="hlIconWrap"><img src={asset+"icon-"+(item.icon==="calendar"?"schedule":item.icon==="organizer"?"organizers":item.icon)+".webp"} alt="" loading="lazy"/></span><strong>{item.label}</strong><small>{item.caption}</small></button>)}</nav>
  <section className="hlSeason">
   <div className="hlSeasonInfo"><span className="hlEyebrow">MCGG LEAGUE BY WWS</span><h2>MCGG LEAGUE<br/><em>СЕЗОН 8</em></h2><p>Архив результатов и соревнования лиги. Побеждай, набирай очки и поднимайся в рейтинге.</p><button onClick={()=>go("ranking")}>Подробнее о сезоне <b>→</b></button></div>
   <div className="hlSeasonArt" aria-hidden="true"/>
   <div className="hlSeasonStats"><div><Icon name="players" size={28}/><strong>{data?.clans?.length??"—"}</strong><small>кланов в рейтинге</small></div><div><Icon name="ranking" size={28}/><strong>{data?.players?.length??"—"}</strong><small>игроков</small></div><div><Icon name="trophySmall" size={28}/><strong>S8</strong><small>сезон лиги</small></div></div>
  </section>
  <div className="hlLower">
   <section className="hlLeaderSection">
    <div className="hlSectionHeading"><h2><span>❧</span> Топ сезона <span>❧</span></h2><div className="hlTabs"><button className={view==="players"?"active":""} onClick={()=>setView("players")}>Игроки</button><button className={view==="clans"?"active":""} onClick={()=>setView("clans")}>Кланы</button></div></div>
    <div className="hlLeaderBoard">
     {pending&&!data?<p className="hlStatus">Загружаю рейтинг сезона S8…</p>:failed&&!data?<p className="hlStatus">Не удалось загрузить рейтинг. Попробуйте обновить страницу.</p>:leaders.length===0?<p className="hlStatus">Пока нет опубликованных результатов.</p>:leaders.map((item,i)=><div key={view==="players"?(item as Player).nick:(item as Clan).name} className="hlLeader">
      <span className={"hlPosition pos"+i}>{i+1}</span><span className="hlLeaderAvatar">{view==="players"?"♟":"♜"}</span><span className="hlLeaderName">{view==="players"?(item as Player).nick:(item as Clan).name}</span><strong>{item.pts} <small>PTS</small></strong>
     </div>)}
    </div>
    <p className="hlSource">{data?.mode==="live"?"Источник: Google Sheets · обновление источника до 10 минут.":data?"Архивный снимок S8 · обновляется только после синхронизации исходных данных.":"Источник: рейтинг MCGG LEAGUE"}{lastChecked&&" · Проверено в "+lastChecked}</p>
    <button className="hlTextLink" onClick={()=>go("ranking")}>Смотреть полный рейтинг →</button>
   </section>
   <section className="hlUpcoming">
    <div className="hlSectionHeading"><h2><span>❧</span> Ближайшие турниры <span>❧</span></h2><button className="hlAll" onClick={()=>go("calendar")}>Все турниры →</button></div>
    <div className="hlUpcomingCards">{[0,1].map((i)=>{const e=upcoming[i];return <button key={e?.id??i} onClick={()=>go("calendar")} className={"hlUpcomingCard card"+i} disabled={!e} aria-label={e?e.title:"Нет опубликованного турнира"}>
      {e?<><span className="hlComingTag">{e.status==="open"?"Регистрация открыта":"Скоро"}</span><div className="hlComingContent"><h3>{e.title}</h3><p>▦ {dateRu(e.startsAt)}</p>{e.format&&<p>♟ {e.format}</p>}</div></>:<><span className="hlComingTag muted">Ждём анонс</span><div className="hlComingContent"><h3>Предстоящий турнир</h3><p>{upcomingFailed?"Расписание пока не подключено":"Информация появится после публикации"}</p></div></>}
     </button>})}</div>
   </section>
  </div>
  <section className="hlBottomCTA"><div><h2>Готов к сражению в MCGG LEAGUE?</h2><p>Следи за турнирами и покажи своё мастерство!</p></div><button className="hlPrimary" onClick={()=>go("tournaments")}>Участвовать <b>→</b></button></section>
 </div>;
}