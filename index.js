/* ============================================================
 * 游逸旅闻汇总 - 主页面逻辑
 * ============================================================ */
(function () {
  'use strict';

  /* ============ 数据校验 ============ */
  const DATA = window.TRAVELERS_TALES;
  if (!DATA || !Array.isArray(DATA.entries) || DATA.entries.length === 0) {
    document.body.innerHTML = '<p style="padding:40px;text-align:center;color:#999;">数据加载失败：请检查 data.js 是否存在。</p>';
    return;
  }

  const ENTRIES = DATA.entries;
  const META = DATA.meta || {};
  const TOTAL = META.total || ENTRIES.length;
  const VALID_IDS = new Set(ENTRIES.map(e => e.id));

  const STORAGE_KEY = 'genshin_travelers_tales_completed_v1';
  const THEME_KEY   = 'genshin_travelers_tales_theme_v1';

  /* ============ 状态 ============ */
  const state = {
    search: '',
    version: 'all',
    status: 'all',
    visibility: 'all',
    done: new Set(loadDone()),
    avatarCache: buildAvatarCache(),
    openDropdown: null
  };

  /* ============ 头像反查 ============ */
  function buildAvatarCache() {
    const cache = new Map();
    if (!window.ICON_DICT || !window.ICON_DICT.characters) return cache;
    const cfg = window.ICON_DICT.config && window.ICON_DICT.config.characters;
    if (!cfg) return cache;
    const chars = window.ICON_DICT.characters;
    for (const key in chars) {
      const item = chars[key];
      if (!item || !item.name) continue;
      let url;
      if (item.url)                   url = item.url;
      else if (key.endsWith('.webp')) url = cfg.prefix + key;
      else                            url = cfg.prefix + key + cfg.ext;
      cache.set(item.name, url);
    }
    return cache;
  }

  /* ============ 旅闻唯一键 ============ */
  function entryKey(e) {
    return (e.character || '') + '·' + (e.title || '');
  }

  /* ============ localStorage ============ */
  function loadDone() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(n => typeof n === 'number') : [];
    } catch (e) { return []; }
  }
  function saveDone() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.done])); } catch (e) {}
  }

  /* ============ DOM ============ */
  const $ = (id) => document.getElementById(id);
  const els = {
    listHost: $('listHost'),
    emptyState: $('emptyState'),
    searchInput: $('searchInput'),
    searchClear: $('searchClear'),
    counterDone: $('counterDone'),
    counterTotal: $('counterTotal'),
    btnExport: $('btnExport'),
    btnImport: $('btnImport'),
    btnTheme: $('btnTheme'),
    importFile: $('importFile'),
    versionTrigger: $('versionTrigger'),
    versionLabel: $('versionLabel'),
    versionPanel: $('versionPanel'),
    statusTrigger: $('statusTrigger'),
    statusLabel: $('statusLabel'),
    statusPanel: $('statusPanel'),
    visibilityTrigger: $('visibilityTrigger'),
    visibilityLabel: $('visibilityLabel'),
    visibilityPanel: $('visibilityPanel')
  };
  const dropWraps = [...document.querySelectorAll('.dropdown-wrap')];

  /* ============ 工具 ============ */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function cleanText(str) {
    if (str == null) return '';
    return String(str)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function cleanTrigger(str) {
    return cleanText(str).replace(/^备注[:：]\s*/, '').trim();
  }
  function cleanPrereq(str) {
    return cleanText(str).replace(/^(前置|备注)[:：]\s*/, '').trim();
  }

  /* ============ 版本 / 状态 / 可见性 ============ */
  function getVersions() {
    if (Array.isArray(DATA.versions) && DATA.versions.length) return DATA.versions.slice();
    const set = new Set();
    ENTRIES.forEach(e => set.add(e.version));
    return [...set];
  }
  const VERSIONS = getVersions();

  const VERSION_ITEMS = (function () {
    const items = [{ value: 'all', label: '全部版本' }];
    VERSIONS.forEach(v => items.push({ value: v, label: v }));
    return items;
  })();
  const STATUS_ITEMS = [
    { value: 'all',    label: '全部' },
    { value: 'done',   label: '已完成' },
    { value: 'undone', label: '未完成' }
  ];
  const VISIBILITY_ITEMS = [
    { value: 'all',    label: '全部' },
    { value: 'normal', label: '正常' },
    { value: 'hidden', label: '隐藏' }
  ];

  /* ============ 下拉 ============ */
  const CHECK_SVG = '<svg class="dropdown-item-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 13 10 18 19 7"></polyline></svg>';

  function renderItems(panelEl, items, current) {
    panelEl.innerHTML = items.map(it => {
      const active = it.value === current ? ' active' : '';
      return `<button type="button" class="dropdown-item${active}" data-value="${escapeHtml(it.value)}">` +
             `<span>${escapeHtml(it.label)}</span>${CHECK_SVG}</button>`;
    }).join('');
  }

  function openDropdown(key) {
    closeDropdown();
    state.openDropdown = key;
    const wrap = dropWraps.find(w => w.dataset.key === key);
    if (wrap) wrap.classList.add('open');

    if (key === 'version')    renderItems(els.versionPanel, VERSION_ITEMS, state.version);
    if (key === 'status')     renderItems(els.statusPanel, STATUS_ITEMS, state.status);
    if (key === 'visibility') renderItems(els.visibilityPanel, VISIBILITY_ITEMS, state.visibility);
  }

  function closeDropdown() {
    state.openDropdown = null;
    dropWraps.forEach(w => w.classList.remove('open'));
  }

  function toggleDropdown(key) {
    if (state.openDropdown === key) closeDropdown();
    else openDropdown(key);
  }

  els.versionTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); toggleDropdown('version');
  });
  els.statusTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); toggleDropdown('status');
  });
  els.visibilityTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); toggleDropdown('visibility');
  });

  [els.versionPanel, els.statusPanel, els.visibilityPanel].forEach(panel => {
    panel.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;
      e.stopPropagation();
      const value = item.dataset.value;
      const key = state.openDropdown;

      if (key === 'version') {
        state.version = value;
        els.versionLabel.textContent = value === 'all' ? '全部版本' : value;
      } else if (key === 'status') {
        state.status = value;
        const opt = STATUS_ITEMS.find(o => o.value === value);
        els.statusLabel.textContent = opt ? opt.label : '全部';
      } else if (key === 'visibility') {
        state.visibility = value;
        const opt = VISIBILITY_ITEMS.find(o => o.value === value);
        els.visibilityLabel.textContent = opt ? opt.label : '全部';
      }

      closeDropdown();
      render();
    });
  });

  document.addEventListener('click', (e) => {
    if (!state.openDropdown) return;
    if (e.target.closest('.dropdown-wrap')) return;
    closeDropdown();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.openDropdown) closeDropdown();
  });

  /* ============ 过滤 ============ */
  function getFiltered() {
    const kw = state.search.trim().toLowerCase();
    return ENTRIES.filter(e => {
      if (state.version !== 'all' && e.version !== state.version) return false;
      if (state.status === 'done'   && !state.done.has(e.id)) return false;
      if (state.status === 'undone' &&  state.done.has(e.id)) return false;
      if (state.visibility === 'normal' && e.hidden) return false;
      if (state.visibility === 'hidden' && !e.hidden) return false;
      if (kw) {
        const hay = (e.character + ' ' + e.title).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }

  /* ============ 渲染卡片 ============ */
  function renderCard(e) {
    const isDone = state.done.has(e.id);
    const avatarUrl = state.avatarCache.get(e.character);
    const initial = e.character ? e.character.charAt(0) : '?';

    const avatarHtml = avatarUrl
      ? `<img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" onerror="this.remove()">${escapeHtml(initial)}`
      : escapeHtml(initial);

    const metaRows = [];

    if (e.location && e.location.trim()) {
      metaRows.push(
        `<div class="tale-meta-row">` +
          `<span class="tale-meta-key">地点</span>` +
          `<span class="tale-meta-val">${escapeHtml(cleanText(e.location))}</span>` +
        `</div>`
      );
    }

    const trigger = cleanTrigger(e.trigger);
    if (trigger) {
      metaRows.push(
        `<div class="tale-meta-row">` +
          `<span class="tale-meta-key">触发条件</span>` +
          `<span class="tale-meta-val trigger">${escapeHtml(trigger)}</span>` +
        `</div>`
      );
    }

    const prereq = cleanPrereq(e.prerequisite);
    if (prereq) {
      metaRows.push(
        `<div class="tale-meta-row">` +
          `<span class="tale-meta-key">前置旅闻</span>` +
          `<span class="tale-meta-val">${escapeHtml(prereq)}</span>` +
        `</div>`
      );
    }

    const metaHtml = metaRows.length ? `<div class="tale-meta">${metaRows.join('')}</div>` : '';

    const descHtml = (e.description && e.description.trim())
      ? `<div class="tale-desc">${escapeHtml(cleanText(e.description))}</div>` : '';

    return (
      `<div class="tale-card${isDone ? ' done' : ''}" data-id="${e.id}" tabindex="0">` +
        `<div class="tale-check" role="checkbox" aria-checked="${isDone}">` +
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">` +
            `<polyline points="5 13 10 18 19 7"></polyline>` +
          `</svg>` +
        `</div>` +
        `<div class="tale-avatar">${avatarHtml}</div>` +
        `<div class="tale-body">` +
          `<div class="tale-head">` +
            `<span class="tale-char">${escapeHtml(e.character)}</span>` +
            `<span class="tale-version">${escapeHtml(e.version)}</span>` +
            `<span class="tale-title${e.hidden ? ' hidden' : ''}">${escapeHtml(e.title)}</span>` +
          `</div>` +
          metaHtml +
          descHtml +
        `</div>` +
      `</div>`
    );
  }

  /* ============ 主渲染 ============ */
  function render() {
    const list = getFiltered();
    if (list.length === 0) {
      els.listHost.innerHTML = '';
      els.emptyState.hidden = false;
    } else {
      els.emptyState.hidden = true;
      els.listHost.innerHTML = list.map(renderCard).join('');
    }
    updateCounter();
  }

  function updateCounter() {
    els.counterDone.textContent = state.done.size;
    els.counterTotal.textContent = TOTAL;
  }

  /* ============ 勾选 ============ */
  function toggle(id) {
    if (state.done.has(id)) state.done.delete(id);
    else state.done.add(id);
    saveDone();
    updateCounter();

    if (state.status !== 'all') render();
    else updateCardState(id);
  }
  function updateCardState(id) {
    const card = els.listHost.querySelector(`.tale-card[data-id="${id}"]`);
    if (!card) return;
    const isDone = state.done.has(id);
    card.classList.toggle('done', isDone);
    const check = card.querySelector('.tale-check');
    if (check) check.setAttribute('aria-checked', isDone ? 'true' : 'false');
  }

  els.listHost.addEventListener('click', (ev) => {
    const card = ev.target.closest('.tale-card');
    if (!card) return;
    const id = Number(card.dataset.id);
    if (!Number.isNaN(id)) toggle(id);
  });
  els.listHost.addEventListener('keydown', (ev) => {
    if (ev.key !== ' ' && ev.key !== 'Enter') return;
    const card = ev.target.closest('.tale-card');
    if (!card) return;
    ev.preventDefault();
    const id = Number(card.dataset.id);
    if (!Number.isNaN(id)) toggle(id);
  });

  /* ============ 搜索 ============ */
  let searchTimer = null;
  els.searchInput.addEventListener('input', () => {
    const val = els.searchInput.value;
    els.searchClear.classList.toggle('visible', val.length > 0);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = val;
      render();
    }, 150);
  });
  els.searchClear.addEventListener('click', () => {
    els.searchInput.value = '';
    els.searchClear.classList.remove('visible');
    state.search = '';
    render();
    els.searchInput.focus();
  });

  /* ============ 导出 ============ */
  els.btnExport.addEventListener('click', () => {
    const d = new Date();
    const ymd = d.getFullYear().toString()
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');

    const completedNames = ENTRIES
      .filter(e => state.done.has(e.id))
      .map(e => entryKey(e));

    const payload = {
      schema: 'genshin-travelers-tales',
      version: META.version || '',
      exportedAt: ymd,
      total: TOTAL,
      completed: completedNames
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `游逸旅闻存档记录-${ymd}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* ============ 导入 ============ */
  els.btnImport.addEventListener('click', () => els.importFile.click());

  els.importFile.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        const list = Array.isArray(json) ? json : (json.completed || []);

        const next = new Set();

        const nameToId = new Map();
        ENTRIES.forEach(e => nameToId.set(entryKey(e), e.id));

        for (const item of list) {
          if (typeof item === 'number') {
            if (VALID_IDS.has(item)) next.add(item);
          } else if (typeof item === 'string') {
            const id = nameToId.get(item);
            if (id != null) next.add(id);
          }
        }

        state.done = next;
        saveDone();
        render();
      } catch (err) {
        alert('导入失败：文件格式不正确');
      }
      els.importFile.value = '';
    };
    reader.readAsText(file);
  });

  /* ============ 主题 ============ */
  function applyTheme(theme) {
    document.documentElement.classList.add('theme-switching');
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    setTimeout(() => document.documentElement.classList.remove('theme-switching'), 100);
  }
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  els.btnTheme.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'light';
    }
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  })();

  /* ============ 启动 ============ */
  let dirty = false;
  [...state.done].forEach(id => {
    if (!VALID_IDS.has(id)) { state.done.delete(id); dirty = true; }
  });
  if (dirty) saveDone();

  render();
})();
