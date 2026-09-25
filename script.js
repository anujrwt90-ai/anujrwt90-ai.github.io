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

/* ---------- storage ---------- */
function save(){localStorage.setItem("mediahub_content",JSON.stringify(content))}
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
function statusOf(x){const t=track[x.id];return t?t.status:null}
function totalEpisodes(x){return x.episodes||null}
function progressPct(x){const t=track[x.id];if(!t||!t.episodes)return 0;const tot=totalEpisodes(x);return tot?Math.min(100,Math.round(t.episodes/tot*100)):0}

/* one-time migration from the old mediahub_status keys */
(function(){
  const old=localStorage.getItem("mediahub_status");
  if(old){try{const o=JSON.parse(old);Object.entries(o).forEach(([id,st])=>{if(st&&STATUSES.includes(st))setTrack(+id,{status:st})})}catch(e){}localStorage.removeItem("mediahub_status")}
})();

/* ---------- library rendering ---------- */
function render(){
 const q=$("#search").value.toLowerCase().trim(), type=$("#typeFilter").value, sort=$("#sort").value, statusSel=$("#statusFilter").value;
 let items=content.filter(x=>(type==="all"||x.type===type)&&`${x.title} ${x.genre} ${x.year}`.toLowerCase().includes(q));
 if(statusSel!=="all"){
   items=items.filter(x=>{
     const st=statusOf(x);
     return statusSel==="untracked"?!st:st===statusSel;
   });
 }
 items.sort((a,b)=>sort==="rating"?b.rating-a.rating:sort==="title"?a.title.localeCompare(b.title):b.year-a.year);
 ["movie","series","anime","other"].forEach(t=>{
   const list=items.filter(x=>x.type===t), grid=document.querySelector(`[data-grid="${t}"]`);
   grid.innerHTML=list.length?list.map(card).join(""):`<p class="meta">No matching content.</p>`;
   $(`#${t}Count`).textContent=`${list.length} item${list.length!==1?"s":""}`;
 });
 document.querySelectorAll(".card").forEach(c=>c.onclick=()=>openModal(+c.dataset.id));
}
function card(x){
 const st=statusOf(x);
 const badge=st?`<span class="badge b-${st}">${LABELS[st]}</span>`:"";
 const pct=progressPct(x);
 const bar=(st==="watching"||st==="onhold")&&pct>0?`<div class="bar card-bar"><i style="width:${pct}%"></i></div>`:"";
 return `<article class="card" data-id="${x.id}"><div class="poster">${x.emoji||"🎬"}${badge}</div><div class="card-body"><h3>${x.title}</h3><div class="meta">${x.year} · ${x.genre}</div><div class="rating">★ ${x.rating}</div>${bar}</div></article>`;
}

/* ---------- modal with tracking ---------- */
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

/* modal interactions (delegated) */
$("#modalContent").addEventListener("click",e=>{
 const id=+e.target.dataset.id;
 if(e.target.classList.contains("chip")){
   if(e.target.dataset.status==="none"){removeTrack(id);render();closeModal();return}
   setTrack(id,{status:e.target.dataset.status});openModal(id);render();return;
 }
 if(e.target.id==="epPlus"||e.target.id==="epMinus"){
   const x=content.find(v=>v.id===id),tot=totalEpisodes(x);
   const input=$("#epInput");
   let v=(+input.value||0)+(e.target.id==="epPlus"?1:-1);
   v=Math.max(0,v);if(tot)v=Math.min(tot,v);
   input.value=v;
   const patch={episodes:v};
   if(tot&&v>=tot)patch.status="completed";
   setTrack(id,patch);openModal(id);render();
 }
});
$("#modalContent").addEventListener("input",e=>{
 const id=+$("#chipRow .chip")?.dataset.id;if(!id)return;
 if(e.target.id==="epInput"){
   const x=content.find(v=>v.id===id),tot=totalEpisodes(x);
   let v=Math.max(0,+e.target.value||0);if(tot)v=Math.min(tot,v);
   const patch={episodes:v};if(tot&&v>=tot)patch.status="completed";
   setTrack(id,patch);render();
 }
 if(e.target.id==="myScore"){const v=e.target.value;setTrack(id,{score:v===""?null:+v});render()}
 if(e.target.id==="myNotes")setTrack(id,{notes:e.target.value});
});

function closeModal(){$("#modal").classList.add("hidden")}
$("#closeModal").onclick=closeModal;
$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
["search","typeFilter","statusFilter","sort"].forEach(id=>$("#"+id).addEventListener("input",render));
$("#themeBtn").onclick=()=>document.body.classList.toggle("light");
render();
