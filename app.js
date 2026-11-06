import { COUNTRIES, getRule, SAMPLE } from './rules.js';
import { layout, toPdf, sampleDate, clean } from './layout.js';

const $ = id => document.getElementById(id);
const KEY = 'exact-resume-v1';
const BLANK = () => ({ name: '', title: '', email: '', phone: '', city: '', links: '', summary: '', skills: '', certs: '', langs: '', dob: '', nationality: '', visa: '', licence: '', exp: [], edu: [], projects: [], referees: [] });
const NEW = { exp: { role: '', org: '', place: '', from: '', to: '', now: false, points: '' }, edu: { degree: '', org: '', place: '', from: '', to: '', score: '' }, projects: { name: '', link: '', points: '' }, referees: { name: '', role: '', contact: '' } };
const params = new URLSearchParams(location.search);
const clone = o => JSON.parse(JSON.stringify(o));

let s = { country: 'IN', gov: false, font: 'sans', german: false, noPhoto: { SG: true }, data: BLANK(), photo: null };
try { const j = JSON.parse(localStorage.getItem(KEY)); if (j) s = { ...s, ...j, data: { ...BLANK(), ...j.data } }; } catch {}
const demo = params.has('sample');
if (demo) s.data = { ...BLANK(), ...clone(SAMPLE) };
if (params.get('c')) s.country = params.get('c');
if (params.has('gov')) s.gov = true;
const save = () => { if (demo) return; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

const isEmpty = () => { const d = s.data; return !['name', 'title', 'email', 'phone', 'summary', 'skills'].some(k => d[k].trim()) && !d.exp.length && !d.edu.length; };
const rule = () => getRule(s.country, s.gov);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Country picker
$('rail').innerHTML = COUNTRIES.map(c => `<label><input type="radio" name="c" value="${c.id}"><span class="plate">${c.plate}</span><span class="nm">${c.name}</span></label>`).join('');
$('rail').addEventListener('change', e => { s.country = e.target.value; refresh(true); e.target.closest('label').scrollIntoView({ inline: 'center', block: 'nearest' }); });
$('modes').addEventListener('click', e => { const b = e.target.closest('[data-gov]'); if (b) { s.gov = b.dataset.gov === '1'; refresh(true); } });
document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
document.querySelector('.stagehead').addEventListener('click', e => { const b = e.target.closest('[data-font]'); if (b) { s.font = b.dataset.font; refresh(); } });
function setView(v) { document.body.dataset.view = v; document.querySelectorAll('.tabs [data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v)); if (v === 'preview') { renderPreview(); window.scrollTo({ top: document.querySelector('.tabs').offsetTop - 8 }); } }

// What the country expects
const yes = v => (v ? 'Yes' : 'Leave out');
function renderExpects() {
  const r = rule();
  const rows = [['Paper', r.paper === 'Letter' ? 'US Letter' : 'A4'], ['Length', r.len], ['Photo', r.photo === 'on' ? 'Common' : r.photo === 'optional' ? 'Optional' : 'Leave out', r.photo === 'off'], ['Date of birth', yes(r.dob), !r.dob], ['Nationality', yes(r.nationality), !r.nationality], ['Dates like', sampleDate(r.dates)]];
  if (r.visa) rows.push([r.id === 'CH' ? 'Work permit' : 'Visa status', 'Yes']);
  if (r.licence) rows.push(['Licence', 'If you have one']);
  if (r.referees) rows.push(['Referees', 'List 2 or 3']);
  if (r.sign) rows.push(['Sign-off', 'Place, date, signature']);
  if (r.declaration) rows.push(['Declaration', 'Yes, signed']);
  $('expects').innerHTML = `<h2>What ${esc(r.name)} expects</h2><table>${rows.map(([a, b, no]) => `<tr><th scope="row">${a}</th><td${no ? ' class="no"' : ''}>${esc(b)}</td></tr>`).join('')}</table>
    ${r.leftOut ? `<p class="note">${esc(r.leftOut)}</p>` : ''}<p class="note">${esc(r.tip)}</p>
    <details class="src"><summary>Where this comes from</summary>${r.sources.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join(' · ')}</details>`;
}

// Fields only some countries ask for
function renderAsks() {
  const r = rule();
  const need = { photo: r.photo !== 'off', dob: r.dob, nationality: r.nationality, visa: r.visa, licence: r.licence, referees: r.referees, german: !!r.german };
  document.querySelectorAll('[data-need]').forEach(el => { el.hidden = !need[el.dataset.need]; });
  $('asks').hidden = !Object.values(need).some(Boolean);
  $('asksh').textContent = `${r.name} also asks for`;
  $('visal').textContent = { CH: 'Work permit', AU: 'Visa or work rights', SG: 'Citizenship or work pass', AE: 'Visa status' }[r.id] || 'Visa status';
  $('nophoto').checked = !!s.noPhoto[r.id];
  $('german').checked = !!s.german;
  const t = $('thumb'); t.classList.toggle('has', !!s.photo); t.style.backgroundImage = s.photo ? `url(${s.photo})` : '';
  $('rmphoto').hidden = !s.photo; $('pickphoto').textContent = s.photo ? 'Change photo' : 'Add a photo';
}

// Repeating entries
const F = {
  exp: [['role', 'Job title', 'Data Analyst'], ['org', 'Company', 'Northwind Logistics'], ['place', 'City', 'Pune'], 'dates', ['points', 'What you did', 'One point per line. Start with a verb and use numbers.', 'area']],
  edu: [['degree', 'Degree or course', 'B.E. Computer Engineering'], ['org', 'College or school', 'Your college'], ['place', 'City', 'Pune'], 'dates', ['score', 'CGPA or percentage', 'CGPA 8.4']],
  projects: [['name', 'Project name', 'City rainfall tracker'], ['link', 'Link', 'github.com/you/project'], ['points', 'What it does', 'One point per line', 'area']],
  referees: [['name', 'Referee name', 'Their full name'], ['role', 'Job and company', 'Head of Analytics, Northwind'], ['contact', 'Email or phone', 'name@company.com']],
};
const REMOVE = { exp: 'Remove this job', edu: 'Remove this entry', projects: 'Remove this project', referees: 'Remove this referee' };
function renderList(k) {
  $(k).innerHTML = s.data[k].map((e, i) => `<div class="item">${F[k].map(f => {
    if (f === 'dates') return `<div class="two"><label class="f"><span>From</span><input type="month" placeholder="YYYY-MM" data-l="${k}" data-i="${i}" data-k="from" value="${esc(e.from || '')}"></label><label class="f"><span>To</span><input type="month" placeholder="YYYY-MM" data-l="${k}" data-i="${i}" data-k="to" value="${esc(e.to || '')}"${e.now ? ' disabled' : ''}></label></div>${k === 'exp' ? `<label class="check"><input type="checkbox" data-l="${k}" data-i="${i}" data-k="now"${e.now ? ' checked' : ''}> I work here now</label>` : ''}`;
    const [key, label, ph, area] = f;
    return `<label class="f"><span>${label}</span>${area ? `<textarea data-l="${k}" data-i="${i}" data-k="${key}" placeholder="${esc(ph)}">${esc(e[key] || '')}</textarea>` : `<input type="text" data-l="${k}" data-i="${i}" data-k="${key}" placeholder="${esc(ph)}" value="${esc(e[key] || '')}">`}</label>`;
  }).join('')}<button type="button" class="link" data-rm="${k}" data-i="${i}">${REMOVE[k]}</button></div>`).join('');
}
const LISTS = ['exp', 'edu', 'projects', 'referees'];

document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f) s.data[t.dataset.f] = t.value;
  else if (t.dataset.l) {
    const it = s.data[t.dataset.l][+t.dataset.i];
    if (t.type === 'checkbox') { it[t.dataset.k] = t.checked; if (t.dataset.k === 'now') { const to = t.closest('.item').querySelector('[data-k="to"]'); to.disabled = t.checked; } }
    else it[t.dataset.k] = t.value;
  } else return;
  queue();
});
document.addEventListener('click', e => {
  const a = e.target.closest('[data-add]'), r = e.target.closest('[data-rm]'), d = e.target.closest('[data-dl]');
  if (a) { const k = a.dataset.add; s.data[k].push(clone(NEW[k])); renderList(k); queue(); $(k).lastElementChild?.querySelector('input,textarea')?.focus(); }
  if (r) { s.data[r.dataset.rm].splice(+r.dataset.i, 1); renderList(r.dataset.rm); queue(); }
  if (d) download();
});
$('nophoto').addEventListener('change', e => { s.noPhoto[rule().id] = e.target.checked; queue(); });
$('german').addEventListener('change', e => { s.german = e.target.checked; queue(); });
$('clearall').addEventListener('click', () => { if (confirm('Clear everything you\'ve typed on this device?')) { s.data = BLANK(); s.photo = null; fillForm(); refresh(); } });

