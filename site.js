(() => {
  const body = document.body;
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  let lastFocused = null;

  const focusable = (root) => [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];

  function closeMenu() {
    if (!mobileMenu || !menuButton) return;
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    if (lastFocused) lastFocused.focus();
  }

  function openMenu() {
    if (!mobileMenu || !menuButton) return;
    lastFocused = document.activeElement;
    mobileMenu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
    const items = focusable(mobileMenu);
    if (items.length) items[0].focus();
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      if (mobileMenu.hidden) openMenu();
      else closeMenu();
    });
    mobileMenu.addEventListener('click', (event) => {
      if (event.target.matches('[data-menu-close], a[href]')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu();
      if (event.key === 'Tab' && !mobileMenu.hidden) {
        const items = focusable(mobileMenu);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  document.querySelectorAll('[data-login-menu]').forEach((menu) => {
    const trigger = menu.querySelector('[data-login-trigger]');
    const panel = menu.querySelector('[data-login-panel]');
    if (!trigger || !panel) return;
    const close = () => {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    };
    trigger.addEventListener('click', () => {
      const willOpen = panel.hidden;
      panel.hidden = !willOpen;
      trigger.setAttribute('aria-expanded', String(willOpen));
    });
    menu.addEventListener('focusout', () => setTimeout(() => {
      if (!menu.contains(document.activeElement)) close();
    }, 0));
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        close();
        trigger.focus();
      }
    });
  });

  const form = document.querySelector('[data-setup-form]');
  if (form) {
    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('button[type="submit"]');
    const success = document.querySelector('[data-form-success]');
    const fields = [...form.querySelectorAll('input, select, textarea')];

    function setError(field, message) {
      const target = form.querySelector(`[data-error-for="${field.id}"]`);
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (target) target.textContent = message || '';
    }

    function validate() {
      let valid = true;
      fields.forEach((field) => {
        let message = '';
        if (field.required && !field.value.trim()) message = 'Please complete this field.';
        if (!message && field.type === 'email' && field.value && !field.validity.valid) message = 'Enter a valid work email.';
        if (!message && field.type === 'url' && field.value && !field.validity.valid) message = 'Enter a full website address, including https://.';
        setError(field, message);
        if (message) valid = false;
      });
      return valid;
    }

    fields.forEach((field) => field.addEventListener('input', () => setError(field, '')));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validate()) {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Sending…';
      if (status) status.textContent = 'Sending your request.';
      try {
        const response = await fetch(form.action, {
          method: form.method || 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Form submission failed');
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
        }
      } catch {
        if (status) status.textContent = 'We could not send your request. Please email contact@clientovo.com instead.';
        button.disabled = false;
        button.textContent = original;
      }
    });
  }
})();
/* Progressive motion: content stays visible if animation is unavailable. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 901px)');
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.agency-hero');
  const board = document.querySelector('.service-board');
  const root = document.documentElement;
  const activeAnimations = new Set();
  let observer = null;
  let frame = 0;
  let cleanups = [];

  const revealGroups = [
    ['.section-heading, .pricing-head, .about-layout, .setup-copy', 0],
    ['.process-steps .numbered-row', 90],
    ['.contrast-point', 65],
    ['.price-card, .decision-card', 90],
    ['.timeline-step, .portal-note, .guide', 60],
    ['.cta-band .shell', 0]
  ];

  function reveal(element, delay) {
    if (preference.matches || typeof element.animate !== 'function') return;
    // Do not move a control or section the visitor is currently using.
    if (element.contains(document.activeElement)) return;
    const animation = element.animate(
      [{ opacity: 0.2, transform: 'translateY(26px)' },
       { opacity: 1, transform: 'translateY(0)' }],
      { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
    );
    activeAnimations.add(animation);
    const finished = () => activeAnimations.delete(animation);
    animation.onfinish = finished;
    animation.oncancel = finished;
  }

  function update() {
    frame = 0;
    const scrollY = window.scrollY || 0;
    const distance = Math.max(0, root.scrollHeight - window.innerHeight);
    const heroTop = hero ? hero.getBoundingClientRect().top : 0;
    const progress = distance ? Math.min(1, Math.max(0, scrollY / distance)) : 0;
    if (header) header.classList.toggle('is-scrolled', scrollY > 16);
    root.style.setProperty('--scroll-progress', String(progress));
    if (board) {
      const shift = !preference.matches && desktop.matches
        ? Math.min(56, Math.max(0, -heroTop) * 0.11) : 0;
      board.style.setProperty('--board-shift', shift + 'px');
      board.style.setProperty('--board-turn', desktop.matches && !preference.matches
        ? (2 - shift / 20) + 'deg' : '0deg');
    }
  }

  function queueUpdate() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  function stop() {
    if (observer) observer.disconnect();
    observer = null;
    activeAnimations.forEach((animation) => animation.cancel());
    activeAnimations.clear();
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
  }

  function setup() {
    stop();
    update();
    if (preference.matches || !('IntersectionObserver' in window)) return;
    const delays = new WeakMap();
    observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target, delays.get(entry.target) || 0);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    revealGroups.forEach(([selector, stagger]) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        // Above-the-fold content is immediately readable; later sections enter once.
        if (element.getBoundingClientRect().top < window.innerHeight - 24) return;
        delays.set(element, (index % 3) * stagger);
        observer.observe(element);
      });
    });

    // Keyboard navigation reveals immediately and never waits for an entrance.
    function onFocus(event) {
      activeAnimations.forEach((animation) => {
        const target = animation.effect && animation.effect.target;
        if (target && target.contains(event.target)) animation.cancel();
      });
    }
    document.addEventListener('focusin', onFocus);
    cleanups.push(() => document.removeEventListener('focusin', onFocus));
  }

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate, { passive: true });
  if (preference.addEventListener) preference.addEventListener('change', setup);
  if (desktop.addEventListener) desktop.addEventListener('change', queueUpdate);
  window.addEventListener('pagehide', () => {
    stop();
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  });
  window.addEventListener('pageshow', setup);
  setup();
})();


/* Scroll story: a fixed visual advances with the three real service stages. */
(() => {
 const story = document.querySelector('[data-scroll-story]');
 if (!story) return;
 const steps = [...story.querySelectorAll('[data-story-step]')];
 const frames = [...story.querySelectorAll('[data-story-frame]')];
 const progress = story.querySelector('[data-story-progress]');
 const count = story.querySelector('[data-story-count]');
 const band = document.querySelector('.scroll-type');
 const track = document.querySelector('.scroll-type-track');
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const mobile = window.matchMedia('(max-width: 700px)');
 let queued = false;
 let current = -1;
 function paint() {
  queued = false;
  // Mobile copy passes below a compact sticky visual; desktop copy passes mid-screen.
  const marker = mobile.matches ? Math.min(window.innerHeight * .72, 540) : window.innerHeight * .52;
  let selected = 0;
  let nearest = Infinity;
  steps.forEach((step, index) => {
   const rect = step.getBoundingClientRect();
   const distance = Math.abs(rect.top + rect.height / 2 - marker);
   if (distance < nearest) { nearest = distance; selected = index; }
  });
  let shift = 0;
  if (band && track && !reduced.matches) {
   const rect = band.getBoundingClientRect();
   const fraction = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
   const travel = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
   shift = -fraction * Math.min(travel, 600);
  }
  if (selected !== current) {
   current = selected;
   steps.forEach((step,index) => step.classList.toggle('is-current', index === selected));
   frames.forEach((frame,index) => {
    frame.classList.toggle('is-current', index === selected);
    frame.classList.toggle('is-past', index < selected);
   });
   if (progress) progress.style.setProperty('--story-progress', String((selected + 1) / steps.length));
   if (count) count.textContent = String(selected + 1).padStart(2, '0') + ' / 03';
  }
  if (track) track.style.setProperty('--type-shift', shift + 'px');
 }
 function queue() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(paint);
 }
 window.addEventListener('scroll',queue,{passive:true});
 window.addEventListener('resize',queue,{passive:true});
 window.addEventListener('pageshow',queue);
 if (reduced.addEventListener) reduced.addEventListener('change',queue);
 paint();
})();

