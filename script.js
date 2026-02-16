const SHEET_ID = "1H2n5pV3QANqjc0cP9Xyt6jTj89qlZ4MgmLe2RKFN7ME";
const API_KEY  = "AIzaSyDxqxuU1Lw43FdsBDSbUDxy6ktg2TKPDgM";
const RANGE    = "가능!A:E";

const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

function toStarNumber(raw){
  if(!raw) return 0;
  const n=Number(String(raw).trim());
  if(Number.isFinite(n)) return Math.min(5,Math.max(0,n));
  const c=(String(raw).match(/⭐/g)||[]).length;
  return c;
}

function starsHtml(n){
  let h="";
  for(let i=1;i<=5;i++){
    h+=i<=n?'<span class="starFilled">★</span>':'<span class="starEmpty">☆</span>';
  }
  return h;
}

async function loadSongs(){
  const res=await fetch(url);
  const data=await res.json();
  const tbody=document.getElementById("songList");
  tbody.innerHTML="";
  if(!data.values) return;
  data.values.slice(1).forEach(r=>{
    const genre=r[1]||"";
    const singer=r[2]||"";
    const title=r[3]||"";
    const stars=toStarNumber(r[4]);
    if(!title) return;
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${genre}</td><td>${singer}</td><td>${title}</td><td>${starsHtml(stars)}</td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById("search").addEventListener("input",()=>{
  const q=document.getElementById("search").value.toLowerCase();
  document.querySelectorAll("#songList tr").forEach(tr=>{
    tr.style.display=tr.innerText.toLowerCase().includes(q)?"":"none";
  });
});

document.getElementById("starFilter").addEventListener("change",()=>{
  const v=document.getElementById("starFilter").value;
  document.querySelectorAll("#songList tr").forEach(tr=>{
    if(v==="all"){tr.style.display="";return;}
    const stars=tr.querySelectorAll(".starFilled").length;
    tr.style.display=(String(stars)===v)?"":"none";
  });
});

loadSongs();
