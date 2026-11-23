import {useMemo,useState} from "react";
import "./TournamentHub.css";
type Page="home"|"tournaments"|"ranking"|"players"|"clans"|"calendar"|"organizers"|"profile"|"event";
type Filter="all"|"upcoming"|"finished"|"draft"|"teams";
type Tile={id:string;title:string;type:"draft"|"teams";badge:string;format:string;detail:string;image:string;active:boolean;date:string};
const tiles:Tile[]=[
{id:"four",title:"4×4 · BEST OF 3",type:"teams",badge:"АРХИВ ТУРНИРА",format:"КОМАНДНЫЙ · 8 КОМАНД",detail:"Турнирная сетка, составы, результаты матчей и статистика карт",image:"/assets/season8-trophy.webp",active:true,date:""},
{id:"draft32",title:"ДРАФТ · 32",type:"draft",badge:"ШАБЛОН ФОРМАТА",format:"ИНДИВИДУАЛЬНЫЙ · 32 ИГРОКА",detail:"Жеребьёвка, этапы, лобби и результаты — структура будущих турниров",image:"/assets/cta-wws-banner.webp",active:false,date:""},
{id:"draft16",title:"ДРАФТ · 16",type:"draft",badge:"ШАБЛОН ФОРМАТА",format:"ИНДИВИДУАЛЬНЫЙ · 16 ИГРОКОВ",detail:"Регистрация, пары, результаты раундов и таблица участников",image:"/assets/hero-mcgg-fairy.webp",active:false,date:""},
{id:"team16",title:"4×4 · 16 / 32",type:"teams",badge:"ШАБЛОН ФОРМАТА",format:"КОМАНДНЫЙ · 16–32 ИГРОКА",detail:"Командные составы, автоматически формируемые сетки и BO3",image:"/assets/season8-trophy.webp",active:false,date:""}
];
const kinds:{id:Filter;label:string}[]=[{id:"all",label:"Все"},{id:"upcoming",label:"Предстоящие"},{id:"finished",label:"Завершённые"},{id:"draft",label:"Драфт"},{id:"teams",label:"4×4"}];
export default function TournamentHub({go}:{go:(p:Page)=>void}){
 const [filter,setFilter]=useState<Filter>("all"),[search,setSearch]=useState("");
 const visible=useMemo(()=>tiles.filter(t=>(filter==="all"||filter==="finished"&&t.active||filter==="upcoming"&&!t.active||filter===t.type)&&(!search||[t.title,t.format,t.detail].join(" ").toLocaleLowerCase("ru").includes(search.trim().toLocaleLowerCase("ru")))),[filter,search]);
 return <div className="thRoot">
 <section className="thHero">
  <div className="thHeroShine" aria-hidden="true"/>
  <div className="thHeroContent">
   <span className="thEyebrow"><span/> MCGG LEAGUE BY WWS <b> / </b> АРЕНА ТУРНИРОВ</span>
   <h1>ТУРНИРЫ<br/><em>MCGG LEAGUE</em></h1>
   <p>Соревнуйся, побеждай и впиши своё имя в историю Magic Chess Go Go. Все форматы лиги — на одной арене.</p>
   <div className="thHeroActions"><button onClick={()=>document.getElementById("thCatalogue")?.scrollIntoView({behavior:"smooth",block:"start"})} className="thAction">Смотреть турниры <span>→</span></button><button onClick={()=>go("ranking")} className="thActionOutline">Рейтинг сезона ↗</button></div>
  </div>
  <div className="thHeroLabel"><span>♛</span><strong>MCGG</strong><small>SEASON 8</small></div>
 </section>
 <div className="thSubnav" aria-label="Сведения о турнирах"><div><span>♜</span><strong>ФАСТКАПЫ</strong><small>Учитываются в истории игр</small></div><div><span>⚔</span><strong>ДРАФТЫ 16+</strong><small>Отдельные турнирные страницы</small></div><div><span>♛</span><strong>КОМАНДНЫЕ 4×4</strong><small>Сетки, BO3 и статистика</small></div><div><span>✦</span><strong>MCGG LEAGUE</strong><small>Турниры by WWS</small></div></div>
 <section className="thFeature">
  <div className="thSectionHeading"><div><span className="thMicro">01 / ОСОБЫЙ ТУРНИР</span><h2>НА АРЕНЕ <em>4×4</em></h2></div><p>Текущий доступный турнир с отдельной страницей, составами и подробной сеткой.</p></div>
  <button className="thFeatureCard" onClick={()=>go("event")} aria-label="Открыть турнир 4 на 4, сетка и результаты">
   <div className="thFeatureInfo"><span className="thPill"><span className="thPillDot"/> ДОСТУПНА СЕТКА</span><h3>MCGG LEAGUE<br/><em>4×4 · BEST OF 3</em></h3><p>8 команд · 32 игрока · BO3</p><span className="thFeatureBtn">Открыть турнир <b>↗</b></span></div>
   <span className="thFeatureSeal">WWS<br/><small>ARENA</small></span>
   <div className="thFeatureStats"><span><b>8</b> команд</span><span><b>32</b> игрока</span><span><b>BO3</b> формат</span></div>
  </button>
 </section>
 <section className="thCatalog" id="thCatalogue">
  <div className="thSectionHeading"><div><span className="thMicro">02 / ФОРМАТЫ И АРХИВ</span><h2>ВСЕ <em>ТУРНИРЫ.</em></h2></div><p>Выбирай нужный формат. Карточки без опубликованного турнира отмечены как шаблоны дизайна.</p></div>
  <div className="thToolbar"><div className="thFilters" role="group" aria-label="Фильтровать турниры">{kinds.map(k=><button key={k.id} className={filter===k.id?"selected":""} aria-pressed={filter===k.id} onClick={()=>setFilter(k.id)}>{k.label}</button>)}</div><label className="thSearch"><span aria-hidden="true">⌕</span><input type="search" placeholder="Найти турнир..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Поиск турнира"/></label></div>
  <div className="thCards">{visible.length?visible.map((t,i)=><article className={"thCard thCard"+i} key={t.id} style={{backgroundImage:'linear-gradient(180deg,rgba(55,10,20,.06) 0%,rgba(58,10,20,.66) 45%,#350d16 100%),url("'+t.image+'")'}}>
   <span className={"thCardBadge "+(t.active?"thLive":"")}>{t.active?"✓ ":"✧ "}{t.badge}</span>
   <div className="thCardContent"><div className="thCardFormat">{t.format}</div><h3>{t.title}</h3><p>{t.detail}</p><div className="thCardBottom">{t.active?<button onClick={()=>go("event")} className="thCardOpen">Сетка и результаты <b>→</b></button>:<span className="thCardPending">Пока нет опубликованного турнира</span>}</div></div>
  </article>):<div className="thNoResults"><span>✧</span><h3>Ничего не найдено</h3><p>Попробуй выбрать другой формат или изменить запрос.</p><button onClick={()=>{setFilter("all");setSearch("")}}>Сбросить фильтры</button></div>}</div>
  <div className="thArchiveNote"><span>✦</span><p>Фасткапы на 8 участников учитываются в сезонном рейтинге и истории игр без отдельных турнирных страниц. Страницы для турниров от 16 участников будут появляться после публикации.</p><button onClick={()=>go("ranking")}>История и рейтинг ↗</button></div>
 </section>
 <section className="thCTA"><div><span>MCGG LEAGUE · BY WWS</span><h2>ТВОЯ <em>СЛЕДУЮЩАЯ ПОБЕДА</em> НАЧИНАЕТСЯ ЗДЕСЬ.</h2><p>Следи за расписанием и участвуй в турнирах лиги.</p></div><button onClick={()=>go("calendar")}>Расписание турниров <b>→</b></button></section>
 </div>;
}