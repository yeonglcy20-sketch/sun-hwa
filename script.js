const SHEET_ID="1H2n5pV3QANqjc0cP9Xyt6jTj89qlZ4MgmLe2RKFN7ME";
const API_KEY="여기에_API키";
const RANGE="Sheet1!A:E";

const url=`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

let songs=[];
let original=[];
let sortKey=null;
let sortAsc=true;

function starNum(v){
if(!v) return 0;
const n=Number(v);
if(!isNaN(n)) return n;
return (String(v).match(/⭐/g)||[]).length;
}

function starHTML(n){
let s="";
for(let i=1;i<=5;i++){
s+=i<=n?'<span class="starFilled">★</span>':'<span class="starEmpty">☆</span>';
}
return s;
}

async function loadSongs(){
const res=await fetch(url);
const data=await res.json();

original=data.values.slice(1).map(r=>({
genre:r[1]||"",
singer:r[2]||"",
title:r[3]||"",
stars:starNum(r[4])
})).filter(v=>v.title);

songs=[...original];
render();
}

function render(){
let list=[...songs];

if(sortKey){
list.sort((a,b)=>{
let A=a[sortKey],B=b[sortKey];
if(sortKey==="stars") return sortAsc?A-B:B-A;
return sortAsc?A.localeCompare(B,"ko"):B.localeCompare(A,"ko");
});
}

const tbody=document.getElementById("songList");
tbody.innerHTML="";

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