// Photo: cropped to passport shape and kept on this device
$('pickphoto').addEventListener('click', () => $('photofile').click());
$('rmphoto').addEventListener('click', () => { s.photo = null; refresh(); });
$('photofile').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    const bmp = await createImageBitmap(file);
    const W = 400, H = 500, c = document.createElement('canvas'); c.width = W; c.height = H;
    const sc = Math.max(W / bmp.width, H / bmp.height), sw = W / sc, sh = H / sc;
    c.getContext('2d').drawImage(bmp, (bmp.width - sw) / 2, Math.max(0, (bmp.height - sh) * 0.3), sw, sh, 0, 0, W, H);
    s.photo = c.toDataURL('image/jpeg', 0.86); refresh();
  } catch { toast('That file couldn\'t be read as a photo. Try a JPG or PNG.'); }
});
const photoObj = () => { if (!s.photo) return null; const b = atob(s.photo.split(',')[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return { w: 400, h: 500, bytes: a }; };

// Preview
const FONT = { 'Helvetica': ['Arimo,Arial,Helvetica,sans-serif', 400], 'Helvetica-Bold': ['Arimo,Arial,Helvetica,sans-serif', 700], 'Times-Roman': ["Tinos,'Times New Roman',Times,serif", 400], 'Times-Bold': ["Tinos,'Times New Roman',Times,serif", 700] };
function svgPage(ops, res) {
  const b = ops.map(o => {
    if (o.k === 't') return `<text x="${o.x.toFixed(2)}" y="${o.y.toFixed(2)}" font-family="${FONT[o.f][0]}" font-weight="${FONT[o.f][1]}" font-size="${o.sz}" fill="${o.col}" xml:space="preserve">${esc(o.s)}</text>`;
    if (o.k === 'l') return `<line x1="${o.x1}" y1="${o.y1.toFixed(2)}" x2="${o.x2}" y2="${o.y2.toFixed(2)}" stroke="${o.col}" stroke-width="${o.w}"/>`;
    if (o.k === 'i') return `<image href="${s.photo}" x="${o.x}" y="${o.y.toFixed(2)}" width="${o.w}" height="${o.h}" preserveAspectRatio="xMidYMid slice"/>`;
    if (o.k === 'p') { const cx = o.x + o.w / 2, y = o.y; return `<rect x="${o.x}" y="${y}" width="${o.w}" height="${o.h}" fill="#DCE5F2"/><circle cx="${cx}" cy="${y + 38}" r="19" fill="#9FB1CF"/><path d="M${o.x + 10} ${y + o.h}c0-28 14-42 ${o.w / 2 - 10}-42s${o.w / 2 - 10} 14 ${o.w / 2 - 10} 42z" fill="#9FB1CF"/>`; }
    return '';
  }).join('');
  return `<svg class="sheet" viewBox="0 0 ${res.W} ${res.H}" style="width:${(res.W / 612 * 100).toFixed(2)}%" role="img" aria-label="Resume page preview">${b}</svg>`;
}
function stampSvg(res, r) {
  const fit = !res.over, col = fit ? '#11205C' : '#C92A22', big = fit ? 'FITS' : 'OVER';
  const line = `${res.count} PAGE${res.count > 1 ? 'S' : ''} · ${r.paper === 'Letter' ? 'LETTER' : 'A4'}`;
  const around = `${r.name.toUpperCase()} · EXACT RESUME · `;
  return `<svg class="stamp thud" viewBox="0 0 150 150" aria-hidden="true"><defs><path id="ring" d="M75 75m-55 0a55 55 0 1 1 110 0a55 55 0 1 1-110 0"/></defs><g fill="none" stroke="${col}"><circle cx="75" cy="75" r="71" stroke-width="3.5"/><circle cx="75" cy="75" r="46" stroke-width="2"/></g><text fill="${col}" font-family="'DM Mono',monospace" font-weight="500" font-size="11.5" textLength="338" lengthAdjust="spacing"><textPath href="#ring">${esc(around)}</textPath></text><text x="75" y="77" text-anchor="middle" fill="${col}" font-family="Archivo,Arial,sans-serif" font-weight="800" font-size="29" style="font-stretch:125%" letter-spacing="-.5">${big}</text><text x="75" y="92" text-anchor="middle" fill="${col}" font-family="'DM Mono',monospace" font-weight="500" font-size="8">${line}</text></svg>`;
}
let lastThud = '';
function renderPreview() {
  const r = rule(), sample = isEmpty();
  const res = layout(sample ? SAMPLE : s.data, r, { font: s.font, german: s.german, noPhoto: !!s.noPhoto[r.id], photo: s.photo, placeholder: sample });
  $('papers').innerHTML = res.pages.map((p, i) => `<div class="sheetwrap">${svgPage(p, res)}${i === 0 ? stampSvg(res, r) : ''}</div>`).join('');
  const key = `${r.id}${s.gov}${res.count}`;
  if (key === lastThud) $('papers').querySelector('.stamp')?.classList.remove('thud');
  lastThud = key;
  $('samplebar').hidden = !sample;
  const size = r.paper === 'Letter' ? 'US Letter · 216 × 279 mm' : 'A4 · 210 × 297 mm';
  $('dims').textContent = `${size} · ${res.count} page${res.count > 1 ? 's' : ''}`;
  $('barmeta').textContent = `${r.name} · ${r.paper === 'Letter' ? 'Letter' : 'A4'} · ${res.count} page${res.count > 1 ? 's' : ''}${res.over ? ' (over)' : ''}`;
  const warns = [];
  if (res.over) warns.push(`This runs to ${res.count} pages, and the usual length for ${r.name} is ${r.len.toLowerCase()}. Cut older jobs or shorten your points.`);
  if (res.dropped.length) warns.push(`These characters can't go in the PDF, so they were left out: ${res.dropped.slice(0, 8).join(' ')}. Write them in English letters.`);
  if (!sample && r.photo === 'on' && !s.photo && !s.noPhoto[r.id]) warns.push(`A photo is common in ${r.name}. Add one under "${r.name} also asks for", or send it without if the ad says so.`);
  const backwards = [...s.data.exp, ...s.data.edu].find(e => !sample && e.from && e.to && !e.now && e.to < e.from);
  if (backwards) warns.push(`One of your entries ends before it starts (${backwards.from} to ${backwards.to}). Check the dates.`);
  $('warns').innerHTML = warns.map(w => `<p class="warn">${esc(w)}</p>`).join('');
  document.querySelectorAll('[data-dl]').forEach(b => { b.disabled = !s.data.name.trim(); b.title = b.disabled ? 'Add your name to download' : ''; b.textContent = b.disabled ? 'Add your name first' : 'Download PDF'; });
  return res;
}

function refresh(changedCountry) {
  document.querySelectorAll('#rail input').forEach(i => { i.checked = i.value === s.country; });
  const india = s.country === 'IN'; $('modes').hidden = !india;
  document.querySelectorAll('[data-gov]').forEach(b => b.setAttribute('aria-pressed', (b.dataset.gov === '1') === !!s.gov));
  document.querySelectorAll('[data-font]').forEach(b => b.setAttribute('aria-pressed', b.dataset.font === s.font));
  renderExpects(); renderAsks(); renderPreview(); save();
  if (changedCountry && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) document.querySelectorAll('.sheet').forEach(el => el.animate([{ opacity: .35, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' }));
}
let timer; function queue() { clearTimeout(timer); timer = setTimeout(() => { renderPreview(); save(); }, 90); }
function fillForm() { document.querySelectorAll('[data-f]').forEach(el => { el.value = s.data[el.dataset.f] || ''; }); LISTS.forEach(renderList); }
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.role = 'status'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 3200); }

function download() {
  const r = rule(); if (!s.data.name.trim()) return;
  const res = layout(s.data, r, { font: s.font, german: s.german, noPhoto: !!s.noPhoto[r.id], photo: s.photo });
  const label = s.german && r.german ? 'Lebenslauf' : r.doc.replace('-', '');
  const pdf = toPdf(res, { photo: photoObj(), title: `${s.data.name} ${label}` });
  const name = `${clean(s.data.name).trim().replace(/[^A-Za-z0-9À-ÿ]+/g, '_')}_${label}.pdf`;
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  toast(`Downloaded ${name}`);
}

if (/Instagram|FBAN|FBAV/.test(navigator.userAgent)) $('inapp').hidden = false;
if (params.get('view')) document.body.dataset.view = params.get('view');
fillForm(); refresh(); setView(document.body.dataset.view);
if (document.fonts) document.fonts.ready.then(renderPreview);
