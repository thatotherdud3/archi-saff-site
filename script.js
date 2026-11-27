const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* One shared transition across the four static pages. */
const loader = $('.page-loader');
const transitionKey = 'archi-saff-transition';
const fadeDuration = reducedMotion ? 0 : 650;
let navigating = false;
let navigationTimer;
let recoveryTimer;

function hideLoader() {
  document.documentElement.classList.remove('page-transition-entering');
  if (!loader) return;
  loader.classList.remove('leaving');
  loader.classList.add('done');
}

function pageKey(url) {
  const path = url.pathname.endsWith('/index.html')
    ? url.pathname.slice(0, -'index.html'.length)
    : url.pathname;
  return path + url.search;
}

// Only the four main destinations participate in the branded cross-page fade.
const mainPages = new Set(['index.html', 'projects.html', 'inspirations.html', 'upcoming.html']);
const siteDirectory = new URL('.', location.href).pathname;
function isMainPage(url) {
  if (!url.pathname.startsWith(siteDirectory)) return false;
  const relativePath = url.pathname.slice(siteDirectory.length);
  return relativePath === '' || mainPages.has(relativePath);
}

if (loader) {
  // Direct visits show the content straight away. Internal links fade back in.
  if (document.documentElement.classList.contains('page-transition-entering')) {
    requestAnimationFrame(() => requestAnimationFrame(hideLoader));
  } else {
    hideLoader();
  }

  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    navigating = false;
    clearTimeout(navigationTimer);
    clearTimeout(recoveryTimer);
    hideLoader();
  });
  addEventListener('pagehide', () => {
    clearTimeout(navigationTimer);
    clearTimeout(recoveryTimer);
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || navigating || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin) return;

    if (pageKey(destination) === pageKey(new URL(location.href))) {
      // Same-page anchors retain native browser behaviour.
      if (!destination.hash) {
        event.preventDefault();
        scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
      }
      return;
    }

    if (!/\.html?$/i.test(destination.pathname)) return;

    // Project details, case studies and other internal pages use normal navigation.
    // This keeps the Archi/Saff interstitial strictly between the four main pages.
    if (!isMainPage(new URL(location.href)) || !isMainPage(destination)) return;

    event.preventDefault();
    if (reducedMotion) {
      location.assign(destination.href);
      return;
    }

    navigating = true;
    loader.classList.remove('done');
    loader.classList.add('leaving');
    try { sessionStorage.setItem(transitionKey, String(Date.now())); } catch (_) {}

    navigationTimer = setTimeout(() => location.assign(destination.href), fadeDuration);
    // If navigation fails, never leave a permanent black screen.
    recoveryTimer = setTimeout(() => {
      navigating = false;
      try { sessionStorage.removeItem(transitionKey); } catch (_) {}
      hideLoader();
    }, 6500);
  });
}


/* A restrained page fade for project links; the branded main-page transition remains intact. */
const projectPagePath = siteDirectory + 'project.html';
const isProjectDetail = url => url.pathname === projectPagePath;
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || navigating || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

  const destination = new URL(link.href, location.href);
  if (destination.origin !== location.origin || !/\.html?$/i.test(destination.pathname)) return;
  if (!isProjectDetail(destination) && !isProjectDetail(new URL(location.href))) return;
  if (pageKey(destination) === pageKey(new URL(location.href))) return;

  event.preventDefault();
  if (reducedMotion) {
    location.assign(destination.href);
    return;
  }

  navigating = true;
  document.body.classList.add('soft-page-exiting');
  try { sessionStorage.setItem('archi-saff-soft-transition', String(Date.now())); } catch (_) {}
  navigationTimer = setTimeout(() => location.assign(destination.href), 230);
  recoveryTimer = setTimeout(() => {
    navigating = false;
    document.body.classList.remove('soft-page-exiting');
    try { sessionStorage.removeItem('archi-saff-soft-transition'); } catch (_) {}
  }, 6500);
});

