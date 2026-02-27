/* ══════════════════════════════════════════════
   PORTFOLIO PRO v2 — main.js
   Features:
   • Particles background
   • Scroll animations + progress bar
   • Skill bar reveal
   • Project / skill filtering
   • Edit panel (7 tabs)
   • 4 photo upload methods (File, URL, Webcam, Clipboard)
   • Cropper.js integration
   • Live DOM updates
   • Toast notifications
══════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let state = {};           // current portfolio data from server
let cropper = null;       // Cropper.js instance
let cropBlob = null;      // blob ready to upload after crop
let webcamStream = null;  // MediaStream for webcam

// ════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initNav();
  initScrollReveal();
  initSkillBars();
  initFilters();
  initFooter();
  await loadState();
  initClipboardZone();
  initDragDrop();
});

async function loadState() {
  try {
    const r = await fetch('/api/portfolio');
    state = await r.json();
  } catch (e) { console.warn('Could not load state', e); }
}

// ════════════════════════════════════════════
//  PARTICLES
// ════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dots = [], W, H;
  const MAX = 60;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const accentRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent').trim() || '#00D4FF';

  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '0,212,255';
  }
  const rgb = hexToRgb(accentRaw);

  for (let i = 0; i < MAX; i++) {
    dots.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + .3,
      vx: (Math.random() - .5) * .3,
      vy: (Math.random() - .5) * .3,
      a: Math.random() * .5 + .1,
    });
  }

  (function animate() {
    ctx.clearRect(0, 0, W, H);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${d.a})`;
      ctx.fill();
    });
    // Draw connecting lines between close dots
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(${rgb},${(1 - dist/100) * .12})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  })();
}

// ════════════════════════════════════════════
//  NAV + SCROLL PROGRESS
// ════════════════════════════════════════════
function initNav() {
  const nav = document.getElementById('nav');
  const bar = document.getElementById('scrollBar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 60);
    const pct = scrollY / (document.body.scrollHeight - innerHeight) * 100;
    if (bar) bar.style.width = pct + '%';
  }, { passive: true });
}

function toggleMobileNav() {
  document.getElementById('navLinks')?.classList.toggle('mobile-open');
}

// ════════════════════════════════════════════
//  SCROLL REVEAL
// ════════════════════════════════════════════
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.sec-head, .skill-card, .proj-card, .tl-item, .testi-card, .about-grid, .contact-grid, .stats-bar, .stat-item'
  );
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  targets.forEach(el => io.observe(el));
}

// ════════════════════════════════════════════
//  SKILL BARS
// ════════════════════════════════════════════
function initSkillBars() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const bar = e.target;
        const level = bar.dataset.level || '80';
        setTimeout(() => { bar.style.width = level + '%'; }, 100);
        io.unobserve(bar);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.skill-bar-fill').forEach(b => io.observe(b));
}

// ════════════════════════════════════════════
//  FILTERS (Skills + Projects)
// ════════════════════════════════════════════
function initFilters() {
  // Skills filter buttons auto-bind via onclick
  // Projects filter buttons auto-bind via onclick
}

function filterSkills(cat) {
  document.querySelectorAll('.skill-filter-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === cat || (cat === 'all' && b.textContent === 'All'));
  });
  document.querySelectorAll('.skill-card').forEach(c => {
    c.classList.toggle('hidden', cat !== 'all' && c.dataset.cat !== cat);
  });
}

function filterProjects(tag) {
  document.querySelectorAll('.proj-filter-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === tag || (tag === 'all' && b.textContent === 'All'));
  });
  document.querySelectorAll('.proj-card').forEach(c => {
    const tags = c.dataset.tags || '';
    c.classList.toggle('hidden', tag !== 'all' && !tags.includes(tag));
  });
}

// ════════════════════════════════════════════
//  FOOTER
// ════════════════════════════════════════════
function initFooter() {
  const el = document.getElementById('fyear');
  if (el) el.textContent = new Date().getFullYear();
}

// ════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════
function $id(id) { return document.getElementById(id); }
function setVal(id, v) { const el = $id(id); if (el) el.value = v ?? ''; }
function setCheck(id, v) { const el = $id(id); if (el) el.checked = !!v; }
function getVal(id) { return ($id(id)?.value ?? '').trim(); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

let toastTimer;
function toast(msg, type = 's') {
  const el = $id('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast on ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 3500);
}

function loading(on, text = 'Uploading…') {
  const el = $id('loadingOverlay');
  const txt = $id('loadingText');
  if (txt) txt.textContent = text;
  el?.classList.toggle('on', on);
}

function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  const inp = $id('e-accent');
  if (inp) inp.value = color;
}

// ════════════════════════════════════════════
//  EDITOR
// ════════════════════════════════════════════
const Editor = {
  open() {
    $id('editPanel')?.classList.add('on');
    $id('epOverlay')?.classList.add('on');
    document.body.style.overflow = 'hidden';
    this.populate();
    this.bindTabs();
  },
  close() {
    $id('editPanel')?.classList.remove('on');
    $id('epOverlay')?.classList.remove('on');
    document.body.style.overflow = '';
    Photo.stopWebcam();
  },
  bindTabs() {
    document.querySelectorAll('.ep-tab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.ep-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ep-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $id('pane-' + btn.dataset.tab)?.classList.add('active');
      };
    });
  },
  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    toast('Theme switched', 's');
  },
  populate() {
    const d = state;
    setVal('e-name',     d.name);
    setVal('e-tagline',  d.tagline);
    setVal('e-bio',      d.bio);
    setVal('e-bio-ext',  d.bio_extended);
    setVal('e-location', d.location);
    setVal('e-email',    d.email);
    setVal('e-phone',    d.phone);
    setVal('e-website',  d.website);
    setVal('e-resume',   d.resume_url);
    setCheck('e-available', d.available);

    const acc = d.accent || '#00D4FF';
    const inp = $id('e-accent');
    if (inp) inp.value = acc;

    Social.render(d.social_links || []);
    Skills.render(d.skills || []);
    Projects.render(d.projects || []);
    Exp.render(d.experience || []);
    Edu.render(d.education || []);
    Testi.render(d.testimonials || []);
    Stats.render(d.stats || []);
    Photo.renderCurrent(d.photo);
  },
  collect() {
    return {
      name:         getVal('e-name'),
      tagline:      getVal('e-tagline'),
      bio:          getVal('e-bio'),
      bio_extended: getVal('e-bio-ext'),
      location:     getVal('e-location'),
      email:        getVal('e-email'),
      phone:        getVal('e-phone'),
      website:      getVal('e-website'),
      resume_url:   getVal('e-resume'),
      available:    $id('e-available')?.checked ?? false,
      accent:       $id('e-accent')?.value || '#00D4FF',
      theme:        document.documentElement.getAttribute('data-theme') || 'dark',
      social_links: Social.collect(),
      skills:       Skills.collect(),
      projects:     Projects.collect(),
      experience:   Exp.collect(),
      education:    Edu.collect(),
      testimonials: Testi.collect(),
      stats:        Stats.collect(),
    };
  },
  async save() {
    const btn = $id('epSave');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    try {
      const payload = this.collect();
      const r = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (data.ok) {
        state = data.data;
        this.applyLive(state);
        toast('✓ Saved! Page will refresh…', 's');
        setTimeout(() => { this.close(); location.reload(); }, 1200);
      } else {
        toast(data.error || 'Save failed', 'e');
      }
    } catch (e) {
      toast('Save failed — check server', 'e');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save All Changes`; }
    }
  },
  applyLive(d) {
    const ids = { 'h-name': d.name, 'h-tagline': d.tagline, 'h-bio': d.bio, 'h-location': d.location, 'a-loc': d.location, 'a-bio-ext': d.bio_extended, 'f-name': d.name };
    Object.entries(ids).forEach(([id, val]) => { const el = $id(id); if (el) el.textContent = val; });
    const em = $id('h-email'); if (em) { em.textContent = d.email; em.href = `mailto:${d.email}`; }
    const cem = $id('c-email'); if (cem) { cem.textContent = d.email; cem.href = `mailto:${d.email}`; }
    if (d.accent) document.documentElement.style.setProperty('--accent', d.accent);
  },
};

// ── Keyboard ──────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); Editor.open(); }
  if (e.key === 'Escape') { Editor.close(); }
});

// ════════════════════════════════════════════
//  SOCIAL MODULE
// ════════════════════════════════════════════
const PLATFORMS = ['GitHub','LinkedIn','Twitter','Instagram','YouTube','Dribbble','Behance','Medium','Dev.to','Website','Email','Portfolio','Other'];

const Social = {
  data: [],
  render(list) {
    this.data = list;
    const el = $id('socialList');
    if (!el) return;
    el.innerHTML = list.map((s, i) => `
      <div class="list-card">
        <div class="list-card-hd">
          <span class="list-card-label">Social ${i+1}</span>
          <button class="list-card-del" onclick="Social.remove(${i})">×</button>
        </div>
        <div class="ef-row">
          <div class="ef">
            <label>Platform</label>
            <select class="ei" id="sp-${i}" onchange="Social.syncIcon(${i})">
              ${PLATFORMS.map(p=>`<option value="${p}" ${p===s.platform?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="ef">
            <label>Icon Key</label>
            <input class="ei" id="si-${i}" value="${esc(s.icon||'')}" placeholder="github"/>
          </div>
        </div>
        <div class="ef"><label>URL</label><input class="ei" id="su-${i}" value="${esc(s.url||'')}" placeholder="https://..."/></div>
      </div>`).join('');
  },
  syncIcon(i) {
    const p = $id(`sp-${i}`)?.value || '';
    const el = $id(`si-${i}`);
    if (el) el.value = p.toLowerCase().replace(/[^a-z0-9.]/g,'');
  },
  add() { this.data.push({platform:'GitHub',url:'',icon:'github'}); this.render(this.data); },
  remove(i) { this.data.splice(i,1); this.render(this.data); },
  collect() {
    return this.data.map((_,i) => ({
      platform: $id(`sp-${i}`)?.value || '',
      url:      getVal(`su-${i}`),
      icon:     getVal(`si-${i}`),
    }));
  },
};

// ════════════════════════════════════════════
//  SKILLS MODULE
// ════════════════════════════════════════════
const SKILL_CATS = ['Frontend','Backend','DevOps','Design','Mobile','Data','Other'];

const Skills = {
  data: [],
  render(list) {
    this.data = list;
    const el = $id('skillsList');
    if (!el) return;
    el.innerHTML = list.map((s,i) => `
      <div class="list-card">
        <div class="list-card-hd">
          <span class="list-card-label">${esc(s.name)||'Skill '+(i+1)}</span>
          <button class="list-card-del" onclick="Skills.remove(${i})">×</button>
        </div>
        <div class="ef-row">
          <div class="ef"><label>Name</label><input class="ei" id="sk-n-${i}" value="${esc(s.name||'')}"/></div>
          <div class="ef"><label>Category</label>
            <select class="ei" id="sk-c-${i}">
              ${SKILL_CATS.map(c=>`<option value="${c}" ${c===s.category?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="ef"><label>Proficiency: <span id="sk-pv-${i}">${s.level||80}%</span></label>
          <div class="range-row">
            <input class="range-input" id="sk-l-${i}" type="range" min="0" max="100" value="${s.level||80}"
              oninput="$id('sk-pv-${i}').textContent=this.value+'%'"/>
          </div>
        </div>
      </div>`).join('');
  },
  add() { this.data.push({name:'',level:80,category:'Other'}); this.render(this.data); },
  remove(i) { this.data.splice(i,1); this.render(this.data); },
  collect() {
    return this.data.map((_,i) => ({
      name:     getVal(`sk-n-${i}`),
      level:    parseInt($id(`sk-l-${i}`)?.value||'80'),
      category: $id(`sk-c-${i}`)?.value||'Other',
    })).filter(s=>s.name);
  },
};

// ════════════════════════════════════════════
//  PROJECTS MODULE
// ════════════════════════════════════════════
const PROJ_COLORS = ['#00D4FF','#7C3AED','#10B981','#F59E0B','#EF4444','#EC4899','#6366F1'];
const STATUSES    = ['','Live','In Progress','Open Source','Archived','Coming Soon'];

const Projects = {
  data: [],
  render(list) {
    this.data = list;
    const el = $id('projectsList');
    if (!el) return;
    el.innerHTML = list.map((p,i) => `
      <div class="list-card">
        <div class="list-card-hd">
          <span class="list-card-label">Project ${i+1}</span>
          <button class="list-card-del" onclick="Projects.remove(${i})">×</button>
        </div>
        <div class="ef"><label>Title</label><input class="ei" id="pr-t-${i}" value="${esc(p.title||'')}"/></div>
        <div class="ef"><label>Short Description</label><textarea class="ei eta" id="pr-d-${i}" rows="2">${esc(p.description||'')}</textarea></div>
        <div class="ef"><label>Tags (comma-separated)</label><input class="ei" id="pr-tg-${i}" value="${esc((p.tags||[]).join(', '))}"/></div>
        <div class="ef-row">
          <div class="ef"><label>Live URL</label><input class="ei" id="pr-u-${i}" value="${esc(p.url||'')}"/></div>
          <div class="ef"><label>GitHub URL</label><input class="ei" id="pr-g-${i}" value="${esc(p.github||'')}"/></div>
        </div>
        <div class="ef-row">
          <div class="ef"><label>Status</label>
            <select class="ei" id="pr-s-${i}">
              ${STATUSES.map(s=>`<option value="${s}" ${s===p.status?'selected':''}>${s||'None'}</option>`).join('')}
            </select>
          </div>
          <div class="ef"><label>Accent Color</label>
            <div class="color-pick-row">
              <input class="color-input" id="pr-c-${i}" type="color" value="${p.color||'#00D4FF'}"/>
              <div class="color-presets">
                ${PROJ_COLORS.map(c=>`<div class="cp" style="background:${c}" onclick="$id('pr-c-${i}').value='${c}'"></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="ef ef-check"><label class="check-label"><input id="pr-f-${i}" type="checkbox" ${p.featured?'checked':''}/><span>Featured project</span></label></div>
      </div>`).join('');
  },
  add() {
    const c = PROJ_COLORS[this.data.length % PROJ_COLORS.length];
    this.data.push({id:'proj-'+Date.now(),title:'',description:'',tags:[],url:'',github:'',image:'',featured:false,status:'',color:c});
    this.render(this.data);
  },
  remove(i) { this.data.splice(i,1); this.render(this.data); },
  collect() {
    return this.data.map((p,i) => ({
      id:          p.id||'proj-'+i,
      title:       getVal(`pr-t-${i}`),
      description: getVal(`pr-d-${i}`),
      tags:        getVal(`pr-tg-${i}`).split(',').map(t=>t.trim()).filter(Boolean),
      url:         getVal(`pr-u-${i}`),
      github:      getVal(`pr-g-${i}`),
      image:       p.image||'',
      status:      $id(`pr-s-${i}`)?.value||'',
      featured:    $id(`pr-f-${i}`)?.checked||false,
      color:       $id(`pr-c-${i}`)?.value||'#00D4FF',
    })).filter(p=>p.title);
  },
};

// ════════════════════════════════════════════
//  EXPERIENCE MODULE
// ════════════════════════════════════════════
const Exp = {
  data: [],
  render(list) {
    this.data = list;
    const el = $id('experienceList');
    if (!el) return;
    el.innerHTML = list.map((e,i) => `
      <div class="list-card">
        <div class="list-card-hd">
          <span class="list-card-label">Role ${i+1}</span>
          <button class="list-card-del" onclick="Exp.remove(${i})">×</button>
        </div>
        <div class="ef-row">
          <div class="ef"><label>Company</label><input class="ei" id="ex-co-${i}" value="${esc(e.company||'')}"/></div>
          <div class="ef"><label>Role / Title</label><input class="ei" id="ex-r-${i}" value="${esc(e.role||'')}"/></div>
        </div>
        <div class="ef-row">
          <div class="ef"><label>Period</label><input class="ei" id="ex-p-${i}" value="${esc(e.period||'')}" placeholder="2022 – Present"/></div>
          <div class="ef"><label>Location</label><input class="ei" id="ex-l-${i}" value="${esc(e.location||'')}"/></div>
        </div>
        <div class="ef"><label>Description</label><textarea class="ei eta" id="ex-d-${i}" rows="3">${esc(e.description||'')}</textarea></div>
        <div class="ef"><label>Tags (comma-separated)</label><input class="ei" id="ex-tg-${i}" value="${esc((e.tags||[]).join(', '))}"/></div>
        <div class="ef ef-check"><label class="check-label"><input id="ex-cur-${i}" type="checkbox" ${e.current?'checked':''}/><span>Current position</span></label></div>
      </div>`).join('');
  },
  add() { this.data.push({id:'exp-'+Date.now(),company:'',role:'',period:'',location:'',description:'',tags:[],current:false}); this.render(this.data); },
  remove(i) { this.data.splice(i,1); this.render(this.data); },
  collect() {
    return this.data.map((e,i) => ({
      id:          e.id,
      company:     getVal(`ex-co-${i}`),
      role:        getVal(`ex-r-${i}`),
      period:      getVal(`ex-p-${i}`),
      location:    getVal(`ex-l-${i}`),
      description: getVal(`ex-d-${i}`),
      tags:        getVal(`ex-tg-${i}`).split(',').map(t=>t.trim()).filter(Boolean),
      current:     $id(`ex-cur-${i}`)?.checked||false,
    })).filter(e=>e.company||e.role);
  },
};

// ════════════════════════════════════════════
//  EDUCATION MODULE
// ════════════════════════════════════════════
const Edu = {
  data: [],
  render(list) {
    this.data = list;
    const el = $id('educationList');
    if (!el) return;
    el.innerHTML = list.map((e,i) => `
      <div class="list-card">
        <div class="list-card-hd">
          <span class="list-card-label">Education ${i+1}</span>
          <button class="list-card-del" onclick="Edu.remove(${i})">×</button>
        </div>
        <div class="ef-row">
          <div class="ef"><label>School</label><input class="ei" id="edu-s-${i}" value="${esc(e.school||'')}"/></div>
          <div class="ef"><label>Degree</label><input class="ei" id="edu-d-${i}" value="${esc(e.degree||'')}"/></div>
        </div>
        <div class="ef-row">
          <div class="ef"><label>Period</label><input class="ei" id="edu-p-${i}" value="${esc(e.period||'')}"/></div>
          <div class="ef"><label>GPA</label><input class="ei" id="edu-g-${i}" value="${esc(e.gpa||'')}" placeholder="3.8"/></div>
        </div>
      </div>`).join('');
  },
  add() { this.data.push({id:'edu-'+Date.now(),school:'',degree:'',period:'',gpa:''}); this.render(this.data); },
  remove(i) { this.data.splice(i,1); this.render(this.data); },
  collect() {
    return this.data.map((e,i) => ({
      id:     e.id,
      school: getVal(`edu-s-${i}`),
      degree: getVal(`edu-d-${i}`),
      period: getVal(`edu-p-${i}`),
      gpa:    getVal(`edu-g-${i}`),
    })).filter(e=>e.school);
  },
};

// ════════════════════════════════════════════
//  TESTIMONIALS MODULE
// ════════════════════════════════════════════
const Testi = {
  data: [],
  render(list) {
    this.data = list;
    const el = $id('testiList');
    if (!el) return;
    el.innerHTML = list.map((t,i) => `
      <div class="list-card">
        <div class="list-card-hd">
          <span class="list-card-label">Testimonial ${i+1}</span>
          <button class="list-card-del" onclick="Testi.remove(${i})">×</button>
        </div>
        <div class="ef-row">
          <div class="ef"><label>Name</label><input class="ei" id="tt-n-${i}" value="${esc(t.name||'')}"/></div>
          <div class="ef"><label>Role</label><input class="ei" id="tt-r-${i}" value="${esc(t.role||'')}"/></div>
        </div>
        <div class="ef"><label>Quote</label><textarea class="ei eta" id="tt-t-${i}" rows="3">${esc(t.text||'')}</textarea></div>
        <div class="ef"><label>Rating (1–5)</label>
          <div class="range-row">
            <input class="range-input" id="tt-ra-${i}" type="range" min="1" max="5" value="${t.rating||5}"
              oninput="$id('tt-rv-${i}').textContent=this.value"/>
            <span class="range-val" id="tt-rv-${i}">${t.rating||5}</span>
          </div>
        </div>
      </div>`).join('');
  },
  add() { this.data.push({id:'t-'+Date.now(),name:'',role:'',text:'',rating:5,avatar:''}); this.render(this.data); },
  remove(i) { this.data.splice(i,1); this.render(this.data); },
  collect() {
    return this.data.map((t,i) => ({
      id:     t.id,
      name:   getVal(`tt-n-${i}`),
      role:   getVal(`tt-r-${i}`),
      text:   getVal(`tt-t-${i}`),
      rating: parseInt($id(`tt-ra-${i}`)?.value||'5'),
      avatar: t.avatar||'',
    })).filter(t=>t.name||t.text);
  },
};

// ════════════════════════════════════════════
//  STATS MODULE
// ════════════════════════════════════════════
const Stats = {
  data: [],
  render(list) {
    this.data = list;
    const el = $id('statsEditor');
    if (!el) return;
    el.innerHTML = list.map((s,i) => `
      <div class="stats-edit-row">
        <input class="ei" id="st-l-${i}" placeholder="Label" value="${esc(s.label||'')}"/>
        <input class="ei" id="st-v-${i}" placeholder="Value" value="${esc(s.value||'')}"/>
        <button class="stats-del" onclick="Stats.remove(${i})">×</button>
      </div>`).join('') + `<button class="btn-add-item" onclick="Stats.add()" style="margin-top:6px">+ Add Stat</button>`;
  },
  add() { this.data.push({label:'',value:''}); this.render(this.data); },
  remove(i) { this.data.splice(i,1); this.render(this.data); },
  collect() {
    return this.data.map((_,i) => ({
      label: getVal(`st-l-${i}`),
      value: getVal(`st-v-${i}`),
    })).filter(s=>s.label);
  },
};

// ════════════════════════════════════════════
//  PHOTO MODULE — 4 upload methods
// ════════════════════════════════════════════
const Photo = {
  // ── Switch method tab ─────────────────────
  switchMethod(method) {
    document.querySelectorAll('.pm-tab').forEach(b => b.classList.toggle('active', b.dataset.method === method));
    document.querySelectorAll('.photo-method-pane').forEach(p => p.classList.toggle('active', p.id === 'pm-'+method));
    if (method === 'webcam') this.setupWebcamUI();
    else this.stopWebcam();
  },

  // ── Render current photo ──────────────────
  renderCurrent(url) {
    const wrap = $id('currentPhotoPreview');
    const btn  = $id('removePhotoBtn');
    if (!wrap) return;
    if (url) {
      wrap.innerHTML = `<img src="${url}?t=${Date.now()}" alt="Current photo"/>`;
      if (btn) btn.style.display = '';
    } else {
      wrap.textContent = 'No photo set';
      if (btn) btn.style.display = 'none';
    }
  },

  // ── UPDATE ALL photo elements on page ─────
  updatePage(url) {
    const heroImg = $id('heroPhoto');
    const heroEmpty = $id('heroPhotoEmpty');
    const aboutImg = $id('aboutPhoto');

    if (url) {
      const src = url + '?t=' + Date.now();
      if (heroImg) { heroImg.src = src; heroImg.style.display = ''; }
      if (heroEmpty) heroEmpty.style.display = 'none';
      if (aboutImg) {
        if (aboutImg.tagName === 'IMG') { aboutImg.src = src; }
        else {
          const img = document.createElement('img');
          img.src = src; img.alt = '';
          aboutImg.replaceWith(img);
        }
      }
    } else {
      if (heroImg) heroImg.style.display = 'none';
      if (heroEmpty) heroEmpty.style.display = '';
    }
    this.renderCurrent(url);
    state.photo = url;
  },

  // ── METHOD 1: File (drag & drop / browse) ─
  handleFile(file) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast('File too large (max 15 MB)', 'e'); return; }
    const reader = new FileReader();
    reader.onload = e => this.openCropper(e.target.result, () => this.uploadBlob());
    reader.readAsDataURL(file);
  },

  // ── METHOD 2: URL ──────────────────────────
  async importUrl() {
    const url = getVal('urlInput');
    if (!url) { toast('Enter a URL first', 'e'); return; }
    setStatus('urlStatus', 'Fetching image…', 'loading');
    try {
      const resp = await fetch('/api/photo/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      if (data.ok) {
        setStatus('urlStatus', '✓ Photo saved!', 'success');
        this.updatePage(data.url);
        toast('✓ Photo imported from URL', 's');
        $id('urlPreviewWrap').style.display = 'none';
      } else {
        setStatus('urlStatus', data.error || 'Import failed', 'error');
      }
    } catch (e) {
      setStatus('urlStatus', 'Network error', 'error');
    }
  },
  async uploadFromUrl() { await this.importUrl(); },

  previewUrl() {
    const url = getVal('urlInput');
    if (!url) return;
    const prev = $id('urlPreview');
    const wrap = $id('urlPreviewWrap');
    if (prev && wrap) {
      prev.src = url;
      prev.onload = () => wrap.style.display = '';
      prev.onerror = () => setStatus('urlStatus', 'Cannot load image from this URL', 'error');
    }
  },

  // ── METHOD 3: Webcam ───────────────────────
  setupWebcamUI() {
    const idle = $id('webcamIdle');
    const live = $id('webcamLive');
    if (!webcamStream) { if (idle) idle.style.display = 'flex'; if (live) live.style.display = 'none'; }
  },
  async startWebcam() {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width:640, height:480 } });
      const vid = $id('webcamVideo');
      if (vid) { vid.srcObject = webcamStream; }
      $id('webcamIdle').style.display = 'none';
      $id('webcamLive').style.display = 'flex';
      setStatus('webcamStatus', 'Camera active — position yourself and capture!', 'success');
    } catch (e) {
      setStatus('webcamStatus', `Camera access denied: ${e.message}`, 'error');
    }
  },
  captureWebcam() {
    const vid = $id('webcamVideo');
    const canvas = $id('webcamCanvas');
    if (!vid || !canvas) return;
    canvas.width  = vid.videoWidth;
    canvas.height = vid.videoHeight;
    canvas.getContext('2d').drawImage(vid, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', .92);
    this.stopWebcam();
    this.openCropper(dataUrl, () => this.uploadBlob());
  },
  stopWebcam() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      webcamStream = null;
    }
    const vid = $id('webcamVideo');
    if (vid) vid.srcObject = null;
    const idle = $id('webcamIdle');
    const live = $id('webcamLive');
    if (idle) idle.style.display = 'none';
    if (live) live.style.display = 'none';
  },

  // ── METHOD 4: Clipboard paste ──────────────
  // (set up via initClipboardZone below)

  // ── Cropper.js ────────────────────────────
  openCropper(dataUrl, onApply) {
    const section  = $id('cropSection');
    const cropImg  = $id('cropImg');
    if (!section || !cropImg) { this._pendingApply = onApply; return; }

    section.style.display = '';
    cropImg.src = dataUrl;

    if (cropper) { cropper.destroy(); cropper = null; }
    cropImg.onload = () => {
      cropper = new Cropper(cropImg, {
        aspectRatio: 1,
        viewMode:    2,
        dragMode:    'move',
        guides:      true,
        center:      true,
        background:  false,
        autoCropArea: .8,
      });
    };
    this._pendingApply = onApply;
  },
  cropAspect(w, h) { if (cropper) cropper.setAspectRatio(w/h); },
  cropFree()       { if (cropper) cropper.setAspectRatio(NaN); },
  applyCrop() {
    if (!cropper) return;
    cropper.getCroppedCanvas({ maxWidth:800, maxHeight:800 }).toBlob(blob => {
      cropBlob = blob;
      if (this._pendingApply) this._pendingApply();
    }, 'image/jpeg', .9);
  },

  // ── Upload the crop blob via base64 ────────
  async uploadBlob() {
    if (!cropBlob) { toast('Apply crop first', 'e'); return; }
    loading(true, 'Uploading photo…');
    try {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const r = await fetch('/api/photo/base64', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: e.target.result }),
          });
          const data = await r.json();
          loading(false);
          if (data.ok) {
            this.updatePage(data.url);
            $id('cropSection').style.display = 'none';
            if (cropper) { cropper.destroy(); cropper = null; }
            toast('✓ Photo uploaded!', 's');
          } else {
            toast(data.error || 'Upload failed', 'e');
          }
        } catch (err) {
          loading(false);
          toast('Upload error', 'e');
        }
      };
      reader.readAsDataURL(cropBlob);
    } catch (e) {
      loading(false);
      toast('Upload error', 'e');
    }
  },

  // ── Remove photo ───────────────────────────
  async remove() {
    if (!confirm('Remove your profile photo?')) return;
    try {
      await fetch('/api/photo/delete', { method: 'POST' });
      this.updatePage('');
      toast('Photo removed', 's');
    } catch (e) { toast('Failed to remove photo', 'e'); }
  },
};

// ── Drag & Drop on drop-zone ─────────────────
function initDragDrop() {
  const zone = $id('dropZone');
  if (!zone) return;
  zone.addEventListener('click', () => $id('fileInput')?.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) Photo.handleFile(f);
  });
}

// ── Clipboard paste ───────────────────────────
function initClipboardZone() {
  const zone = $id('clipZone');
  if (!zone) return;

  const handler = async e => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setStatus('clipStatus', 'Image detected! Opening crop tool…', 'success');
          Photo.handleFile(file);
          return;
        }
      }
    }
    setStatus('clipStatus', 'No image found in clipboard — copy an image first', 'error');
  };

  zone.addEventListener('focus',    () => document.addEventListener('paste', handler));
  zone.addEventListener('blur',     () => document.removeEventListener('paste', handler));
  zone.addEventListener('click',    () => { zone.focus(); setStatus('clipStatus', 'Ready — press Ctrl+V to paste', 'loading'); });
  zone.addEventListener('keydown',  e => { if (e.ctrlKey && e.key === 'v') e.preventDefault(); });
}

// ── Helper: set status text ───────────────────
function setStatus(id, msg, type) {
  const el = $id(id);
  if (el) { el.textContent = msg; el.className = `upload-status ${type}`; }
}
