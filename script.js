const CSV_URL =
"https://docs.google.com/spreadsheets/d/1H2n5pV3QANqjc0cP9Xyt6jTj89qlZ4MgmLe2RKFN7ME/gviz/tq?tqx=out:csv&sheet=가능곡";

let songs = [];
let original = [];
let sortKey = null;
let sortAsc = true;

function parseCSV(line){
  const result=[];
  let cur="";
  let q=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c=='"'){ q=!q; continue;}
    if(c=="," && !q){ result.push(cur); cur=""; continue;}
    cur+=c;
  }
  result.push(cur);
  return result;
}

function starNum(v){
if(!v) return 0;
const n = Number(v);
if(!isNaN(n)) return Math.max(0, Math.min(5, n));
return (String(v).match(/⭐/g)||[]).length;
}

function starHTML(n){
let s="";
for(let i=1;i<=5;i++){
s+=i<=n?'<span class="starFilled">★</span>':'<span class="starEmpty">☆</span>';
}
return s;
}

function showMessage(msg){
const tbody=document.getElementById("songList");
tbody.innerHTML=`<tr><td colspan="4" style="text-align:center;padding:24px;">${msg}</td></tr>`;
}

async function loadSongs(){
try{
const res = await fetch(CSV_URL);
const text = await res.text();

const rows = text.split(/\r?\n/).filter(r=>r.trim()).map(parseCSV);

original = rows.slice(1).map(r=>({
genre:r[1]||"",
singer:r[2]||"",
title:r[3]||"",
stars:starNum(r[4])
})).filter(v=>v.title);

songs=[...original];
render();
}catch(e){
console.error(e);
showMessage("시트를 불러오지 못했습니다. 시트 공개 설정을 확인해주세요.");
}
}

function render(){
let list=[...songs];

if(sortKey){
list.sort((a,b)=>{
let A=a[sortKey],B=b[sortKey];
if(sortKey==="stars") return sortAsc?A-B:B-A;
return sortAsc?String(A).localeCompare(String(B),"ko"):String(B).localeCompare(String(A),"ko");
});
}

const tbody=document.getElementById("songList");
tbody.innerHTML="";

if(!list.length){
showMessage("표시할 곡이 없습니다.");
return;
}

list.forEach(s=>{
const tr=document.createElement("tr");
tr.innerHTML=`
<td>${s.genre}</td>
<td>${s.singer}</td>
<td>${s.title}</td>
<td>${starHTML(s.stars)}</td>`;
tbody.appendChild(tr);
});
}

document.querySelectorAll(".thSort").forEach(th=>{
th.onclick=()=>{
const key=th.dataset.sort;
if(sortKey===key) sortAsc=!sortAsc;
else{sortKey=key;sortAsc=true;}
render();
};
});

document.getElementById("search").addEventListener("input",()=>{
const q=document.getElementById("search").value.toLowerCase();
songs=original.filter(s=>`${s.genre} ${s.singer} ${s.title}`.toLowerCase().includes(q));
render();
});

document.getElementById("starFilter").addEventListener("change",e=>{
const v=e.target.value;
if(v==="all"){songs=[...original];render();return;}
songs=original.filter(s=>String(s.stars)===v);
render();
});

loadSongs();
