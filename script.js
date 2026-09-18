const defaultContent=[
{id:1,title:"Interstellar",type:"movie",year:2014,genre:"Sci-Fi",rating:8.7,emoji:"🚀",description:"A science-fiction film about space, time and humanity's search for a new home."},
{id:2,title:"The Dark Knight",type:"movie",year:2008,genre:"Action",rating:9.0,emoji:"🦇",description:"A crime-action classic centered on Batman and Gotham's escalating conflict."},
{id:3,title:"Breaking Bad",type:"series",year:2008,genre:"Crime",rating:9.5,emoji:"🧪",description:"A chemistry teacher enters the world of illegal drug production."},
{id:4,title:"Stranger Things",type:"series",year:2016,genre:"Mystery",rating:8.6,emoji:"👾",description:"Friends investigate strange events in a small town."},
{id:5,title:"Naruto",type:"anime",year:2002,genre:"Adventure",rating:8.4,emoji:"🍥",description:"A young ninja works toward recognition and his dream of becoming Hokage."},
{id:6,title:"Solo Leveling",type:"anime",year:2024,genre:"Action",rating:8.8,emoji:"⚔️",description:"A hunter gains a mysterious power that lets him level up beyond limits."},
{id:7,title:"Documentary Collection",type:"other",year:2025,genre:"Documentary",rating:8.1,emoji:"🎥",description:"A placeholder category for documentaries and other legal content."}
];
let content=JSON.parse(localStorage.getItem("mediahub_content")||"null")||defaultContent;
const $=s=>document.querySelector(s);
function save(){localStorage.setItem("mediahub_content",JSON.stringify(content))}
function render(){
 const q=$("#search").value.toLowerCase().trim(), type=$("#typeFilter").value, sort=$("#sort").value;
 let items=content.filter(x=>(type==="all"||x.type===type)&&`${x.title} ${x.genre} ${x.year}`.toLowerCase().includes(q));
 items.sort((a,b)=>sort==="rating"?b.rating-a.rating:sort==="title"?a.title.localeCompare(b.title):b.year-a.year);
 ["movie","series","anime","other"].forEach(t=>{
   const list=items.filter(x=>x.type===t), grid=document.querySelector(`[data-grid="${t}"]`);
   grid.innerHTML=list.length?list.map(card).join(""):`<p class="meta">No matching content.</p>`;
   $(`#${t==="movie"?"movie":t}Count`).textContent=`${list.length} item${list.length!==1?"s":""}`;
 });
 document.querySelectorAll(".card").forEach(c=>c.onclick=()=>openModal(+c.dataset.id));
}
function card(x){return `<article class="card" data-id="${x.id}"><div class="poster">${x.emoji||"🎬"}</div><div class="card-body"><h3>${x.title}</h3><div class="meta">${x.year} · ${x.genre}</div><div class="rating">★ ${x.rating}</div></div></article>`}
function openModal(id){const x=content.find(v=>v.id===id);$("#modalContent").innerHTML=`<p class="eyebrow">${x.type.toUpperCase()}</p><h2>${x.title}</h2><p class="meta">${x.year} · ${x.genre} · ★ ${x.rating}</p><p>${x.description}</p>`;$("#modal").classList.remove("hidden")}
$("#closeModal").onclick=()=>$("#modal").classList.add("hidden");$("#modal").onclick=e=>{if(e.target.id==="modal")$("#modal").classList.add("hidden")};
["search","typeFilter","sort"].forEach(id=>$("#"+id).addEventListener("input",render));
$("#themeBtn").onclick=()=>document.body.classList.toggle("light");
render();
