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
})();
