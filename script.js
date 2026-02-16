const SHEET_ID = "1H2n5pV3QANqjc0cP9Xyt6jTj89qlZ4MgmLe2RKFN7ME";
const API_KEY  = "AIzaSyDxqxuU1Lw43FdsBDSbUDxy6ktg2TKPDgM";
const RANGE    = "가능곡!A:D";

const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

let songs=[]; let sortKey=null; let sortAsc=true; let viewMode="table";

function toStarNumber(raw){
  if(!raw) return 0;
  const n=Number(String(raw).trim());
  if(Number.isFinite(n)) return Math.min(5,Math.max(0,Math.round(n)));
  const c=(String(raw).match(/⭐/g)||[]).length;
  return c?Math.min(5,c):0;
}
function starsHtml(n){
  let h='<span>';
  for(let i=1;i<=5;i++){
    h+=i<=n?'<span class="starFilled">★</span>':'<span class="starEmpty">☆</span>';
  }
  return h+'</span>';
}
async function loadSongs(){
  const res=await fetch(url); const data=await res.json();
  if(!data.values||data.values.length<=1){render();return;}
  songs=data.values.slice(1).map(r=>({
    genre:r[0]||"", singer:r[1]||"", title:r[2]||"", stars:toStarNumber(r[3])
  }));
  sortKey="title"; sortAsc=true; render();
}
function applySort(list){
  if(!sortKey) return list;
  return [...list].sort((a,b)=>{
    if(sortKey==="stars") return sortAsc?(a.stars-b.stars):(b.stars-a.stars);
    return sortAsc
      ?String(a[sortKey]).localeCompare(String(b[sortKey]),"ko")
      :String(b[sortKey]).localeCompare(String(a[sortKey]),"ko");
  });
}
function getFiltered(){
  const q=document.getElementById("search").value.toLowerCase();
  const f=document.getElementById("starFilter").value;
  return applySort(songs.filter(s=>{
    const hay=`${s.genre} ${s.singer} ${s.title}`.toLowerCase();
    return (!q||hay.includes(q))&&(f==="all"||String(s.stars)===f);
  }));
}
function render(){
  const list=getFiltered();
  document.getElementById("count").textContent=`총 ${list.length}곡 / 전체 ${songs.length}곡`;
  if(viewMode==="table"){
    document.getElementById("tableView").classList.remove("hidden");
    document.getElementById("cardView").classList.add("hidden");
    const tbody=document.getElementById("songList"); tbody.innerHTML="";
    list.forEach(s=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${s.genre}</td><td>${s.singer}</td><td>${s.title}</td><td>${starsHtml(s.stars)}</td>`;
      tbody.appendChild(tr);
    });
  }else{
    document.getElementById("tableView").classList.add("hidden");
    document.getElementById("cardView").classList.remove("hidden");
    const wrap=document.getElementById("cardList"); wrap.innerHTML="";
    list.forEach(s=>{
      const d=document.createElement("div"); d.className="card";
      d.innerHTML=`<b>${s.title}</b><div>${s.singer}</div><div>${starsHtml(s.stars)}</div>`;
      wrap.appendChild(d);
    });
  }
}
document.getElementById("search").addEventListener("input",render);
document.getElementById("starFilter").addEventListener("change",render);
document.querySelectorAll(".chip.sort").forEach(b=>b.onclick=()=>{sortKey=b.dataset.sort;render();});
document.querySelectorAll(".thSort").forEach(th=>th.onclick=()=>{sortKey=th.dataset.sort;render();});
document.getElementById("sortDir").onclick=()=>{sortAsc=!sortAsc;render();};
document.getElementById("viewToggle").onclick=()=>{
  viewMode=viewMode==="table"?"card":"table";
  document.getElementById("viewToggle").textContent=viewMode==="card"?"테이블 보기":"카드 보기";
  render();
};
document.getElementById("themeToggle").onclick=()=>{
  document.body.classList.toggle("dark");
};
loadSongs();
