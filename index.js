/* ============================================================
 * 游逸旅闻汇总 - 主页面逻辑
 * ============================================================
 * 资源加载由 index.html 里的内联启动器统一负责：
 *   · theme.css / index.css / icon-dict.js / data.js / index.js 同时下载
 *   · 全部就绪后，window.__bootPromise resolve
 *   · 本文件等待 __bootPromise 再初始化
 *   · 加载期间 body 被内联样式隐藏，加载完加 .ready 显示
 * ============================================================ */
(function () {
  'use strict';

  /* ============ 常量 ============ */
  const STORAGE_KEY = 'genshin_travelers_tales_completed_v2';
  const LEGACY_KEY  = 'genshin_travelers_tales_completed_v1';
  const THEME_KEY   = 'genshin_travelers_tales_theme_v1';

  /* ============ 全局状态 ============ */
  let DATA = null;
  let ENTRIES = [];
  let META = {};
  let TOTAL = 0;
  let DISPLAY_ENTRIES = [];
  let ORDER_MAP = new Map();
  let VERSION_INDEX = new Map();

  const state = {
    search: '',
    version: 'all',
    status: 'all',
    visibility: 'all',
    done: new Set(),
    avatarCache: new Map(),
    openDropdown: null
  };

  /* ============ 旅闻唯一键 ============ */
  function entryKey(e) {
    return (e.character || '') + '·' + (e.title || '');
  }

  /* ============ DOM 引用 ============ */
  const $ = (id) => document.getElementById(id);
  const els = {};

  function initEls() {
    els.listHost           = $('listHost');
    els.emptyState         = $('emptyState');
    els.searchInput        = $('searchInput');
    els.searchClear        = $('searchClear');
    els.counterDone        = $('counterDone');
    els.counterTotal       = $('counterTotal');
    els.btnExport          = $('btnExport');
    els.btnImport          = $('btnImport');
    els.btnClear           = $('btnClear');
    els.btnTheme           = $('btnTheme');
    els.importFile         = $('importFile');
    els.versionTrigger     = $('versionTrigger');
    els.versionLabel       = $('versionLabel');
    els.versionPanel       = $('versionPanel');
    els.statusTrigger      = $('statusTrigger');
    els.statusLabel        = $('statusLabel');
    els.statusPanel        = $('statusPanel');
    els.visibilityTrigger  = $('visibilityTrigger');
    els.visibilityLabel    = $('visibilityLabel');
    els.visibilityPanel    = $('visibilityPanel');
  }

  /* ============ localStorage ============ */
  function loadDone() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(s => typeof s === 'string') : [];
    } catch (e) { return []; }
  }
  function saveDone() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.done]));
    } catch (e) {}
  }

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

  /* ============ 排序 ============ */
  function buildOrderMap() {
    const m = new Map();
    if (window.ICON_DICT && window.ICON_DICT.characters) {
      for (const key in window.ICON_DICT.characters) {
        const item = window.ICON_DICT.characters[key];
        if (item && item.name) {
          m.set(item.name, typeof item.order === 'number' ? item.order : 9999);
        }
      }
    }
    return m;
  }

  function buildVersionIndex() {
    const m = new Map();
    (DATA.versions || []).forEach((v, i) => m.set(v, i));
    return m;
  }

  function sortEntries(list) {
    return list.slice().sort((a, b) => {
      const oa = ORDER_MAP.has(a.character) ? ORDER_MAP.get(a.character) : 9999;
      const ob = ORDER_MAP.has(b.character) ? ORDER_MAP.get(b.character) : 9999;
      if (oa !== ob) return oa - ob;
      const va = VERSION_INDEX.has(a.version) ? VERSION_INDEX.get(a.version) : 9999;
      const vb = VERSION_INDEX.has(b.version) ? VERSION_INDEX.get(b.version) : 9999;
      if (va !== vb) return va - vb;
      return (a.id || 0) - (b.id || 0);
    });
  }

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

  function toast(msg) {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);' +
      'background:rgba(31,29,26,.9);color:#fff;padding:8px 16px;' +
      'border-radius:8px;font-size:13px;z-index:9999;pointer-events:none;' +
      'max-width:80vw;text-align:center;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /* ============ 版本 / 状态 / 可见性 ============ */
  let VERSION_ITEMS = [];
  const STATUS_ITEMS = [
    { value: 'all',    label: '全部状态' },
    { value: 'done',   label: '已完成' },
    { value: 'undone', label: '未完成' }
  ];
  const VISIBILITY_ITEMS = [
    { value: 'all',    label: '全部类型' },
    { value: 'normal', label: '正常' },
    { value: 'hidden', label: '隐藏' }
  ];

  function buildVersionItems() {
    const items = [{ value: 'all', label: '全部版本' }];
    (DATA.versions || []).forEach(v => items.push({ value: v, label: v }));
    VERSION_ITEMS = items;
  }

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
    const wrap = document.querySelector(`.dropdown-wrap[data-key="${key}"]`);
    if (wrap) wrap.classList.add('open');

    if (key === 'version')    renderItems(els.versionPanel, VERSION_ITEMS, state.version);
    if (key === 'status')     renderItems(els.statusPanel, STATUS_ITEMS, state.status);
    if (key === 'visibility') renderItems(els.visibilityPanel, VISIBILITY_ITEMS, state.visibility);
  }

  function closeDropdown() {
    state.openDropdown = null;
    document.querySelectorAll('.dropdown-wrap').forEach(w => w.classList.remove('open'));
  }

  function toggleDropdown(key) {
    if (state.openDropdown === key) closeDropdown();
    else openDropdown(key);
  }

  /* ============ 过滤 ============ */
  function getFiltered() {
    const kw = state.search.trim().toLowerCase();
    return DISPLAY_ENTRIES.filter(e => {
      const key = entryKey(e);
      if (state.version !== 'all' && e.version !== state.version) return false;
      if (state.status === 'done'   && !state.done.has(key)) return false;
      if (state.status === 'undone' &&  state.done.has(key)) return false;
      if (state.visibility === 'normal' && e.hidden) return false;
      if (state.visibility === 'hidden' && !e.hidden) return false;
      if (kw) {
        const name = (e.character || '').toLowerCase();
        const title = (e.title || '').toLowerCase();
        if (!name.includes(kw) && !title.includes(kw)) return false;
      }
      return true;
    });
  }

  /* ============ 渲染卡片 ============ */
  function renderCard(e) {
    const key = entryKey(e);
    const isDone = state.done.has(key);
    const avatarUrl = state.avatarCache.get(e.character);
    const initial = e.character ? e.character.charAt(0) : '?';

    const avatarHtml = avatarUrl
      ? `<img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" onerror="this.remove()">${escapeHtml(initial)}`
      : escapeHtml(initial);

    const locHtml = (e.location && e.location.trim())
      ? `<div class="tale-loc">` +
          `<span class="tale-meta-key">地点</span>` +
          `<span class="tale-meta-val">${escapeHtml(cleanText(e.location))}</span>` +
        `</div>`
      : '';

    const trigger = cleanTrigger(e.trigger);
    const trigHtml = trigger
      ? `<div class="tale-trig">` +
          `<span class="tale-meta-key">触发条件</span>` +
          `<span class="tale-meta-val">${escapeHtml(trigger)}</span>` +
        `</div>`
      : '';

    const prereq = cleanPrereq(e.prerequisite);
    const prereqHtml = prereq
      ? `<div class="tale-prereq">` +
          `<span class="tale-meta-key">前置旅闻</span>` +
          `<span class="tale-meta-val">${escapeHtml(prereq)}</span>` +
        `</div>`
      : '';

    const descHtml = (e.description && e.description.trim())
      ? `<div class="tale-desc">${escapeHtml(e.description)}</div>` : '';

    // 动态 grid-template-areas：内层用单引号，避免与外层 HTML 属性的双引号冲突
    const areas = ["'avatar head   check'"];
    if (locHtml)    areas.push("'avatar loc    loc'");
    if (trigHtml)   areas.push("'trig   trig   trig'");
    if (prereqHtml) areas.push("'prereq prereq prereq'");
    if (descHtml)   areas.push("'desc   desc   desc'");

    return (
      `<div class="tale-card${isDone ? ' done' : ''}" data-key="${escapeHtml(key)}" tabindex="0" style="grid-template-areas: ${areas.join(' ')}">` +
        `<div class="tale-avatar">${avatarHtml}</div>` +
        `<div class="tale-head">` +
          `<span class="tale-char">${escapeHtml(e.character)}</span>` +
          `<span class="tale-version">${escapeHtml(e.version)}</span>` +
          `<span class="tale-title${e.hidden ? ' hidden' : ''}">${escapeHtml(e.title)}</span>` +
        `</div>` +
        `<div class="tale-check" role="checkbox" aria-checked="${isDone}">` +
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">` +
            `<polyline points="5 13 10 18 19 7"></polyline>` +
          `</svg>` +
        `</div>` +
        locHtml +
        trigHtml +
        prereqHtml +
        descHtml +
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
  function toggle(key) {
    if (state.done.has(key)) state.done.delete(key);
    else state.done.add(key);
    saveDone();
    updateCounter();

    if (state.status !== 'all') render();
    else updateCardState(key);
  }
  function updateCardState(key) {
    const card = els.listHost.querySelector(`.tale-card[data-key="${CSS.escape(key)}"]`);
    if (!card) return;
    const isDone = state.done.has(key);
    card.classList.toggle('done', isDone);
    const check = card.querySelector('.tale-check');
    if (check) check.setAttribute('aria-checked', isDone ? 'true' : 'false');
  }

  /* ============ 事件绑定 ============ */
  function bindEvents() {

    // 列表点击
    els.listHost.addEventListener('click', (ev) => {
      const card = ev.target.closest('.tale-card');
      if (!card) return;
      const key = card.dataset.key;
      if (key) toggle(key);
    });
    els.listHost.addEventListener('keydown', (ev) => {
      if (ev.key !== ' ' && ev.key !== 'Enter') return;
      const card = ev.target.closest('.tale-card');
      if (!card) return;
      ev.preventDefault();
      const key = card.dataset.key;
      if (key) toggle(key);
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

    // 下拉触发器
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
          els.statusLabel.textContent = opt ? opt.label : '全部状态';
        } else if (key === 'visibility') {
          state.visibility = value;
          const opt = VISIBILITY_ITEMS.find(o => o.value === value);
          els.visibilityLabel.textContent = opt ? opt.label : '全部类型';
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

    // 导出
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
        completed: [...state.done].sort()
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

    // 导入
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

          const idToKey = new Map();
          ENTRIES.forEach(e => idToKey.set(e.id, entryKey(e)));

          for (const item of list) {
            if (typeof item === 'string') {
              next.add(item);
            } else if (typeof item === 'number') {
              const key = idToKey.get(item);
              if (key) next.add(key);
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

    // 清空完成记录
    els.btnClear.addEventListener('click', () => {
      if (state.done.size === 0) {
        toast('暂无已完成的旅闻');
        return;
      }
      const ok = window.confirm(
        '确定清空所有完成标记吗？\n\n' +
        '建议先「导出存档」备份进度，清空后无法恢复。'
      );
      if (!ok) return;

      state.done.clear();
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_KEY);
      } catch (e) {}
      render();
      toast('已清空完成记录');
    });

    // 主题
    els.btnTheme.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

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

  /* ============ 初始化 ============ */
  function init() {
    ENTRIES = DATA.entries;
    META = DATA.meta || {};
    TOTAL = META.total || ENTRIES.length;

    ORDER_MAP = buildOrderMap();
    VERSION_INDEX = buildVersionIndex();
    DISPLAY_ENTRIES = sortEntries(ENTRIES);

    state.done = new Set(loadDone());
    state.avatarCache = buildAvatarCache();

    buildVersionItems();
    initEls();
    bindEvents();

    // 清理已不存在的 key
    let dirty = false;
    const validKeys = new Set(ENTRIES.map(entryKey));
    [...state.done].forEach(k => {
      if (!validKeys.has(k)) { state.done.delete(k); dirty = true; }
    });
    if (dirty) saveDone();

    render();

    // 揭开 body（显示完整页面）
    document.body.classList.add('ready');
  }

  /* ============ 加载失败处理 ============ */
  function showError(err) {
    const host = document.getElementById('listHost');
    if (host) {
      host.innerHTML =
        '<div class="error-state">' +
          '<p>数据加载失败</p>' +
          '<p style="font-size:12px;color:var(--text-tertiary)">' + escapeHtml(err && err.message ? err.message : '未知错误') + '</p>' +
          '<button type="button" class="action-btn" onclick="location.reload()">重新加载</button>' +
        '</div>';
    }
    // 加载失败也要显示，让用户看到错误
    document.body.classList.add('ready');
  }

  /* ============ Bootstrap ============ */
  window.__bootPromise
    .then(() => {
      if (!window.TRAVELERS_TALES || !Array.isArray(window.TRAVELERS_TALES.entries)) {
        throw new Error('data.js 内容无效');
      }
      DATA = window.TRAVELERS_TALES;
      init();
    })
    .catch((err) => {
      console.error(err);
      showError(err);
    });
})();
