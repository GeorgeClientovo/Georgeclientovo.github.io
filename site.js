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
 video.defaultMuted = true;
 video.playsInline = true;
 video.autoplay = !reduced.matches && !saveData;
 toggle.hidden = reduced.matches;
 function syncLabel() {
  toggle.textContent = video.paused ? 'Play background video' : 'Pause background video';
 }
 async function start() {
  if (failed || reduced.matches || userPaused || !inView || document.hidden || !video.paused || document.querySelector('[data-demo-dialog][open]')) return;
  const request = ++playingRequest;
  video.autoplay = !reduced.matches && !saveData;
  video.preload = 'auto';
  if (!video.getAttribute('src')) {
   video.src = video.dataset.videoSrc;
   video.load();
  }
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
  video.autoplay = false;
  playingRequest++;
  video.pause();
  syncLabel();
 }
 toggle.addEventListener('click', () => {
  userPaused = !video.paused;
  if (userPaused) pause();
  else start();
 });
 video.addEventListener('canplay', () => { if (!saveData) start(); });
 window.addEventListener('pageshow', () => { if (!saveData) start(); });
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
 document.addEventListener('clientovo:demo', (event) => {
  if (event.detail.open) pause();
  else if (!saveData) start();
 });
 if (!saveData) start();
})();

/* Cruip Open interactions, without a framework dependency. */
(() => {
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const modal = document.querySelector('[data-demo-dialog]');
 const launch = document.querySelector('[data-demo-open]');
 const close = document.querySelector('[data-demo-close]');
 const player = document.querySelector('[data-demo-video]');
 if (modal && launch && close && player) {
  launch.addEventListener('click', () => {
   if (typeof modal.showModal !== 'function') {
    window.location.assign('/media/portal-walkthrough-audio.mp4');
    return;
   }
   modal.showModal();
   document.body.classList.add('demo-open');
   document.dispatchEvent(new CustomEvent('clientovo:demo', { detail: { open: true } }));
   player.muted = false;
   player.volume = 1;
   player.play().catch(() => {});
  });
  close.addEventListener('click', () => modal.close());
  modal.addEventListener('click', (event) => {
   if (event.target !== modal) return;
   const bounds = modal.getBoundingClientRect();
   if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close();
  });
  modal.addEventListener('close', () => {
   player.pause();
   document.body.classList.remove('demo-open');
   document.dispatchEvent(new CustomEvent('clientovo:demo', { detail: { open: false } }));
   launch.focus();
  });
 }
 const cards = [...document.querySelectorAll('.open-card')];
 if (window.matchMedia('(hover: hover)').matches) {
  cards.forEach((card) => card.addEventListener('pointermove', (event) => {
   if (reduced.matches) return;
   const rect = card.getBoundingClientRect();
   card.style.setProperty('--pointer-x', (event.clientX - rect.left) + 'px');
   card.style.setProperty('--pointer-y', (event.clientY - rect.top) + 'px');
  }, { passive: true }));
 }
 let observer;
 const animations = new Set();
 function setupReveals() {
  if (observer) observer.disconnect();
  animations.forEach((animation) => animation.cancel());
  animations.clear();
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  observer = new window.IntersectionObserver((entries) => entries.forEach((entry) => {
   if (!entry.isIntersecting) return;
   observer.unobserve(entry.target);
   if (entry.target.contains(document.activeElement) || typeof entry.target.animate !== 'function') return;
   const siblings = entry.target.parentElement.children;
   const stagger = entry.target.matches('.open-card, .open-feature') ? [...siblings].indexOf(entry.target) % 3 * 90 : 0;
   const animation = entry.target.animate([{ opacity: .2, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 700, delay: stagger, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
   animations.add(animation);
   animation.onfinish = animation.oncancel = () => animations.delete(animation);
  }), { threshold: .08, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.open-section-heading, .open-card, .open-feature, .pricing-head, .price-card, .open-cta, .about-layout').forEach((element) => {
   if (element.getBoundingClientRect().top >= window.innerHeight - 20) observer.observe(element);
  });
 }
 document.addEventListener('focusin', (event) => {
  animations.forEach((animation) => { if (animation.effect.target.contains(event.target)) animation.cancel(); });
 });
 if (reduced.addEventListener) reduced.addEventListener('change', setupReveals);
 setupReveals();
})();


/* Launch once, 1.5 seconds after landing, then remove the announcement. */
(() => {
 const flight = document.querySelector('[data-promo-flight]');
 if (!flight) return;
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 let launchTimer;
 const dismiss = () => {
  window.clearTimeout(launchTimer);
  flight.remove();
 };
 if (reduced.matches) { dismiss(); return; }
 flight.querySelector('[data-promo-dismiss]').addEventListener('click', dismiss);
 flight.addEventListener('animationend', (event) => {
  if (event.target === flight && event.animationName === 'promo-flyby') dismiss();
 });
 reduced.addEventListener('change', (event) => { if (event.matches) dismiss(); });
 launchTimer = window.setTimeout(() => { if (!reduced.matches) flight.hidden = false; }, 1500);
})();
