type Preferences = { theme: 'auto' | 'light' | 'dark'; font: 'amiri' | 'system'; size: number };
type Entry = { path: string; title: string; updated: number; progress: number; block: number; offset: number; read: boolean; note: string };
type Library = Record<string, Entry>;
const KEY = 'helghareeb-reader-v1';
const PREFS = 'helghareeb-reader-preferences-v1';
const defaults: Preferences = { theme: 'auto', font: 'amiri', size: 100 };
const bounded = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
function safePath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.length > 1000) return null;
  try { const url = new URL(value, location.origin); return url.origin === location.origin && !url.search && !url.hash ? url.pathname : null; } catch { return null; }
}
function validateLibrary(value: unknown): Library {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid library');
  const result: Library = Object.create(null);
  const entries = Object.values(value);
  if (entries.length > 5000) throw new Error('Too many records');
  for (const row of entries) {
    if (!row || typeof row !== 'object') throw new Error('Invalid record');
    const r = row as Entry; const path = safePath(r.path);
    if (!path || typeof r.title !== 'string' || typeof r.note !== 'string' || r.note.length > 12000 || typeof r.read !== 'boolean' || typeof r.updated !== 'number' || !Number.isFinite(r.updated)) throw new Error('Invalid record');
    result[path] = { path, title: r.title.slice(0, 300), note: r.note, read: r.read, updated: bounded(r.updated, 0, Date.now()), progress: bounded(r.progress, 0, 1), block: Math.floor(bounded(r.block, 0, 10000)), offset: bounded(r.offset, -2000, 2000) };
  }
  return result;
}
export function initializeReader() {
  const dialog = document.querySelector<HTMLDialogElement>('#reader-dialog');
  if (!dialog) return;
  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const ar = document.documentElement.lang === 'ar';
  const say = (a: string, e: string) => ar ? a : e;
  const status = el<HTMLElement>('reader-status');
  const note = el<HTMLTextAreaElement>('reader-note');
  const root = document.querySelector<HTMLElement>('[data-reading-root]');
  const currentPath = location.pathname;
  let engaged = false;
  let library: Library = Object.create(null), prefs = { ...defaults }, writable = true;
  try {
    const raw = localStorage.getItem(KEY); if (raw) library = validateLibrary(JSON.parse(raw));
    const saved = JSON.parse(localStorage.getItem(PREFS) || '{}');
    prefs = { theme: ['auto', 'light', 'dark'].includes(saved.theme) ? saved.theme : 'auto', font: saved.font === 'system' ? 'system' : 'amiri', size: bounded(saved.size ?? 100, 85, 150) };
  } catch { writable = false; status.textContent = say('التخزين غير متاح أو السجل غير قابل للقراءة. لم يُستبدل السجل السابق. يمكنك استخدام الإعدادات مؤقتًا وتصدير هذه الجلسة.', 'Storage is unavailable or unreadable. Existing data has not been overwritten. Preferences still work for this session; you can export it.'); }
  function persist() {
    if (!writable) return false;
    try { localStorage.setItem(KEY, JSON.stringify(library)); return true; }
    catch { status.textContent = say('تعذر الحفظ على الجهاز. صدّر نسخة من ملاحظاتك قبل إغلاق الصفحة.', 'Could not save on this device. Export your notes before closing the page.'); return false; }
  }
  function applyPreferences() {
    const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.readerTheme = dark ? 'dark' : 'light';
    document.documentElement.dataset.readerFont = prefs.font;
    document.documentElement.style.setProperty('--reader-scale', String(prefs.size / 100));
    el<HTMLOutputElement>('reader-size-value').value = `${prefs.size}%`;
  }
  const theme = el<HTMLSelectElement>('reader-theme'), font = el<HTMLSelectElement>('reader-font'), size = el<HTMLInputElement>('reader-size');
  function syncPreferences() { theme.value = prefs.theme; font.value = prefs.font; size.value = String(prefs.size); applyPreferences(); }
  function storePreferences() { applyPreferences(); try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch { status.textContent = say('إعدادات هذه الجلسة فقط؛ تعذر حفظها على الجهاز.', 'Preferences apply to this session only; device storage is unavailable.'); } }
  theme.addEventListener('change', () => { prefs.theme = theme.value as Preferences['theme']; storePreferences(); });
  font.addEventListener('change', () => { prefs.font = font.value as Preferences['font']; storePreferences(); });
  size.addEventListener('input', () => { prefs.size = Number(size.value); storePreferences(); });
  el('reader-reset').addEventListener('click', () => { prefs = { ...defaults }; syncPreferences(); storePreferences(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyPreferences);
  syncPreferences();
  function blank(path = currentPath, title = document.querySelector('h1')?.textContent || document.title): Entry { return { path, title: title.trim().slice(0, 300), updated: Date.now(), progress: 0, block: 0, offset: 0, read: false, note: '' }; }
  // A saved position is stable relative to content blocks, rather than a device-specific pixel scroll.
  function blocks(): HTMLElement[] {
    if (!root) return [];
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.hadith-card'));
    return cards.length > 1 ? cards : Array.from(root.querySelectorAll<HTMLElement>('h2,h3,p'));
  }
  function savePosition() {
    if (!root || dialog.open || !engaged) return;
    const row = library[currentPath] || blank();
    const list = blocks(); let index = 0;
    list.forEach((p, i) => { if (p.getBoundingClientRect().top <= 160) index = i; });
    row.block = index; row.offset = list[index] ? list[index].getBoundingClientRect().top - 160 : 0;
    const rect = root.getBoundingClientRect();
    row.progress = bounded((160 - rect.top) / Math.max(1, rect.height - innerHeight + 160), 0, 1);
    row.updated = Date.now(); library[currentPath] = row; persist();
  }
  function restore() {
    const row = library[currentPath]; if (!row || !root) return;
    dialog.close();
    const block = blocks()[row.block];
    const y = block ? scrollY + block.getBoundingClientRect().top - 160 - row.offset : scrollY + root.getBoundingClientRect().top + row.progress * Math.max(1, root.offsetHeight - innerHeight + 160) - 160;
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  }
  const readButton = el<HTMLButtonElement>('reader-read');
  function refreshCurrent() {
    const row = library[currentPath];
    readButton.setAttribute('aria-pressed', String(!!row?.read));
    readButton.textContent = row?.read ? say('مقروء ✓ — إلغاء العلامة', 'Read ✓ — mark unread') : say('تمت القراءة', 'Mark as read');
    el('reader-progress').textContent = say('موضع التوقف: ', 'Saved position: ') + `${Math.round((row?.progress || 0) * 100)}%`;
    el<HTMLButtonElement>('reader-restore').disabled = !row;
  }
  readButton.addEventListener('click', () => { const row = library[currentPath] || blank(); row.read = !row.read; row.updated = Date.now(); library[currentPath] = row; persist(); refreshCurrent(); renderHistory(); updateCards(); });
  note.addEventListener('input', () => { const row = library[currentPath] || blank(); row.note = note.value; row.updated = Date.now(); library[currentPath] = row; const saved = persist(); if (saved) status.textContent = say('حُفظت الملاحظة على جهازك.', 'Note saved on your device.'); });
  el('reader-restore').addEventListener('click', restore);
  const history = el<HTMLUListElement>('reader-history'), filter = el<HTMLSelectElement>('reader-filter');
  function renderHistory() {
    history.replaceChildren();
    const rows = Object.values(library).filter(r => filter.value === 'all' || (filter.value === 'read' && r.read) || (filter.value === 'unfinished' && !r.read) || (filter.value === 'notes' && !!r.note)).sort((a, b) => b.updated - a.updated);
    if (!rows.length) { const li = document.createElement('li'); li.textContent = say('لم تُحفظ صفحات هنا بعد.', 'No saved pages here yet.'); history.append(li); }
    for (const r of rows) {
      const li = document.createElement('li'), link = document.createElement('a'), detail = document.createElement('small'), remove = document.createElement('button');
      link.href = r.path + '#reader-resume'; link.textContent = r.title;
      detail.textContent = `${r.read ? say('مقروء ✓', 'Read ✓') : say('قيد القراءة', 'In progress')} · ${Math.round(r.progress * 100)}%${r.note ? say(' · ملاحظة محفوظة', ' · Has notes') : ''}`;
      remove.type = 'button'; remove.textContent = say('حذف', 'Remove'); remove.setAttribute('aria-label', say('حذف سجل ', 'Remove record for ') + r.title);
      remove.addEventListener('click', () => { if (!confirm(say('حذف سجل هذه الصفحة وملاحظتها من هذا الجهاز؟', 'Remove this page’s record and note from this device?'))) return; delete library[r.path]; persist(); if (r.path === currentPath) { note.value = ''; engaged = false; } renderHistory(); refreshCurrent(); updateCards(); refreshLast(); });
      li.append(link, detail, remove); history.append(li);
    }
  }
  filter.addEventListener('change', renderHistory);
  const last = el<HTMLAnchorElement>('reader-last');
  function refreshLast() {
    const row = Object.values(library).filter(r => !r.read && r.path !== currentPath).sort((a, b) => b.updated - a.updated)[0];
    last.hidden = !row; if (row) { last.href = row.path + '#reader-resume'; last.title = row.title; }
  }
  function updateCards() {
    document.querySelectorAll<HTMLButtonElement>('[data-reading-path]').forEach(button => {
      const path = safePath(button.dataset.readingPath); if (!path) return;
      const read = !!library[path]?.read; button.setAttribute('aria-pressed', String(read));
      button.textContent = read ? say('مقروء ✓', 'Read ✓') : say('تمت القراءة', 'Mark as read');
    });
  }
  document.querySelectorAll<HTMLButtonElement>('[data-reading-path]').forEach(button => {
    button.addEventListener('click', () => { const path = safePath(button.dataset.readingPath); if (!path) return; const row = library[path] || blank(path, button.dataset.readingTitle || path); row.read = !row.read; row.updated = Date.now(); library[path] = row; persist(); updateCards(); refreshCurrent(); });
  });
  updateCards(); refreshLast();
  el('reader-open').addEventListener('click', () => { savePosition(); el('reader-current').hidden = !root; note.value = library[currentPath]?.note || ''; refreshCurrent(); renderHistory(); dialog.showModal(); });
  el('reader-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', refreshLast);
  let timer: ReturnType<typeof setTimeout>;
  addEventListener('scroll', () => { engaged = true; clearTimeout(timer); timer = setTimeout(savePosition, 700); }, { passive: true });
  addEventListener('pagehide', savePosition);
  document.addEventListener('visibilitychange', () => { if (document.hidden) savePosition(); });
  // Other tabs share the same origin; merge on storage events so unrelated page notes are retained.
  addEventListener('storage', event => {
    if (event.key === KEY && event.newValue) {
      try { library = validateLibrary(JSON.parse(event.newValue)); updateCards(); refreshLast(); if (!dialog.open) refreshCurrent(); } catch { /* Keep the last readable state. */ }
    }
  });
  el('reader-export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'helghareeb-reader', version: 1, preferences: prefs, entries: library }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `reading-notes-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  el<HTMLInputElement>('reader-import').addEventListener('change', async event => {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error('File too large');
      const data = JSON.parse(await file.text());
      if (data.format !== 'helghareeb-reader' || data.version !== 1) throw new Error('Invalid format');
      const incoming = validateLibrary(data.entries);
      if (!writable) throw new Error('Storage unavailable');
      const merged = { ...library };
      for (const [key, value] of Object.entries(incoming)) if (!merged[key] || value.updated > merged[key].updated) merged[key] = value;
      // Commit only after storage succeeds; failed imports never replace the in-memory library.
      localStorage.setItem(KEY, JSON.stringify(merged)); library = merged;
      note.value = library[currentPath]?.note || ''; renderHistory(); refreshCurrent(); refreshLast(); updateCards();
      status.textContent = say('تم دمج النسخة المحفوظة.', 'Saved copy merged.');
    } catch { status.textContent = say('تعذر الاستيراد: تحقق من الملف ومساحة التخزين. لم يُستبدل سجلك.', 'Import failed: check the file and available storage. Your history was not replaced.'); }
    input.value = '';
  });
  if (root && location.hash === '#reader-resume') { document.fonts.ready.then(() => { requestAnimationFrame(restore); }); }
  addEventListener('hashchange', () => { if (location.hash === '#reader-resume') restore(); });
}
