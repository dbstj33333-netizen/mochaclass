/* =========================================================
   오프라인 클래스 검색 페이지 로직 (순수 JS)
   - 검색 / 지역 / 카테고리 / 요일 / 금액 / 상세필터 / 정렬
   - 지도 마커 연동 / 보기 전환 / 위치 변경 / 찜
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 인라인 SVG 아이콘 ---------- */
  const icons = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="3" x2="8" y2="6"/><line x1="16" y1="3" x2="16" y2="6"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 12 10 18 20 6"/></svg>',
    won: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7l3 10 3-8 2 8 3-10"/><line x1="3" y1="11" x2="21" y2="11"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="8" x2="20" y2="8"/><circle cx="9" cy="8" r="2.2"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="15" cy="16" r="2.2"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.5-9.2-9C1.4 8.3 2.6 5 5.8 5 8 5 9.3 6.7 12 9c2.7-2.3 4-4 6.2-4 3.2 0 4.4 3.3 3 6-2.2 4.5-9.2 9-9.2 9z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.2-9C1.4 8.3 2.6 5 5.8 5 8 5 9.3 6.7 12 9c2.7-2.3 4-4 6.2-4 3.2 0 4.4 3.3 3 6-2.2 4.5-9.2 9-9.2 9z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 4 21 10 15 10"/><path d="M20 14a8 8 0 1 1-2-7l3 3"/></svg>',
    // 지도용 무료 아이콘 (Material Symbols - Apache 2.0)
    markerPin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
    myLocation: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A9 9 0 0 0 13 3.06V1h-2v2.06A9 9 0 0 0 3.06 11H1v2h2.06A9 9 0 0 0 11 20.94V23h2v-2.06A9 9 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/></svg>'
  };

  /* ---------- 상태 ---------- */
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const state = {
    classType: 'offline',          // 클래스 유형 탭
    keyword: '',                   // 적용된 검색어
    location: '성수동',            // 현재 위치 (라벨/지도 중심)
    region: 'all',                 // 지역 필터
    category: 'all',               // 카테고리 필터
    days: [],                      // 요일(다중)
    price: { min: null, max: null, quick: 'all' },
    timeSlots: [],
    classFormats: [],
    reservationOptions: [],
    distance: 'all',
    sort: 'distance',
    viewMode: isMobile ? 'list' : 'map',
    selectedClassId: null,
    mapZoom: 1,
    mapPage: 0
  };

  /* 드롭다운 임시(draft) 값 — 적용 버튼을 눌러야 state 에 반영 */
  let draft = {};

  /* 현재 필터 결과 캐시 / 지도보기 페이지당 카드 수 / 모바일 판별 */
  let currentResults = [];
  const MAP_PER_PAGE = 3;
  const onMobile = () => window.matchMedia('(max-width: 767px)').matches;

  /* ---------- DOM 참조 ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const dom = {};

  /* ---------- 유틸 ---------- */
  function formatDistance(m) {
    return m < 1000 ? m + 'm' : (m / 1000).toFixed(1) + 'km';
  }
  function formatPrice(n) {
    return Number(n).toLocaleString('ko-KR') + '원';
  }
  function priceButtonLabel() {
    const p = state.price;
    if (p.quick && p.quick !== 'all') {
      const q = FILTER_OPTIONS.priceQuick.find((x) => x.key === p.quick);
      if (q) return q.label.replace('원~', '~').replace('만원~', '만~');
    }
    if (p.min != null && p.max != null) return formatPrice(p.min) + '~' + formatPrice(p.max);
    if (p.min != null) return formatPrice(p.min) + ' 이상';
    if (p.max != null) return formatPrice(p.max) + ' 이하';
    return '전체';
  }
  function dayButtonLabel() {
    const d = state.days;
    if (!d.length) return '전체';
    if (d.length === 1) return d[0];
    if (d.length === 2) return d[0] + ', ' + d[1];
    return d[0] + ' 외 ' + (d.length - 1) + '개';
  }
  function detailCount() {
    return state.timeSlots.length + state.classFormats.length +
      state.reservationOptions.length + (state.distance !== 'all' ? 1 : 0);
  }

  /* =========================================================
     필터링 / 정렬
     ========================================================= */
  function filterClasses(data, f) {
    // 1) 클래스 유형: 현재 데이터는 모두 오프라인 → 'offline'/'all' 만 결과 표시
    if (f.classType !== 'offline' && f.classType !== 'all') return [];

    return data.filter((c) => {
      // 2) 검색어 (title + category + studio + region)
      if (f.keyword) {
        const hay = (c.title + ' ' + c.category + ' ' + c.studio + ' ' + c.region).toLowerCase();
        if (!hay.includes(f.keyword.toLowerCase())) return false;
      }
      // 3) 지역
      if (f.region !== 'all' && c.region !== f.region) return false;
      // 4) 카테고리
      if (f.category !== 'all' && c.category !== f.category) return false;
      // 5) 요일 (교집합)
      if (f.days.length && !f.days.some((d) => c.availableDays.includes(d))) return false;
      // 6) 금액
      if (f.price.min != null && c.price < f.price.min) return false;
      if (f.price.max != null && c.price > f.price.max) return false;
      // 7) 시간대
      if (f.timeSlots.length && !f.timeSlots.includes(c.timeSlot)) return false;
      // 8) 수업 형태
      if (f.classFormats.length && !f.classFormats.includes(c.classFormat)) return false;
      // 9) 예약 가능 여부 (교집합)
      if (f.reservationOptions.length &&
          !f.reservationOptions.some((r) => c.reservationOptions.includes(r))) return false;
      // 10) 거리
      if (f.distance !== 'all') {
        const lim = FILTER_OPTIONS.distances.find((x) => x.key === f.distance);
        if (lim && c.distance > lim.m) return false;
      }
      return true;
    });
  }

  function sortClasses(data, sort) {
    const arr = data.slice();
    switch (sort) {
      case 'popularity': return arr.sort((a, b) => b.popularity - a.popularity);
      case 'priceLow': return arr.sort((a, b) => a.price - b.price);
      case 'priceHigh': return arr.sort((a, b) => b.price - a.price);
      case 'latest': return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case 'distance':
      default: return arr.sort((a, b) => a.distance - b.distance);
    }
  }

  function getResults() {
    return sortClasses(filterClasses(classData, state), state.sort);
  }

  /* =========================================================
     렌더링
     ========================================================= */
  function render() {
    state.mapPage = 0;            // 필터/검색이 바뀌면 첫 페이지부터
    const results = getResults();
    renderClassList(results);
    updateMapMarkers(results);
    updateResultCount(results.length);
    updateResultTitle();
    updateFilterButtons();
  }

  /* 카드 1개 HTML */
  function cardHTML(c) {
    const thumb = c.image
      ? '<img class="oc-card-thumb" src="' + c.image + '" alt="' + c.title + '">'
      : '<div class="oc-thumb-empty">이미지 준비 중</div>';
    const favCls = c.isFavorite ? ' is-fav' : '';
    const favIcon = c.isFavorite ? icons.heartFill : icons.heart;
    const favLabel = c.isFavorite ? '찜 해제' : '찜하기';
    const sel = c.id === state.selectedClassId ? ' is-selected' : '';
    return '' +
      '<article class="oc-card' + sel + '" data-id="' + c.id + '" tabindex="0">' +
        thumb +
        '<div class="oc-card-body">' +
          '<span class="oc-card-badge">' + c.category + '</span>' +
          '<h3 class="oc-card-title">' + c.title + '</h3>' +
          '<p class="oc-card-meta">' +
            '<span>' + icons.pin + '<i>' + c.studio + '</i></span>' +
            '<span>' + icons.calendar + '<i>' + c.schedule + '</i></span>' +
          '</p>' +
        '</div>' +
        '<div class="oc-card-side">' +
          '<button type="button" class="oc-fav' + favCls + '" data-fav="' + c.id + '" aria-label="' + favLabel + '">' + favIcon + '</button>' +
          '<div>' +
            '<div class="oc-card-trans">' + c.transportType + ' ' + c.transportTime + '분</div>' +
            '<div class="oc-card-dist">' + formatDistance(c.distance) + '</div>' +
            '<div class="oc-card-price">' + formatPrice(c.price) + '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderClassList(data) {
    currentResults = data;
    if (!data.length) {
      dom.list.innerHTML = '' +
        '<div class="oc-empty">' + icons.search +
        '<strong>조건에 맞는 클래스가 없습니다.</strong>' +
        '<p>필터를 변경하거나 검색 조건을 초기화해보세요.</p>' +
        '<button type="button" id="ocEmptyReset">전체 필터 초기화</button>' +
        '</div>';
      const btn = $('#ocEmptyReset');
      if (btn) btn.addEventListener('click', resetAllFilters);
      return;
    }

    // 지도 보기 + 모바일 → 3개씩 페이지네이션
    const paginate = state.viewMode === 'map' && onMobile();
    let pageData = data;
    let totalPages = 1;
    if (paginate) {
      totalPages = Math.ceil(data.length / MAP_PER_PAGE);
      if (state.mapPage >= totalPages) state.mapPage = 0;
      if (state.mapPage < 0) state.mapPage = totalPages - 1;
      pageData = data.slice(state.mapPage * MAP_PER_PAGE, (state.mapPage + 1) * MAP_PER_PAGE);
    }

    let html = pageData.map(cardHTML).join('');
    if (paginate && totalPages > 1) {
      html +=
        '<nav class="oc-pager" aria-label="클래스 페이지 이동">' +
          '<button type="button" class="oc-pager-btn" data-dir="prev" aria-label="이전 클래스">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>' +
          '</button>' +
          '<span class="oc-pager-info"><b>' + (state.mapPage + 1) + '</b> / ' + totalPages + '</span>' +
          '<button type="button" class="oc-pager-btn" data-dir="next" aria-label="다음 클래스">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</button>' +
        '</nav>';
    }
    dom.list.innerHTML = html;

    if (paginate && totalPages > 1) {
      $$('.oc-pager-btn', dom.list).forEach((btn) => btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        state.mapPage = dir === 'prev'
          ? (state.mapPage - 1 + totalPages) % totalPages
          : (state.mapPage + 1) % totalPages;
        renderClassList(currentResults);
        dom.list.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
  }

  function updateResultCount(n) {
    dom.resultCount.textContent = n;
  }

  function updateResultTitle() {
    dom.resultLoc.textContent = state.location;
    dom.mapCenter.lastChild.textContent = state.location;
  }

  /* 지도 마커 (필터 결과만 표시) */
  function updateMapMarkers(data) {
    // 기존 클래스 마커 제거
    $$('.oc-marker', dom.markerLayer).forEach((m) => m.remove());

    data.forEach((c) => {
      const m = document.createElement('button');
      m.type = 'button';
      m.className = 'oc-marker' + (c.id === state.selectedClassId ? ' is-selected' : '');
      m.dataset.id = c.id;
      m.style.left = c.markerX + '%';
      m.style.top = c.markerY + '%';
      m.setAttribute('aria-label', c.title);
      m.title = c.title;
      m.innerHTML = icons.markerPin;
      m.addEventListener('click', () => selectClass(c.id, true));
      dom.markerLayer.appendChild(m);
    });

    // 클러스터 마커는 결과가 있을 때만 노출
    $$('.oc-cluster', dom.markerLayer).forEach((el) => {
      el.style.display = data.length ? 'flex' : 'none';
    });
  }

  /* 클래스 선택 (카드 ↔ 마커 연동) */
  function selectClass(id, fromMarker) {
    state.selectedClassId = id;
    // 지도보기+모바일에서 마커를 누르면, 해당 카드가 있는 페이지로 이동 후 표시
    if (fromMarker && state.viewMode === 'map' && onMobile() && currentResults.length) {
      const idx = currentResults.findIndex((c) => c.id === id);
      if (idx >= 0) {
        const page = Math.floor(idx / MAP_PER_PAGE);
        if (page !== state.mapPage) { state.mapPage = page; renderClassList(currentResults); }
      }
    }
    $$('.oc-card').forEach((el) => el.classList.toggle('is-selected', +el.dataset.id === id));
    $$('.oc-marker', dom.markerLayer).forEach((el) => el.classList.toggle('is-selected', +el.dataset.id === id));
    if (fromMarker) {
      const card = $('.oc-card[data-id="' + id + '"]');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* 필터 버튼 라벨/활성 상태 갱신 */
  function updateFilterButtons() {
    setFilterBtn('region', state.region === 'all' ? '전체' : state.region, state.region !== 'all');
    setFilterBtn('category', state.category === 'all' ? '전체' : state.category, state.category !== 'all');
    setFilterBtn('day', dayButtonLabel(), state.days.length > 0);
    setFilterBtn('price', priceButtonLabel(), state.price.min != null || state.price.max != null);

    const cnt = detailCount();
    const detailFilter = $('.oc-filter[data-filter="detail"]');
    detailFilter.classList.toggle('is-active', cnt > 0);
    const badge = $('#ocDetailCount');
    if (cnt > 0) { badge.textContent = cnt; badge.hidden = false; }
    else { badge.hidden = true; }
  }

  function setFilterBtn(name, valText, active) {
    const wrap = $('.oc-filter[data-filter="' + name + '"]');
    if (!wrap) return;
    $('.oc-filter-val', wrap).textContent = valText;
    wrap.classList.toggle('is-active', active);
  }

  /* =========================================================
     드롭다운 공통
     ========================================================= */
  function closeAllDropdowns() {
    $$('.oc-dropdown.is-open').forEach((d) => d.classList.remove('is-open'));
    $$('.oc-filter-btn[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }

  function openDropdown(name) {
    const wrap = $('.oc-filter[data-filter="' + name + '"]');
    const dd = $('.oc-dropdown', wrap);
    const btn = $('.oc-filter-btn', wrap);
    const isOpen = dd.classList.contains('is-open');
    closeAllDropdowns();
    if (isOpen) return; // 같은 버튼 → 닫기
    buildDropdown(name); // 현재 적용값으로 draft 초기화 + 내용 렌더
    dd.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    const firstFocus = dd.querySelector('button, input, [tabindex]');
    if (firstFocus) firstFocus.focus();
  }

  function buildDropdown(name) {
    const dd = $('.oc-dropdown', $('.oc-filter[data-filter="' + name + '"]'));
    if (name === 'region') dd.innerHTML = buildSingleList(FILTER_OPTIONS.regions, state.region);
    else if (name === 'category') dd.innerHTML = buildSingleList(FILTER_OPTIONS.categories, state.category);
    else if (name === 'day') buildDayDropdown(dd);
    else if (name === 'price') buildPriceDropdown(dd);
    else if (name === 'detail') buildDetailDropdown(dd);
    bindDropdown(name, dd);
  }

  /* 단일 선택 목록 (지역/카테고리) */
  function buildSingleList(options, current) {
    let html = '<button type="button" class="oc-opt' + (current === 'all' ? ' selected' : '') + '" data-val="all">' +
      '<span class="oc-check">' + icons.check + '</span>전체</button>';
    options.forEach((o) => {
      html += '<button type="button" class="oc-opt' + (current === o ? ' selected' : '') + '" data-val="' + o + '">' +
        '<span class="oc-check">' + icons.check + '</span>' + o + '</button>';
    });
    return html;
  }

  /* 요일 (다중 + 적용) */
  function buildDayDropdown(dd) {
    draft.days = state.days.slice();
    let chips = '<button type="button" class="oc-chip' + (!draft.days.length ? ' selected' : '') + '" data-day="all">전체</button>';
    FILTER_OPTIONS.days.forEach((d) => {
      chips += '<button type="button" class="oc-chip' + (draft.days.includes(d) ? ' selected' : '') + '" data-day="' + d + '">' + d + '</button>';
    });
    dd.innerHTML =
      '<div class="oc-dd-title">요일 선택 (다중)</div>' +
      '<div class="oc-dd-chips">' + chips + '</div>' +
      '<div class="oc-dd-actions">' +
        '<button type="button" class="oc-dd-reset">초기화</button>' +
        '<button type="button" class="oc-dd-apply">적용</button>' +
      '</div>';
  }

  /* 금액 (빠른선택 + 직접입력 + 적용) */
  function buildPriceDropdown(dd) {
    draft.price = { min: state.price.min, max: state.price.max, quick: state.price.quick };
    let quick = '';
    FILTER_OPTIONS.priceQuick.forEach((q) => {
      quick += '<button type="button" class="oc-chip' + (draft.price.quick === q.key ? ' selected' : '') + '" data-quick="' + q.key + '">' + q.label + '</button>';
    });
    dd.innerHTML =
      '<div class="oc-dd-title">빠른 선택</div>' +
      '<div class="oc-dd-chips">' + quick + '</div>' +
      '<div class="oc-dd-title">직접 입력</div>' +
      '<div class="oc-price-inputs">' +
        '<input type="text" inputmode="numeric" class="oc-price-min" placeholder="최소" value="' + (draft.price.min != null ? draft.price.min.toLocaleString('ko-KR') : '') + '">' +
        '<span>~</span>' +
        '<input type="text" inputmode="numeric" class="oc-price-max" placeholder="최대" value="' + (draft.price.max != null ? draft.price.max.toLocaleString('ko-KR') : '') + '">' +
      '</div>' +
      '<div class="oc-price-error"></div>' +
      '<div class="oc-dd-actions">' +
        '<button type="button" class="oc-dd-reset">초기화</button>' +
        '<button type="button" class="oc-dd-apply">적용</button>' +
      '</div>';
  }

  /* 상세필터 */
  function buildDetailDropdown(dd) {
    draft.detail = {
      timeSlots: state.timeSlots.slice(),
      classFormats: state.classFormats.slice(),
      reservationOptions: state.reservationOptions.slice(),
      distance: state.distance,
      sort: state.sort
    };
    // 칩 그룹: multi=true 다중선택, useObj=true 는 {key,label} 옵션
    const chipGroup = (title, opts, selected, key, multi, useObj, spanAll) => {
      let chips = '';
      opts.forEach((o) => {
        const val = useObj ? o.key : o;
        const lab = useObj ? o.label : o;
        const on = multi ? selected.includes(val) : (selected === val);
        chips += '<button type="button" class="oc-chip' + (on ? ' selected' : '') +
          '" data-group="' + key + '" data-val="' + val + '">' + lab + '</button>';
      });
      return '<div class="oc-dd-group' + (spanAll ? ' span-all' : '') + '"><div class="oc-dd-title">' + title + '</div>' +
        '<div class="oc-dd-chips">' + chips + '</div></div>';
    };

    dd.innerHTML =
      '<div class="oc-detail-grid">' +
        chipGroup('수업 시간대', FILTER_OPTIONS.timeSlots, draft.detail.timeSlots, 'timeSlots', true, false) +
        chipGroup('수업 형태', FILTER_OPTIONS.classFormats, draft.detail.classFormats, 'classFormats', true, false) +
        chipGroup('예약 가능 여부', FILTER_OPTIONS.reservationOptions, draft.detail.reservationOptions, 'reservationOptions', true, false) +
        chipGroup('거리', FILTER_OPTIONS.distances, draft.detail.distance, 'distance', false, true, true) +
        chipGroup('정렬', FILTER_OPTIONS.sorts, draft.detail.sort, 'sort', false, true, true) +
      '</div>' +
      '<div class="oc-dd-actions">' +
        '<button type="button" class="oc-dd-reset">초기화</button>' +
        '<button type="button" class="oc-dd-apply">필터 적용</button>' +
      '</div>';
  }

  /* 드롭다운 내부 이벤트 바인딩 */
  function bindDropdown(name, dd) {
    if (name === 'region' || name === 'category') {
      $$('.oc-opt', dd).forEach((opt) => {
        opt.addEventListener('click', () => {
          const val = opt.dataset.val;
          state[name] = val;
          closeAllDropdowns();
          render();
        });
      });
    }

    if (name === 'day') {
      $$('.oc-chip', dd).forEach((chip) => {
        chip.addEventListener('click', () => {
          const d = chip.dataset.day;
          if (d === 'all') draft.days = [];
          else {
            const i = draft.days.indexOf(d);
            if (i > -1) draft.days.splice(i, 1); else draft.days.push(d);
          }
          // chip UI 갱신
          $$('.oc-chip', dd).forEach((c) => {
            const cd = c.dataset.day;
            c.classList.toggle('selected', cd === 'all' ? draft.days.length === 0 : draft.days.includes(cd));
          });
        });
      });
      $('.oc-dd-reset', dd).addEventListener('click', () => {
        state.days = []; closeAllDropdowns(); render();
      });
      $('.oc-dd-apply', dd).addEventListener('click', () => {
        state.days = draft.days.slice();
        closeAllDropdowns(); render();
      });
    }

    if (name === 'price') {
      const minEl = $('.oc-price-min', dd);
      const maxEl = $('.oc-price-max', dd);
      const errEl = $('.oc-price-error', dd);
      const applyBtn = $('.oc-dd-apply', dd);
      const parseNum = (v) => {
        const n = v.replace(/[^0-9]/g, '');
        return n === '' ? null : parseInt(n, 10);
      };
      const validate = () => {
        const mn = parseNum(minEl.value), mx = parseNum(maxEl.value);
        if (mn != null && mx != null && mn > mx) {
          errEl.textContent = '최소 금액이 최대 금액보다 큽니다.';
          applyBtn.disabled = true; return false;
        }
        errEl.textContent = ''; applyBtn.disabled = false; return true;
      };
      [minEl, maxEl].forEach((el) => el.addEventListener('input', () => {
        // 숫자만 + 천단위 콤마
        const n = parseNum(el.value);
        el.value = n != null ? n.toLocaleString('ko-KR') : '';
        draft.price.quick = 'all';
        $$('.oc-chip', dd).forEach((c) => c.classList.toggle('selected', c.dataset.quick === 'all'));
        validate();
      }));
      $$('.oc-chip', dd).forEach((chip) => {
        chip.addEventListener('click', () => {
          const q = FILTER_OPTIONS.priceQuick.find((x) => x.key === chip.dataset.quick);
          draft.price = { min: q.min, max: q.max, quick: q.key };
          minEl.value = q.min != null ? q.min.toLocaleString('ko-KR') : '';
          maxEl.value = q.max != null ? q.max.toLocaleString('ko-KR') : '';
          $$('.oc-chip', dd).forEach((c) => c.classList.toggle('selected', c === chip));
          validate();
        });
      });
      $('.oc-dd-reset', dd).addEventListener('click', () => {
        state.price = { min: null, max: null, quick: 'all' };
        closeAllDropdowns(); render();
      });
      applyBtn.addEventListener('click', () => {
        if (!validate()) return;
        const mn = parseNum(minEl.value), mx = parseNum(maxEl.value);
        state.price = { min: mn, max: mx, quick: draft.price.quick };
        closeAllDropdowns(); render();
      });
    }

    if (name === 'detail') {
      const MULTI = ['timeSlots', 'classFormats', 'reservationOptions'];
      $$('.oc-chip', dd).forEach((chip) => chip.addEventListener('click', () => {
        const key = chip.dataset.group, val = chip.dataset.val;
        if (MULTI.indexOf(key) > -1) {
          const arr = draft.detail[key];
          const i = arr.indexOf(val);
          if (i > -1) arr.splice(i, 1); else arr.push(val);
          chip.classList.toggle('selected');
        } else {
          draft.detail[key] = val;
          $$('.oc-chip[data-group="' + key + '"]', dd).forEach((c) => c.classList.toggle('selected', c === chip));
        }
      }));
      $('.oc-dd-reset', dd).addEventListener('click', () => {
        state.timeSlots = []; state.classFormats = []; state.reservationOptions = [];
        state.distance = 'all'; state.sort = 'distance';
        closeAllDropdowns(); render();
      });
      $('.oc-dd-apply', dd).addEventListener('click', () => {
        state.timeSlots = draft.detail.timeSlots.slice();
        state.classFormats = draft.detail.classFormats.slice();
        state.reservationOptions = draft.detail.reservationOptions.slice();
        state.distance = draft.detail.distance;
        state.sort = draft.detail.sort;
        closeAllDropdowns(); render();
      });
    }
  }

  /* =========================================================
     검색 / 위치 / 보기전환 / 지도 컨트롤
     ========================================================= */
  function applySearch() {
    state.keyword = dom.keyword.value.trim();
    render();
  }

  let searching = false;
  function handleSubmit() {
    if (searching) return;             // 중복 클릭 방지
    searching = true;
    dom.submit.disabled = true;
    dom.submit.textContent = '검색 중';
    applySearch();
    setTimeout(() => {
      searching = false;
      dom.submit.disabled = false;
      dom.submit.textContent = '검색하기';
      dom.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    state.mapPage = 0;
    dom.resultBody.dataset.view = mode;
    $$('.oc-view-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.view === mode));
    // 보기 전환 시 페이지네이션 적용/해제 반영
    if (currentResults.length) renderClassList(currentResults);
  }

  function setLocation(loc) {
    state.location = loc;
    if (dom.locName) dom.locName.textContent = loc;
    updateResultTitle();
  }

  /* 토스트 */
  let toastTimer = null;
  function toast(msg) {
    dom.toast.textContent = msg;
    dom.toast.hidden = false;
    requestAnimationFrame(() => dom.toast.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
      setTimeout(() => { dom.toast.hidden = true; }, 250);
    }, 1800);
  }

  /* 전체 필터 초기화 (현재 위치는 유지) */
  function resetAllFilters() {
    state.classType = 'offline';
    state.keyword = '';
    state.region = 'all';
    state.category = 'all';
    state.days = [];
    state.price = { min: null, max: null, quick: 'all' };
    state.timeSlots = [];
    state.classFormats = [];
    state.reservationOptions = [];
    state.distance = 'all';
    state.sort = 'distance';
    state.selectedClassId = null;
    dom.keyword.value = '';
    $$('.oc-tab').forEach((t) => t.classList.toggle('active', t.dataset.type === 'offline'));
    closeAllDropdowns();
    render();
    toast('필터를 초기화했어요.');
  }

  /* =========================================================
     이벤트 바인딩 / 초기화
     ========================================================= */
  function bindEvents() {
    // 검색
    dom.searchForm.addEventListener('submit', (e) => { e.preventDefault(); applySearch(); });
    dom.submit.addEventListener('click', handleSubmit);

    // 전체 초기화 버튼
    var resetBtn = $('#ocResetAll');
    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);

    // 클래스 유형 탭
    $$('.oc-tab').forEach((tab) => tab.addEventListener('click', () => {
      $$('.oc-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.classType = tab.dataset.type;
      render();
    }));

    // 필터 버튼 토글
    $$('.oc-filter-btn').forEach((btn) => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDropdown(btn.closest('.oc-filter').dataset.filter);
    }));

    // 바깥 클릭 / Escape 로 닫기
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.oc-filter')) closeAllDropdowns();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeAllDropdowns(); closeLocModal(); }
    });

    // 카드 클릭 / 찜 (이벤트 위임)
    dom.list.addEventListener('click', (e) => {
      const fav = e.target.closest('.oc-fav');
      if (fav) {
        e.stopPropagation();
        toggleFavorite(+fav.dataset.fav, fav);
        return;
      }
      const card = e.target.closest('.oc-card');
      if (card) selectClass(+card.dataset.id, false);
    });
    dom.list.addEventListener('keydown', (e) => {
      const card = e.target.closest('.oc-card');
      if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectClass(+card.dataset.id, false); }
    });

    // 보기 전환
    $$('.oc-view-toggle button').forEach((b) => b.addEventListener('click', () => setViewMode(b.dataset.view)));

    // 모바일↔데스크톱 전환 시 지도보기 페이지네이션 적용/해제
    let lastMobile = onMobile();
    window.addEventListener('resize', () => {
      const nowMobile = onMobile();
      if (nowMobile !== lastMobile) {
        lastMobile = nowMobile;
        state.mapPage = 0;
        if (currentResults.length) renderClassList(currentResults);
      }
    });

    // 위치 변경 / 내 위치
    dom.changeLoc.addEventListener('click', openLocModal);
    dom.myLoc.addEventListener('click', () => {
      dom.myLoc.classList.add('is-loading');
      dom.myLoc.textContent = '확인 중';
      setTimeout(() => {
        setLocation('성수동');
        dom.myLoc.classList.remove('is-loading');
        dom.myLoc.textContent = '내 위치';
        toast('현재 위치를 성수동으로 설정했어요.');
      }, 500);
    });
    dom.locModalClose.addEventListener('click', closeLocModal);
    dom.locModalDim.addEventListener('click', closeLocModal);

    // 지도 컨트롤
    dom.mapSearch.addEventListener('click', () => {
      const textEl = dom.mapSearch.querySelector('.oc-ms-text');
      dom.mapSearch.classList.add('is-loading');
      const original = textEl.textContent;
      textEl.textContent = '검색 중...';
      setTimeout(() => {
        render();
        dom.mapSearch.classList.remove('is-loading');
        textEl.textContent = original;
        toast('현재 지도 기준으로 검색했습니다.');
      }, 400);
    });
    dom.zoomIn.addEventListener('click', () => setZoom(state.mapZoom + 0.1));
    dom.zoomOut.addEventListener('click', () => setZoom(state.mapZoom - 0.1));
  }

  function toggleFavorite(id, btn) {
    const c = classData.find((x) => x.id === id);
    if (!c) return;
    c.isFavorite = !c.isFavorite;
    btn.classList.toggle('is-fav', c.isFavorite);
    btn.innerHTML = c.isFavorite ? icons.heartFill : icons.heart;
    btn.setAttribute('aria-label', c.isFavorite ? '찜 해제' : '찜하기');
  }

  function setZoom(z) {
    state.mapZoom = Math.min(1.4, Math.max(1, Math.round(z * 10) / 10));
    dom.mapBg.style.transform = 'scale(' + state.mapZoom + ')';
  }

  /* 위치 변경 모달 */
  function openLocModal() {
    dom.locModal.hidden = false;
    $$('.oc-loc-list button', dom.locModal).forEach((b) =>
      b.classList.toggle('current', b.dataset.loc === state.location));
  }
  function closeLocModal() { dom.locModal.hidden = true; }

  function buildLocModal() {
    dom.locList.innerHTML = FILTER_OPTIONS.locations.map((l) =>
      '<li><button type="button" data-loc="' + l + '">' + l + '</button></li>').join('');
    dom.locList.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      setLocation(b.dataset.loc);
      closeLocModal();
      toast(b.dataset.loc + '(으)로 위치를 변경했어요.');
    });
  }

  /* 클러스터 마커 생성 (정적 더미) */
  function buildClusters() {
    clusterMarkers.forEach((cl) => {
      const el = document.createElement('div');
      el.className = 'oc-cluster';
      el.style.left = cl.x + '%';
      el.style.top = cl.y + '%';
      el.textContent = cl.count;
      dom.markerLayer.appendChild(el);
    });
  }

  /* 아이콘 주입 (HTML 자리표시자) */
  function injectIcons() {
    $$('[data-icon]').forEach((el) => {
      const name = el.dataset.icon;
      if (icons[name]) el.innerHTML = icons[name];
    });
  }

  /* 모바일 햄버거 메뉴 */
  function bindMobileMenu() {
    const toggle = $('.menu-toggle');
    const shell = $('.nav-shell');
    const menu = $('.nav-menu');
    if (!toggle || !shell) return;
    const closeNav = () => {
      shell.classList.remove('is-nav-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = shell.classList.toggle('is-nav-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (menu) $$('a', menu).forEach((a) => a.addEventListener('click', closeNav));
  }

  function init() {
    dom.list = $('#ocList');
    dom.resultBody = $('#ocResultBody');
    dom.result = $('.oc-result');
    dom.resultCount = $('#ocResultCount');
    dom.resultLoc = $('#ocResultLoc');
    dom.mapCenter = $('#ocMapCenter');
    dom.markerLayer = $('#ocMarkers');
    dom.mapBg = $('#ocMapBg');
    dom.searchForm = $('#ocSearchForm');
    dom.keyword = $('#ocKeyword');
    dom.submit = $('#ocSubmit');
    dom.changeLoc = $('#ocChangeLoc');
    dom.myLoc = $('#ocMyLoc');
    dom.locName = $('#ocLocName');
    dom.locModal = $('#ocLocModal');
    dom.locModalClose = $('#ocLocClose');
    dom.locModalDim = $('#ocLocDim');
    dom.locList = $('#ocLocList');
    dom.mapSearch = $('#ocMapSearch');
    dom.zoomIn = $('#ocZoomIn');
    dom.zoomOut = $('#ocZoomOut');
    dom.toast = $('#ocToast');

    injectIcons();
    buildClusters();
    buildLocModal();
    bindEvents();
    bindMobileMenu();
    setViewMode(state.viewMode);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
