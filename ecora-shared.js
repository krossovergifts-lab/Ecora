/* ecora-shared.js — shared across all inner pages
   Audit fixes:
   #5 A11y: aria-expanded on hamburger
   #4 Responsive: visibility-based mobile menu
   #9 Cross-browser: touch/pointer guard for cursor
   #3 Perf: passive scroll listener
*/
(function() {
  'use strict';

  /* ── Custom cursor — fine pointer only [FIX #9] ── */
  const isFinePt = window.matchMedia('(pointer: fine)').matches;
  const dot  = document.getElementById('cursor-dot');
  const leaf = document.getElementById('cursor-leaf');

  if (isFinePt && dot && leaf) {
    let mx = -100, my = -100, lx = -100, ly = -100, lastTrail = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      const now = Date.now();
      if (now - lastTrail > 120) { lastTrail = now; spawnTrail(mx, my); }
    });
    (function animLeaf() {
      lx += (mx - lx) * 0.10; ly += (my - ly) * 0.10;
      leaf.style.left = lx + 'px'; leaf.style.top = ly + 'px';
      const angle = Math.atan2(my - ly, mx - lx) * (180 / Math.PI) - 90;
      leaf.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
      requestAnimationFrame(animLeaf);
    })();
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; leaf.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; leaf.style.opacity = '1'; });
  }

  function spawnTrail(x, y) {
    const el = document.createElement('div');
    el.className = 'leaf-trail';
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--r', (Math.random() * 60 - 30) + 'deg');
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true"><ellipse cx="9" cy="10" rx="6" ry="7" fill="#40916c" opacity=".8" transform="rotate(-15,9,9)"/><line x1="9" y1="17" x2="9" y2="5" stroke="#2d6a4f" stroke-width=".8" stroke-linecap="round"/></svg>';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /* ── Navbar scroll [FIX #3 passive] ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
  }

  /* ── Hamburger [FIX #5 aria-expanded] ── */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });
  }

  /* ── Page hero load animation ── */
  const heroEl = document.querySelector('.page-hero');
  if (heroEl) setTimeout(() => heroEl.classList.add('loaded'), 100);

  /* ── Scroll reveal ── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Accordion [FIX #5 aria] ── */
  document.querySelectorAll('.accordion-trigger').forEach(btn => {
    const item = btn.closest('.accordion-item');
    const body = item ? item.querySelector('.accordion-body') : null;
    if (body) {
      const id = 'acc-' + Math.random().toString(36).slice(2, 7);
      body.id = id;
      btn.setAttribute('aria-controls', id);
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        const t = i.querySelector('.accordion-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Stats counter animation [FIX #7 unified] ── */
  function animateCounter(el, target, suffix) {
    if (!el || isNaN(target) || target < 0) return;
    if (target === 0) { el.textContent = '0' + suffix; return; }
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = (Number.isInteger(target) ? Math.floor(current) : current.toFixed(0)) + suffix;
    }, 25);
  }

  const statsSections = document.querySelectorAll('.stats-band, #stats');
  if (statsSections.length && 'IntersectionObserver' in window) {
    const statsObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          /* supports both .stat-number (homepage) and .stat-num (inner pages) */
          e.target.querySelectorAll('.stat-num, .stat-number').forEach(n => {
            const raw = n.textContent.trim();
            const num = parseFloat(raw);
            const suffix = raw.replace(/[\d.]/g, '');
            animateCounter(n, num, suffix);
          });
          statsObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    statsSections.forEach(s => statsObs.observe(s));
  }

})();
