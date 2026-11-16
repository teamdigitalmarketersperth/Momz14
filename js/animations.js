/* Coordinate each page opening, then reveal remaining content once on scroll. */
document.addEventListener('DOMContentLoaded', () => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || typeof window.IntersectionObserver !== 'function' || typeof Element.prototype.animate !== 'function') return;

  const candidates = [...document.querySelectorAll([
    '.header-nav-list', '.header-cta-pill',
    'main h1:not(.hero-title)', 'main h2', 'main h3', 'main h4', 'main h5', 'main h6',
    'main p', 'main .section-tag', 'main .mono-num', 'main .info-label', 'main .info-val',
    'main .debut-badge', 'main .debut-venue-text', 'main .galaxy-quote-editorial',
    'main .galaxy-astronomy-badge', 'main .current-track-meta', 'main .player-badge-row',
    'main .music-track-row', 'main .audio-controls-block', 'main .momz-form-group',
    'main label', 'main span:not([aria-hidden="true"])', 'main a[href]', 'main button', 'main .inspiration-names li',
    'main img:not(.track-artwork):not(.header-logo-img):not(.footer-logo-img)',
    'main figcaption', 'main .discover-image-caption', 'main .contact-standalone-badge',
    'main .hero-caption', 'footer p', 'footer .footer-col-title', 'footer a[href]',
    'footer .footer-nav-list', 'footer .footer-social-row', 'footer .footer-bottom-bar'
  ].join(', '))].filter(target => (target.tagName !== 'SPAN' || target.textContent.trim()) && !target.closest('.hero-title, .header-brand, .player-status, .form-feedback-alert, .form-honeypot'));
  const selected = new Set(candidates);
  const targets = candidates.filter(target => {
    // Animate a text/control group once, without layering effects on its children.
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (selected.has(parent)) return false;
    }
    return true;
  });
  const active = new Set();
  const counts = new Map();
  const delays = new WeakMap();
  const revealed = new WeakSet();
  const reveal = target => {
    if (motion.matches || revealed.has(target)) return;
    revealed.add(target);
    observer.unobserve(target);
    const image = target.tagName === 'IMG';
    const interactive = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName) || Boolean(target.querySelector('a, button, input, select, textarea'));
    const heading = /^H[1-6]$/.test(target.tagName);
    const animation = target.animate([
      { opacity: image ? .82 : interactive ? .85 : .6,
        transform: image ? 'scale(.975)' : interactive ? 'translateY(0)' : 'translateY(12px)' },
      { opacity: 1, transform: image ? 'scale(1)' : 'translateY(0)' }
    ], {
      duration: image ? 820 : heading ? 720 : 620,
      delay: delays.get(target), easing: 'cubic-bezier(.2, .65, .3, 1)', fill: 'backwards'
    });
    active.add(animation);
    animation.finished.then(() => active.delete(animation), () => active.delete(animation));
  };
  const observer = new window.IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
  }, { rootMargin: '0px 0px 48px 0px', threshold: .01 });

  for (const target of targets) {
    const section = target.closest('section, footer, header') || target.parentElement;
    const count = counts.get(section) || 0;
    delays.set(target, (count % 3) * 70);
    counts.set(section, count + 1);
    const rect = target.getBoundingClientRect();
    if (rect.width && rect.height && rect.bottom > 0 && rect.top < window.innerHeight) reveal(target);
    else observer.observe(target);
  }
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    for (const animation of active) animation.cancel();
    active.clear();
  });
});
