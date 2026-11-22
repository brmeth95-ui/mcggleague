import {useEffect,useState} from "react";
import "./LeagueEditor.css";
type Cup={id:string;date:string;players:string[];top3:string[];confirmed:boolean};
const KEY="mcgg-preview-fastcups-v1";
const sample="1. WWS/Coco Zamm\n2. EGO • Sanya\n3. WWS/Амир\n4. WWS/Riko\n5. TTTS • GERREE\n6. CMT | poss\n7. Belka23\n8. WWS/GooZ";
const sampleTop="1 - TTTS • GERREE\n2 - CMT | poss\n3 - WWS/Амир";
const normalize=(s:string)=>s.trim().toLowerCase().replace(/\s+/g," ");
function rows(s:string,top=false){
 return s.split(/\r?\n/).map(v=>v.trim()).filter(Boolean).filter(v=>top?/^[1-3]\s*[).:\-]\s*\S/.test(v):/^\d{1,2}\s*[).:\-]\s*\S/.test(v)).map(v=>v.replace(/^\d{1,2}\s*[).:\-]\s*/,"").replace(/\s+(?:\d+\s*руб(?:лей|ля|ль)?|плюс\s+(?:один|1)\s*птс).*$/i,"").trim());
}
function load():Cup[]{try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a:[]}catch{return []}}
export default function LeagueEditor({admin}:{admin:boolean}){
 const [cups,setCups]=useState<Cup[]>([]),[date,setDate]=useState("2026-11-22"),[members,setMembers]=useState(sample),[result,setResult]=useState(sampleTop),[editing,setEditing]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>setCups(load()),[]);
 const players=rows(members),top=rows(result,true);
 const issues:string[]=[];
 if(players.length!==8)issues.push("Нужно ровно 8 участников; сейчас "+players.length);
 if(new Set(players.map(normalize)).size!==players.length)issues.push("Повторяются участники");
 if(top.length!==3)issues.push("Укажи три призовых места");
 if(new Set(top.map(normalize)).size!==top.length)issues.push("Повторяются призёры");
 for(const w of top)if(!players.some(p=>normalize(p)===normalize(w)))issues.push("Призёр отсутствует в регистрации: "+w);
 if(!/^\d{4}-\d\d-\d\d$/.test(date))issues.push("Неверная дата");
 const store=(next:Cup[])=>{try{localStorage.setItem(KEY,JSON.stringify(next));setCups(next);return true}catch{setNotice("Не удалось сохранить локальные данные");return false}};
 const save=()=>{if(!admin||issues.length)return;const old=cups.find(c=>c.id===editing);const id=old?.id||"WWS"+String(Math.max(0,...cups.map(c=>Number(c.id.slice(3))||0))+1).padStart(4,"0");const cup:Cup={id,date,players,top3:top,confirmed:false};if(store(old?cups.map(c=>c.id===id?cup:c):[...cups,cup])){setEditing(id);setNotice("Черновик "+id+" сохранён только в тестовом браузере")}};
 const open=(c:Cup)=>{setEditing(c.id);setDate(c.date);setMembers(c.players.map((p,i)=>String(i+1)+". "+p).join("\n"));setResult(c.top3.map((p,i)=>String(i+1)+" - "+p).join("\n"));setNotice("Открыт "+c.id)};
 const confirm=(id:string)=>{if(!admin||!window.confirm("Локально подтвердить "+id+"? На основном сайте PTS не начисляются."))return;store(cups.map(c=>c.id===id?{...c,confirmed:true}:c));setNotice("Локально подтверждён "+id)};
 const del=(id:string)=>{if(!admin||!window.confirm("Удалить черновик "+id+"?"))return;store(cups.filter(c=>c.id!==id));if(editing===id)setEditing("")};
 const exportData=()=>{const blob=new Blob([JSON.stringify({format:"mcggleague-fastcups-v1",tournaments:cups},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="mcgg-fastcups-test.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)};
 return <section className="leRoot"><header className="leHeader"><h2>MCGG LEAGUE 3.0 · РУЧНОЙ ВВОД</h2><p>Тестовый редактор · Фасткап 8</p></header>
 <p className="leNotice">Данные хранятся только в этом браузере. Основной сайт, рейтинг и база D1 не изменяются. Войди как тестовый организатор для сохранения.</p>
 <div className="leColumns"><div className="leCard"><h3>{editing?"Редактирование "+editing:"Новый фасткап"}</h3>
 <label>Дата<input aria-label="Дата фасткапа" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
 <label>Участники регистрации (8)<textarea aria-label="Участники регистрации" rows={10} value={members} onChange={e=>setMembers(e.target.value)}/></label>
 <label>Результаты (ТОП-3)<textarea aria-label="Результаты ТОП-3" rows={5} value={result} onChange={e=>setResult(e.target.value)}/></label>
 {issues.length>0&&<p className="leErrors" role="alert">{issues.join(" · ")}</p>}
 <div className="leActions"><button onClick={save} disabled={!admin||!!issues.length}>Сохранить черновик</button><button onClick={()=>{setEditing("");setNotice("Новый турнир")}}>Новый ID</button></div>{notice&&<p role="status">{notice}</p>}</div>
 <div className="leCard"><h3>Предпросмотр статистики</h3><div className="leScroll"><table><thead><tr><th>Игрок</th><th>Место</th><th>Игры</th><th>ТОП-3</th><th>ТОП-1</th><th>PTS</th></tr></thead><tbody>{players.map((p,i)=>{const place=top.findIndex(w=>normalize(w)===normalize(p))+1;return <tr key={i}><td>{p}</td><td>{place||"—"}</td><td>1</td><td>{place?1:0}</td><td>{place===1?1:0}</td><td>{place===1?"+1":"0"}</td></tr>})}</tbody></table></div><p>Места 4–8 неизвестны: пятеро остальных получают только участие. WR = ТОП-3 / Игры × 100%.</p></div></div>
 <div className="leCard"><div className="leActions leBetween"><h3>Тестовые турниры · {cups.length}</h3><button onClick={exportData} disabled={!cups.length}>Экспорт JSON</button></div>
 {cups.length===0?<p>Сохранённых черновиков пока нет.</p>:cups.slice().reverse().map(c=><div key={c.id} className="leItem"><span><strong>{c.id}</strong> · {c.date} · {c.confirmed?"Подтверждён локально":"Черновик"} · {c.players.length} игроков</span><div className="leActions"><button onClick={()=>open(c)}>Открыть</button>{!c.confirmed&&<button disabled={!admin} onClick={()=>confirm(c.id)}>Подтвердить</button>}<button disabled={!admin} onClick={()=>del(c.id)}>Удалить</button></div></div>)}</div>
 </section>;
}