const CSV_URL =
"https://docs.google.com/spreadsheets/d/1H2n5pV3QANqjc0cP9Xyt6jTj89qlZ4MgmLe2RKFN7ME/export?format=csv&gid=0";

let songs = [];
let original = [];
let sortKey = null;
let sortAsc = true;

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map(v => v.trim());
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
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;">${msg}</td></tr>`;
}

async function loadSongs(){
  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();

    const rows = text
      .split(/\r?\n/)
      .filter(row => row.trim() !== "")
      .map(parseCSVLine);

    if (rows.length <= 1) {
      showMessage("불러온 데이터가 없어요.");
      return;
    }

    original = rows.slice(1).map(r => ({
      genre: r[1] || "",
      singer: r[2] || "",
      title: r[3] || "",
      stars: starNum(r[4])
    })).filter(v => v.title);

    songs = [...original];
    render();
  } catch (err) {
    console.error(err);
    showMessage("시트를 불러오지 못했어요. 시트 공개 설정과 gid를 확인해 주세요.");
  }
}

function render(){
  let list=[...songs];

  if(sortKey){
    list.sort((a,b)=>{
      let A=a[sortKey], B=b[sortKey];
      if(sortKey==="stars") return sortAsc?A-B:B-A;
      return sortAsc
        ? String(A).localeCompare(String(B),"ko")
        : String(B).localeCompare(String(A),"ko");
    });
  }

  const tbody=document.getElementById("songList");
  tbody.innerHTML="";

  if (!list.length) {
    showMessage("표시할 곡이 없어요.");
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
    else { sortKey=key; sortAsc=true; }
    render();
  };
});

document.getElementById("search").addEventListener("input",()=>{
  const q=document.getElementById("search").value.toLowerCase();
  songs = original.filter(s =>
    `${s.genre} ${s.singer} ${s.title}`.toLowerCase().includes(q)
  );
  render();
});

document.getElementById("starFilter").addEventListener("change",e=>{
  const v=e.target.value;
  let filtered = [...original];

  const q=document.getElementById("search").value.toLowerCase();
  if (q) {
    filtered = filtered.filter(s =>
      `${s.genre} ${s.singer} ${s.title}`.toLowerCase().includes(q)
    );
  }

  if(v!=="all"){
    filtered = filtered.filter(s=>String(s.stars)===v);
  }

  songs = filtered;
  render();
});

loadSongs();
