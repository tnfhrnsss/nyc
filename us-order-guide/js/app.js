const CAT_LABELS = {
  bagel:  '🥯 베이글',
  burger: '🍔 버거',
  pizza:  '🍕 피자',
  deli:   '🥪 델리',
  coffee: '☕ 커피',
  bakery: '🥐 베이커리',
  taco:   '🌮 타코',
  ramen:  '🍜 라멘',
  other:  '🍽️ 기타',
};

const REGION_LABELS = {
  manhattan:  'Manhattan',
  queens:     'Queens',
  washington: 'Washington D.C.',
  niagara:    'Niagara',
};

const MANHATTAN_AREAS = new Set(['downtown', 'midtown', 'uptown']);

let stores  = [];
let region   = 'downtown';
let category = 'all'; // 'all' = 필터 없음 (전체)
let query    = '';

async function loadStores() {
  const res = await fetch('data/stores.json');
  const json = await res.json();
  stores = json.stores;
}

function filtered() {
  const q = query.trim().toLowerCase();
  return stores.filter(s => {
    if (MANHATTAN_AREAS.has(region)) {
      if (s.region !== 'manhattan' || s.area !== region) return false;
    } else {
      if (s.region !== region) return false;
    }
    if (category !== 'all' && s.category !== category) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderList() {
  const list = document.getElementById('store-list');
  const items = filtered();
  if (!items.length) {
    list.innerHTML = `<div class="empty-msg">등록된 가게가 없습니다.<br>다른 지역이나 카테고리를 선택해보세요.</div>`;
    return;
  }
  list.innerHTML = items.map(s => `
    <a class="store-card" href="store.html?id=${s.id}">
      <div class="store-card-top">
        <div class="store-name">${s.name}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${s.price_range ? `<span class="price-tag">${s.price_range}</span>` : ''}
          <div class="cat-tag">${CAT_LABELS[s.category] || s.category}</div>
        </div>
      </div>
      <div class="store-desc">${s.description}</div>
      <div class="store-meta">
        <span class="meta-tag">📍 ${REGION_LABELS[s.region] || s.region}</span>
        ${s.tip_expected ? '<span class="meta-tag">🪙 Tip</span>' : ''}
        ${s.has_seating  ? '<span class="meta-tag">🪑</span>' : ''}
      </div>
    </a>
  `).join('');
}

function setNiagaraMode(isNiagara) {
  document.getElementById('store-section').classList.toggle('hidden', isNiagara);
}

function resetCatFilter() {
  category = 'all';
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.cat-chip[data-cat="all"]').classList.add('active');
}

function initRegionTabs() {
  document.querySelectorAll('.region-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      region = tab.dataset.region;
      document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      resetCatFilter();
      initWeather('weather-scroll', region);
      setNiagaraMode(region === 'niagara');
      if (region !== 'niagara') renderList();
    });
  });
}

function initCatFilter() {
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      category = chip.dataset.cat;
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderList();
    });
  });
}

function initSearch() {
  document.getElementById('search-input').addEventListener('input', e => {
    query = e.target.value;
    renderList();
  });
}

async function init() {
  await loadStores();
  renderList();
  initRegionTabs();
  initCatFilter();
  initSearch();
  initWeather('weather-scroll', region); // 초기 지역(manhattan) 날씨
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
}

document.addEventListener('DOMContentLoaded', init);
