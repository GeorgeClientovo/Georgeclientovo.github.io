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
/* Cruip Open interactions, without a framework dependency. */
(() => {
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const modal = document.querySelector('[data-demo-dialog]');
 const launches = [...document.querySelectorAll('[data-demo-open]')];
 let lastLaunch = null;
 const close = document.querySelector('[data-demo-close]');
 const tour = document.querySelector('[data-demo-tour]');
 const step = document.querySelector('[data-demo-step]');
 const next = document.querySelector('[data-demo-next]');
 const back = document.querySelector('[data-demo-back]');
 const steps = [
  ['Agency','Create your template','Example Agency asks for business goals, a website link and a brand image. Choose the questions your client needs to answer.'],
  ['Agency','Submit your client request','Enter Alex Example, Example Company and alex@example.com, then select your template. In this example, staff start the onboarding and send the client a private link.'],
  ['Client','Provide and confirm answers','Alex opens the private link, answers the questions and uploads brand.png. Saving a draft is separate from confirming an answer. Missing items stay visible.'],
  ['Staff','Review and resolve corrections','The team reviews the answers and files, requests any corrections, and approves the completed responses. Reaching 100% alone does not publish a pack.'],
  ['Agency','Handover published','Success: the reviewed example pack is available in the agency portal, with a report and attachments. The client form is closed. This demonstration has not created records or sent email.']
 ];
 let current = 0;
 function showStep() {
  const [actor,title,description] = steps[current];
  step.replaceChildren();
  for (const [tag,text] of [['p',`Step ${current + 1} of ${steps.length} · ${actor}`],['h3',title],['p',description]]) { const element=document.createElement(tag); element.textContent=text; step.append(element); }
  back.disabled=current===0;
  next.textContent=current===steps.length-1?'Restart example':'Next step';
 }
 if (tour && step && next && back) {
  next.addEventListener('click',()=>{current=(current+1)%steps.length;showStep();});
  back.addEventListener('click',()=>{current=Math.max(0,current-1);showStep();});
 }

 if (modal && launches.length && close && tour) {
  launches.forEach((launch) => launch.addEventListener('click', () => {
   lastLaunch = launch;
   if (typeof modal.showModal !== 'function') {
    window.location.assign('/how-it-works.html');
    return;
   }
   modal.showModal();
   document.body.classList.add('demo-open');
   document.dispatchEvent(new CustomEvent('clientovo:demo', { detail: { open: true } }));
   current=0;showStep();
   close.focus();
  }));
  close.addEventListener('click', () => modal.close());
  modal.addEventListener('click', (event) => {
   if (event.target !== modal) return;
   const bounds = modal.getBoundingClientRect();
   if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close();
  });
  modal.addEventListener('close', () => {

   document.body.classList.remove('demo-open');
   document.dispatchEvent(new CustomEvent('clientovo:demo', { detail: { open: false } }));
   if (lastLaunch) lastLaunch.focus();
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


/* Mouse hover, touch tap, and native keyboard activation all reveal the same biography. */
(() => {
 document.querySelectorAll('[data-founder-card]').forEach((card) => {
  const front=card.querySelector('[data-founder-front]');
  const back=card.querySelector('[data-founder-back]');
  const copy=card.querySelector('[data-founder-copy]');
  const read=document.querySelector('[data-founder-open="'+card.getAttribute('aria-controls')+'"]');
  function setOpen(open){
   card.classList.toggle('is-flipped',open);
   card.setAttribute('aria-expanded',String(open));
   if(read){read.setAttribute('aria-expanded',String(open));read.textContent=open?'Show photo ↶':'Read background →';}
   front.setAttribute('aria-hidden',String(open));
   back.setAttribute('aria-hidden',String(!open));
   card.setAttribute('aria-label',card.dataset.founderName+', co-founder. '+(open?'Show photo':'Show background'));
   if(open)card.setAttribute('aria-describedby',copy.id);
   else card.removeAttribute('aria-describedby');
  }
  if(read)read.addEventListener('click',()=>{const open=card.getAttribute('aria-expanded')!=='true';card.focus();setOpen(open);});
  card.addEventListener('pointerenter',(event)=>{if(event.pointerType==='mouse')setOpen(true);});
  card.addEventListener('pointerleave',(event)=>{if(event.pointerType==='mouse')setOpen(false);});
  card.addEventListener('click',()=>setOpen(card.getAttribute('aria-expanded')!=='true'));
  card.addEventListener('blur',()=>setOpen(false));
  card.addEventListener('keydown',(event)=>{if(event.key==='Escape')setOpen(false);});
 });
})();



/* Pricing comparison: £14 pay as you go versus £34/month for five, then £9 each. */
(() => {
 const root=document.querySelector('[data-pricing-calculator]');
 if(!root)return;
 const slider=root.querySelector('[data-onboarding-slider]');
 const count=root.querySelector('[data-onboarding-count]');
 const paygTotal=root.querySelector('[data-payg-total]');
 const paygDetail=root.querySelector('[data-payg-detail]');
 const monthlyTotal=root.querySelector('[data-monthly-total]');
 const monthlyDetail=root.querySelector('[data-monthly-detail]');
 const savingMessage=root.querySelector('[data-saving-message]');
 if(!slider||!count||!paygTotal||!paygDetail||!monthlyTotal||!monthlyDetail||!savingMessage)return;
 const money=(value)=>'£'+value.toLocaleString('en-GB');
 function update(){
  const clients=Number(slider.value);
  const payg=clients*14;
  const extras=Math.max(0,clients-5);
  const monthly=34+(extras*9);
  const difference=Math.abs(payg-monthly);
  const progress=((clients-Number(slider.min))/(Number(slider.max)-Number(slider.min)))*100;
  slider.style.setProperty('--range-progress',progress+'%');
  count.value=clients;
  count.textContent=clients;
  paygTotal.textContent=money(payg);
  paygDetail.textContent=clients+' × £14';
  monthlyTotal.textContent=money(monthly);
  monthlyDetail.textContent=extras?('£34 + '+extras+' × £9'):'Up to 5 included';
  savingMessage.classList.toggle('is-payg',payg<monthly);
  if(monthly<payg)savingMessage.innerHTML='<strong>Save '+money(difference)+' each month</strong> with the monthly plan.';
  else if(payg<monthly)savingMessage.innerHTML='<strong>Save '+money(difference)+' this month</strong> with pay as you go.';
  else savingMessage.innerHTML='<strong>Both options cost the same</strong> at this volume.';
 }
 slider.addEventListener('input',update);
 update();
})();
