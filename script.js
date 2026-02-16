const SHEET_ID = "1H2n5pV3QANqjc0cP9Xyt6jTj89qlZ4MgmLe2RKFN7ME";
const API_KEY  = "AIzaSyDxqxuU1Lw43FdsBDSbUDxy6ktg2TKPDgM";
const RANGE    = "가능곡!A:E";

const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

let allSongs = [];      // 원본
let viewSongs = [];     // 필터+정렬 적용된 목록
let sortKey = null;     // "genre" | "singer" | "title" | "stars"
let sortAsc = true;     // true=오름차순

function toStarNumber(raw){
  if(!raw) return 0;
  const s = String(raw).trim();
  const n = Number(s);
  if(Number.isFinite(n)) return Math.min(5, Math.max(0, Math.round(n)));
  const c = (s.match(/⭐/g) || []).length;
  return Math.min(5, c);
}

function starsHtml(n){
  let h = "";
  for(let i=1;i<=5;i++){
    h += i<=n
      ? '<span class="starFilled">★</span>'
      : '<span class="starEmpty">☆</span>';
  }
  return h;
}

// --- 데이터 로드 ---
async function loadSongs(){
  const res = await fetch(url);
  const data = await res.json();

  if(!data.values || data.values.length <= 1){
    allSongs = [];
    render();
    return;
  }

  // 번호/장르/가수/제목/난이도 (번호는 무시)
  allSongs = data.values.slice(1).map(r => {
    const genre  = r[1] || "";
    const singer = r[2] || "";
    const title  = r[3] || "";
    const stars  = toStarNumber(r[4]);

    return { genre, singer, title, stars };
  }).filter(s => {
    // ✅ 제목 없는 줄 제거
    if(!s.title) return false;

    // ✅ "🎤 노래 제목" 같은 가짜 헤더줄 제거
    if (s.title.includes("제목") || s.singer.includes("가수") || s.genre.includes("장르")) return false;

    return true;
  });

  // 기본 정렬: 제목 오름차순
  sortKey = "title";
  sortAsc = true;

  render();
}

// --- 필터/정렬 ---
function getFiltered(){
  const q = document.getElementById("search").value.toLowerCase().trim();
  const star = document.getElementById("starFilter").value;

  let list = allSongs.filter(s => {
    const hay = `${s.genre} ${s.singer} ${s.title}`.toLowerCase();
    const matchQ = !q || hay.includes(q);
    const matchStar = (star === "all") || (String(s.stars) === star);
    return matchQ && matchStar;
  });

  // 정렬 적용
  if(sortKey){
    list.sort((a,b) => {
      if(sortKey === "stars"){
        return sortAsc ? (a.stars - b.stars) : (b.stars - a.stars);
      }
      const A = String(a[sortKey] ?? "");
      const B = String(b[sortKey] ?? "");
      return sortAsc ? A.localeCompare(B, "ko") : B.localeCompare(A, "ko");
    });
  }

  return list;
}

// --- 렌더 ---
function render(){
  viewSongs = getFiltered();

  const tbody = document.getElementById("songList");
  tbody.innerHTML = "";

  viewSongs.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(s.genre)}</td>
      <td>${escapeHtml(s.singer)}</td>
      <td>${escapeHtml(s.title)}</td>
      <td>${starsHtml(s.stars)}</td>
    `;
    tbody.appendChild(tr);
  });

  // 정렬 표시(▲▼)
  updateHeaderArrows();
}

// XSS 방지(가수/제목에 특수문자 있을 수 있어서)
function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// --- 헤더 클릭 정렬 ---
function setSort(key){
  if(sortKey === key){
    sortAsc = !sortAsc; // 같은 키면 오름/내림 토글
  }else{
    sortKey = key;
    sortAsc = true; // 새 키는 기본 오름
  }
  render();
}

function updateHeaderArrows(){
  document.querySelectorAll(".thSort").forEach(th => {
    const base = th.dataset.base || th.textContent.replace(/[▲▼]\s*$/,"").trim();
    th.dataset.base = base;

    if(th.dataset.sort === sortKey){
      th.textContent = `${base} ${sortAsc ? "▲" : "▼"}`;
    }else{
      th.textContent = base;
    }
  });
}

// --- 이벤트 ---
document.getElementById("search").addEventListener("input", render);
document.getElementById("starFilter").addEventListener("change", render);

// 테이블 헤더 클릭 정렬
document.querySelectorAll(".thSort").forEach(th => {
  th.addEventListener("click", () => setSort(th.dataset.sort));
});

// 시작
loadSongs();
