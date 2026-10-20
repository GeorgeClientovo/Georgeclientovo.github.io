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