// Turns resume data and a country's rules into positioned text, then into a PDF with real, selectable text.
// The page preview draws the same positions, so what you see is what downloads.
import { WIDTHS } from './metrics.js';

const dec = new TextDecoder('windows-1252');
const BYTE = new Map();
for (let b = 32; b < 256; b++) { if (b === 127 || b === 173) continue; const c = dec.decode(new Uint8Array([b])); if (!BYTE.has(c)) BYTE.set(c, b); }
const SWAP = { '₹': 'Rs ', '→': '->', '←': '<-', '‑': '-', '‐': '-', '−': '-', '●': '•', '▪': '•', '◦': '•', '✓': '', '✔': '', '\t': ' ', '​': '', '‍': '', '️': '' };

export function clean(s, dropped) {
  let out = '';
  for (const c of String(s ?? '').normalize('NFC').replace(/\s*\n\s*/g, ' ')) {
    if (BYTE.has(c)) out += c;
    else if (c in SWAP) out += SWAP[c];
    else {
      const base = c.normalize('NFD').replace(/\p{M}/gu, '');
      if (base && [...base].every(x => BYTE.has(x))) out += base;
      else if (dropped) dropped.add(c);
    }
  }
  return out;
}
const width = (s, f, sz) => { let w = 0; for (const c of s) w += WIDTHS[f][BYTE.get(c) ?? 32]; return w * sz / 1000; };

