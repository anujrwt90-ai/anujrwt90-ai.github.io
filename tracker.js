const defaultContent=[
{id:1,title:"Interstellar",type:"movie",year:2014,genre:"Sci-Fi",rating:8.7,emoji:"🚀",description:"A science-fiction film about space, time and humanity's search for a new home.",runtime:169},
{id:2,title:"The Dark Knight",type:"movie",year:2008,genre:"Action",rating:9.0,emoji:"🦇",description:"A crime-action classic centered on Batman and Gotham's escalating conflict.",runtime:152},
{id:3,title:"Breaking Bad",type:"series",year:2008,genre:"Crime",rating:9.5,emoji:"🧪",description:"A chemistry teacher enters the world of illegal drug production.",episodes:62},
{id:4,title:"Stranger Things",type:"series",year:2016,genre:"Mystery",rating:8.6,emoji:"👾",description:"Friends investigate strange events in a small town.",episodes:34},
{id:5,title:"Naruto",type:"anime",year:2002,genre:"Adventure",rating:8.4,emoji:"🍥",description:"A young ninja works toward recognition and his dream of becoming Hokage.",episodes:220},
{id:6,title:"Solo Leveling",type:"anime",year:2024,genre:"Action",rating:8.8,emoji:"⚔️",description:"A hunter gains a mysterious power that lets him level up beyond limits.",episodes:12},
{id:7,title:"Documentary Collection",type:"other",year:2025,genre:"Documentary",rating:8.1,emoji:"🎥",description:"A placeholder category for documentaries and other legal content."}
];

let content=JSON.parse(localStorage.getItem("mediahub_content")||"null")||defaultContent;
const $=s=>document.querySelector(s);
const STATUSES=["watching","completed","plan","onhold","dropped"];
const LABELS={watching:"Watching",completed:"Completed",plan:"Plan to Watch",onhold:"On Hold",dropped:"Dropped"};

/* ---------- storage (shared keys with the library) ---------- */
function loadTrack(){try{return JSON.parse(localStorage.getItem("mediahub_track")||"{}")}catch(e){return {}}}
let track=loadTrack();
function saveTrack(){localStorage.setItem("mediahub_track",JSON.stringify(track))}
function getTrack(id){return track[id]||null}
function setTrack(id,patch){
  const cur=track[id]||{status:"watching",episodes:0,score:null,notes:""};
  track[id]={...cur,...patch};
  if(!track[id].status)track[id].status="watching";
  const x=content.find(v=>v.id===id),tot=x&&x.episodes;
  if(tot&&(track[id].episodes||0)>=tot)track[id].status="completed";
  saveTrack();
}
function removeTrack(id){delete track[id];saveTrack()}
function totalEpisodes(x){return x.episodes||null}
function runtimeOf(x){
  if(x.runtime)return x.runtime;
  if((x.type==="series"||x.type==="anime")&&x.episodes)return x.episodes*45;
  return 120;
}
function hoursOf(x){
  const t=track[x.id];if(!t)return 0;
  if(x.type==="movie"||x.type==="other"){
    if(t.status==="completed")return runtimeOf(x)/60;
    return 0;
  }
  return t.episodes*(runtimeOf(x)/Math.max(1,totalEpisodes(x)||t.episodes));
}

