/* ============================================================
 * 原神 · 游逸旅闻 - 主页面逻辑
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
  const THEME_KEY = 'genshin_travelers_tales_theme_v1';

  /* ============ 状态 ============ */
  const state = {
    search: '',
    version: 'all',
    status: 'all',
    done: new Set(loadDone()),
    avatarCache: buildAvatarCache()
  };

  /* ============ 头像反查表 ============ */
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
      if (item.url) {
        url = item.url;
      } else if (key.endsWith('.webp')) {
        url = cfg.prefix + key;
      } else {
        url = cfg.prefix + key + cfg.ext;
      }
      cache.set(item.name, url);
    }
    return cache;
  }

  /* ============ localStorage ============ */
  function loadDone() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(n => typeof n === 'number') : [];
    } catch (e) {
      return [];
    }
  }
  function saveDone() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.done]));
    } catch (e) { /* 忽略 */ }
  }

  /* ============ DOM ============ */
  const $ = (id) => document.getElementById(id);
  const els = {
    listHost: $('listHost'),
    emptyState: $('emptyState'),
    searchInput: $('searchInput'),
    searchClear: $('searchClear'),
    versionFilter: $('versionFilter'),
    statusFilter: $('statusFilter'),
    counterDone: $('counterDone'),
    counterTotal: $('counterTotal'),
    btnExport: $('btnExport'),
    btnImport: $('btnImport'),
    btnTheme: $('btnTheme'),
    importFile: $('importFile')
  };

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
  // 允许 <br> 标签（触发条件里用得到）
  function escapeAllowBr(str) {
    if (str == null) return '';
    return escapeHtml(str).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  }

  /* ============ 初始化版本下拉 ============ */
  function initVersionFilter() {
    let versions = [];
    if (Array.isArray(DATA.versions) && DATA.versions.length) {
      versions = DATA.versions.slice();
    } else {
      const set = new Set();
      ENTRIES.forEach(e => set.add(e.version));
      versions = [...set];
    }
    const opts = ['<option value="all">全部版本</option>'];
    versions.forEach(v => {
      opts.push(`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`);
    });
    els.versionFilter.innerHTML = opts.join('');
  }

  /* ============ 过滤 ============ */
  function getFiltered() {
    const kw = state.search.trim().toLowerCase();
    return ENTRIES.filter(e => {
      if (state.version !== 'all' && e.version !== state.version) return false;
      if (state.status === 'done' && !state.done.has(e.id)) return false;
      if (state.status === 'undone' && state.done.has(e.id)) return false;
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

    // 触发条件 / 前置
    const metaRows = [];
    if (e.trigger && e.trigger.trim()) {
      metaRows.push(
        `<div class="tale-meta-row">` +
          `<span class="tale-meta-key">触发</span>` +
          `<span class="tale-meta-val trigger">${escapeAllowBr(e.trigger)}</span>` +
        `</div>`
      );
    }
    if (e.prerequisite && e.prerequisite.trim()) {
      metaRows.push(
        `<div class="tale-meta-row">` +
          `<span class="tale-meta-key">前置</span>` +
          `<span class="tale-meta-val">${escapeAllowBr(e.prerequisite)}</span>` +
        `</div>`
      );
    }
    const metaHtml = metaRows.length
      ? `<div class="tale-meta">${metaRows.join('')}</div>`
      : '';

    // 描述
    const descHtml = (e.description && e.description.trim())
      ? `<div class="tale-desc">${escapeHtml(e.description)}</div>`
      : '';

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

  /* ============ 勾选切换 ============ */
  function toggle(id) {
    if (state.done.has(id)) state.done.delete(id);
    else state.done.add(id);
    saveDone();
    updateCounter();

    // 若当前有状态筛选，整表重绘；否则只更新单卡
    if (state.status !== 'all') {
      render();
    } else {
      updateCardState(id);
    }
  }

  function updateCardState(id) {
    const card = els.listHost.querySelector(`.tale-card[data-id="${id}"]`);
    if (!card) return;
    const isDone = state.done.has(id);
    card.classList.toggle('done', isDone);
    const check = card.querySelector('.tale-check');
    if (check) check.setAttribute('aria-checked', isDone ? 'true' : 'false');
  }

  /* ============ 事件绑定 ============ */
  // 列表点击（事件委托）
  els.listHost.addEventListener('click', (ev) => {
    const card = ev.target.closest('.tale-card');
    if (!card) return;
    const id = Number(card.dataset.id);
    if (Number.isNaN(id)) return;
    toggle(id);
  });
  // 键盘（空格/回车）
  els.listHost.addEventListener('keydown', (ev) => {
    if (ev.key !== ' ' && ev.key !== 'Enter') return;
    const card = ev.target.closest('.tale-card');
    if (!card) return;
    ev.preventDefault();
    const id = Number(card.dataset.id);
    if (!Number.isNaN(id)) toggle(id);
  });

  // 搜索
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

  // 版本 / 状态
  els.versionFilter.addEventListener('change', () => {
    state.version = els.versionFilter.value;
    render();
  });
  els.statusFilter.addEventListener('change', () => {
    state.status = els.statusFilter.value;
    render();
  });

  /* ============ 导出存档 ============ */
  els.btnExport.addEventListener('click', () => {
    const d = new Date();
    const ymd = d.getFullYear().toString()
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');

    const payload = {
      schema: 'genshin-travelers-tales',
      version: META.version || '',
      exportedAt: ymd,
      total: TOTAL,
      completed: [...state.done].sort((a, b) => a - b)
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

  /* ============ 导入存档 ============ */
  els.btnImport.addEventListener('click', () => els.importFile.click());

  els.importFile.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        const list = Array.isArray(json) ? json : (json.completed || []);
        const next = list
          .map(n => Number(n))
          .filter(n => !Number.isNaN(n) && VALID_IDS.has(n));
        state.done = new Set(next);
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
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-switching');
    }, 100);
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
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();

  /* ============ 启动 ============ */
  // 清理无效 id
  let dirty = false;
  [...state.done].forEach(id => {
    if (!VALID_IDS.has(id)) { state.done.delete(id); dirty = true; }
  });
  if (dirty) saveDone();

  initVersionFilter();
  render();
})();
