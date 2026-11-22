import {useEffect,useState} from "react";
import Tournament from "./Tournament";
import "./SiteShell.css";

type Page="home"|"tournaments"|"ranking"|"players"|"clans"|"calendar"|"organizers"|"profile"|"event";
type Nav={id:Page;title:string;glyph:string};
const navigation:Nav[]=[
 {id:"home",title:"Главная",glyph:"⌂"},
 {id:"tournaments",title:"Турниры",glyph:"▦"},
 {id:"ranking",title:"Рейтинг",glyph:"♛"},
 {id:"players",title:"Игроки",glyph:"♙"},
 {id:"clans",title:"Кланы",glyph:"♜"},
 {id:"calendar",title:"Расписание",glyph:"▤"}
];
const labels:Record<Page,string>={home:"Главная",tournaments:"Турниры",ranking:"Рейтинг",players:"Игроки",clans:"Кланы",calendar:"Расписание",organizers:"Организаторам",profile:"Профиль",event:"Турнир 4×4"};
function initial():Page{const hash=location.hash.replace(/^#\/?/,"");const key=hash.split("/")[0] as Page;return [...navigation.map(x=>x.id),"organizers","profile","event"].includes(key)?key:"home"}
export default function SiteShell(){
 const [page,setPage]=useState<Page>(initial);
 const [mobileMenu,setMobileMenu]=useState(false);
 const [season,setSeason]=useState("S8");
 useEffect(()=>{const onHash=()=>{setPage(initial());setMobileMenu(false)};window.addEventListener("hashchange",onHash);return()=>window.removeEventListener("hashchange",onHash)},[]);
 const go=(id:Page)=>{setPage(id);setMobileMenu(false);const hash="#/"+id;if(location.hash!==hash)history.pushState(null,"",hash);window.scrollTo({top:0,behavior:"instant"})};
 const tile=(id:Page,eyebrow:string,title:string,subtitle:string,icon:string,kind="")=><button type="button" className={"hubTile "+kind} onClick={()=>go(id)} key={id}><span className="hubTileIcon">{icon}</span><span className="hubTileEyebrow">{eyebrow}</span><strong>{title}</strong><span>{subtitle}</span><span className="hubTileGo">Открыть <span aria-hidden="true">↗</span></span></button>;
 return <div className="hubWrap">
 <div className="hubTopline"><span>MAGIC CHESS: GO GO</span><span>MCGG LEAGUE BY WWS · ТЕСТОВАЯ СТРУКТУРА 3.0</span></div>
 <header className="hubHeader"><button className="hubLogo" onClick={()=>go("home")} aria-label="MCGG LEAGUE — главная"><span className="hubMark">W</span><span><strong>MCGG LEAGUE</strong><small>BY WWS · ESPORTS PLATFORM</small></span></button>
 <button className="hubMenuButton" aria-expanded={mobileMenu} aria-label="Открыть меню" onClick={()=>setMobileMenu(!mobileMenu)}>☰ <span>Меню</span></button>
 <nav className={"hubNav "+(mobileMenu?"hubNavOpen":"")} aria-label="Основная навигация">{navigation.map(n=><button key={n.id} onClick={()=>go(n.id)} className={page===n.id?"isCurrent":""}><span aria-hidden="true">{n.glyph}</span> {n.title}</button>)}</nav>
 <button className={"hubLogin "+(page==="profile"?"isCurrent":"")} onClick={()=>go("profile")}><span aria-hidden="true">♙</span> Войти</button>
 </header>
 {page==="event"?<><div className="hubEventBack"><button onClick={()=>go("tournaments")}>← Все турниры</button><span>Архив · 4×4 · 8 команд · BO3</span></div><div className="hubEvent"><Tournament/></div></>:
 <main className="hubMain">
 {page==="home"?<>
  <section className="hubHero"><div className="hubHeroContent"><span className="hubKicker"><i/> MAGIC CHESS GO GO · MCGG LEAGUE</span><div className="hubHeroCrown">♛</div><h1>MCGG<br/>LEAGUE<br/><em>by WWS</em></h1><p>Турнирная платформа Magic Chess Go Go. Сражайся, побеждай и поднимайся в рейтинге!</p><div className="hubHeroButtons"><button className="hubBtnMain" onClick={()=>go("tournaments")}>К турнирам ↗</button><button className="hubBtnOutline" onClick={()=>go("ranking")}>Рейтинг лиги →</button></div></div></section>
  <section className="hubFeatureBar" aria-label="Навигация по лиге"><div><span>♛</span><strong>ТУРНИРЫ</strong><small>Драфт · Фасткап · 4×4</small></div><div><span>♜</span><strong>РЕЙТИНГ</strong><small>Сезоны S6 / S7 / S8</small></div><div><span>♙</span><strong>ИГРОКИ И КЛАНЫ</strong><small>История и статистика</small></div><div><span>✦</span><strong>ЛИГА WWS</strong><small>Magic Chess Go Go</small></div></section>
  <div className="hubSectionIntro hubSectionTwoCol"><div><span>01 / ИССЛЕДУЙ ПЛАТФОРМУ</span><h2>ВСЁ ДЛЯ <em>MCGG LEAGUE.</em></h2></div><p>Участвуй в турнирах, следи за результатами, исследуй статистику игроков и узнавай о новых событиях.</p></div>
  <div className="hubTiles">
   {tile("tournaments","ТУРНИРНАЯ АРЕНА","ТУРНИРЫ","Сетки, участники и итоги.","♛","hubFeatured")}
   {tile("ranking","СЕЗОННЫЕ ЛИДЕРЫ","РЕЙТИНГ","PTS, победы, ТОП-3 и WR.","🏆")}
   {tile("players","ИСТОРИЯ ЛИГИ","ИГРОКИ","Статистика и достижения.","♙")}
   {tile("clans","КЛАНЫ ЛИГИ","КЛАНЫ","Составы и командный рейтинг.","♜")}
   {tile("calendar","АНОНСЫ","РАСПИСАНИЕ","Ближайшие соревнования.","▤")}
   {tile("organizers","ОРГАНИЗАЦИЯ","ОРГАНИЗАТОРАМ","Управление турнирами.","⚙")}
  </div>
  <section className="hubHighlight"><div><span className="hubKicker">02 / ТУРНИР В АРХИВЕ</span><h2>MCGG LEAGUE<br/><em>4 × 4 · BO3</em></h2><p>Реальная турнирная сетка на восемь команд, участники, результаты матчей, пики и статистика.</p><button className="hubBtnMain" onClick={()=>go("event")}>Открыть сетку ↗</button></div><div className="hubHighlightArt"><img src="/assets/league-trophy.svg" alt="Золотой кубок MCGG LEAGUE" loading="lazy"/></div></section>
  <div className="hubSectionIntro hubSectionTwoCol"><div><span>03 / СЕЗОННЫЕ РЕЙТИНГИ</span><h2>НА ПУТИ <em>К ПОБЕДЕ.</em></h2></div><p>Архив сезонов S6, S7 и S8. Следи за результатами и достижениями игроков и кланов.</p></div>
  <div className="hubHomeBottom"><button onClick={()=>go("ranking")}><span className="hubBottomTag">РЕЙТИНГ ИГРОКОВ</span><strong>ТВОЁ МЕСТО<br/><em>В ИСТОРИИ ЛИГИ</em></strong><span>Результаты по сезонам <b>↗</b></span></button><button onClick={()=>go("clans")}><span className="hubBottomTag">РЕЙТИНГ КЛАНОВ</span><strong>СИЛА КЛАНА<br/><em>В ЕДИНСТВЕ</em></strong><span>Составы и статистика <b>↗</b></span></button></div>
  <section className="hubCTA"><div><span>MCGG LEAGUE · BY WWS</span><h2>ГОТОВ <em>К НОВОЙ БИТВЕ?</em></h2><p>Выбирай турнир и становись частью MCGG LEAGUE.</p></div><button className="hubBtnMain" onClick={()=>go("tournaments")}>Смотреть турниры ↗</button></section>
 </>:<>
 <section className="hubPageHeading"><div><span className="hubKicker">MCGG LEAGUE / {labels[page].toUpperCase()}</span><h1>{labels[page].toUpperCase()}</h1></div><button className="hubBtnOutline" onClick={()=>go("home")}>← На главную</button></section>
 {page==="tournaments"&&<><div className="hubSectionIntro"><span>АРХИВ И СОБЫТИЯ</span><h2>ТУРНИРЫ ЛИГИ</h2><p>Турниры от 16 участников получают отдельные страницы; небольшие фасткапы остаются в истории игр.</p></div><div className="hubTiles hubTournamentTiles">
 <button className="hubArchive" onClick={()=>go("event")}><div className="hubArchiveArt">4<span>×</span>4</div><div className="hubArchiveBody"><span className="hubStatus">СУЩЕСТВУЮЩИЙ ТУРНИР</span><h3>4×4 · BEST OF 3</h3><p>21.11.2026 · 8 команд / 32 игрока</p><span>Открыть сетку, составы и статистику ↗</span></div></button>
 <div className="hubComing"><span>НОВЫЙ ФОРМАТ</span><h3>ДРАФТ 16 / 32</h3><p>Будущие страницы регистрации, лобби, этапов и результатов.</p><small>Шаблон готовится</small></div>
 <div className="hubComing"><span>КОМАНДНЫЕ ТУРНИРЫ</span><h3>4×4 · 16 / 32</h3><p>Сетки, команды, составы и карты BO3.</p><small>Шаблон готовится</small></div>
 </div><div className="hubInfoStrip">История фасткапов на 8 участников будет отображаться отдельным списком без индивидуальных страниц. ID присваивается каждому турниру.</div></>}
 {page==="ranking"&&<><div className="hubSectionIntro"><span>ТАБЛИЦЫ ЛИДЕРОВ</span><h2>РЕЙТИНГ ИГРОКОВ И КЛАНОВ</h2><p>Здесь будет размещён существующий архив S6–S8 и автоматический рейтинг будущих турниров.</p></div><div className="hubFilter" aria-label="Выбор сезона">{["S8","S7","S6"].map(s=><button key={s} className={season===s?"active":""} onClick={()=>setSeason(s)}>{s}</button>)}</div><div className="hubEmpty"><span className="hubEmptyIcon">♛</span><h3>СЕЗОН {season}</h3><p>Структура страницы подготовлена. Подключение реальных данных рейтинга из существующего архива — следующий этап; цифры здесь не подменяются примерами.</p><div className="hubFakeColumns"><span>ИГРОК</span><span>PTS</span><span>ИГРЫ</span><span>ТОП-3</span><span>WR</span></div></div></>}
 {page==="players"&&<><div className="hubSectionIntro"><span>ПРОФИЛИ</span><h2>ИГРОКИ</h2><p>Поиск по никнейму, история смены имени, статистика по сезонам и достижения.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">♙</span><h3>КАТАЛОГ ИГРОКОВ</h3><p>Карточки игроков появятся после подключения постоянных ID и данных архива. Не создаём вымышленные профили.</p><div className="hubFakeColumns"><span>НИК</span><span>КЛАН</span><span>PTS</span><span>WR</span></div></div></>}
 {page==="clans"&&<><div className="hubSectionIntro"><span>СООБЩЕСТВА</span><h2>КЛАНЫ</h2><p>Профили кланов, составы, рейтинги и переходы игроков между командами.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">♜</span><h3>КАТАЛОГ КЛАНОВ</h3><p>Следующим шагом подключим существующий рейтинг кланов и реальные составы из базы.</p><div className="hubFakeColumns"><span>КЛАН</span><span>ИГРОКИ</span><span>PTS</span><span>ТОП-3</span></div></div></>}
 {page==="calendar"&&<><div className="hubSectionIntro"><span>КАЛЕНДАРЬ</span><h2>БЛИЖАЙШИЕ ТУРНИРЫ</h2><p>Дата, формат, организатор, условия участия и ссылка на регистрацию.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">▤</span><h3>РАСПИСАНИЕ</h3><p>Пока расписание не синхронизировано с Telegram. Не публикуем неподтверждённые даты.</p></div></>}
 {page==="organizers"&&<><div className="hubSectionIntro"><span>ПАНЕЛЬ УПРАВЛЕНИЯ</span><h2>ОРГАНИЗАТОРАМ</h2><p>Черновики, публикации, управление регистрациями и подтверждение результатов.</p></div><div className="hubTiles"><div className="hubComing"><span>УЖЕ В ТЕСТЕ</span><h3>РУЧНОЙ ВВОД ФАСТКАПОВ</h3><p>На странице существующего турнира есть тестовая вкладка «Фасткапы 3.0». Данные пока локальные.</p><button className="hubTextButton" onClick={()=>go("event")}>Открыть редактор через турнир ↗</button></div><div className="hubComing"><span>СЛЕДУЮЩИЙ ЭТАП</span><h3>TELEGRAM-БОТ</h3><p>Черновики по хэштегам, уникальные ID, редактирование и подтверждение любым организатором.</p></div><div className="hubComing"><span>СЛЕДУЮЩИЙ ЭТАП</span><h3>СЕТКИ 16+</h3><p>Создание драфта, соло и командных турниров с автоматической сеткой.</p></div></div></>}
 {page==="profile"&&<><div className="hubSectionIntro"><span>ЛИЧНЫЙ КАБИНЕТ</span><h2>ПРОФИЛЬ ИГРОКА</h2><p>Личные достижения, сезонные рейтинги, список сыгранных турниров и привязка игрового ника.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">♙</span><h3>ВХОД ЧЕРЕЗ TELEGRAM</h3><p>Авторизация будет подключена после подготовки пользовательских аккаунтов и защиты API. Сейчас кнопка входа не запрашивает пароли и не создаёт профиль.</p></div></>}
 </>}
 </main>}
 <footer className="hubFooter"><strong>MCGG LEAGUE <span>BY WWS</span></strong><span>Magic Chess: Go Go · Сообщество и турниры</span><span>Тестовая структура · Основной сайт не изменён</span></footer>
 </div>
}