/* Restore an intact page when navigating back from the browser cache. */
addEventListener('pageshow', event => {
  if (!event.persisted) return;
  navigating = false;
  clearTimeout(navigationTimer);
  clearTimeout(recoveryTimer);
  document.body.classList.remove('soft-page-exiting');
});

/* Placeholder social URLs must not open an empty tab before Saff supplies links. */
$$('a[href="#"]').forEach(link => link.addEventListener('click', event => event.preventDefault()));

/* ---- accessible mobile navigation ---- */
const mobileMenuToggle = $('.mobile-menu-toggle');
const navRoot = $('.nav');
if (mobileMenuToggle && navRoot) {
  const closeMobileMenu = () => {
    navRoot.classList.remove('menu-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mobileMenuToggle.setAttribute('aria-label', 'Open menu');
  };
  mobileMenuToggle.addEventListener('click', () => {
    const opening = !navRoot.classList.contains('menu-open');
    navRoot.classList.toggle('menu-open', opening);
    mobileMenuToggle.setAttribute('aria-expanded', String(opening));
    mobileMenuToggle.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('pointerdown', event => {
    if (navRoot.classList.contains('menu-open') && !navRoot.contains(event.target)) closeMobileMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navRoot.classList.contains('menu-open')) {
      closeMobileMenu();
      mobileMenuToggle.focus();
    }
  });
  $$('.primary-nav a', navRoot).forEach(link => link.addEventListener('click', closeMobileMenu));
  const desktopQuery = matchMedia('(min-width: 861px)');
  const handleBreakpoint = event => { if (event.matches) closeMobileMenu(); };
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', handleBreakpoint);
  else desktopQuery.addListener(handleBreakpoint);
}

/* ---- project filter (Projects page only) ---- */
$$('.ftabs button').forEach(b => {
  b.setAttribute('aria-pressed', String(b.classList.contains('on')));
  b.addEventListener('click', () => {
    $$('.ftabs button').forEach(x => {
      const selected = x === b;
      x.classList.toggle('on', selected);
      x.setAttribute('aria-pressed', String(selected));
    });
    const f = b.dataset.f;
    $$('#projGrid .tile').forEach(t => {
      t.style.display = f === 'all' || t.dataset.f === f ? '' : 'none';
    });
  });
});

/* ---- inspirations data + viewer (Inspirations page only) ---- */
const inspData=[
  {t:'Weight & Shadow',b:"I keep coming back to this one for how the light carves the concrete into something almost soft. It's a reminder that heaviness and warmth aren't opposites."},
  {t:'Curved Volume',b:"The way this ramp bends against the sky feels less like engineering and more like a gesture. Proportion over ornament, every time."},
  {t:'Layered Form',b:'Stacked, staggered blocks that read differently from every angle. I love buildings that reward walking around them slowly.'},
  {t:'Light on White',b:'A single raking shadow doing all the work here. Minimal material, maximum atmosphere — the goal I keep chasing.'},
  {t:'Raw Texture',b:'Board-formed concrete up close, every grain of the timber mould still visible. The material remembers how it was made.'},
  {t:'Quiet Corner',b:"Not every inspiration needs to be monumental. This stairwell is just honest, functional, and calm."},
  {t:'Threshold',b:'The moment between outside and in — that in-between space says more about a building than its facade does.'},
  {t:'Mass & Void',b:'Solid against empty. This is the proportion study I keep returning to when a design feels too busy.'}
];
const inspGrid = $('#inspGrid');
if (inspGrid) {
  // Tiles live in HTML too, so a script error can never leave an empty archive.
  $$('.insp-tile', inspGrid).forEach(tile => {
    const i = Number(tile.dataset.i);
    if (!Number.isInteger(i) || !inspData[i]) return;
    tile.addEventListener('click', () => openViewer(i));
  });
}
const viewer=$('#viewer');
let lastInspirationTile = null;
function openViewer(i){
  const d=inspData[i];
  lastInspirationTile = $('.insp-tile[data-i="' + i + '"]');
  $('#viewerNum').textContent='0'+(i+1);
  $('#viewerTitle').textContent=d.t;
  $('#viewerBody').textContent=d.b;
  $('#viewerImg').setAttribute('data-label',d.t);
  viewer.classList.add('on');
  viewer.scrollIntoView({behavior:reducedMotion ? 'instant' : 'smooth',block:'start'});
  viewerClose?.focus({preventScroll:true});
}
const viewerClose=$('#viewerClose');
function closeViewer() {
  viewer?.classList.remove('on');
  lastInspirationTile?.focus({preventScroll:true});
  lastInspirationTile?.scrollIntoView({
    behavior: reducedMotion ? 'instant' : 'smooth',
    block: 'nearest'
  });
}
if (viewerClose) viewerClose.addEventListener('click', closeViewer);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && viewer?.classList.contains('on')) closeViewer();
});

