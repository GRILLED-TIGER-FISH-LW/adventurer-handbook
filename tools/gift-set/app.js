/* ============================================================
 * 尘歌壶赠礼套装 · 逻辑
 * ============================================================ */
(function () {
  'use strict';

  const KEY_OWNED = 'genshin_homeworld_gift_sets_owned_v1';
  const KEY_COMPLETED = 'genshin_homeworld_gift_sets_completed_v1';
  const KEY_UID = 'genshin_homeworld_gift_sets_uid_v1';
  const THEME_KEY = 'genshin_travelers_tales_theme_v1';

  const EXCLUDED_CHARS = new Set(['旅行者']);

  const IS_IFRAME = (function () {
    try { return window.parent !== window; } catch (e) { return false; }
  })();

  /* ============================================================
   * 1. 兜底图标
   * ============================================================ */
  const FALLBACK_ICONS = {
    file:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="m213.66 82.34l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V88a8 8 0 0 0-2.34-5.66M160 51.31L188.69 80H160ZM200 216H56V40h88v48a8 8 0 0 0 8 8h48z"/></svg>',
    check:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="m229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69L218.34 66.34a8 8 0 0 1 11.32 11.32"/></svg>'
  };

  function resolveIcon(key) {
    if (window.ICONS) {
      let cur = window.ICONS;
      for (const p of key.split('.')) {
        cur = cur?.[p];
        if (!cur) break;
      }
      if (typeof cur === 'string') return cur;
    }
    return FALLBACK_ICONS[key] || '';
  }

  function injectIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      if (el.dataset.iconReady === '1') return;
      const svg = resolveIcon(el.dataset.icon);
      if (svg) {
        el.innerHTML = svg;
        el.dataset.iconReady = '1';
      }
    });
  }

  /* ============================================================
   * 2. 工具函数
   * ============================================================ */
  const esc = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const pad2 = (n) => String(n).padStart(2, '0');

  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  };

  const todayFileStr = () => {
    const d = new Date();
    return String(d.getFullYear()) + pad2(d.getMonth() + 1) + pad2(d.getDate());
  };

  /* ============================================================
   * 3. DOM 引用
   * ============================================================ */
  const $ = (id) => document.getElementById(id);
  const els = {
    uidInput: $('uidInput'),
    btnImport: $('btnImport'),
    btnExport: $('btnExport'),
    btnReset: $('btnReset'),
    btnTheme: $('btnTheme'),
    fileInput: $('fileInput'),
    toastContainer: $('toastContainer'),

    gsCharSection: $('gsCharSection'),
    gsCharCount: $('gsCharCount'),
    btnCharToggle: $('btnCharToggle'),
    gsCharChipsBar: $('gsCharChipsBar'),
    gsCharChips: $('gsCharChips'),
    gsCharGridWrap: $('gsCharGridWrap'),
    gsCharSearch: $('gsCharSearch'),
    gsCharGrid: $('gsCharGrid'),

    gsRecommendSection: $('gsRecommendSection'),
    btnRecommendToggle: $('btnRecommendToggle'),
    gsRecommendList: $('gsRecommendList'),

    gsAllSection: $('gsAllSection'),
    gsSearch: $('gsSearch'),
    gsSearchClear: $('gsSearchClear'),
    gsRegionTrigger: $('gsRegionTrigger'),
    gsRegionLabel: $('gsRegionLabel'),
    gsRegionPanel: $('gsRegionPanel'),
    gsTypeTrigger: $('gsTypeTrigger'),
    gsTypeLabel: $('gsTypeLabel'),
    gsTypePanel: $('gsTypePanel'),
    gsSetList: $('gsSetList'),
    gsSetEmpty: $('gsSetEmpty'),
    gsFirstTip: $('gsFirstTip'),

    modalBackdrop: $('modalBackdrop'),
    modalTitle: $('modalTitle'),
    modalMessage: $('modalMessage'),
    modalActions: $('modalActions')
  };

  /* ============================================================
   * 4. Toast / 确认框
   * ============================================================ */
  function toast(message, type = '') {
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = message;
    els.toastContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 350);
    }, 2200);
  }

  function confirmDialog({ title, message, okText = '确定', cancelText = '取消', danger = false }) {
    return new Promise((resolve) => {
      els.modalTitle.textContent = title || '';
      els.modalMessage.textContent = message || '';
      els.modalActions.innerHTML = '';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn-sm';
      cancelBtn.textContent = cancelText;

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'btn-sm ' + (danger ? 'btn-danger' : 'ios-btn-fill');
      okBtn.textContent = okText;

      els.modalActions.append(cancelBtn, okBtn);
      els.modalBackdrop.classList.add('show');

      const close = (result) => {
        els.modalBackdrop.classList.remove('show');
        cancelBtn.removeEventListener('click', onCancel);
        okBtn.removeEventListener('click', onOk);
        els.modalBackdrop.removeEventListener('click', onBackdrop);
        resolve(result);
      };
      const onCancel = () => close(false);
      const onOk = () => close(true);
      const onBackdrop = (e) => {
        if (e.target === els.modalBackdrop) close(false);
      };

      cancelBtn.addEventListener('click', onCancel);
      okBtn.addEventListener('click', onOk);
      els.modalBackdrop.addEventListener('click', onBackdrop);
    });
  }

  /* ============================================================
   * 5. 主题
   * ============================================================ */
  const currentTheme = () =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  function applyTheme(theme, { save = true } = {}) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.add('theme-switching');
    if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');

    if (save && !IS_IFRAME) {
      try { localStorage.setItem(THEME_KEY, next); } catch {}
    }

    setTimeout(() => document.documentElement.classList.remove('theme-switching'), 120);
  }

  /* ============================================================
   * 6. 角色字典（排除旅行者）
   * ============================================================ */
  const CHAR_INDEX = (() => {
    const dict = window.ICON_DICT;
    if (!dict?.characters) {
      return {
        byName: new Map(),
        descNames: [],
        avatarUrl: new Map()
      };
    }

    const cfg = dict.config?.characters;
    const byName = new Map();
    const avatarUrl = new Map();

    for (const [key, item] of Object.entries(dict.characters)) {
      if (!item?.name) continue;
      if (EXCLUDED_CHARS.has(item.name)) continue;

      byName.set(item.name, { key, order: item.order ?? 9999 });

      let url = '';
      if (item.url) url = item.url;
      else if (cfg) {
        if (/\.(webp|png|jpe?g)$/i.test(key)) url = cfg.prefix + key;
        else url = cfg.prefix + key + cfg.ext;
      }
      if (url) avatarUrl.set(item.name, url);
    }

    const sorted = Array.from(byName.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([name]) => name);

    return {
      byName,
      descNames: sorted.slice().reverse(),
      avatarUrl
    };
  })();

  const getAvatarUrl = (name) => CHAR_INDEX.avatarUrl.get(name) || '';
  const getOrder = (name) => CHAR_INDEX.byName.get(name)?.order ?? 9999;

  /* ============================================================
   * 7. 数据存储
   * ============================================================ */
  const state = {
    sets: [],
    regions: [],
    owned: [],
    completed: {},
    uid: '',
    search: '',
    regionFilter: 'all',
    typeFilter: 'all',
    openDropdown: null
  };

  function sanitizeOwnedList(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(
      (x) => typeof x === 'string' && !EXCLUDED_CHARS.has(x)
    );
  }

  function loadOwned() {
    try {
      const raw = localStorage.getItem(KEY_OWNED);
      return sanitizeOwnedList(raw ? JSON.parse(raw) : []);
    } catch { return []; }
  }

  function loadCompleted() {
    try {
      const raw = localStorage.getItem(KEY_COMPLETED);
      const obj = raw ? JSON.parse(raw) : {};
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
      const out = {};
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          out[key] = obj[key].filter(
            (x) => typeof x === 'string' && !EXCLUDED_CHARS.has(x)
          );
        }
      }
      return out;
    } catch { return {}; }
  }

  function loadUid() {
    try { return localStorage.getItem(KEY_UID) || ''; } catch { return ''; }
  }

  function saveOwned() {
    try { localStorage.setItem(KEY_OWNED, JSON.stringify(state.owned)); } catch {}
  }
  function saveCompleted() {
    try { localStorage.setItem(KEY_COMPLETED, JSON.stringify(state.completed)); } catch {}
  }
  function saveUid() {
    try {
      if (state.uid) localStorage.setItem(KEY_UID, state.uid);
      else localStorage.removeItem(KEY_UID);
    } catch {}
  }

  /* ============================================================
   * 8. 套装工具
   * ============================================================ */
  function getSetImageUrl(set) {
    if (!set?.key) return '';
    const cfg = window.HOMEWORLD_GIFT_SETS?.config?.image;
    if (!cfg) return '';
    return cfg.prefix + set.key + cfg.ext;
  }

  const typeLabel = (t) => (t === 'exterior' ? '室外' : t === 'interior' ? '室内' : '?');

  function getSetCharsSorted(set) {
    const chars = Array.isArray(set.preferredCharacters) ? set.preferredCharacters : [];
    return chars
      .filter((c) => !EXCLUDED_CHARS.has(c))
      .slice()
      .sort((a, b) => getOrder(a) - getOrder(b));
  }

  function getSetProgress(set) {
    const ownedSet = new Set(state.owned);
    const done = state.completed[set.key] || [];
    const chars = getSetCharsSorted(set);

    const ownedChars = chars.filter((c) => ownedSet.has(c));
    if (!ownedChars.length) {
      return { text: '未拥有角色', completed: false, empty: true };
    }
    const doneOwned = ownedChars.filter((c) => done.includes(c));
    const isDone = doneOwned.length === ownedChars.length;
    return {
      text: isDone ? '已完成' : `${doneOwned.length} / ${ownedChars.length}`,
      completed: isDone,
      empty: false
    };
  }

  function computeRecommendations() {
    const ownedSet = new Set(state.owned);
    if (!ownedSet.size) return [];

    const candidates = [];
    for (const set of state.sets) {
      const chars = getSetCharsSorted(set);
      if (!chars.length) continue;

      const ownedInSet = chars.filter((c) => ownedSet.has(c));
      if (!ownedInSet.length) continue;

      const doneInSet = state.completed[set.key] || [];
      const pending = ownedInSet.filter((c) => !doneInSet.includes(c));
      if (!pending.length) continue;

      candidates.push({
        set,
        pendingCount: pending.length,
        ratio: ownedInSet.length / chars.length
      });
    }

    candidates.sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      return (a.set.id ?? 0) - (b.set.id ?? 0);
    });

    return candidates.slice(0, 5).map((c) => c.set);
  }

  /* ============================================================
   * 9. 角色栏渲染
   * ============================================================ */
  function renderCharChips() {
    const ownedSet = new Set(state.owned);
    const sorted = CHAR_INDEX.descNames.filter((n) => ownedSet.has(n));

    els.gsCharCount.textContent = String(sorted.length);
    els.gsCharChipsBar.hidden = !sorted.length;

    if (!sorted.length) {
      els.gsCharChips.innerHTML = '';
      return;
    }

    els.gsCharChips.innerHTML = sorted
      .map((name) => {
        const url = getAvatarUrl(name);
        const initial = name.charAt(0);
        const avatarInner = url
          ? `<img src="${esc(url)}" alt="">${esc(initial)}`
          : esc(initial);
        return (
          `<span class="gs-chip" data-char="${esc(name)}">` +
            `<span class="gs-chip-avatar">${avatarInner}</span>` +
            `<span class="gs-chip-name">${esc(name)}</span>` +
            `<button type="button" class="gs-chip-remove" data-remove="${esc(name)}" aria-label="移除">` +
              '<span class="ic" data-icon="app.close"></span>' +
            '</button>' +
          '</span>'
        );
      })
      .join('');
    injectIcons(els.gsCharChips);
  }

  function renderCharGrid() {
    const ownedSet = new Set(state.owned);
    const q = els.gsCharSearch.value.trim().toLowerCase();

    const names = CHAR_INDEX.descNames.filter((n) => {
      if (!q) return true;
      return n.toLowerCase().includes(q);
    });

    if (!names.length) {
      els.gsCharGrid.innerHTML = '<div class="gs-empty"><div>没有匹配的角色</div></div>';
      return;
    }

    els.gsCharGrid.innerHTML = names
      .map((name) => {
        const url = getAvatarUrl(name);
        const initial = name.charAt(0);
        const avatarInner = url
          ? `<img src="${esc(url)}" alt="" loading="lazy">${esc(initial)}`
          : esc(initial);
        const isOwned = ownedSet.has(name);
        const cls = 'gs-char-cell ' + (isOwned ? 'owned' : 'not-owned');
        return (
          `<div class="${cls}" data-char="${esc(name)}" title="${esc(name)}">` +
            `<div class="gs-char-cell-avatar">${avatarInner}</div>` +
            `<div class="gs-char-cell-name">${esc(name)}</div>` +
          '</div>'
        );
      })
      .join('');
  }

  function updateCharSectionState() {
    if (!state.owned.length) {
      els.gsCharSection.classList.remove('collapsed');
    } else {
      els.gsCharSection.classList.add('collapsed');
    }
    els.gsCharChipsBar.hidden = !state.owned.length;
  }

  function toggleOwned(name) {
    if (EXCLUDED_CHARS.has(name)) return;

    const idx = state.owned.indexOf(name);
    if (idx >= 0) state.owned.splice(idx, 1);
    else state.owned.push(name);
    saveOwned();

    renderCharChips();
    const cell = els.gsCharGrid.querySelector(`.gs-char-cell[data-char="${CSS.escape(name)}"]`);
    if (cell) {
      const isOwned = state.owned.includes(name);
      cell.classList.toggle('owned', isOwned);
      cell.classList.toggle('not-owned', !isOwned);
    }

    refreshDerivedSections();
  }

  /* ============================================================
   * 10. 套装卡片
   * ============================================================ */
  function renderSetCardHtml(set, { showRecommendTag = false } = {}) {
    const url = getSetImageUrl(set);
    const prog = getSetProgress(set);
    const chars = getSetCharsSorted(set);
    const ownedSet = new Set(state.owned);
    const done = state.completed[set.key] || [];

    const thumbInner = url
      ? `<img src="${esc(url)}" alt="" loading="lazy">`
      : '<span class="gs-set-thumb-fallback">无图</span>';

    const progressCls = prog.empty ? 'empty' : prog.completed ? 'done' : '';
    const cardCls = 'gs-set-item' + (prog.completed ? ' completed' : '');
    const tagHtml = showRecommendTag ? '<span class="gs-set-tag">推荐</span>' : '';

    const charsHtml = chars.length
      ? chars
          .map((name) => {
            const isOwned = ownedSet.has(name);
            const isDone = done.includes(name);
            const cellCls =
              'gs-set-char ' +
              (!isOwned ? 'not-owned' : isDone ? 'owned-done' : 'owned-pending');
            const charUrl = getAvatarUrl(name);
            const initial = name.charAt(0);
            const avatarInner = charUrl
              ? `<img src="${esc(charUrl)}" alt="" loading="lazy">${esc(initial)}`
              : esc(initial);
            return (
              `<div class="${cellCls}" data-char="${esc(name)}" title="${esc(name)}">` +
                `<div class="gs-set-char-avatar">${avatarInner}</div>` +
                `<div class="gs-set-char-name">${esc(name)}</div>` +
              '</div>'
            );
          })
          .join('')
      : '<div class="gs-empty"><div>无偏好角色数据</div></div>';

    return (
      `<div class="${cardCls}" data-set-key="${esc(set.key)}">` +
        '<div class="gs-set-head" role="button" tabindex="0">' +
          tagHtml +
          `<div class="gs-set-thumb">${thumbInner}</div>` +
          '<div class="gs-set-main">' +
            `<div class="gs-set-name">${esc(set.name || '(未命名套装)')}</div>` +
            `<div class="gs-set-sub">${esc(set.region || '?')} · ${esc(typeLabel(set.type))}</div>` +
          '</div>' +
          `<div class="gs-set-progress ${progressCls}">${esc(prog.text)}</div>` +
          '<span class="gs-set-arrow ic" data-icon="ui.chevronDown"></span>' +
        '</div>' +
        '<div class="gs-set-body">' +
          `<div class="gs-set-chars">${charsHtml}</div>` +
        '</div>' +
      '</div>'
    );
  }

  function renderRecommend(recs = null) {
    if (recs === null) recs = computeRecommendations();

    if (!recs.length) {
      els.gsRecommendSection.hidden = true;
      els.gsRecommendList.innerHTML = '';
      return;
    }

    els.gsRecommendSection.hidden = false;

    els.gsRecommendList.innerHTML = recs
      .map((s) => renderSetCardHtml(s, { showRecommendTag: true }))
      .join('');
    injectIcons(els.gsRecommendList);
  }

  function renderAllSets() {
    const expanded = new Set();
    els.gsSetList.querySelectorAll('.gs-set-item.expanded').forEach((el) => {
      if (el.dataset.setKey) expanded.add(el.dataset.setKey);
    });

    const kw = state.search.trim().toLowerCase();
    const filtered = state.sets.filter((s) => {
      if (state.regionFilter !== 'all' && s.region !== state.regionFilter) return false;
      if (state.typeFilter !== 'all' && s.type !== state.typeFilter) return false;
      if (kw) {
        const chars = s.preferredCharacters || [];
        const hitName = (s.name || '').toLowerCase().includes(kw);
        const hitChar = chars.some((c) => c.toLowerCase().includes(kw));
        if (!hitName && !hitChar) return false;
      }
      return true;
    });

    filtered.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

    if (!state.sets.length) {
      els.gsSetList.innerHTML = '';
      els.gsSetEmpty.hidden = false;
      els.gsSetEmpty.innerHTML =
        '<span class="ic" data-icon="file"></span>' +
        '<div>套装数据未加载<br>请检查 data.js 是否存在</div>';
      injectIcons(els.gsSetEmpty);
      return;
    }

    if (!filtered.length) {
      els.gsSetList.innerHTML = '';
      els.gsSetEmpty.hidden = false;
      els.gsSetEmpty.innerHTML = '<div>没有匹配的套装</div>';
      return;
    }

    els.gsSetEmpty.hidden = true;
    els.gsSetList.innerHTML = filtered.map((s) => renderSetCardHtml(s)).join('');
    injectIcons(els.gsSetList);

    expanded.forEach((key) => {
      const el = els.gsSetList.querySelector(`.gs-set-item[data-set-key="${CSS.escape(key)}"]`);
      if (el) el.classList.add('expanded');
    });
  }

  /* ============================================================
   * 11. 汇总刷新
   * ============================================================ */
  function refreshDerivedSections() {
    const hasOwned = state.owned.length > 0;
    els.gsFirstTip.hidden = hasOwned;
    els.gsAllSection.hidden = false;

    renderRecommend();
    renderAllSets();
  }

  /* ============================================================
   * 12. 套装内角色切换
   * ============================================================ */
  function toggleSetChar(setKey, name) {
    if (EXCLUDED_CHARS.has(name)) return;

    const ownedSet = new Set(state.owned);
    if (!ownedSet.has(name)) return;

    const set = state.sets.find((s) => s.key === setKey);
    if (!set || !(set.preferredCharacters || []).includes(name)) return;

    if (!state.completed[setKey]) state.completed[setKey] = [];
    const arr = state.completed[setKey];

    const idx = arr.indexOf(name);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(name);

    if (!arr.length) delete state.completed[setKey];

    saveCompleted();

    const item = els.gsSetList.querySelector(`.gs-set-item[data-set-key="${CSS.escape(setKey)}"]`);
    if (item) {
      const wasExpanded = item.classList.contains('expanded');
      item.outerHTML = renderSetCardHtml(set);
      const newItem = els.gsSetList.querySelector(`.gs-set-item[data-set-key="${CSS.escape(setKey)}"]`);
      if (newItem) {
        if (wasExpanded) newItem.classList.add('expanded');
        injectIcons(newItem);
      }
    }

    renderRecommend();
  }

  /* ============================================================
   * 13. 筛选下拉（对齐 tales 的 dropdown）
   * ============================================================ */
  function renderGsDropdown(panelEl, items, current) {
    panelEl.innerHTML = items.map((it) => {
      const active = it.value === current ? ' active' : '';
      return `<button type="button" class="gs-dropdown-item${active}" data-value="${esc(it.value)}">${esc(it.label)}</button>`;
    }).join('');
  }

  function openGsDropdown(key) {
    closeGsDropdown();
    state.openDropdown = key;
    document.querySelector(`.gs-dropdown-wrap[data-key="${key}"]`)?.classList.add('open');

    if (key === 'region') {
      const items = [{ value: 'all', label: '全部地区' }];
      state.regions.forEach((r) => items.push({ value: r, label: r }));
      renderGsDropdown(els.gsRegionPanel, items, state.regionFilter);
    } else if (key === 'type') {
      const items = [
        { value: 'all', label: '全部类型' },
        { value: 'interior', label: '室内' },
        { value: 'exterior', label: '室外' }
      ];
      renderGsDropdown(els.gsTypePanel, items, state.typeFilter);
    }
  }

  function closeGsDropdown() {
    state.openDropdown = null;
    document.querySelectorAll('.gs-dropdown-wrap').forEach((w) => w.classList.remove('open'));
  }

  function toggleGsDropdown(key) {
    if (state.openDropdown === key) closeGsDropdown();
    else openGsDropdown(key);
  }

  /* ============================================================
   * 14. 定位到某套装
   * ============================================================ */
  function clearFilters() {
    const hadFilter =
      state.search !== '' ||
      state.regionFilter !== 'all' ||
      state.typeFilter !== 'all';
    if (!hadFilter) return false;

    state.search = '';
    state.regionFilter = 'all';
    state.typeFilter = 'all';
    els.gsSearch.value = '';
    els.gsSearchClear.classList.remove('show');
    els.gsRegionLabel.textContent = '全部地区';
    els.gsTypeLabel.textContent = '全部类型';

    renderAllSets();
    return true;
  }

  function scrollToSet(setKey) {
    clearFilters();

    const item = els.gsSetList.querySelector(`.gs-set-item[data-set-key="${CSS.escape(setKey)}"]`);
    if (!item) {
      toast('套装不存在', 'error');
      return;
    }

    item.classList.add('expanded');
    requestAnimationFrame(() => {
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ============================================================
   * 15. 导入 / 导出 / 重置
   * ============================================================ */
  function resetFiltersUI() {
    state.search = '';
    state.regionFilter = 'all';
    state.typeFilter = 'all';
    els.gsSearch.value = '';
    els.gsSearchClear.classList.remove('show');
    els.gsRegionLabel.textContent = '全部地区';
    els.gsTypeLabel.textContent = '全部类型';
    els.gsCharSearch.value = '';
    closeGsDropdown();
  }

  function exportData() {
    const uid = state.uid.trim();
    const validKeys = new Set(state.sets.map((s) => s.key));

    const filteredCompleted = {};
    for (const key in state.completed) {
      if (!validKeys.has(key)) continue;
      const arr = state.completed[key];
      if (arr && arr.length) filteredCompleted[key] = arr.slice();
    }

    const data = {
      schema: 'genshin-homeworld-gift-sets',
      uid: uid || '',
      exportedAt: todayStr(),
      owned: state.owned.slice(),
      completed: filteredCompleted
    };

    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const fileDate = todayFileStr();
    a.download = uid
      ? `赠礼套装存档记录-${uid}-${fileDate}.json`
      : `赠礼套装存档记录-${fileDate}.json`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast('已导出存档', 'success');
  }

  function importData(text) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('JSON 格式错误'); }
    if (!data || typeof data !== 'object') throw new Error('存档格式无效');
    if (data.schema && data.schema !== 'genshin-homeworld-gift-sets') {
      throw new Error('存档 schema 不匹配');
    }
    if (!Array.isArray(data.owned)) throw new Error('缺少 owned 数组');
    if (data.completed && (typeof data.completed !== 'object' || Array.isArray(data.completed))) {
      throw new Error('completed 格式错误');
    }

    state.owned = sanitizeOwnedList(data.owned);
    state.completed = {};
    if (data.completed) {
      for (const key in data.completed) {
        if (Array.isArray(data.completed[key])) {
          state.completed[key] = data.completed[key].filter(
            (x) => typeof x === 'string' && !EXCLUDED_CHARS.has(x)
          );
        }
      }
    }
    state.uid = typeof data.uid === 'string' ? data.uid : '';
    els.uidInput.value = state.uid;

    saveOwned();
    saveCompleted();
    saveUid();

    resetFiltersUI();
    updateCharSectionState();
    renderCharChips();
    renderCharGrid();
    refreshDerivedSections();

    toast(`已导入：${state.owned.length} 个角色`, 'success');
  }

  async function resetAll() {
    const ok = await confirmDialog({
      title: '重置全部数据',
      message: '将清空「我拥有的角色」和所有完成记录，此操作不可撤销。',
      okText: '重置',
      danger: true
    });
    if (!ok) return;

    state.owned = [];
    state.completed = {};
    state.uid = '';
    els.uidInput.value = '';

    saveOwned();
    saveCompleted();
    saveUid();

    resetFiltersUI();
    updateCharSectionState();
    renderCharChips();
    renderCharGrid();
    refreshDerivedSections();

    toast('已重置', 'success');
  }

  /* ============================================================
   * 16. 事件绑定
   * ============================================================ */
  function bindCharSectionEvents() {
    els.btnCharToggle.addEventListener('click', () => {
      els.gsCharSection.classList.toggle('collapsed');
    });

    let charSearchTimer = null;
    els.gsCharSearch.addEventListener('input', () => {
      clearTimeout(charSearchTimer);
      charSearchTimer = setTimeout(() => {
        renderCharGrid();
      }, 120);
    });

    els.gsCharGrid.addEventListener('click', (e) => {
      const cell = e.target.closest('.gs-char-cell');
      if (!cell) return;
      const name = cell.dataset.char;
      if (!name) return;
      toggleOwned(name);
    });

    els.gsCharChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.gs-chip-remove');
      if (!btn) return;
      const name = btn.dataset.remove;
      if (!name) return;
      toggleOwned(name);
    });
  }

  function bindRecommendSectionEvents() {
    els.btnRecommendToggle.addEventListener('click', () => {
      els.gsRecommendSection.classList.toggle('collapsed');
    });

    els.gsRecommendList.addEventListener('click', (e) => {
      const head = e.target.closest('.gs-set-head');
      if (!head) return;
      const item = head.closest('.gs-set-item');
      if (!item?.dataset.setKey) return;
      scrollToSet(item.dataset.setKey);
    });
  }

  function bindAllSectionEvents() {
    els.gsSetList.addEventListener('click', (e) => {
      const head = e.target.closest('.gs-set-head');
      if (head) {
        const item = head.closest('.gs-set-item');
        if (item) item.classList.toggle('expanded');
        return;
      }

      const char = e.target.closest('.gs-set-char');
      if (char) {
        if (char.classList.contains('not-owned')) return;
        const item = char.closest('.gs-set-item');
        if (!item?.dataset.setKey) return;
        const name = char.dataset.char;
        if (!name) return;
        toggleSetChar(item.dataset.setKey, name);
      }
    });

    els.gsSetList.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const head = e.target.closest('.gs-set-head');
      if (!head) return;
      e.preventDefault();
      const item = head.closest('.gs-set-item');
      if (item) item.classList.toggle('expanded');
    });

    let searchTimer = null;
    els.gsSearch.addEventListener('input', () => {
      els.gsSearchClear.classList.toggle('show', els.gsSearch.value.length > 0);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = els.gsSearch.value;
        renderAllSets();
      }, 150);
    });

    els.gsSearchClear.addEventListener('click', () => {
      els.gsSearch.value = '';
      els.gsSearchClear.classList.remove('show');
      state.search = '';
      renderAllSets();
    });

    els.gsRegionTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGsDropdown('region');
    });

    els.gsTypeTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGsDropdown('type');
    });

    [els.gsRegionPanel, els.gsTypePanel].forEach((panel) => {
      panel.addEventListener('click', (e) => {
        const item = e.target.closest('.gs-dropdown-item');
        if (!item) return;
        e.stopPropagation();
        const value = item.dataset.value;
        const key = state.openDropdown;

        if (key === 'region') {
          state.regionFilter = value;
          els.gsRegionLabel.textContent = value === 'all' ? '全部地区' : value;
        } else if (key === 'type') {
          state.typeFilter = value;
          els.gsTypeLabel.textContent =
            value === 'all' ? '全部类型' : value === 'interior' ? '室内' : '室外';
        }

        closeGsDropdown();
        renderAllSets();
      });
    });

    document.addEventListener('click', (e) => {
      if (state.openDropdown && !e.target.closest('.gs-dropdown-wrap')) closeGsDropdown();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.openDropdown) closeGsDropdown();
    });
  }

  function bindHeaderEvents() {
    els.uidInput.value = state.uid;
    els.uidInput.addEventListener('input', () => {
      const filtered = els.uidInput.value.replace(/\D/g, '').slice(0, 15);
      if (els.uidInput.value !== filtered) els.uidInput.value = filtered;
      state.uid = filtered;
      saveUid();
    });

    els.btnExport.addEventListener('click', () => {
      if (!state.owned.length && !Object.keys(state.completed).length) {
        toast('还没有可导出的记录', 'error');
        return;
      }
      exportData();
    });

    els.btnImport.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          importData(reader.result);
        } catch (err) {
          toast('导入失败：' + err.message, 'error');
        }
        els.fileInput.value = '';
      };
      reader.readAsText(file);
    });

    els.btnReset.addEventListener('click', resetAll);

    if (!IS_IFRAME) {
      els.btnTheme.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
  }

  /* ============================================================
   * 17. iframe 主题接收 + 图片加载失败兜底
   * ============================================================ */
  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'theme') {
      applyTheme(data.theme, { save: false });
    }
  });

  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (!img.closest('.gs-set-thumb, .gs-chip-avatar, .gs-char-cell-avatar, .gs-set-char-avatar')) return;
    img.remove();
  }, true);

  /* ============================================================
   * 18. 启动
   * ============================================================ */
  (function init() {
    if (IS_IFRAME) {
      document.body.classList.add('in-iframe');
    }

    let savedTheme = 'light';
    try { savedTheme = localStorage.getItem(THEME_KEY) || 'light'; } catch {}
    applyTheme(savedTheme, { save: false });

    const data = window.HOMEWORLD_GIFT_SETS;
    if (data?.sets && Array.isArray(data.sets)) {
      state.sets = data.sets.slice();
    }
    if (data?.regions && Array.isArray(data.regions)) {
      state.regions = data.regions.slice();
    }

    state.owned = loadOwned();
    state.completed = loadCompleted();
    state.uid = loadUid();

    injectIcons(document);
    bindHeaderEvents();
    bindCharSectionEvents();
    bindRecommendSectionEvents();
    bindAllSectionEvents();

    updateCharSectionState();

    renderCharChips();
    renderCharGrid();
    refreshDerivedSections();

    document.body.classList.add('ready');
  })();
})();
