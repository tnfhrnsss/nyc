# CLAUDE.md — NYC Guide 작업 가이드

이 파일은 Claude Code가 새 세션에서 프로젝트를 이어서 작업할 때 필요한 모든 컨텍스트를 담고 있습니다.

---

## 프로젝트 개요

뉴욕·퀸즈·워싱턴 D.C.·나이아가라를 여행하는 **한국인**을 위한 오프라인 우선 웹앱.
- 현지 맛집 주문 Q&A 가이드 (한영 병기)
- 관광 스팟 정보 (무료/유료, 예약 여부, 팁)
- 지역별 날씨 (Open-Meteo API)
- Leaflet 지도 + 핀
- 화장실 찾기 (현재 위치 기반 Leaflet 지도)
- PWA (Service Worker 오프라인 캐시)
- 배포 목표: **GitHub Pages**

---

## 기술 스택

- **빌드 도구 없음** — 순수 HTML5 + Vanilla JS + CSS
- **지도** — Leaflet.js + OpenStreetMap (CDN)
- **날씨** — Open-Meteo API (무료, API 키 불필요)
- **데이터** — `data/stores.json`, `data/spots.json` (로컬 JSON)
- **오프라인** — `sw.js` Service Worker
- **로컬 서버** — `python3 -m http.server 8787` (프로젝트 루트에서 실행)

---

## 폴더 구조

```
us-order-guide/
├── index.html          ← 푸드(맛집) 홈
├── store.html          ← 가게 상세 (?id=store-id)
├── spots.html          ← 관광 스팟
├── map.html            ← Leaflet 지도
├── restroom.html       ← 화장실 찾기 (현재 위치 기반)
├── manifest.json       ← PWA
├── sw.js               ← Service Worker (캐시 버전: nyc-guide-v3)
├── README.md
├── css/
│   └── style.css       ← 단일 CSS, CSS 변수 기반
├── js/
│   ├── app.js          ← 푸드 홈 로직
│   ├── store.js        ← 가게 상세 로직
│   ├── spots.js        ← 관광 스팟 로직
│   ├── map.js          ← Leaflet 지도 로직
│   ├── restroom.js     ← 화장실 찾기 로직
│   └── weather.js      ← Open-Meteo API + localStorage 캐시
├── data/
│   ├── stores.json     ← 맛집 데이터 (단일 소스)
│   └── spots.json      ← 관광 스팟 데이터 (단일 소스)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 지역 구조

### 푸드(index.html) 탭 순서
| 탭 라벨 | `region` 값 | 필터 방식 |
|---------|------------|----------|
| 다운타운 | `downtown` | `region=="manhattan" && area=="downtown"` |
| 미드타운 | `midtown`  | `region=="manhattan" && area=="midtown"`  |
| 어퍼사이드 | `uptown` | `region=="manhattan" && area=="uptown"`  |
| Queens | `queens`   | `region=="queens"` |
| Washington D.C. | `washington` | `region=="washington"` |
| Niagara | `niagara`  | 날씨만 표시, 식당 없음 |

### 스팟(spots.html) 탭 순서
다운타운 / 미드타운 / 어퍼사이드 / Queens / Washington D.C. (Niagara 없음)

### 맨해튼 구역 기준
- **다운타운**: ~23번가 이남 (소호, 웨스트·이스트빌리지, 첼시, LES, 트라이베카)
- **미드타운**: 23~59번가 (타임스퀘어, 5번가, 그랜드센트럴, 허드슨야즈)
- **어퍼사이드**: 59번가 이북 (센트럴파크, Met, 자연사박물관)

---

## 데이터 스키마

### stores.json — 맛집

루트 구조: `{ "stores": [ ... ] }`

```json
{
  "id": "string (URL용 kebab-case)",
  "name": "string (영문)",
  "category": "bagel|pizza|deli|coffee|taco|ramen|burger|bakery|other",
  "region": "manhattan|queens|washington|niagara",
  "area": "downtown|midtown|uptown|null",  // Manhattan만 필수
  "address": "string",
  "lat": 0.0, "lng": 0.0,
  "tip_expected": true|false,
  "has_seating": true|false,
  "price_range": "$X~Y",                  // 추천 메뉴 기준 1인 예상
  "description": "string (한국어 1~2줄)",
  "ordering_flow": [
    {
      "step": 1,
      "question_en": "string",
      "question_ko": "string",
      "tip": "string (선택)",
      "options": [
        { "en": "string", "ko": "string", "recommended": true|false }
      ]
    }
  ],
  "sauce_guide": [
    { "name": "string", "name_ko": "string", "description_ko": "string", "recommended": true|false }
  ],
  "tips": ["string", ...]
}
```

### spots.json — 관광 스팟

루트 구조: 배열 `[ ... ]`

```json
{
  "id": "string",
  "name_ko": "string (한국어명)",
  "region": "manhattan|queens|washington",
  "area": "downtown|midtown|uptown|null",
  "category": "landmark|museum|park|view|market",
  "address": "string",
  "lat": 0.0, "lng": 0.0,
  "admission": "free|paid",
  "admission_note": "string (예: '무료' 또는 '유료 ($30)')",
  "reservation": false|true|"recommended",
  "hours": "string",
  "description_ko": "string",
  "tips": ["string", ...]
}
```

---

## 현재 데이터 현황

### 맛집 (stores.json) — 총 45곳

| 구역 | 가게 | 카테고리 |
|------|------|----------|
| **다운타운** (14곳) | Ess-a-Bagel, Katz's Delicatessen, Joe's Pizza, Los Tacos No. 1, Tacombi, Ippudo NY, Dominique Ansel Bakery, Clinton St. Baking Co., Russ & Daughters Cafe, Sadelle's, Breads Bakery, Blue Bottle Coffee, Intelligentsia Coffee, La Colombe Coffee | bagel, deli, pizza, taco×2, ramen, bakery×4, coffee×3 |
| **미드타운** (11곳) | Stumptown Coffee, The Halal Guys, Totto Ramen, Go Go Curry, Shake Shack, Burger Joint, Magnolia Bakery, Junior's Restaurant, Jongro BBQ, Dallas BBQ Times Square, CAVA | coffee, other×2, ramen, burger×2, bakery, other×4 |
| **어퍼사이드** (6곳) | Levain Bakery, Absolute Bagels, Gray's Papaya, Cafe Lalo, Hungarian Pastry Shop, Zabar's | bakery×2, bagel, other, coffee, deli |
| **Queens** (5곳) | Xi'an Famous Foods, Joe's Shanghai, Nan Xiang Xiao Long Bao, Taverna Kyclades, New World Mall Food Court | other×5 |
| **Washington D.C.** (9곳) | Old Ebbitt Grill, Founding Farmers, District Taco, Shake Shack DC, Mitsitam Native Foods Café, Jaleo by José Andrés, Eastern Market, Ted's Bulletin, Ben's Chili Bowl | other×5, taco, burger, deli×2 |

### 관광 스팟 (spots.json) — 총 27곳

| 구역 | 스팟 |
|------|------|
| **다운타운** (8곳) | 브루클린 브리지, 자유의 여신상, 휘트니 미술관, 하이라인, 첼시 마켓, 트레이더 조, 소호, 9/11 메모리얼 |
| **미드타운** (10곳) | 베슬, 엣지 전망대, 타임스 스퀘어, 엠파이어 스테이트, 탑 오브 더 록, 그랜드 센트럴, 뉴욕 공립도서관, MoMA, H Mart 코리아타운, 홀푸드 마켓 |
| **어퍼사이드** (3곳) | 센트럴 파크, The Met, 자연사 박물관 |
| **Queens** (2곳) | 플러싱 메도스 코로나 파크, H Mart 플러싱 |
| **Washington D.C.** (4곳) | 링컨 기념관, 워싱턴 기념탑, 스미소니언 자연사 박물관, 국회의사당 |

---

## 날씨 (weather.js)

- API: `https://api.open-meteo.com/v1/forecast`
- 캐시: `localStorage` 키 `nyc_weather_v1_{region}`, TTL 30분
- CITY_MAP 키: `downtown | midtown | uptown | queens | washington | niagara`
- 호출: `initWeather('weather-scroll', region)` — region 탭 변경 시마다 호출

