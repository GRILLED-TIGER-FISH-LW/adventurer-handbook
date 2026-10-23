/* ============================================================
 * 游逸旅闻 · 子页面逻辑
 * ============================================================
 * v2 变更：
 *  1. 【致命】状态类名 .show → .is-visible
 *     —— overlays.css 用的是 .is-visible，原来 Toast 与确认弹窗全都不显示
 *  2. 【致命】.tale-title.hidden → .is-biz-hidden
 *     —— 业务标记「隐藏」撞上全局 .hidden（display:none），标题会直接消失
 *  3. 下拉迁到共享组件：删掉自制的 openDropdown / closeDropdown / toggleDropdown，
 *     改用 dropdown.js + dropdown:select 事件
 *  4. 内联 grid-template-areas → 通过 style.setProperty('--areas', …) 注入
 *  5. .done → .is-done；.visible → .is-visible；.active → .is-active
 *  6. showError() 的内联样式改为 CSS 类
 *  7. init() 补齐错误兜底
 * ============================================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'genshin_travelers_tales_completed_v2';
  const LEGACY_KEY  = 'genshin_travelers_tales_completed_v1';
  const UID_KEY     = 'genshin_travelers_tales_uid_v1';

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
    avatarCache: new Map()
  };

  /* =========================================================================
   * 【模块 1】基础工具
   * ========================================================================= */
  function entryKey(e) {
    return (e.character || '') + '·' + (e.version || '') + '·' + (e.title || '');
  }

  function getIcon(key) {
    if (!window.ICONS) return '';
    const parts = String(key).split('.');
    let node = window.ICONS;
    for (let i = 0; i < parts.length; i++) {
      if (!node) return '';
      node = node[parts[i]];
    }
    return typeof node === 'string' ? node : '';
  }

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      if (el.dataset.iconInjected === '1') return;
      const svg = getIcon(el.dataset.icon);
      if (svg) {
        el.innerHTML = svg;
        el.dataset.iconInjected = '1';
      }
    });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cleanText(str) {
    return String(str == null ? '' : str)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function labelOf(items, value, fallback) {
    const hit = items.find(o => o.value === value);
    return hit ? hit.label : fallback;
  }

  const $ = (id) => document.getElementById(id);
  const els = {};

  function initEls() {
    els.listHost = $('listHost');
    els.emptyState = $('emptyState');
    els.searchInput = $('searchInput');
    els.searchClear = $('searchClear');
    els.counterDone = $('counterDone');
    els.counterTotal = $('counterTotal');
    els.uidInput = $('uidInput');
    els.btnExport = $('btnExport');
    els.btnImport = $('btnImport');
    els.btnClear = $('btnClear');
    els.importFile = $('importFile');
    els.versionLabel = $('versionLabel');
    els.versionPanel = $('versionPanel');
    els.statusLabel = $('statusLabel');
    els.statusPanel = $('statusPanel');
    els.visibilityLabel = $('visibilityLabel');
    els.visibilityPanel = $('visibilityPanel');
  }

  /* =========================================================================
   * 【模块 2】本地存储
   * ========================================================================= */
  function loadDone() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr)
        ? arr.filter(s => typeof s === 'string' && s.split('·').length === 3)
        : [];
    } catch (e) { return []; }
  }
  function saveDone() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.done])); } catch (e) {}
  }
  function loadUid() {
    try { return localStorage.getItem(UID_KEY) || ''; } catch (e) { return ''; }
  }
  function saveUid(v) {
    try {
      if (v) localStorage.setItem(UID_KEY, v);
      else localStorage.removeItem(UID_KEY);
    } catch (e) {}
  }

  /* =========================================================================
   * 【模块 3】Toast / Confirm（共享 overlays.css 的状态类是 .is-visible）
   * ========================================================================= */
  function toast(msg, type) {
    let box = document.querySelector('.toast-container');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toast-container';
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast' +
      (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 300);
    }, 2400);
  }

  function showConfirm(title, message) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML =
        `<div class="modal-box">` +
          `<div class="modal-title">${escapeHtml(title)}</div>` +
          `<div class="modal-message">${escapeHtml(message).replace(/\n/g, '<br>')}</div>` +
          `<div class="modal-actions">` +
            `<button type="button" data-act="cancel">取消</button>` +
            `<button type="button" class="modal-confirm" data-act="confirm">确定</button>` +
          `</div>` +
        `</div>`;
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add('is-visible'));

      const cleanup = (result) => {
        backdrop.classList.remove('is-visible');
        setTimeout(() => backdrop.remove(), 320);
        resolve(result);
      };
      backdrop.addEventListener('click', (e) => {
        const act = e.target.closest('[data-act]');
        if (act) cleanup(act.dataset.act === 'confirm');
        else if (e.target === backdrop) cleanup(false);
      });
    });
  }

  /* =========================================================================
   * 【模块 4】数据准备
   * ========================================================================= */
  function buildAvatarCache() {
    const cache = new Map();
    const dict = window.ICON_DICT;
    if (!dict || !dict.characters) return cache;
    const cfg = dict.config && dict.config.characters;
    if (!cfg) return cache;
    for (const key in dict.characters) {
      const item = dict.characters[key];
      if (!item || !item.name) continue;
      const url = item.url
        ? item.url
        : (key.endsWith('.webp') ? cfg.prefix + key : cfg.prefix + key + cfg.ext);
      cache.set(item.name, url);
    }
    return cache;
  }

  function buildOrderMap() {
    const m = new Map();
    const dict = window.ICON_DICT;
    if (dict && dict.characters) {
      for (const key in dict.characters) {
        const item = dict.characters[key];
        if (item && item.name) m.set(item.name, typeof item.order === 'number' ? item.order : 9999);
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

  let VERSION_ITEMS = [];
  const STATUS_ITEMS = [
    { value: 'all', label: '全部状态' },
    { value: 'done', label: '已完成' },
    { value: 'undone', label: '未完成' }
  ];
  const VISIBILITY_ITEMS = [
    { value: 'all', label: '全部类型' },
    { value: 'normal', label: '正常' },
    { value: 'hidden', label: '隐藏' }
  ];

  function buildVersionItems() {
    const items = [{ value: 'all', label: '全部版本' }];
    (DATA.versions || []).forEach(v => items.push({ value: v, label: v }));
    VERSION_ITEMS = items;
  }

  /* =========================================================================
   * 【模块 5】下拉（渲染交给 dropdown.js，这里只负责填内容与响应选择）
   * ========================================================================= */
  function renderItems(panelEl, items, current) {
    if (!panelEl) return;
    panelEl.innerHTML = items.map(it =>
      `<button type="button" class="dropdown-item${it.value === current ? ' is-active' : ''}" data-value="${escapeHtml(it.value)}">${escapeHtml(it.label)}</button>`
    ).join('');
  }

  function renderAllPanels() {
    renderItems(els.versionPanel, VERSION_ITEMS, state.version);
    renderItems(els.statusPanel, STATUS_ITEMS, state.status);
    renderItems(els.visibilityPanel, VISIBILITY_ITEMS, state.visibility);
  }

  /* =========================================================================
   * 【模块 6】筛选与渲染
   * ========================================================================= */
  function getFiltered() {
    const kw = state.search.trim().toLowerCase();
    return DISPLAY_ENTRIES.filter(e => {
      const key = entryKey(e);
      if (state.version !== 'all' && e.version !== state.version) return false;
      if (state.status === 'done' && !state.done.has(key)) return false;
      if (state.status === 'undone' && state.done.has(key)) return false;
      if (state.visibility === 'normal' && e.hidden) return false;
      if (state.visibility === 'hidden' && !e.hidden) return false;
      if (kw
        && !(e.character || '').toLowerCase().includes(kw)
        && !(e.title || '').toLowerCase().includes(kw)) return false;
      return true;
    });
  }

  function renderCard(e) {
    const key = entryKey(e);
    const isDone = state.done.has(key);
    const avatarUrl = state.avatarCache.get(e.character);
    const initial = e.character ? e.character.charAt(0) : '?';

    const avatarHtml = avatarUrl
      ? `<img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" onerror="this.remove()">${escapeHtml(initial)}`
      : escapeHtml(initial);

    const locHtml = (e.location && e.location.trim())
      ? `<div class="tale-loc"><span class="tale-meta-key">地点</span><span class="tale-meta-val">${escapeHtml(cleanText(e.location))}</span></div>`
      : '';
    const trigHtml = (e.trigger && e.trigger.trim())
      ? `<div class="tale-trig"><span class="tale-meta-key">触发条件</span><span class="tale-meta-val">${escapeHtml(cleanText(e.trigger))}</span></div>`
      : '';
    const prereqHtml = (e.prerequisite && e.prerequisite.trim())
      ? `<div class="tale-prereq"><span class="tale-meta-key">前置旅闻</span><span class="tale-meta-val">${escapeHtml(cleanText(e.prerequisite))}</span></div>`
      : '';
    const descHtml = (e.description && e.description.trim())
      ? `<div class="tale-desc">${escapeHtml(e.description)}</div>`
      : '';

    /* 哪几段内容存在，就只排哪几行 */
    const areas = ["'avatar head check'"];
    if (locHtml) areas.push("'avatar loc loc'");
    if (trigHtml) areas.push("'trig trig trig'");
    if (prereqHtml) areas.push("'prereq prereq prereq'");
    if (descHtml) areas.push("'desc desc desc'");
    const areaStr = areas.join(' ');

    return `
      <div class="tale-card${isDone ? ' is-done' : ''}"
           data-key="${escapeHtml(key)}"
           data-areas="${escapeHtml(areaStr)}"
           tabindex="0">
        <div class="tale-avatar">${avatarHtml}</div>
        <div class="tale-head">
          <span class="tale-char">${escapeHtml(e.character)}</span>
          <span class="tale-version">${escapeHtml(e.version)}</span>
          <span class="tale-title${e.hidden ? ' is-biz-hidden' : ''}">${escapeHtml(e.title)}</span>
        </div>
        <div class="tale-check" role="checkbox" aria-checked="${isDone}">
          <span class="check-icon">${getIcon('ui.check')}</span>
        </div>
        ${locHtml}${trigHtml}${prereqHtml}${descHtml}
      </div>`;
  }

  function render() {
    const list = getFiltered();

    if (list.length === 0) {
      els.listHost.innerHTML = '';
      els.emptyState.hidden = false;
    } else {
      els.emptyState.hidden = true;
      els.listHost.innerHTML = list.map(renderCard).join('');

      /* 把每条卡片的网格模板写进 CSS 变量（不写内联 style） */
      els.listHost.querySelectorAll('.tale-card[data-areas]').forEach(card => {
        card.style.setProperty('--areas', card.dataset.areas);
      });
    }

    updateCounter();
  }

  function updateCounter() {
    els.counterDone.textContent = state.done.size;
    els.counterTotal.textContent = TOTAL;
  }

  function toggle(key) {
    if (state.done.has(key)) state.done.delete(key);
    else state.done.add(key);
    saveDone();
    updateCounter();

    if (state.status !== 'all') {
      render();
      return;
    }

    /* 只更新这一张卡片，不重建整个列表 */
    const card = els.listHost.querySelector(`.tale-card[data-key="${CSS.escape(key)}"]`);
    if (!card) return;
    const isDone = state.done.has(key);
    card.classList.toggle('is-done', isDone);
    const check = card.querySelector('.tale-check');
    if (check) check.setAttribute('aria-checked', isDone ? 'true' : 'false');
  }

  /* =========================================================================
   * 【模块 7】事件绑定
   * ========================================================================= */
  function bindEvents() {
    /* 列表：点击 / 键盘切换完成状态 */
    els.listHost.addEventListener('click', (ev) => {
      const card = ev.target.closest('.tale-card');
      if (card && card.dataset.key) toggle(card.dataset.key);
    });
    els.listHost.addEventListener('keydown', (ev) => {
      if (ev.key !== ' ' && ev.key !== 'Enter') return;
      const card = ev.target.closest('.tale-card');
      if (!card) return;
      ev.preventDefault();
      if (card.dataset.key) toggle(card.dataset.key);
    });

    /* 搜索 */
    let searchTimer = null;
    els.searchInput.addEventListener('input', () => {
      const val = els.searchInput.value;
      els.searchClear.classList.toggle('is-visible', val.length > 0);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { state.search = val; render(); }, 150);
    });
    els.searchClear.addEventListener('click', () => {
      els.searchInput.value = '';
      els.searchClear.classList.remove('is-visible');
      state.search = '';
      render();
      els.searchInput.focus();
    });

    /* UID */
    els.uidInput.value = loadUid();
    els.uidInput.addEventListener('input', () => {
      const cleaned = els.uidInput.value.replace(/\D/g, '');
      if (cleaned !== els.uidInput.value) els.uidInput.value = cleaned;
      saveUid(cleaned);
    });

    /* 下拉选择：dropdown.js 负责开关面板，这里只处理业务 */
    document.addEventListener('dropdown:select', (e) => {
      const wrap = e.detail && e.detail.dropdown;
      const key = wrap && wrap.dataset.key;
      const value = e.detail ? e.detail.value : null;
      if (!key || value == null) return;

      if (key === 'version') {
        state.version = value;
        els.versionLabel.textContent = value === 'all' ? '全部版本' : value;
      } else if (key === 'status') {
        state.status = value;
        els.statusLabel.textContent = labelOf(STATUS_ITEMS, value, '全部状态');
      } else if (key === 'visibility') {
        state.visibility = value;
        els.visibilityLabel.textContent = labelOf(VISIBILITY_ITEMS, value, '全部类型');
      }

      renderAllPanels();
      render();
    });

    /* 导出 */
    els.btnExport.addEventListener('click', () => {
      const d = new Date();
      const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const uid = loadUid();
      const filename = uid ? `游逸旅闻存档记录-${uid}-${ymd}.json` : `游逸旅闻存档记录-${ymd}.json`;
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
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    /* 导入 */
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
          const twoPartMap = new Map();

          ENTRIES.forEach(e => {
            const k3 = entryKey(e);
            idToKey.set(e.id, k3);
            const k2 = (e.character || '') + '·' + (e.title || '');
            if (!twoPartMap.has(k2)) twoPartMap.set(k2, []);
            twoPartMap.get(k2).push(k3);
          });

          list.forEach(item => {
            if (typeof item === 'string') {
              const parts = item.split('·');
              if (parts.length === 3) next.add(item);
              else if (parts.length === 2) {
                const hits = twoPartMap.get(item);
                if (hits) hits.forEach(k => next.add(k));
              }
            } else if (typeof item === 'number') {
              const k = idToKey.get(item);
              if (k) next.add(k);
            }
          });

          state.done = next;
          saveDone();
          render();
          toast('存档导入成功', 'success');
        } catch (err) {
          toast('导入失败：文件格式不正确', 'error');
        }
        els.importFile.value = '';
      };
      reader.readAsText(file);
    });

    /* 清空 */
    els.btnClear.addEventListener('click', async () => {
      if (state.done.size === 0) { toast('暂无已完成的旅闻'); return; }
      const ok = await showConfirm(
        '清空完成记录',
        `确定清空所有完成标记吗？共 ${state.done.size} 条。\n\n建议先「导出存档」备份进度，清空后无法恢复。`
      );
      if (!ok) return;
      state.done.clear();
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_KEY);
      } catch (e) {}
      render();
      toast('已清空完成记录', 'success');
    });
  }

  /* =========================================================================
   * 【模块 8】主题同步（父页面会先同源直写，这里只在值不同时才动）
   * ========================================================================= */
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'theme') return;
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    if (current === e.data.theme) return;

    html.classList.add('theme-switching');
    html.setAttribute('data-theme', e.data.theme);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      html.classList.remove('theme-switching');
    }));
  });

  /* =========================================================================
   * 【模块 9】错误兜底
   * ========================================================================= */
  function showError(err) {
    const host = document.getElementById('listHost');
    if (host) {
      host.innerHTML =
        `<div class="error-state">` +
          `<p class="error-title">数据加载失败</p>` +
          `<p class="error-detail">${escapeHtml(err && err.message ? err.message : '未知错误')}</p>` +
          `<button type="button" class="btn" onclick="location.reload()">重新加载</button>` +
        `</div>`;
    }
    document.body.classList.add('ready');
  }

  /* =========================================================================
   * 【模块 10】启动
   * ========================================================================= */
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
    injectIcons();
    renderAllPanels();

    /* 清掉数据里已不存在的完成记录 */
    let dirty = false;
    const validKeys = new Set(ENTRIES.map(entryKey));
    [...state.done].forEach(k => {
      if (!validKeys.has(k)) { state.done.delete(k); dirty = true; }
    });
    if (dirty) saveDone();

    render();
    document.body.classList.add('ready');
  }

  if (window.TRAVELERS_TALES && Array.isArray(window.TRAVELERS_TALES.entries)) {
    DATA = window.TRAVELERS_TALES;
    try {
      init();
    } catch (err) {
      console.error('[init]', err);
      showError(err);
    }
  } else {
    showError(new Error('data.js 加载失败或内容无效'));
  }

})();
