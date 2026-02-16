// ====== CONFIG ======
const SHEET_ID = "1H2n5pV3QANqjc0cP9Xyt6jTj89qlZ4MgmLe2RKFN7ME";
const API_KEY  = "AIzaSyDxqxuU1Lw43FdsBDSbUDxy6ktg2TKPDgM"; // ← 반드시 본인 키로 교체
const RANGE    = "Sheet1!A:E"; // 번호 포함 5열 읽기
// ====================

const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

let songs = [];
let sortKey = null;
let sortAsc = true;
let viewMode = "table";

// ⭐ 난이도 → 별 개수 변환
function toStarNumber(raw) {
  if (!raw) return 0;

  const s = String(raw).trim();

  // 숫자 처리
  const n = Number(s);
  if (Number.isFinite(n)) {
    return Math.min(5, Math.max(0, Math.round(n)));
  }

  // ⭐⭐⭐ 형태 처리
  const starCount = (s.match(/⭐/g) || []).length;
  if (starCount) return Math.min(5, starCount);

  return 0;
}

// ⭐ 별 HTML
function starsHtml(n) {
  const filled = Math.min(5, Math.max(0, n));
  let html = `<span class="starRow">`;

  for (let i = 1; i <= 5; i++) {
    html += i <= filled
      ? `<span class="starFilled">★</span>`
      : `<span class="starEmpty">☆</span>`;
  }

  html += `</span>`;
  return html;
}

// ===== 데이터 로드 =====
async function loadSongs() {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.values || data.values.length <= 1) {
      songs = [];
      render();
      return;
    }

    // 🔥 번호 열 무시 버전
    songs = data.values
      .slice(1)
      .map(row => ({
        // row[0] = 번호 (사용 안 함)
        genre: row[1] ?? "",
        singer: row[2] ?? "",
        title: row[3] ?? "",
        stars: toStarNumber(row[4])
      }))
      // ✅ 제목 없는 행 자동 제거
      .filter(song => song.title);

    // 기본 정렬
    if (!sortKey) {
      sortKey = "title";
      sortAsc = true;
    }

    render();

  } catch (err) {
    console.error("시트 로드 실패:", err);
  }
}

// ===== 정렬 =====
function applySort(list) {
  if (!sortKey) return list;

  return [...list].sort((a, b) => {
    if (sortKey === "stars") {
      return sortAsc ? (a.stars - b.stars) : (b.stars - a.stars);
    }

    return sortAsc
      ? String(a[sortKey]).localeCompare(String(b[sortKey]), "ko")
      : String(b[sortKey]).localeCompare(String(a[sortKey]), "ko");
  });
}

// ===== 필터 =====
function getFiltered() {
  const q = document.getElementById("search").value.toLowerCase();
  const starFilter = document.getElementById("starFilter").value;

  return applySort(
    songs.filter(song => {
      const hay = `${song.genre} ${song.singer} ${song.title}`.toLowerCase();

      const matchQ = !q || hay.includes(q);
      const matchStar = starFilter === "all" || String(song.stars) === starFilter;

      return matchQ && matchStar;
    })
  );
}

// ===== 테이블 렌더 =====
function renderTable(list) {
  const tbody = document.getElementById("songList");
  tbody.innerHTML = "";

  list.forEach(song => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${song.genre}</td>
      <td>${song.singer}</td>
      <td>${song.title}</td>
      <td>${starsHtml(song.stars)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== 카드 렌더 =====
function renderCards(list) {
  const wrap = document.getElementById("cardList");
  wrap.innerHTML = "";

  list.forEach(song => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <b>${song.title}</b>
      <div>${song.singer}</div>
      <div>${starsHtml(song.stars)}</div>
    `;
    wrap.appendChild(div);
  });
}

// ===== 전체 렌더 =====
function render() {
  const list = getFiltered();

  document.getElementById("count").textContent =
    `총 ${list.length}곡 / 전체 ${songs.length}곡`;

  if (viewMode === "table") {
    document.getElementById("tableView").classList.remove("hidden");
    document.getElementById("cardView").classList.add("hidden");
    renderTable(list);
  } else {
    document.getElementById("tableView").classList.add("hidden");
    document.getElementById("cardView").classList.remove("hidden");
    renderCards(list);
  }
}

// ===== 정렬 설정 =====
function setSort(key) {
  if (sortKey === key) {
    sortAsc = !sortAsc;
  } else {
    sortKey = key;
    sortAsc = true;
  }
  render();
}

// ===== 이벤트 =====
document.getElementById("search").addEventListener("input", render);
document.getElementById("starFilter").addEventListener("change", render);

document.querySelectorAll(".chip.sort").forEach(btn => {
  btn.addEventListener("click", () => setSort(btn.dataset.sort));
});

document.querySelectorAll(".thSort").forEach(th => {
  th.addEventListener("click", () => setSort(th.dataset.sort));
});

document.getElementById("sortDir").addEventListener("click", () => {
  sortAsc = !sortAsc;
  render();
});

document.getElementById("viewToggle").addEventListener("click", () => {
  viewMode = viewMode === "table" ? "card" : "table";
  document.getElementById("viewToggle").textContent =
    viewMode === "card" ? "테이블 보기" : "카드 보기";
  render();
});

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// 시작
loadSongs();

