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

  /* ===== 드로어(모바일·태블릿): 1차 카테고리 클릭 → 2차 서브메뉴 아코디언 펼침 =====
     캡처 단계로 등록해 페이지별 '링크 클릭 시 드로어 닫기'보다 먼저 가로채서
     이동/닫힘을 막고 서브메뉴만 토글한다. */
  document.addEventListener('click', function (e) {
    if (!window.matchMedia('(max-width: 1279px)').matches) return;   // 데스크톱은 호버 드롭다운 유지
    var link = e.target.closest('.nav-menu .nav-item > a');
    if (!link) return;
    var item = link.parentElement;
    if (!item || !item.classList.contains('nav-item')) return;
    if (!item.querySelector(':scope > .sub-menu')) return;           // 2차 메뉴 없는 항목은 일반 링크
    e.preventDefault();
    e.stopPropagation();
    item.classList.toggle('is-open');
  }, true);
})();