function wrap(s, f, sz, max) {
  const lines = []; let cur = '';
  for (let word of s.split(' ').filter(Boolean)) {
    while (width(word, f, sz) > max) {                                   // a very long link or word
      let n = word.length; while (n > 1 && width(word.slice(0, n), f, sz) > max) n--;
      if (cur) { lines.push(cur); cur = ''; }
      lines.push(word.slice(0, n)); word = word.slice(n);
    }
    const t = cur ? cur + ' ' + word : word;
    if (width(t, f, sz) <= max) cur = t; else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtMonth = (v, style) => { if (!v) return ''; if (!/^\d{4}-\d{2}$/.test(v)) return v; const [y, m] = v.split('-'); return style === 'num' ? `${m}/${y}` : `${MON[+m - 1]} ${y}`; };
const fmtDob = (v, style) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return v || ''; const [y, m, d] = v.split('-'); return style === 'num' ? `${d}.${m}.${y}` : `${+d} ${MONTH[+m - 1]} ${y}`; };
export const sampleDate = style => (style === 'num' ? '06/2024' : 'Jun 2024');

const WORDS = {
  en: { Experience: 'Experience', Education: 'Education', Projects: 'Projects', Skills: 'Skills', Certifications: 'Certifications', Languages: 'Languages', Referees: 'Referees', Personal: 'Personal details', Present: 'Present', Declaration: 'Declaration', Born: 'Date of birth', Nationality: 'Nationality', Visa: 'Visa status', Licence: 'Driving licence', Permit: 'Work permit', Summary: 'Summary', Profile: 'Profile', Title: '' },
  de: { Experience: 'Berufserfahrung', Education: 'Ausbildung', Projects: 'Projekte', Skills: 'Kenntnisse', Certifications: 'Zertifikate', Languages: 'Sprachen', Referees: 'Referenzen', Personal: 'Persönliche Daten', Present: 'heute', Declaration: 'Erklärung', Born: 'Geburtsdatum', Nationality: 'Staatsangehörigkeit', Visa: 'Aufenthaltsstatus', Licence: 'Führerschein', Permit: 'Arbeitsbewilligung', Summary: 'Profil', Profile: 'Profil', Title: 'Lebenslauf' },
};
const INK = '#111111', SOFT = '#444444', RULE = '#999999';
const sortKey = e => (e.now ? '9999-99' : e.to || e.from || '0000');
const newestFirst = list => [...list].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
const has = o => Object.values(o).some(v => (typeof v === 'string' ? v.trim() : false));
const pointsOf = t => String(t || '').split('\n').map(x => x.replace(/^\s*[-–—•*·]\s*/, '').trim()).filter(Boolean);

function build(d, r, opt, size, M, W, dropped) {
  const wantsPhoto = r.photo !== 'off' && !opt.noPhoto && (opt.photo || opt.placeholder);
  if (r.layout === 'centre' && wantsPhoto) r = { ...r, layout: 'photo' };
  const FR = opt.font === 'serif' ? 'Times-Roman' : 'Helvetica', FB = opt.font === 'serif' ? 'Times-Bold' : 'Helvetica-Bold';
  const L = WORDS[opt.german && r.german ? 'de' : 'en'];
  const c = s => clean(s, dropped);
  const lh = size * 1.3, gap = size * 0.42;
  const x0 = M, x1 = W - M, cw = x1 - x0;
  const blocks = [];
  const T = (x, y, s, f, sz, col = INK, anchor = 'l') => ({ k: 't', x: anchor === 'r' ? x - width(s, f, sz) : anchor === 'c' ? x - width(s, f, sz) / 2 : x, y, s, f, sz, col });
  const add = (h, ops, keep = false) => blocks.push({ h, ops, keep });

  const heading = t => {
    const s = c(r.layout === 'centre' ? t.toUpperCase() : t), sz = r.layout === 'centre' ? size : size + 1.5, top = size * 1.15;
    add(top + sz + 5.5, [T(x0, top + sz * 0.8, s, FB, sz), { k: 'l', x1: x0, y1: top + sz + 2.6, x2: x1, y2: top + sz + 2.6, w: 0.6, col: RULE }], true);
  };
  const para = (text, x, max, f = FR, sz = size, col = INK, after = 0) => {
    const ls = wrap(c(text), f, sz, max);
    ls.forEach((s, i) => add(lh + (i === ls.length - 1 ? after : 0), [T(x, sz * 0.95, s, f, sz, col)]));
  };
  const bullets = (text, x, max) => pointsOf(text).forEach(p => {
    const ls = wrap(c(p), FR, size, max - size * 0.95);
    ls.forEach((s, i) => add(lh + (i === ls.length - 1 ? 1 : 0), [...(i ? [] : [T(x, size * 0.95, '•', FR, size)]), T(x + size * 0.95, size * 0.95, s, FR, size)], i === 0 && ls.length > 1));
  });

  // Top of the page
  const contact = [d.email, d.phone, d.city].concat(String(d.links || '').split(/[\n,]+/)).map(s => c(String(s || '').trim())).filter(Boolean);
  const showPhoto = wantsPhoto;
  const name = c(d.name), title = c(d.title);
  if (r.layout === 'centre') {
    const ops = []; let y = size * 1.9 + 1;
    const nameSz = size * 2.05;
    wrap(name, FB, nameSz, cw).forEach((s, i) => { if (i) y += nameSz * 1.08; ops.push(T(W / 2, y, s, FB, nameSz, INK, 'c')); }); y += size * 0.6;
    wrap(title, FR, size + 0.75, cw).forEach(s => { y += lh; ops.push(T(W / 2, y, s, FR, size + 0.75, SOFT, 'c')); });
    const lines = wrap(contact.join('  |  '), FR, size - 0.25, cw);
    lines.forEach(s => { y += lh * 0.98; ops.push(T(W / 2, y, s, FR, size - 0.25, INK, 'c')); });
    const extra = [];
    if (r.nationality && d.nationality) extra.push(c(d.nationality));
    if (r.visa && d.visa) extra.push(c(d.visa));
    wrap(extra.join('  |  '), FR, size - 0.25, cw).forEach(s => { y += lh * 0.98; ops.push(T(W / 2, y, s, FR, size - 0.25, INK, 'c')); });
    add(y + 2, ops);
  } else {
    const pw = 82, ph = 103;
    const tw = showPhoto ? cw - pw - 16 : cw;
    const ops = []; let y = 0;
    if (L.Title && r.layout === 'table') { y += size; ops.push(T(x0, y, c(L.Title), FR, size, SOFT)); y += 4; }
    const nameSz = size * 2.15; y += nameSz * 0.95;
    wrap(name, FB, nameSz, tw).forEach((s, i) => { if (i) y += nameSz * 1.08; ops.push(T(x0, y, s, FB, nameSz)); });
    y += size * 0.45;
    wrap(title, FR, size + 0.75, tw).forEach(s => { y += lh; ops.push(T(x0, y, s, FR, size + 0.75, SOFT)); });
    y += 3;
    contact.forEach(s => wrap(s, FR, size - 0.25, tw).forEach(p => { y += lh * 0.96; ops.push(T(x0, y, p, FR, size - 0.25)); }));
    if (showPhoto) ops.push(opt.photo ? { k: 'i', x: x1 - pw, y: 0, w: pw, h: ph } : { k: 'p', x: x1 - pw, y: 0, w: pw, h: ph });
    add(Math.max(y + 3, showPhoto ? ph + 3 : 0), ops);
  }

  // Personal details, for countries that expect them
  const facts = [];
  if (r.layout !== 'centre') {
    if (r.dob && d.dob) facts.push([L.Born, fmtDob(d.dob, r.dates)]);
    if (r.nationality && d.nationality) facts.push([L.Nationality, d.nationality]);
    if (r.visa && d.visa) facts.push([r.id === 'CH' ? L.Permit : L.Visa, d.visa]);
    if (r.licence && d.licence) facts.push([L.Licence, d.licence]);
  }
  const DC = r.layout === 'table' ? 100 : 0;                               // date column on German-style CVs
  if (facts.length) {
    heading(L.Personal);
    const kw = 112;
    facts.forEach(([k, v]) => wrap(c(v), FR, size, cw - kw).forEach((s, i) => add(lh, [...(i ? [] : [T(x0, size * 0.95, c(k), FB, size)]), T(x0 + kw, size * 0.95, s, FR, size)])));
  }
  if (d.summary && d.summary.trim()) { heading(r.summary === 'Summary' ? L.Summary : L.Profile); para(d.summary, x0, cw); }

  const range = e => { const a = fmtMonth(e.from, r.dates), b = e.now ? L.Present : fmtMonth(e.to, r.dates); return c(a && b ? `${a} – ${b}` : a || b); };
  const entry = (head, sub, when, points) => {
    const x = x0 + DC, max = cw - DC, dw = when && !DC ? width(when, FR, size) + 10 : 0;
    const hs = wrap(c(head), FB, size + 0.25, max - dw), subs = wrap(c(sub), FR, size, max);
    const h0 = size * 0.5, ops = []; let y = h0;
    y += size * 0.95;
    hs.forEach((s, i) => { if (i) y += lh; ops.push(T(x, y, s, FB, size + 0.25)); });
    if (when) ops.push(DC ? T(x0, h0 + size * 0.95, when, FR, size) : T(x1, h0 + size * 0.95, when, FR, size, INK, 'r'));
    subs.forEach(s => { y += lh; ops.push(T(x, y, s, FR, size, SOFT)); });
    add(y + 2.5, ops, pointsOf(points).length > 0);
    bullets(points, x, max);
  };

  const exp = newestFirst((d.exp || []).filter(has)), edu = newestFirst((d.edu || []).filter(has)), proj = (d.projects || []).filter(has);
  const secExp = () => { if (exp.length) { heading(L.Experience); exp.forEach(e => entry(e.role || e.org, e.role ? [e.org, e.place].filter(Boolean).join(', ') : e.place, range(e), e.points)); } };
  const secEdu = () => { if (edu.length) { heading(L.Education); edu.forEach(e => entry(e.degree || e.org, [e.degree ? e.org : '', e.place, e.score].filter(Boolean).join(', '), range(e), '')); } };
  const secProj = () => { if (proj.length) { heading(L.Projects); proj.forEach(e => entry(e.name, e.link, '', e.points)); } };
  if (exp.length) { secExp(); secProj(); secEdu(); } else { secEdu(); secProj(); }   // no work history yet: lead with education

  const lines = (label, text) => { const ls = String(text || '').split('\n').map(s => s.trim()).filter(Boolean); if (ls.length) { heading(label); ls.forEach(s => para(s, x0, cw)); } };
  lines(L.Skills, d.skills); lines(L.Certifications, d.certs); lines(L.Languages, d.langs);

  if (r.referees) {
    const refs = (d.referees || []).filter(has);
    if (refs.length) { heading(L.Referees); refs.forEach(p => { para(p.name, x0, cw, FB); para([p.role, p.contact].filter(Boolean).join(', '), x0, cw, FR, size, SOFT, 3); }); }
  }

  // Sign-off, for countries that expect one
  const now = new Date(), dd = String(now.getDate()).padStart(2, '0'), mm = String(now.getMonth() + 1).padStart(2, '0');
  const place = c(String(d.city || '').split(',')[0].trim());
  if (r.declaration) {
    heading(L.Declaration);
    para('I declare that the information given above is true to the best of my knowledge.', x0, cw, FR, size, INK, 4);
    const ns = wrap(name, FB, size, cw * 0.45);
    add(size + Math.max(2, ns.length) * lh + 6, [...wrap(`Place: ${place}`, FR, size, cw * 0.48).slice(0, 1).map(s => T(x0, size, s, FR, size)), T(x0, size + lh, `Date: ${dd}/${mm}/${now.getFullYear()}`, FR, size), ...ns.map((s, i) => T(x1, size + lh + i * lh, s, FB, size, INK, 'r')), { k: 'l', x1: x1 - 130, y1: size - 2, x2: x1, y2: size - 2, w: 0.5, col: RULE }]);
  } else if (r.sign) {
    const ns = wrap(name, FR, size, cw * 0.45);
    add(size * 3.2 + ns.length * lh + 4, [...wrap(`${place ? place + ', ' : ''}${dd}.${mm}.${now.getFullYear()}`, FR, size, cw * 0.48).slice(0, 2).map((s, i) => T(x0, size * 3.2 + i * lh, s, FR, size)), { k: 'l', x1: x1 - 150, y1: size * 2, x2: x1, y2: size * 2, w: 0.5, col: RULE }, ...ns.map((s, i) => T(x1, size * 3.2 + i * lh, s, FR, size, INK, 'r'))]);
  }
  return blocks;
}

function paginate(blocks, W, H, M) {
  const pages = [[]], top = M * 0.86, bottom = H - M * 0.86 - 10;
  let y = top;
  blocks.forEach((b, i) => {
    let need = b.h, j = i;
    while (blocks[j].keep && blocks[j + 1]) { j++; need += blocks[j].h; }
    if (y + need > bottom && y > top) { pages.push([]); y = top; }
    for (const op of b.ops) pages[pages.length - 1].push(op.k === 'l' ? { ...op, y1: op.y1 + y, y2: op.y2 + y } : { ...op, y: op.y + y });
    y += b.h;
  });
  return pages;
}

export function layout(d, r, opt = {}) {
  const [W, H] = r.paper === 'Letter' ? [612, 792] : [595.28, 841.89];
  const dropped = new Set();
  let best = null;
  for (const size of [10.5, 10.25, 10, 9.75, 9.5, 9.25]) {
    const M = size >= 10 ? 50 : 44;
    const pages = paginate(build(d, r, opt, size, M, W, dropped), W, H, M);
    if (!best || pages.length < best.pages.length) best = { pages, size, M };
    if (pages.length <= r.pages) break;
  }
  const n = best.pages.length, who = clean(d.name);
  if (n > 1) best.pages.forEach((p, i) => { const s = `${who}, page ${i + 1} of ${n}`; p.push({ k: 't', x: W - best.M - width(s, 'Helvetica', 7.5), y: H - best.M * 0.55, s, f: 'Helvetica', sz: 7.5, col: '#777777' }); });
  return { pages: best.pages, W, H, size: best.size, count: n, over: n > r.pages, dropped: [...dropped] };
}

// PDF output
const hex = s => { let h = ''; for (const c of s) h += (BYTE.get(c) ?? 32).toString(16).padStart(2, '0'); return `<${h}>`; };
const rgb = c => [1, 3, 5].map(i => (parseInt(c.slice(i, i + 2), 16) / 255).toFixed(3)).join(' ');
const num = n => (Math.round(n * 100) / 100).toString();

export function toPdf(res, { photo, title = '' } = {}) {
  const enc = s => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
  const fonts = [...new Set(res.pages.flat().filter(o => o.k === 't').map(o => o.f))];
  const fontRef = f => `F${fonts.indexOf(f) + 1}`;
  const objs = [];                                                       // each entry: array of byte chunks
  const add = (...chunks) => { objs.push(chunks.map(c => (typeof c === 'string' ? enc(c) : c))); return objs.length; };
  add('');                                                               // 1 catalog, filled below
  add('');                                                               // 2 page tree, filled below
  const fontIds = fonts.map(f => add(`<< /Type /Font /Subtype /Type1 /BaseFont /${f} /Encoding /WinAnsiEncoding >>`));
  const usesImg = photo && res.pages.flat().some(o => o.k === 'i');
  const imgId = usesImg ? add(`<< /Type /XObject /Subtype /Image /Width ${photo.w} /Height ${photo.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${photo.bytes.length} >>\nstream\n`, photo.bytes, '\nendstream') : 0;
  const res0 = `<< /Font << ${fonts.map((f, i) => `/F${i + 1} ${fontIds[i]} 0 R`).join(' ')} >>${imgId ? ` /XObject << /Im1 ${imgId} 0 R >>` : ''} >>`;
  const kids = [];
  for (const ops of res.pages) {
    let s = '';
    for (const o of ops) {
      if (o.k === 't') s += `BT /${fontRef(o.f)} ${num(o.sz)} Tf ${rgb(o.col)} rg 1 0 0 1 ${num(o.x)} ${num(res.H - o.y)} Tm ${hex(o.s)} Tj ET\n`;
      else if (o.k === 'l') s += `${num(o.w)} w ${rgb(o.col)} RG ${num(o.x1)} ${num(res.H - o.y1)} m ${num(o.x2)} ${num(res.H - o.y2)} l S\n`;
      else if (o.k === 'i' && imgId) s += `q ${num(o.w)} 0 0 ${num(o.h)} ${num(o.x)} ${num(res.H - o.y - o.h)} cm /Im1 Do Q\n`;
    }
    const cid = add(`<< /Length ${s.length} >>\nstream\n${s}endstream`);
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(res.W)} ${num(res.H)}] /Resources ${res0} /Contents ${cid} 0 R >>`));
  }
  const info = add(`<< /Title ${hex(clean(title))} /Creator ${hex('Resume Passport')} >>`);
  objs[0] = [enc('<< /Type /Catalog /Pages 2 0 R >>')];
  objs[1] = [enc(`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] >>`)];
  const parts = [enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')]; let off = parts[0].length; const xref = [];
  objs.forEach((chunks, i) => {
    xref.push(off);
    for (const p of [enc(`${i + 1} 0 obj\n`), ...chunks, enc('\nendobj\n')]) { parts.push(p); off += p.length; }
  });
  let tail = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  xref.forEach(o => { tail += `${String(o).padStart(10, '0')} 00000 n \n`; });
  tail += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${off}\n%%EOF\n`;
  parts.push(enc(tail));
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
