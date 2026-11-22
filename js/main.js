// Renova Design Build — shared interactivity (nav toggle, scroll header, lightbox, gallery filter)

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  var header = document.querySelector('.site-header');

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (header) header.classList.toggle('is-open', isOpen);
    });
  }

  /* ---------- Header background on scroll ---------- */
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else if (!mobileMenu || !mobileMenu.classList.contains('is-open')) {
      header.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Lightbox (gallery page) ---------- */
  var lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('img');
    var lightboxCaption = lightbox.querySelector('.lightbox-caption');
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox-trigger]'));
    var currentIndex = 0;

    function openLightbox(index) {
      currentIndex = index;
      var el = triggers[index];
      var img = el.querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = el.getAttribute('data-caption') || img.alt;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    function showNext(delta) {
      currentIndex = (currentIndex + delta + triggers.length) % triggers.length;
      openLightbox(currentIndex);
    }

    triggers.forEach(function (el, index) {
      el.addEventListener('click', function () { openLightbox(index); });
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); }
      });
    });

    var closeBtn = lightbox.querySelector('.lightbox-close');
    var prevBtn = lightbox.querySelector('.lightbox-prev');
    var nextBtn = lightbox.querySelector('.lightbox-next');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', function () { showNext(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showNext(1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext(1);
      if (e.key === 'ArrowLeft') showNext(-1);
    });
  }

  /* ---------- Gallery category filter ---------- */
  var filterTabs = Array.prototype.slice.call(document.querySelectorAll('.filter-tab'));
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('[data-category]'));
  if (filterTabs.length && galleryItems.length) {
    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        filterTabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var filter = tab.getAttribute('data-filter');
        galleryItems.forEach(function (item) {
          var match = filter === 'all' || item.getAttribute('data-category') === filter;
          item.style.display = match ? '' : 'none';
        });
      });
    });
  }

  /* ---------- Contact form: sends to Formspree ---------- */
  var contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = document.querySelector('#form-note');
      var button = contactForm.querySelector('button[type="submit"]');
      function show(msg) { if (note) { note.textContent = msg; note.style.display = 'block'; } }
      var name = contactForm.querySelector('#name').value.trim();
      var email = contactForm.querySelector('#email').value.trim();
      if (!name || !email || email.indexOf('@') < 1) {
        show('Please add your name and a valid email so we can get back to you.');
        return;
      }
      if (button) { button.disabled = true; button.textContent = 'Sending...'; }
      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('Send failed');
        contactForm.reset();
        show('Thanks, we got your project details. We\'ll be in touch shortly.');
        // Google Ads conversion: fires only once the Ads tag and window.RENOVA_ADS_CONVERSION are added to the page head.
        if (window.gtag && window.RENOVA_ADS_CONVERSION) { window.gtag('event', 'conversion', { send_to: window.RENOVA_ADS_CONVERSION }); }
        if (button) button.textContent = 'Sent';
      }).catch(function () {
        show('Sorry, that didn\'t go through. Please email info@renovadesignbuild.com or call (604) 763-5329.');
        if (button) { button.disabled = false; button.textContent = 'Send Project Details'; }
      });
    });
  }

  /* ---------- Google Ads: count taps on any phone link as a lead ---------- */
  var RENOVA_PHONE_CONVERSION = 'AW-11371930890/o-PvCPrDxr0dEIrKx64q';
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (link && window.gtag) { window.gtag('event', 'conversion', { send_to: RENOVA_PHONE_CONVERSION }); }
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector('#current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- FAQ accordion ---------- */
  var faqToggles = Array.prototype.slice.call(document.querySelectorAll('.faq-toggle'));
  faqToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var isOpen = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (panel) panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });
  });

  /* ---------- Scroll-reveal fade-in ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Hero video: fall back gracefully if it can't play ---------- */
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    heroVideo.addEventListener('error', function () {
      heroVideo.style.display = 'none';
    });
  }

});