/* ---------- stats ---------- */
function renderStats(){
  const entries=Object.entries(track);
  $("#statTotal").textContent=entries.length;
  $("#statWatching").textContent=entries.filter(([,t])=>t.status==="watching").length;
  const eps=entries.reduce((s,[,t])=>s+(t.episodes||0),0);
  $("#statEpisodes").textContent=eps;
  const scored=entries.filter(([,t])=>t.score!=null&&t.score!=="");
  $("#statAvg").textContent=scored.length?(scored.reduce((s,[,t])=>s+(+t.score),0)/scored.length).toFixed(1):"–";
  const hrs=entries.reduce((s,[id])=>s+hoursOf(content.find(x=>x.id===+id)||{}),0);
  $("#statDays").textContent=Math.round(hrs);
  $("#statTime").textContent=hrs.toFixed(1);
  const epItems=entries.filter(([id])=>{const x=content.find(v=>v.id===+id);return x&&(x.type==="series"||x.type==="anime")});
  const epTot=epItems.reduce((s,[id])=>s+(totalEpisodes(content.find(v=>v.id===+id))||0),0);
  const pct=epTot?Math.min(100,Math.round(eps/epTot*100)):0;
  $("#statBar").style.width=pct+"%";
}

/* ---------- list ---------- */
let filter="all";
function renderList(){
  const q=($("#trackerSearch").value||"").toLowerCase().trim();
  let rows=Object.entries(track)
    .map(([id,t])=>({x:content.find(v=>v.id===+id),t}))
    .filter(r=>r.x)
    .filter(r=>filter==="all"||r.t.status===filter)
    .filter(r=>`${r.x.title} ${r.x.genre} ${r.x.year}`.toLowerCase().includes(q));
  rows.sort((a,b)=>(b.t.episodes||0)-(a.t.episodes||0));
  $("#trackerList").innerHTML=rows.map(row).join("");
  $("#trackerCount").textContent=`${rows.length} title${rows.length!==1?"s":""}`;
  $("#emptyState").classList.toggle("hidden",rows.length>0);
  bindRows();
}
function row({x,t}){
  const tot=totalEpisodes(x);
  const pct=tot?Math.min(100,Math.round((t.episodes||0)/tot*100)):0;
  const hasEps=x.type==="series"||x.type==="anime";
  const pctTxt=tot?`${pct}%`:`${t.episodes||0} eps`;
  return `<div class="track-row" data-id="${x.id}">
    <div class="row-poster">${x.emoji||"🎬"}</div>
    <div class="row-main">
      <b>${x.title}</b>
      <div class="meta">${x.type} · ${x.year} · ${x.genre} · ★ ${x.rating}${t.score!=null&&t.score!==""?` · my ★ ${t.score}`:""}</div>
      ${hasEps?`<div class="bar row-bar"><i style="width:${pct}%"></i></div><div class="meta">${pctTxt}${tot?` of ${tot} episodes`:""}</div>`:""}
      ${t.notes?`<div class="meta row-notes">“${t.notes}”</div>`:""}
    </div>
    <div class="row-actions">
      <span class="badge b-${t.status}">${LABELS[t.status]||"—"}</span>
      ${hasEps?`<div class="progress-row"><button class="icon-btn step row-minus" data-id="${x.id}">−</button><span class="ep-count">${t.episodes||0}</span><button class="icon-btn step row-plus" data-id="${x.id}">+</button></div>`:""}
      <button class="icon-btn row-open" data-id="${x.id}">Edit</button>
    </div>
  </div>`;
}
function bindRows(){
  document.querySelectorAll(".row-plus,.row-minus").forEach(btn=>btn.onclick=()=>{
    const id=+btn.dataset.id,x=content.find(v=>v.id===id),tot=totalEpisodes(x);
    let v=(getTrack(id).episodes||0)+(btn.classList.contains("row-plus")?1:-1);
    v=Math.max(0,v);if(tot)v=Math.min(tot,v);
    const patch={episodes:v};if(tot&&v>=tot)patch.status="completed";
    setTrack(id,patch);refresh();
  });
  document.querySelectorAll(".row-open").forEach(btn=>btn.onclick=()=>openModal(+btn.dataset.id));
}

