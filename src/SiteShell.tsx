import {useEffect,useState} from "react";
import Tournament from "./Tournament";
import HomeLanding from "./HomeLanding";
import League from "./League";
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
 const [authModal,setAuthModal]=useState<"login"|"register"|null>(null);
 useEffect(()=>{const onHash=()=>{setPage(initial());setMobileMenu(false)};window.addEventListener("hashchange",onHash);return()=>window.removeEventListener("hashchange",onHash)},[]);
 const go=(id:Page)=>{setPage(id);setMobileMenu(false);const hash="#/"+id;if(location.hash!==hash)history.pushState(null,"",hash);window.scrollTo({top:0,behavior:"instant"})};
 const tile=(id:Page,eyebrow:string,title:string,subtitle:string,icon:string,kind="")=><button type="button" className={"hubTile "+kind} onClick={()=>go(id)} key={id}><span className="hubTileIcon">{icon}</span><span className="hubTileEyebrow">{eyebrow}</span><strong>{title}</strong><span>{subtitle}</span><span className="hubTileGo">Открыть <span aria-hidden="true">↗</span></span></button>;
 return <div className="hubWrap">
 <header className="hubHeader"><button className="hubLogo" onClick={()=>go("home")} aria-label="MCGG LEAGUE — главная"><span className="hubMark">M</span><span><strong>MCGG LEAGUE</strong><small>by WWS</small></span></button>
 <button className="hubMenuButton" aria-expanded={mobileMenu} aria-label="Открыть меню" onClick={()=>setMobileMenu(!mobileMenu)}>☰ <span>Меню</span></button>
 <nav className={"hubNav "+(mobileMenu?"hubNavOpen":"")} aria-label="Основная навигация">{navigation.map(n=><button key={n.id} onClick={()=>go(n.id)} className={page===n.id?"isCurrent":""}>{n.title}</button>)}</nav>
 <div className="hubAuthButtons"><button className="hubSignIn" onClick={()=>setAuthModal("login")}>Вход</button><button className="hubRegister" onClick={()=>setAuthModal("register")}>Регистрация</button></div>
 </header>
  {page==="event"?<><div className="hubEventBack"><button onClick={()=>go("tournaments")}>← Все турниры</button><span>Архив · 4×4 · 8 команд · BO3</span></div><div className="hubEvent"><Tournament/></div></>:
 <main className="hubMain">
 {page==="home"?<HomeLanding go={go}/>:<>
 <section className="hubPageHeading"><div><span className="hubKicker">MCGG LEAGUE / {labels[page].toUpperCase()}</span><h1>{labels[page].toUpperCase()}</h1></div><button className="hubBtnOutline" onClick={()=>go("home")}>← На главную</button></section>
 {page==="tournaments"&&<><div className="hubSectionIntro"><span>АРХИВ И СОБЫТИЯ</span><h2>ТУРНИРЫ ЛИГИ</h2><p>Турниры от 16 участников получают отдельные страницы; небольшие фасткапы остаются в истории игр.</p></div><div className="hubTiles hubTournamentTiles">
 <button className="hubArchive" onClick={()=>go("event")}><div className="hubArchiveArt">4<span>×</span>4</div><div className="hubArchiveBody"><span className="hubStatus">СУЩЕСТВУЮЩИЙ ТУРНИР</span><h3>4×4 · BEST OF 3</h3><p>21.11.2026 · 8 команд / 32 игрока</p><span>Открыть сетку, составы и статистику ↗</span></div></button>
 <div className="hubComing"><span>НОВЫЙ ФОРМАТ</span><h3>ДРАФТ 16 / 32</h3><p>Будущие страницы регистрации, лобби, этапов и результатов.</p><small>Шаблон готовится</small></div>
 <div className="hubComing"><span>КОМАНДНЫЕ ТУРНИРЫ</span><h3>4×4 · 16 / 32</h3><p>Сетки, команды, составы и карты BO3.</p><small>Шаблон готовится</small></div>
 </div><div className="hubInfoStrip">История фасткапов на 8 участников будет отображаться отдельным списком без индивидуальных страниц. ID присваивается каждому турниру.</div></>}
 {page==="ranking"&&<League/>}
 {page==="players"&&<><div className="hubSectionIntro"><span>ПРОФИЛИ</span><h2>ИГРОКИ</h2><p>Поиск по никнейму, история смены имени, статистика по сезонам и достижения.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">♙</span><h3>КАТАЛОГ ИГРОКОВ</h3><p>Карточки игроков появятся после подключения постоянных ID и данных архива. Не создаём вымышленные профили.</p><div className="hubFakeColumns"><span>НИК</span><span>КЛАН</span><span>PTS</span><span>WR</span></div></div></>}
 {page==="clans"&&<><div className="hubSectionIntro"><span>СООБЩЕСТВА</span><h2>КЛАНЫ</h2><p>Профили кланов, составы, рейтинги и переходы игроков между командами.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">♜</span><h3>КАТАЛОГ КЛАНОВ</h3><p>Следующим шагом подключим существующий рейтинг кланов и реальные составы из базы.</p><div className="hubFakeColumns"><span>КЛАН</span><span>ИГРОКИ</span><span>PTS</span><span>ТОП-3</span></div></div></>}
 {page==="calendar"&&<><div className="hubSectionIntro"><span>КАЛЕНДАРЬ</span><h2>БЛИЖАЙШИЕ ТУРНИРЫ</h2><p>Дата, формат, организатор, условия участия и ссылка на регистрацию.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">▤</span><h3>РАСПИСАНИЕ</h3><p>Пока расписание не синхронизировано с Telegram. Не публикуем неподтверждённые даты.</p></div></>}
 {page==="organizers"&&<><div className="hubSectionIntro"><span>ПАНЕЛЬ УПРАВЛЕНИЯ</span><h2>ОРГАНИЗАТОРАМ</h2><p>Черновики, публикации, управление регистрациями и подтверждение результатов.</p></div><div className="hubTiles"><div className="hubComing"><span>УЖЕ В ТЕСТЕ</span><h3>РУЧНОЙ ВВОД ФАСТКАПОВ</h3><p>На странице существующего турнира есть тестовая вкладка «Фасткапы 3.0». Данные пока локальные.</p><button className="hubTextButton" onClick={()=>go("event")}>Открыть редактор через турнир ↗</button></div><div className="hubComing"><span>СЛЕДУЮЩИЙ ЭТАП</span><h3>TELEGRAM-БОТ</h3><p>Черновики по хэштегам, уникальные ID, редактирование и подтверждение любым организатором.</p></div><div className="hubComing"><span>СЛЕДУЮЩИЙ ЭТАП</span><h3>СЕТКИ 16+</h3><p>Создание драфта, соло и командных турниров с автоматической сеткой.</p></div></div></>}
 {page==="profile"&&<><div className="hubSectionIntro"><span>ЛИЧНЫЙ КАБИНЕТ</span><h2>ПРОФИЛЬ ИГРОКА</h2><p>Личные достижения, сезонные рейтинги, список сыгранных турниров и привязка игрового ника.</p></div><div className="hubEmpty"><span className="hubEmptyIcon">♙</span><h3>ВХОД ЧЕРЕЗ TELEGRAM</h3><p>Авторизация будет подключена после подготовки пользовательских аккаунтов и защиты API. Сейчас кнопка входа не запрашивает пароли и не создаёт профиль.</p></div></>}
 </>}
 </main>}
 <footer className="hubFooter"><strong>MCGG LEAGUE <span>BY WWS</span></strong><span>Magic Chess: Go Go · Сообщество и турниры</span><span>Тестовая структура · Основной сайт не изменён</span></footer>
 {authModal&&<div className="hubModalOverlay" onClick={()=>setAuthModal(null)}><div className="hubModal" role="dialog" aria-modal="true" aria-label={authModal==="login"?"Вход в MCGG LEAGUE":"Регистрация в MCGG LEAGUE"} onClick={e=>e.stopPropagation()}><button className="hubModalClose" onClick={()=>setAuthModal(null)} aria-label="Закрыть">×</button><div className="hubModalCrown">♛</div><h2>{authModal==="login"?"ВХОД В ЛИГУ":"РЕГИСТРАЦИЯ"}</h2><p>Личные аккаунты MCGG LEAGUE будут подключены через Telegram с проверкой личности и привязкой игрового профиля.</p><div className="hubModalNotice">Сейчас работает тестовая версия оформления. Авторизация ещё не подключена, поэтому данные для входа не запрашиваются.</div><button className="hubModalOK" onClick={()=>setAuthModal(null)}>Понятно</button><button className="hubModalSwitch" onClick={()=>setAuthModal(authModal==="login"?"register":"login")}>{authModal==="login"?"Перейти к регистрации":"Уже есть аккаунт? Вход"}</button></div></div>}
 </div>
}