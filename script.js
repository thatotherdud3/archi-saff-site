const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Smooth page-to-page fade. No splash screen or minimum loading delay. */
const loader = $('.page-loader');
const transitionKey = 'archi-saff-transition';
let navigating = false;
let navigationTimer;

function hideLoader() {
  if (!loader) return;
  document.documentElement.classList.remove('page-transition-entering');
  loader.classList.remove('leaving');
  loader.classList.add('done');
}

/* Treat '/' and '/index.html' as the same page so the logo does not reload Home. */
function pageKey(url) {
  const path = url.pathname.endsWith('/index.html')
    ? url.pathname.slice(0, -'index.html'.length)
    : url.pathname;
  return path + url.search;
}

if (loader) {
  // Reveal the destination on the next painted frame, not after a timed splash.
  requestAnimationFrame(() => requestAnimationFrame(hideLoader));

  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    navigating = false;
    clearTimeout(navigationTimer);
    hideLoader();
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || navigating || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin) return;

    if (pageKey(destination) === pageKey(new URL(location.href))) {
      if (!destination.hash || destination.hash === location.hash) event.preventDefault();
      return;
    }

    // Animate HTML page changes only.
    if (!/\.html?$/i.test(destination.pathname)) return;

    event.preventDefault();
    navigating = true;
    loader.classList.remove('done');
    loader.classList.add('leaving');

    if (!reducedMotion) {
      try { sessionStorage.setItem(transitionKey, '1'); } catch (_) {}
    }

    navigationTimer = setTimeout(() => location.assign(destination.href),
      reducedMotion ? 0 : 650);
  });
}

/* ---- project filter (Projects page only) ---- */
$$('.ftabs button').forEach(b=>b.addEventListener('click',()=>{
  $$('.ftabs button').forEach(x=>x.classList.remove('on')); b.classList.add('on');
  const f=b.dataset.f;
  $$('#projGrid .tile').forEach(t=>t.style.display=(f==='all'||t.dataset.f===f)?'':'none');
}));

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
const inspGrid=$('#inspGrid');
if(inspGrid){
  inspData.forEach((d,i)=>{
    const tile=document.createElement('div');
    tile.className='insp-tile'; tile.dataset.i=i;
    tile.innerHTML=`<span class="num">0${i+1}</span><div class="ph" data-label="${d.t}"></div>`;
    tile.addEventListener('click',()=>openViewer(i));
    inspGrid.appendChild(tile);
  });
}
const viewer=$('#viewer');
function openViewer(i){
  const d=inspData[i];
  $('#viewerNum').textContent='0'+(i+1);
  $('#viewerTitle').textContent=d.t;
  $('#viewerBody').textContent=d.b;
  $('#viewerImg').setAttribute('data-label',d.t);
  viewer.classList.add('on');
  viewer.scrollIntoView({behavior:'smooth',block:'start'});
}
const viewerClose=$('#viewerClose');
if(viewerClose) viewerClose.addEventListener('click',()=>viewer.classList.remove('on'));

/* ---- magnetic nav/pill links ---- */
$$('.magnet').forEach(el=>{
  el.addEventListener('mousemove',e=>{
    const r=el.getBoundingClientRect();
    const x=(e.clientX-(r.left+r.width/2))*0.3;
    const y=(e.clientY-(r.top+r.height/2))*0.3;
    el.style.transform=`translate(${x}px,${y}px)`;
  });
  el.addEventListener('mouseleave',()=>{ el.style.transform='translate(0,0)'; });
});

/* ---- scroll reveal ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); }),{threshold:.15});
$$('.reveal').forEach(el=>io.observe(el));