---

## Service Worker (sw.js)

- 캐시 이름: `nyc-guide-v3`
- 전략: App Shell은 cache-first, Open-Meteo API는 network-first + cache fallback
- **새 파일 추가 시** `APP_SHELL` 배열에 경로 추가 후 캐시 이름 버전 올리기 (`nyc-guide-v4` 등)

---

## 하단 네비게이션

모든 HTML 파일(index, store, spots, map, restroom)에 동일한 구조 (SVG 아이콘 사용):

```html
<nav class="bottom-nav">
  <a class="nav-item [active]" href="index.html">푸드 아이콘</a>
  <a class="nav-item [active]" href="spots.html">스팟 아이콘</a>
  <a class="nav-item [active]" href="map.html">지도 아이콘</a>
  <a class="nav-item [active]" href="restroom.html">화장실 아이콘</a>
</nav>
```
현재 페이지 항목에만 `active` 클래스 추가.

---

## 로컬 개발

```bash
# 프로젝트 루트에서 실행
cd /Users/petermini/Documents/nyc/us-order-guide
python3 -m http.server 8787

# 브라우저에서 접속
# http://localhost:8787/index.html
```

Service Worker는 `http://localhost`에서만 동작 (https 불필요).

---

## 남은 작업 (v1 완성까지)

### 기능 개선
- [ ] 지도(map.html)에 스팟 핀도 표시 (stores + spots 통합)
- [ ] GitHub Pages 배포 확인
- [ ] PWA 아이콘 개선 (현재 단순 파란 사각형)

### v2 예정
- [ ] 팁 계산기 (18/20/22%)
- [ ] 카드 단말기 팁 가이드

---

## 주요 설계 결정 및 이유

| 결정 | 이유 |
|------|------|
| 빌드 도구 없음 | GitHub Pages 단순 배포, 학습 부담 최소화 |
| 단일 stores.json | 모든 페이지가 같은 소스 참조, 유지보수 단순 |
| stores.json 루트 키 `"stores"` | 배열 직접 노출 대신 네임스페이스 래핑 |
| Manhattan을 area로 세분화 | region 필드는 유지하되 area 필드 추가 — 하위 호환성 보장 |
| 날씨 캐시 per-region | 지역별 30분 TTL, 중복 API 호출 방지 |
| Niagara 날씨만 표시 | 투어 지역이라 식당 정보 불필요 |