/* ---------- modal ---------- */
function openModal(id){
  const x=content.find(v=>v.id===id);if(!x)return;
  const t=getTrack(id)||{status:null,episodes:0,score:null,notes:""};
  const tot=totalEpisodes(x);
  let html=`<p class="eyebrow">${x.type.toUpperCase()}</p><h2>${x.title}</h2><p class="meta">${x.year} · ${x.genre} · ★ ${x.rating}</p><p>${x.description}</p>`;
  html+=`<div class="track-panel">
    <div class="track-label">My status</div>
    <div class="chips" id="chipRow">${STATUSES.map(s=>`<button class="chip ${t.status===s?"active":""}" data-status="${s}" data-id="${id}">${LABELS[s]}</button>`).join("")}
    ${t.status?`<button class="chip untrack" data-status="none" data-id="${id}">✕ Untrack</button>`:""}</div>`;
  if(x.type==="series"||x.type==="anime"){
    const pct=tot?Math.min(100,Math.round((t.episodes||0)/tot*100)):0;
    html+=`<div class="track-label">Progress</div>
    <div class="progress-row">
      <button class="icon-btn step" id="epMinus" data-id="${id}">−</button>
      <input id="epInput" type="number" min="0" ${tot?`max="${tot}"`:""} value="${t.episodes||0}">
      <span class="meta">/ ${tot??"?"} eps</span>
      <button class="icon-btn step" id="epPlus" data-id="${id}">+</button>
    </div>
    ${tot?`<div class="bar"><i style="width:${pct}%"></i></div>`:""}`;
  }
  html+=`<div class="track-label">My score</div>
    <input id="myScore" type="number" min="0" max="10" step="0.1" value="${t.score??""}" placeholder="0–10">
    <div class="track-label">Notes</div>
    <textarea id="myNotes" rows="2" placeholder="Private notes about this title...">${t.notes||""}</textarea>
  </div>`;
  $("#modalContent").innerHTML=html;
  $("#modal").classList.remove("hidden");
}
$("#modalContent").addEventListener("click",e=>{
  const id=+e.target.dataset.id;
  if(e.target.classList.contains("chip")){
    if(e.target.dataset.status==="none"){removeTrack(id);refresh();closeModal();return}
    setTrack(id,{status:e.target.dataset.status});openModal(id);refresh();return;
  }
  if(e.target.id==="epPlus"||e.target.id==="epMinus"){
    const x=content.find(v=>v.id===id),tot=totalEpisodes(x),input=$("#epInput");
    let v=(+input.value||0)+(e.target.id==="epPlus"?1:-1);
    v=Math.max(0,v);if(tot)v=Math.min(tot,v);
    input.value=v;
    const patch={episodes:v};if(tot&&v>=tot)patch.status="completed";
    setTrack(id,patch);openModal(id);refresh();
  }
});
$("#modalContent").addEventListener("input",e=>{
  const chip=$("#chipRow .chip");if(!chip)return;
  const id=+chip.dataset.id;
  if(e.target.id==="epInput"){
    const x=content.find(v=>v.id===id),tot=totalEpisodes(x);
    let v=Math.max(0,+e.target.value||0);if(tot)v=Math.min(tot,v);
    const patch={episodes:v};if(tot&&v>=tot)patch.status="completed";
    setTrack(id,patch);refresh();
  }
  if(e.target.id==="myScore"){const v=e.target.value;setTrack(id,{score:v===""?null:+v});refresh()}
  if(e.target.id==="myNotes")setTrack(id,{notes:e.target.value});
});
function closeModal(){$("#modal").classList.add("hidden")}
$("#closeModal").onclick=closeModal;
$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};

/* ---------- tabs & boot ---------- */
document.querySelectorAll("#tabs .tab").forEach(tab=>tab.onclick=()=>{
  document.querySelectorAll("#tabs .tab").forEach(b=>b.classList.remove("active"));
  tab.classList.add("active");
  filter=tab.dataset.status;
  renderList();
});
$("#trackerSearch").addEventListener("input",renderList);
$("#themeBtn").onclick=()=>document.body.classList.toggle("light");
function refresh(){renderStats();renderList()}
refresh();
