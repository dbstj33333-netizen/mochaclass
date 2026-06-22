/* =========================================================
   공통 스크립트 (모든 페이지 공용)
   - 맨 위로 이동 플로팅 버튼
   - 로그인 상태에 따른 네비 노출(마이페이지/로그아웃)
   ※ 정적 사이트이므로 로그인 상태는 데모용 localStorage 플래그로 처리
   ========================================================= */
(function () {
  'use strict';

  /* ===== 맨 위로 이동 ===== */
  var toTopBtn = document.querySelector('.to-top');
  if (toTopBtn) {
    var toggleToTop = function () {
      toTopBtn.classList.toggle('is-visible', window.scrollY > 400);
    };
    toggleToTop();
    window.addEventListener('scroll', toggleToTop, { passive: true });
    toTopBtn.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ===== 로그인 상태에 따른 네비 ===== */
  var AUTH_KEY = 'mc_loggedIn';
  var store = {
    get: function () { try { return localStorage.getItem(AUTH_KEY) === '1'; } catch (e) { return false; } },
    set: function (v) { try { v ? localStorage.setItem(AUTH_KEY, '1') : localStorage.removeItem(AUTH_KEY); } catch (e) {} }
  };

  function applyAuth() {
    var logged = store.get();
    document.querySelectorAll('.nav-mypage, .nav-logout').forEach(function (el) { el.hidden = !logged; });
    document.querySelectorAll('.nav-login, .nav-signup').forEach(function (el) { el.hidden = logged; });
  }

  document.querySelectorAll('.nav-login').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      store.set(true);   // 데모: 클릭 시 로그인 상태로 전환
      applyAuth();
    });
  });
  document.querySelectorAll('.nav-logout').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      store.set(false);
      applyAuth();
    });
  });

  applyAuth();

  /* ===== 햄버거 드로어: 딤 배경/바깥 영역 클릭 시 닫기 (전 페이지 공용) ===== */
  var navShell = document.querySelector('.nav-shell');
  var menuToggle = document.querySelector('.menu-toggle');
  if (navShell && menuToggle) {
    document.addEventListener('click', function (e) {
      if (!navShell.classList.contains('is-nav-open')) return;
      if (e.target.closest('.nav-drawer') || e.target.closest('.menu-toggle')) return;
      navShell.classList.remove('is-nav-open');
      menuToggle.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* ===== 네비 클릭 처리 (캡처 단계: 페이지별 닫기/이동보다 먼저 가로챔) =====
     1) 파트너 등록(+하위) → '준비중이에요' 안내만 표시
     2) 모바일·태블릿에서 1차 카테고리 → 2차 서브메뉴 아코디언 펼침 */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.nav-menu a');
    if (!a) return;
    var item = a.closest('.nav-item');
    if (!item) return;
    var topLink = item.querySelector(':scope > a');
    var isPartner = topLink && /#partner$/.test(topLink.getAttribute('href') || '');
    var isTopLevel = (a === topLink);
    var mobile = window.matchMedia('(max-width: 1279px)').matches;

    // 파트너 등록 2차 항목(강사·공방 등록 / 제휴 문의) → 준비중 안내
    if (isPartner && !isTopLevel) {
      e.preventDefault();
      e.stopPropagation();
      window.alert('준비중이에요');
      return;
    }

    // 1차 카테고리(2차 메뉴 있음): 모바일은 아코디언으로 2차 펼침, 데스크톱 파트너는 이동만 차단
    if (isTopLevel && item.querySelector(':scope > .sub-menu')) {
      if (mobile) {
        e.preventDefault();
        e.stopPropagation();
        item.classList.toggle('is-open');
      } else if (isPartner) {
        e.preventDefault();   // 데스크톱: 호버로 2차 노출, 2차 클릭 시 준비중
      }
    }
  }, true);

  /* ===== 돋보기(검색) 버튼: 클래스 검색 오버레이 화면 ===== */
  var searchBtn = document.querySelector('.search-button');
  if (searchBtn) {
    var overlay = document.createElement('div');
    overlay.className = 'mc-search-overlay';
    overlay.innerHTML =
      '<div class="mc-search-panel" role="dialog" aria-modal="true" aria-label="클래스 검색">' +
        '<button type="button" class="mc-search-close" aria-label="검색 닫기">&times;</button>' +
        '<form class="mc-search-form">' +
          '<input type="text" class="mc-search-input" placeholder="클래스명 또는 카테고리를 검색하세요" aria-label="검색어">' +
        '</form>' +
        '<div class="mc-search-results" aria-live="polite"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = overlay.querySelector('.mc-search-input');
    var results = overlay.querySelector('.mc-search-results');
    var data = (typeof classData !== 'undefined' && Array.isArray(classData)) ? classData : [];
    var won = function (n) { return Number(n).toLocaleString('ko-KR') + '원'; };

    var render = function (q) {
      q = (q || '').trim().toLowerCase();
      if (!data.length) {
        results.innerHTML = '<p class="mc-search-empty">‘클래스 찾기’ 페이지에서 검색해 주세요.</p>';
        return;
      }
      var list = !q ? data.slice(0, 8) : data.filter(function (c) {
        return (c.title && c.title.toLowerCase().indexOf(q) > -1) ||
               (c.category && c.category.toLowerCase().indexOf(q) > -1);
      });
      if (!list.length) { results.innerHTML = '<p class="mc-search-empty">검색 결과가 없어요.</p>'; return; }
      results.innerHTML = list.map(function (c) {
        return '<a class="mc-search-card" href="offline-class.html">' +
          '<img src="' + c.image + '" alt="" loading="lazy">' +
          '<span class="mc-sc-body"><span class="mc-sc-cat">' + (c.category || '') + '</span>' +
          '<strong class="mc-sc-title">' + c.title + '</strong>' +
          '<em class="mc-sc-price">' + won(c.price) + '</em></span></a>';
      }).join('');
    };
    var openSearch = function () {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      render('');
      setTimeout(function () { input.focus(); }, 60);
    };
    var closeSearch = function () {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    searchBtn.addEventListener('click', openSearch);
    overlay.querySelector('.mc-search-close').addEventListener('click', closeSearch);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    overlay.querySelector('.mc-search-form').addEventListener('submit', function (e) { e.preventDefault(); });
    input.addEventListener('input', function () { render(input.value); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSearch(); });
  }
})();
