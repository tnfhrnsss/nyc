const CITY_MAP = {
  downtown:   { name_ko: '뉴욕 (다운타운)',  lat: 40.7128, lng: -74.0060 },
  midtown:    { name_ko: '뉴욕 (미드타운)',  lat: 40.7580, lng: -73.9855 },
  uptown:     { name_ko: '뉴욕 (어퍼사이드)', lat: 40.7831, lng: -73.9712 },
  queens:     { name_ko: '뉴욕 (퀸즈)',      lat: 40.7282, lng: -73.7949 },
  washington: { name_ko: '워싱턴 D.C.',      lat: 38.9072, lng: -77.0369 },
  niagara:    { name_ko: '나이아가라',        lat: 43.0962, lng: -79.0377 },
};

const WMO = {
  0:  { ko: '맑음',       icon: '☀️' },
  1:  { ko: '대체로 맑음', icon: '🌤️' },
  2:  { ko: '구름 조금',   icon: '⛅' },
  3:  { ko: '흐림',       icon: '🌥️' },
  45: { ko: '안개',       icon: '🌫️' },
  48: { ko: '짙은 안개',  icon: '🌫️' },
  51: { ko: '이슬비',     icon: '🌦️' },
  53: { ko: '이슬비',     icon: '🌦️' },
  55: { ko: '이슬비',     icon: '🌦️' },
  61: { ko: '비',         icon: '🌧️' },
  63: { ko: '비',         icon: '🌧️' },
  65: { ko: '폭우',       icon: '🌧️' },
  71: { ko: '눈',         icon: '🌨️' },
  73: { ko: '눈',         icon: '🌨️' },
  75: { ko: '폭설',       icon: '❄️' },
  80: { ko: '소나기',     icon: '🌦️' },
  81: { ko: '소나기',     icon: '🌦️' },
  82: { ko: '강한 소나기', icon: '⛈️' },
  95: { ko: '뇌우',       icon: '⛈️' },
  99: { ko: '뇌우+우박',  icon: '⛈️' },
};

function wmoInfo(code) {
  return WMO[code] || { ko: '알 수 없음', icon: '🌡️' };
}

async function fetchCityWeather(city) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}`
    + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode`
    + `&timezone=America%2FNew_York&forecast_days=2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

function buildCards(city, data) {
  const days = ['오늘', '내일'];
  return [0, 1].map(i => {
    const info = wmoInfo(data.daily.weathercode[i]);
    const max  = Math.round(data.daily.temperature_2m_max[i]);
    const min  = Math.round(data.daily.temperature_2m_min[i]);
    const rain = data.daily.precipitation_probability_max[i] ?? 0;
    return `
      <div class="w-card">
        <div class="w-city">${city.name_ko}</div>
        <div class="w-day">${days[i]}</div>
        <div class="w-temp">${info.icon} ${max}°</div>
        <div class="w-cond">${info.ko}</div>
        <div class="w-hilo">최고 ${max}° / 최저 ${min}°</div>
        <div class="w-rain">💧 강수 ${rain}%</div>
      </div>`;
  }).join('');
}

async function initWeather(containerId, region) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const city = CITY_MAP[region];
  if (!city) { el.innerHTML = ''; return; }

  const CACHE_KEY = `nyc_weather_v1_${region}`;
  const TTL = 30 * 60 * 1000; // 30분

  // 캐시 유효하면 바로 렌더링
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < TTL) {
      el.innerHTML = buildCards(city, cached.data);
      return;
    }
  } catch (_) {}

  el.innerHTML = '<div class="w-loading">날씨 불러오는 중…</div>';

  // 실시간 fetch
  try {
    const data = await fetchCityWeather(city);
    el.innerHTML = buildCards(city, data);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {
    // 만료된 캐시라도 사용
    try {
      const stale = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (stale) {
        el.innerHTML = buildCards(city, stale.data);
        const banner = document.getElementById('offline-banner');
        if (banner) banner.classList.remove('hidden');
      } else {
        el.innerHTML = '<div class="w-loading">날씨 정보를 불러올 수 없습니다.</div>';
      }
    } catch (_2) {
      el.innerHTML = '<div class="w-loading">날씨 정보를 불러올 수 없습니다.</div>';
    }
  }
}
