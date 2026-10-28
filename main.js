/**
 * Portofahrizal Cinematic Interactive Script v2
 * Inspired by Charles Leclerc Official Website
 * Native horizontal storytelling, scroll reveals, active navigation, and interactive modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     01. NAVIGATION CONTROLLER & SCROLL PROGRESS
     ========================================================================== */
  const nav = document.querySelector('.nav');
  const navProgress = document.querySelector('.nav-progress');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navAnchors = document.querySelectorAll('.nav-link[href^="#"]');

  // Update navbar background & top progress bar
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (nav) {
      nav.classList.toggle('scrolled', scrollY > 30);
    }

    if (navProgress && maxScroll > 0) {
      const progressPercent = Math.min(Math.max((scrollY / maxScroll) * 100, 0), 100);
      navProgress.style.width = `${progressPercent}%`;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('active');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active section indicator in navigation
  const observedSections = [...navAnchors]
    .map((anchor) => document.querySelector(anchor.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navAnchors.forEach((anchor) => {
              if (anchor.getAttribute('href') === `#${id}`) {
                anchor.setAttribute('aria-current', 'true');
              } else {
                anchor.removeAttribute('aria-current');
              }
            });
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    observedSections.forEach((sec) => navObserver.observe(sec));
  }

  /* ==========================================================================
     02. DESKTOP PINNED HORIZONTAL STORYTELLING (SELECTED WORK)
     ========================================================================== */
  const horizSection = document.querySelector('.horizontal-scroll-section');
  const horizTrack = document.querySelector('.horizontal-track');
  const trackContainer = document.querySelector('.horizontal-track-container');
  const trackFill = document.querySelector('.track-progress-fill');
  const currentCardIndicator = document.querySelector('.current-card-num');
  const totalCards = document.querySelectorAll('.horizontal-card').length;

  let isHorizontalActive = false;
  let maxTranslate = 0;
  let ticking = false;

  const calculateHorizontalBounds = () => {
    if (!horizSection || !horizTrack || !trackContainer) return;

    if (window.innerWidth >= 1024 && !prefersReducedMotion) {
      isHorizontalActive = true;
      maxTranslate = horizTrack.scrollWidth - trackContainer.clientWidth;
    } else {
      isHorizontalActive = false;
      horizTrack.style.transform = 'none';
      if (trackFill) trackFill.style.width = '100%';
    }
  };

  calculateHorizontalBounds();
  window.addEventListener('resize', calculateHorizontalBounds, { passive: true });

  const updateHorizontalScroll = () => {
    if (!isHorizontalActive || !horizSection || !horizTrack) {
      ticking = false;
      return;
    }

    const rect = horizSection.getBoundingClientRect();
    const sectionHeight = horizSection.offsetHeight;
    const windowHeight = window.innerHeight;

    // Scroll progress through pinned section: 0 when top touches viewport top, 1 when bottom touches bottom
    const totalDistance = sectionHeight - windowHeight;
    const scrolledDistance = -rect.top;

    let progress = scrolledDistance / totalDistance;
    progress = Math.max(0, Math.min(progress, 1));

    const currentX = progress * maxTranslate;
    horizTrack.style.transform = `translateX(-${currentX}px)`;

    if (trackFill) {
      trackFill.style.width = `${Math.max(10, Math.round(progress * 100))}%`;
    }

    if (currentCardIndicator && totalCards > 0) {
      const activeIdx = Math.min(Math.floor(progress * totalCards) + 1, totalCards);
      currentCardIndicator.textContent = String(activeIdx).padStart(2, '0');
    }

    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (isHorizontalActive && !ticking) {
        requestAnimationFrame(updateHorizontalScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  /* ==========================================================================
     03. ALTERNATING SCROLL REVEAL OBSERVERS
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-left, .reveal-right');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    document.body.classList.add('js-active');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '50px 0px 50px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // Immediately mark currently visible elements
    const checkVisibleNow = () => {
      revealElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 120 && rect.bottom > -120) {
          el.classList.add('in-view');
        }
      });
    };
    checkVisibleNow();
    window.addEventListener('scroll', checkVisibleNow, { passive: true });
    window.addEventListener('hashchange', checkVisibleNow, { passive: true });
  } else {
    // Graceful fallback: instantly show all
    revealElements.forEach((el) => el.classList.add('in-view'));
  }

  /* ==========================================================================
     04. ANIMATED NUMBER COUNTERS (GPA & TOEFL)
     ========================================================================== */
  const counterElements = document.querySelectorAll('.counter');

  const runCounterAnimation = (counter) => {
    const target = parseFloat(counter.getAttribute('data-target'));
    const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
    const duration = 1600;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quadratic ease out
      const easeProgress = progress * (2 - progress);
      const currentVal = easeProgress * target;

      counter.textContent = currentVal.toFixed(decimals);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        counter.textContent = target.toFixed(decimals);
      }
    };

    requestAnimationFrame(step);
  };

  const eduSection = document.getElementById('education');
  if (eduSection && counterElements.length > 0 && 'IntersectionObserver' in window && !prefersReducedMotion) {
    let countersAnimated = false;
    const eduObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersAnimated) {
            countersAnimated = true;
            counterElements.forEach((c) => runCounterAnimation(c));
            eduObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    eduObserver.observe(eduSection);
  } else {
    counterElements.forEach((c) => {
      const target = parseFloat(c.getAttribute('data-target'));
      const decimals = parseInt(c.getAttribute('data-decimals') || '0', 10);
      c.textContent = target.toFixed(decimals);
    });
  }

  /* ==========================================================================
     05. CERTIFICATION LIGHTBOX MODAL
     ========================================================================== */
  const certCards = document.querySelectorAll('.cert-card');
  const lightbox = document.getElementById('cert-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxIssuer = document.getElementById('lightbox-issuer');
  const lightboxClose = document.querySelector('.lightbox-close');

  if (lightbox && lightboxImg && certCards.length > 0) {
    const openLightbox = (card) => {
      const imgSrc = card.getAttribute('data-img');
      const title = card.getAttribute('data-title') || card.querySelector('.cert-title')?.textContent || '';
      const issuer = card.getAttribute('data-issuer') || card.querySelector('.cert-issuer')?.textContent || '';

      // If no image yet (pending cert), don't open lightbox
      if (!imgSrc) {
        return;
      }

      lightboxImg.src = imgSrc;
      lightboxImg.alt = title;
      if (lightboxTitle) lightboxTitle.textContent = title;
      if (lightboxIssuer) lightboxIssuer.textContent = issuer;

      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (lightboxClose) lightboxClose.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => {
        lightboxImg.src = '';
      }, 250);
    };

    certCards.forEach((card) => {
      card.addEventListener('click', () => openLightbox(card));
      // Keyboard enter key
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(card);
        }
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-img-wrap')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  /* ==========================================================================
     06. CONTACT FORM INTERACTION
     ========================================================================== */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = contactForm.querySelector('[name="name"]');
      const emailInput = contactForm.querySelector('[name="email"]');
      const messageInput = contactForm.querySelector('[name="message"]');
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Membuka aplikasi email...';
      submitBtn.disabled = true;

      const subject = encodeURIComponent(`Pesan dari ${name}`);
      const body = encodeURIComponent(`Halo Fahrizal,\n\n${message}\n\nSalam,\n${name}\nEmail: ${email}`);

      window.location.href = `mailto:fahrizal55250@gmail.com?subject=${subject}&body=${body}`;

      setTimeout(() => {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        contactForm.reset();
      }, 2500);
    });
  }

  /* ==========================================================================
     07. SMOOTH RETURN-TO-TOP BUTTON
     ========================================================================== */
  const backToTopBtn = document.querySelector('.footer-back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
});