/* ---- magnetic links, calculated from a fixed starting rectangle ---- */
if (!reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  $$('.magnet').forEach(el => {
    let initialRect = null;
    const reset = () => {
      initialRect = null;
      el.style.removeProperty('--mag-x');
      el.style.removeProperty('--mag-y');
    };
    el.addEventListener('pointerenter', () => { initialRect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', event => {
      if (!initialRect) initialRect = el.getBoundingClientRect();
      const centreX = initialRect.left + initialRect.width / 2;
      const centreY = initialRect.top + initialRect.height / 2;
      // Slightly stronger pull than before, without the exaggerated travel.
      const x = Math.max(-10, Math.min(10, (event.clientX - centreX) * .21));
      const y = Math.max(-8, Math.min(8, (event.clientY - centreY) * .21));
      el.style.setProperty('--mag-x', x.toFixed(1) + 'px');
      el.style.setProperty('--mag-y', y.toFixed(1) + 'px');
    });
    el.addEventListener('pointerleave', reset);
    el.addEventListener('pointercancel', reset);
    el.addEventListener('blur', reset);
  });
}


/* Light scroll reveals across projects, the live Inspirations gallery, and footers.
   No content is hidden until a working observer schedules an animation. */
if (!reducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .06, rootMargin: '0px 0px -3% 0px' });

  const revealSelectors = [
    '.reveal',
    '#projects .filters',
    '#projGrid .tile',
    '#inspirations .filters',
    '#inspirations .pinterest-archive-intro',
    '#inspirations .tileset-board-shell',
    '#inspirations .pinterest-archive-footer',
    '#upcoming .table .trow:not(.head)',
    '#projectDetail .project-detail-description',
    '#projectDetail .project-document-section',
    '#projectDetail .project-detail-bottom',
    '.foot-band .foot-intro',
    '.foot-band .wordmark'
  ].join(', ');

  function scheduleReveals(root) {
    root.querySelectorAll(revealSelectors).forEach(el => {
      if (el.classList.contains('in') || el.classList.contains('reveal-pending')) return;
      // Keep content visible above the fold and when jumping back into a page.
      if (el.getBoundingClientRect().top <= innerHeight * .8) return;
      if (!el.classList.contains('reveal')) el.classList.add('reveal', 'editorial-reveal');
      el.classList.add('reveal-pending');
      revealObserver.observe(el);
    });
  }

  scheduleReveals(document);

  // The project-reader creates its document sections after this shared script runs.
  const documents = document.querySelector('#projectDocuments');
  if (documents && 'MutationObserver' in window) {
    const documentObserver = new MutationObserver(() => {
      scheduleReveals(documents);
      if (documents.querySelector('.project-document-section') ||
          !documents.querySelector('.project-documents-loading')) documentObserver.disconnect();
    });
    documentObserver.observe(documents, { childList: true });
  }
}
