const CAT_LABELS = {
  landmark: '🗽 랜드마크',
  museum:   '🏛️ 박물관',
  park:     '🌿 공원',
  view:     '🔭 전망대',
  market:   '🛍️ 마켓',
};

const MANHATTAN_AREAS = new Set(['downtown', 'midtown', 'uptown']);

let spots    = [];
let region   = 'downtown';
let category = 'all';
let expanded = new Set();

async function loadSpots() {
  const res  = await fetch('data/spots.json');
  const json = await res.json();
  spots = json.spots;
}

function filtered() {
  return spots.filter(s => {
    if (MANHATTAN_AREAS.has(region)) {
      if (s.region !== 'manhattan' || s.area !== region) return false;
    } else {
      if (s.region !== region) return false;
    }
    if (category !== 'all' && s.category !== category) return false;
    return true;
  });
}

function admBadge(s) {
  if (s.admission === 'free') return '<span class="badge-free">무료</span>';
  if (s.admission === 'paid') return '<span class="badge-paid">유료</span>';
  return '';
}

function resBadge(s) {
  if (s.reservation === true)            return '<span class="badge-res">예약 필수</span>';
  if (s.reservation === 'recommended')   return '<span class="badge-res-rec">예약 권장</span>';
  return '';
}

function renderSpots() {
  const list  = document.getElementById('spot-list');
  const items = filtered();

  if (!items.length) {
    list.innerHTML = '<div class="empty-msg">등록된 스팟이 없습니다.<br>다른 지역을 선택해보세요.</div>';
    return;
  }

  list.innerHTML = items.map(s => {
    const open = expanded.has(s.id);
    return `
      <div class="spot-card" id="card-${s.id}">
        <div class="spot-top">
          <div class="spot-name">${s.name_ko}</div>
          <div class="spot-badges">${admBadge(s)}${resBadge(s)}</div>
        </div>
        <div class="spot-meta">
          <span class="meta-tag">${CAT_LABELS[s.category] || s.category}</span>
          <span class="meta-tag">⏰ ${s.hours}</span>
        </div>
        <div class="spot-price-note">${s.admission_note}</div>
        <div class="spot-desc">${s.description_ko}</div>
        ${s.tips?.length ? `
          <div class="spot-tips${open ? '' : ' hidden'}" id="tips-${s.id}">
            ${s.tips.map(t => `<div class="tip-item">${t}</div>`).join('')}
          </div>
          <button class="tips-toggle" data-id="${s.id}">
            ${open ? '▲ 팁 접기' : '▼ 팁 보기'}
          </button>
        ` : ''}
        <div class="spot-address">
          <a href="https://maps.google.com/?q=${encodeURIComponent(s.address)}"
             target="_blank" rel="noopener noreferrer">
            📍 ${s.address}
          </a>
        </div>
      </div>`;
  }).join('');
}

function initRegionTabs() {
  document.querySelectorAll('.region-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      region = tab.dataset.region;
      document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      expanded.clear();
      initWeather('weather-scroll', region);
      renderSpots();
    });
  });
}

function initCatFilter() {
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      category = chip.dataset.cat;
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderSpots();
    });
  });
}

function initTipsToggle() {
  document.getElementById('spot-list').addEventListener('click', e => {
    const btn = e.target.closest('.tips-toggle');
    if (!btn) return;
    const id = btn.dataset.id;
    expanded.has(id) ? expanded.delete(id) : expanded.add(id);
    renderSpots();
  });
}

async function init() {
  await loadSpots();
  renderSpots();
  initRegionTabs();
  initCatFilter();
  initTipsToggle();
  initWeather('weather-scroll', region);
}

document.addEventListener('DOMContentLoaded', init);