/* Silent background footage: pause when off-screen, and honour motion/data preferences. */
(() => {
 const video = document.querySelector('[data-hero-video]');
 const toggle = document.querySelector('[data-hero-video-toggle]');
 if (!video || !toggle) return;
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const saveData = !!(navigator.connection && navigator.connection.saveData);
 let userPaused = false;
 let inView = true;
 let failed = false;
 let playingRequest = 0;
 video.muted = true;
 function syncLabel() {
  toggle.textContent = video.paused ? 'Play background video' : 'Pause background video';
 }
 async function start() {
  if (failed || reduced.matches || userPaused || !inView || document.hidden || !video.paused) return;
  const request = ++playingRequest;
  if (!video.getAttribute('src')) video.src = video.dataset.videoSrc;
  try {
   await video.play();
   if (request !== playingRequest || reduced.matches || userPaused || !inView || document.hidden) {
    video.pause();
   }
   toggle.hidden = reduced.matches;
   syncLabel();
  } catch {
   // Autoplay restrictions keep the dark fallback and allow a manual play.
   toggle.hidden = reduced.matches || failed;
   syncLabel();
  }
 }
 function pause() {
  playingRequest++;
  video.pause();
  syncLabel();
 }
 toggle.addEventListener('click', () => {
  userPaused = !video.paused;
  if (userPaused) pause();
  else start();
 });
 video.addEventListener('play',syncLabel);
 video.addEventListener('pause',syncLabel);
 video.addEventListener('error',() => {
  failed = true;
  pause();
  video.hidden = true;
  toggle.hidden = true;
 });
 if ('IntersectionObserver' in window) {
  const observer = new window.IntersectionObserver(([entry]) => {
   inView = entry.isIntersecting;
   if (inView && !saveData) start();
   else pause();
  },{threshold:0});
  observer.observe(video.closest('.agency-hero'));
 }
 document.addEventListener('visibilitychange',() => {
  if (document.hidden) pause();
  else if (!saveData) start();
 });
 if (reduced.addEventListener) reduced.addEventListener('change',() => {
  if (reduced.matches) {pause();toggle.hidden=true;}
  else if (!saveData) start();
 });
 if (!reduced.matches && saveData) {toggle.hidden=false;syncLabel();}
 if (!saveData) start();
})();
