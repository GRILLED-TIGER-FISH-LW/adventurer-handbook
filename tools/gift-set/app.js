/* ============================================================
 * 尘歌壶赠礼套装 · app.js
 * ------------------------------------------------------------
 * v4 变更：
 *  · 删除主题切换按钮（#btnTheme）及全部配套代码：
 *    IS_IFRAME 常量、els.btnTheme、init 里的隐藏逻辑、bindEvents 里的点击绑定。
 *    本工具始终作为 adventurer-handbook 的 iframe 子页面使用，
 *    主题由父页面统一控制。
 *  · 保留 window message 监听（父页面推送主题时同步 data-theme）。
 * ------------------------------------------------------------
 * v3 变更：
 *  · 「全部套装」按钮改为整块折叠（#btnAllToggle），
 *    删除上一版的「一键展开所有卡片」逻辑
 *  · 套装卡片展开状态仍由 expandedKeys 统一管理
 * ------------------------------------------------------------
 * v2 变更：
 *  · 主题改用 theme-init.js 的 Theme（key = gi-theme）
 *  · Toast / 弹窗 / 搜索清除 全部改用 .is-visible
 *  · 筛选下拉改用共享 dropdown.js + dropdown:select
 *  · 推荐卡片就地展开（D3）
 *  · 「未完成」筛选只含 incomplete（D5）
 *  · 点未拥有角色 → Toast（D6）
 *  · 「已达成」→「已送完」（D9）
 *  · importData 校验 completed 的 key
 *  · init 全流程 try/catch
 * ============================================================ */

(function () {
  'use strict';

  const KEY_OWNED = 'genshin_homeworld_gift_sets_owned_v1';
  const KEY_COMPLETED = 'genshin_homeworld_gift_sets_completed_v1';
  const KEY_UID = 'genshin_homeworld_gift_sets_uid_v1';

  const EXCLUDED_CHARS = new Set(['旅行者']);

  const STATUS_OPTIONS = [
    { value: 'all', label: '全部状态' },
    { value: 'done', label: '已完成' },
    { value: 'achieved', label: '已送完' },
    { value: 'incomplete', label: '未完成' }
  ];

  /* ============================================================
   * 1. 工具
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
   * 2. DOM 引用
   * ============================================================ */
  const $ = (id) => document.getElementById(id);
  const els = {
    uidInput: $('uidInput'),
    btnImport: $('btnImport'),
    btnExport: $('btnExport'),
    btnReset: $('btnReset'),
    fileInput: $('fileInput'),
    toastContainer: $('toastContainer'),

    gsCharSection: $('gsCharSection'),
    gsCharCount: $('gsCharCount'),
    btnCharToggle: $('btnCharToggle'),
    gsCharSearch: $('gsCharSearch'),
    gsCharGrid: $('gsCharGrid'),

    gsRecommendSection: $('gsRecommendSection'),
    btnRecommendToggle: $('btnRecommendToggle'),
    gsRecommendList: $('gsRecommendList'),

    gsAllSection: $('gsAllSection'),
    btnAllToggle: $('btnAllToggle'),
    gsSearch: $('gsSearch'),
    gsSearchClear: $('gsSearchClear'),
    gsRegionLabel: $('gsRegionLabel'),
    gsRegionPanel: $('gsRegionPanel'),
    gsTypeLabel: $('gsTypeLabel'),
    gsTypePanel: $('gsTypePanel'),
    gsStatusLabel: $('gsStatusLabel'),
    gsStatusPanel: $('gsStatusPanel'),
    gsSetList: $('gsSetList'),
    gsSetEmpty: $('gsSetEmpty'),
    gsFirstTip: $('gsFirstTip'),

    modalBackdrop: $('modalBackdrop'),
    modalTitle: $('modalTitle'),
    modalMessage: $('modalMessage'),
    modalActions: $('modalActions')
  };

  /* ============================================================
   * 3. 图标注入
   * ============================================================ */
  function resolveIcon(key) {
    let cur = window.ICONS;
    if (!cur) return '';
    for (const p of String(key).split('.')) {
      cur = cur?.[p];
      if (!cur) return '';
    }
    return typeof cur === 'string' ? cur : '';
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
   * 4. Toast / 确认框
   * ============================================================ */
  function toast(message, type = '') {
    if (!els.toastContainer) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = message;
    els.toastContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 350);
    }, 2200);
  }

  function confirmDialog({ title, message, okText = '确定', cancelText = '取消', danger = false }) {
    return new Promise((resolve) => {
      if (!els.modalBackdrop) { resolve(false); return; }

      els.modalTitle.textContent = title || '';
      els.modalMessage.textContent = message || '';
      els.modalActions.innerHTML = '';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn';
      cancelBtn.textContent = cancelText;

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'btn' + (danger ? ' btn-danger' : '');
      okBtn.textContent = okText;

      els.modalActions.append(cancelBtn, okBtn);
      els.modalBackdrop.classList.add('is-visible');

      const close = (result) => {
        els.modalBackdrop.classList.remove('is-visible');
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
   * 5. 角色字典
   * ============================================================ */
  const CHAR_INDEX = (() => {
    const dict = window.ICON_DICT;
    const empty = { byName: new Map(), descNames: [], avatarUrl: new Map() };
    if (!dict?.characters) return empty;

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

    return { byName, descNames: sorted.slice().reverse(), avatarUrl };
  })();

  const getAvatarUrl = (name) => CHAR_INDEX.avatarUrl.get(name) || '';
  const getOrder = (name) => CHAR_INDEX.byName.get(name)?.order ?? 9999;

  /* ============================================================
   * 6. 头像渐变
   * ============================================================ */
  const avatarGradientCache = new Map();
  const avatarGradientPending = new Map();

  function getAvatarGradient(name) {
    if (avatarGradientCache.has(name)) return Promise.resolve(avatarGradientCache.get(name));
    if (avatarGradientPending.has(name)) return avatarGradientPending.get(name);

    const info = CHAR_INDEX.byName.get(name);
    if (!info || !window.ICON_LIB?.load) return Promise.resolve(null);

    const promise = (async () => {
      try {
        const dataURL = await window.ICON_LIB.load('characters', info.key, { size: 80 });
        avatarGradientCache.set(name, dataURL);
        return dataURL;
      } catch {
        return null;
      } finally {
        avatarGradientPending.delete(name);
      }
    })();

    avatarGradientPending.set(name, promise);
    return promise;
  }

  async function upgradeAvatars(root = document) {
    const imgs = root.querySelectorAll('img[data-avatar-name]');
    if (!imgs.length) return;

    const tasks = [];
    imgs.forEach((img) => {
      if (img.src.startsWith('data:')) return;
      const name = img.dataset.avatarName;
      if (!name) return;
      tasks.push(
        getAvatarGradient(name).then((url) => {
          if (!url || !document.contains(img)) return;
          img.src = url;
        })
      );
    });
    await Promise.all(tasks);
  }

  /* ============================================================
   * 7. 状态与存储
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
    statusFilter: 'all'
  };

  /* 已展开的套装 key —— 推荐列表与全部列表共用，天然双向同步 */
  const expandedKeys = new Set();

  function sanitizeOwnedList(list) {
    if (!Array.isArray(list)) return [];
    return list.filter((x) => typeof x === 'string' && !EXCLUDED_CHARS.has(x));
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
          out[key] = obj[key].filter((x) => typeof x === 'string' && !EXCLUDED_CHARS.has(x));
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
      return { status: 'unowned', text: '未拥有角色', completed: false };
    }

    const doneOwned = ownedChars.filter((c) => done.includes(c));
    const allOwnedDone = doneOwned.length === ownedChars.length;

    if (allOwnedDone && ownedChars.length === chars.length) {
      return { status: 'done', text: '已完成', completed: true };
    }
    if (allOwnedDone) {
      return { status: 'achieved', text: '已送完', completed: true };
    }
    return {
      status: 'incomplete',
      text: `${doneOwned.length} / ${ownedChars.length}`,
      completed: false
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
  function renderCharGrid() {
    const ownedSet = new Set(state.owned);
    const q = (els.gsCharSearch?.value || '').trim().toLowerCase();

    const names = CHAR_INDEX.descNames.filter((n) => !q || n.toLowerCase().includes(q));

    if (!names.length) {
      els.gsCharGrid.innerHTML =
        '<div class="empty-state"><span class="empty-icon" data-icon="ui.search"></span><span>没有匹配的角色</span></div>';
      injectIcons(els.gsCharGrid);
      return;
    }

    els.gsCharGrid.innerHTML = names.map((name) => {
      const url = getAvatarUrl(name);
      const initial = name.charAt(0);
      const avatarInner = url
        ? `<img src="${esc(url)}" alt="" loading="lazy" data-avatar-name="${esc(name)}">${esc(initial)}`
        : esc(initial);
      const cls = 'gs-char-cell ' + (ownedSet.has(name) ? 'owned' : 'not-owned');
      return (
        `<div class="${cls}" data-char="${esc(name)}" title="${esc(name)}">` +
          `<div class="gs-char-cell-avatar">${avatarInner}</div>` +
          `<div class="gs-char-cell-name">${esc(name)}</div>` +
        '</div>'
      );
    }).join('');

    if (els.gsCharCount) els.gsCharCount.textContent = String(state.owned.length);
    upgradeAvatars(els.gsCharGrid).catch(() => {});
  }

  function updateCharSectionState() {
    if (!els.gsCharSection) return;
    els.gsCharSection.classList.toggle('collapsed', state.owned.length > 0);
  }

  function toggleOwned(name) {
    if (!name || EXCLUDED_CHARS.has(name)) return;

    const idx = state.owned.indexOf(name);
    if (idx >= 0) state.owned.splice(idx, 1);
    else state.owned.push(name);
    saveOwned();

    if (els.gsCharCount) els.gsCharCount.textContent = String(state.owned.length);

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
    const isExpanded = expandedKeys.has(set.key);

    const thumbInner = url
      ? `<img src="${esc(url)}" alt="" loading="lazy">`
      : '<span class="gs-set-thumb-fallback">无图</span>';

    const cardCls = 'gs-set-item'
      + (isExpanded ? ' expanded' : '')
      + (prog.completed ? ' completed' : '');
    const tagHtml = showRecommendTag ? '<span class="gs-set-tag">推荐</span>' : '';

    const charsHtml = chars.length
      ? chars.map((name) => {
          const isOwned = ownedSet.has(name);
          const isDone = done.includes(name);
          const cellCls = 'gs-set-char '
            + (!isOwned ? 'not-owned' : isDone ? 'owned-done' : 'owned-pending');
          const charUrl = getAvatarUrl(name);
          const initial = name.charAt(0);
          const avatarInner = charUrl
            ? `<img src="${esc(charUrl)}" alt="" loading="lazy" data-avatar-name="${esc(name)}">${esc(initial)}`
            : esc(initial);
          return (
            `<div class="${cellCls}" data-char="${esc(name)}" title="${esc(name)}">` +
              `<div class="gs-set-char-avatar">${avatarInner}</div>` +
              `<div class="gs-set-char-name">${esc(name)}</div>` +
            '</div>'
          );
        }).join('')
      : '<div class="empty-state"><span>无偏好角色数据</span></div>';

    return (
      `<div class="${cardCls}" data-set-key="${esc(set.key)}">` +
        '<div class="gs-set-head" role="button" tabindex="0">' +
          tagHtml +
          `<div class="gs-set-thumb">${thumbInner}</div>` +
          '<div class="gs-set-main">' +
            `<div class="gs-set-name">${esc(set.name || '(未命名套装)')}</div>` +
            `<div class="gs-set-sub">${esc(set.region || '?')} · ${esc(typeLabel(set.type))}</div>` +
          '</div>' +
          `<div class="gs-set-progress ${prog.status}">${esc(prog.text)}</div>` +
          '<span class="gs-set-arrow" data-icon="ui.chevronDown"></span>' +
        '</div>' +
        '<div class="gs-set-body">' +
          `<div class="gs-set-chars">${charsHtml}</div>` +
        '</div>' +
      '</div>'
    );
  }

  function renderRecommend() {
    if (!els.gsRecommendList || !els.gsRecommendSection) return;

    const recs = computeRecommendations();
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
    upgradeAvatars(els.gsRecommendList).catch(() => {});
  }

  function renderAllSets() {
    if (!els.gsSetList) return;

    const kw = state.search.trim().toLowerCase();
    const filtered = state.sets.filter((s) => {
      if (state.regionFilter !== 'all' && s.region !== state.regionFilter) return false;
      if (state.typeFilter !== 'all' && s.type !== state.typeFilter) return false;

      if (state.statusFilter !== 'all') {
        const status = getSetProgress(s).status;
        if (state.statusFilter !== status) return false;
      }

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
        '<span class="empty-icon" data-icon="ui.inbox"></span>' +
        '<span>套装数据未加载<br>请检查 data.js 是否存在</span>';
      injectIcons(els.gsSetEmpty);
      return;
    }

    if (!filtered.length) {
      els.gsSetList.innerHTML = '';
      els.gsSetEmpty.hidden = false;
      els.gsSetEmpty.innerHTML =
        '<span class="empty-icon" data-icon="ui.search"></span>' +
        '<span>没有匹配的套装</span>';
      injectIcons(els.gsSetEmpty);
      return;
    }

    els.gsSetEmpty.hidden = true;
    els.gsSetList.innerHTML = filtered.map((s) => renderSetCardHtml(s)).join('');
    injectIcons(els.gsSetList);
    upgradeAvatars(els.gsSetList).catch(() => {});
  }

  function refreshDerivedSections() {
    if (els.gsFirstTip) els.gsFirstTip.hidden = state.owned.length > 0;
    renderRecommend();
    renderAllSets();
  }

  /* ============================================================
   * 11. 展开 / 勾选
   * ============================================================ */
  function toggleSetExpand(setKey) {
    if (!setKey) return;
    if (expandedKeys.has(setKey)) expandedKeys.delete(setKey);
    else expandedKeys.add(setKey);

    const on = expandedKeys.has(setKey);
    document
      .querySelectorAll(`.gs-set-item[data-set-key="${CSS.escape(setKey)}"]`)
      .forEach((el) => el.classList.toggle('expanded', on));
  }

  function toggleSetChar(setKey, name) {
    if (!setKey || !name || EXCLUDED_CHARS.has(name)) return;

    const ownedSet = new Set(state.owned);
    if (!ownedSet.has(name)) {
      toast(`未拥有「${name}」，先去上面的角色栏勾选`, 'error');
      return;
    }

    const set = state.sets.find((s) => s.key === setKey);
    if (!set || !(set.preferredCharacters || []).includes(name)) return;

    if (!state.completed[setKey]) state.completed[setKey] = [];
    const arr = state.completed[setKey];

    const idx = arr.indexOf(name);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(name);
    if (!arr.length) delete state.completed[setKey];

    saveCompleted();

    /* 两个列表一起重渲染 —— 展开状态由 expandedKeys 恢复 */
    renderRecommend();
    renderAllSets();
  }

  /* ============================================================
   * 12. 筛选下拉（共享 dropdown.js 负责开关）
   * ============================================================ */
  function renderDropdownOptions(panelEl, items, current) {
    if (!panelEl) return;
    panelEl.innerHTML = items.map((it) => {
      const active = it.value === current ? ' is-active' : '';
      return `<button type="button" class="dropdown-item${active}" data-value="${esc(it.value)}">${esc(it.label)}</button>`;
    }).join('');
  }

  function renderFilters() {
    renderDropdownOptions(
      els.gsRegionPanel,
      [{ value: 'all', label: '全部地区' }].concat(state.regions.map((r) => ({ value: r, label: r }))),
      state.regionFilter
    );
    renderDropdownOptions(
      els.gsTypePanel,
      [
        { value: 'all', label: '全部类型' },
        { value: 'interior', label: '室内' },
        { value: 'exterior', label: '室外' }
      ],
      state.typeFilter
    );
    renderDropdownOptions(els.gsStatusPanel, STATUS_OPTIONS, state.statusFilter);
  }

  /* ============================================================
   * 13. 导入 / 导出 / 重置
   * ============================================================ */
  function resetFiltersUI() {
    state.search = '';
    state.regionFilter = 'all';
    state.typeFilter = 'all';
    state.statusFilter = 'all';

    if (els.gsSearch) els.gsSearch.value = '';
    if (els.gsSearchClear) els.gsSearchClear.classList.remove('is-visible');
    if (els.gsRegionLabel) els.gsRegionLabel.textContent = '全部地区';
    if (els.gsTypeLabel) els.gsTypeLabel.textContent = '全部类型';
    if (els.gsStatusLabel) els.gsStatusLabel.textContent = '全部状态';
    if (els.gsCharSearch) els.gsCharSearch.value = '';

    renderFilters();
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

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
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

    const validKeys = new Set(state.sets.map((s) => s.key));

    state.owned = sanitizeOwnedList(data.owned);
    state.completed = {};
    if (data.completed) {
      for (const key in data.completed) {
        if (!validKeys.has(key)) continue;
        if (!Array.isArray(data.completed[key])) continue;
        state.completed[key] = data.completed[key]
          .filter((x) => typeof x === 'string' && !EXCLUDED_CHARS.has(x));
      }
    }
    state.uid = typeof data.uid === 'string' ? data.uid : '';
    if (els.uidInput) els.uidInput.value = state.uid;

    saveOwned();
    saveCompleted();
    saveUid();

    resetFiltersUI();
    updateCharSectionState();
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
    if (els.uidInput) els.uidInput.value = '';

    expandedKeys.clear();

    saveOwned();
    saveCompleted();
    saveUid();

    resetFiltersUI();
    updateCharSectionState();
    renderCharGrid();
    refreshDerivedSections();

    toast('已重置', 'success');
  }

  /* ============================================================
   * 14. 事件绑定
   * ============================================================ */
  function onSetListClick(e) {
    const head = e.target.closest('.gs-set-head');
    if (head) {
      const item = head.closest('.gs-set-item');
      if (item?.dataset.setKey) toggleSetExpand(item.dataset.setKey);
      return;
    }

    const char = e.target.closest('.gs-set-char');
    if (char) {
      const item = char.closest('.gs-set-item');
      if (!item?.dataset.setKey) return;
      const name = char.dataset.char;
      if (!name) return;
      toggleSetChar(item.dataset.setKey, name);
    }
  }

  function onSetListKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const head = e.target.closest('.gs-set-head');
    if (!head) return;
    e.preventDefault();
    const item = head.closest('.gs-set-item');
    if (item?.dataset.setKey) toggleSetExpand(item.dataset.setKey);
  }

  function bindEvents() {
    /* ---- 区块折叠（三处行为一致） ---- */
    els.btnCharToggle?.addEventListener('click', () => {
      els.gsCharSection.classList.toggle('collapsed');
    });
    els.btnRecommendToggle?.addEventListener('click', () => {
      els.gsRecommendSection.classList.toggle('collapsed');
    });
    els.btnAllToggle?.addEventListener('click', () => {
      els.gsAllSection.classList.toggle('collapsed');
    });

    /* ---- 角色栏 ---- */
    let charSearchTimer = null;
    els.gsCharSearch?.addEventListener('input', () => {
      clearTimeout(charSearchTimer);
      charSearchTimer = setTimeout(renderCharGrid, 120);
    });

    els.gsCharGrid?.addEventListener('click', (e) => {
      const cell = e.target.closest('.gs-char-cell');
      if (!cell) return;
      toggleOwned(cell.dataset.char);
    });

    /* ---- 套装列表（推荐 + 全部） ---- */
    [els.gsRecommendList, els.gsSetList].forEach((list) => {
      if (!list) return;
      list.addEventListener('click', onSetListClick);
      list.addEventListener('keydown', onSetListKeydown);
    });

    /* ---- 搜索 ---- */
    let searchTimer = null;
    els.gsSearch?.addEventListener('input', () => {
      els.gsSearchClear?.classList.toggle('is-visible', els.gsSearch.value.length > 0);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = els.gsSearch.value;
        renderAllSets();
      }, 150);
    });

    els.gsSearchClear?.addEventListener('click', () => {
      els.gsSearch.value = '';
      els.gsSearchClear.classList.remove('is-visible');
      state.search = '';
      renderAllSets();
    });

    /* ---- 筛选下拉：共享 dropdown.js 派发 dropdown:select ---- */
    document.addEventListener('dropdown:select', (e) => {
      const { dropdown, value } = e.detail || {};
      const filter = dropdown?.dataset?.filter;
      if (!filter || value == null) return;

      if (filter === 'region') {
        state.regionFilter = value;
        if (els.gsRegionLabel) {
          els.gsRegionLabel.textContent = value === 'all' ? '全部地区' : value;
        }
      } else if (filter === 'type') {
        state.typeFilter = value;
        if (els.gsTypeLabel) {
          els.gsTypeLabel.textContent =
            value === 'all' ? '全部类型' : value === 'interior' ? '室内' : '室外';
        }
      } else if (filter === 'status') {
        state.statusFilter = value;
        const opt = STATUS_OPTIONS.find((o) => o.value === value);
        if (els.gsStatusLabel) els.gsStatusLabel.textContent = opt ? opt.label : '全部状态';
      }

      renderFilters();
      renderAllSets();
    });

    /* ---- 顶栏 ---- */
    if (els.uidInput) {
      els.uidInput.value = state.uid;
      els.uidInput.addEventListener('input', () => {
        const filtered = els.uidInput.value.replace(/\D/g, '').slice(0, 15);
        if (els.uidInput.value !== filtered) els.uidInput.value = filtered;
        state.uid = filtered;
        saveUid();
      });
    }

    els.btnExport?.addEventListener('click', () => {
      if (!state.owned.length && !Object.keys(state.completed).length) {
        toast('还没有可导出的记录', 'error');
        return;
      }
      exportData();
    });

    els.btnImport?.addEventListener('click', () => els.fileInput?.click());
    els.fileInput?.addEventListener('change', (ev) => {
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

    els.btnReset?.addEventListener('click', resetAll);
  }

  /* ============================================================
   * 15. 父页面主题推送 + 图片失败兜底
   * ============================================================ */
  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || typeof data !== 'object') return;
    if (data.type !== 'theme') return;
    if (data.theme !== 'dark' && data.theme !== 'light') return;
    if (document.documentElement.getAttribute('data-theme') === data.theme) return;

    document.documentElement.classList.add('theme-switching');
    document.documentElement.setAttribute('data-theme', data.theme);
    void document.documentElement.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-switching');
      });
    });
  });

  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (!img.closest('.gs-set-thumb, .gs-char-cell-avatar, .gs-set-char-avatar')) return;
    img.remove();
  }, true);

  /* ============================================================
   * 16. 启动
   * ============================================================ */
  (async function init() {
    try {
      try {
        await window.__bootPromise;
      } catch (e) {
        console.warn('[boot]', e);
      }

      if (typeof window.ICONS === 'undefined') {
        throw new Error('图标库未加载（ui-icons.js），请刷新重试');
      }

      const data = window.HOMEWORLD_GIFT_SETS;
      if (Array.isArray(data?.sets)) state.sets = data.sets.slice();
      if (Array.isArray(data?.regions)) state.regions = data.regions.slice();

      state.owned = loadOwned();
      state.completed = loadCompleted();
      state.uid = loadUid();

      injectIcons(document);
      renderFilters();
      bindEvents();

      updateCharSectionState();
      renderCharGrid();
      refreshDerivedSections();

      document.body.classList.add('ready');
    } catch (err) {
      console.error('[init]', err);
      const bootEl = document.querySelector('.boot-loading');
      if (bootEl) {
        bootEl.style.whiteSpace = 'pre-wrap';
        bootEl.textContent = '初始化失败：' + (err && err.message ? err.message : String(err)) +
          '\n请刷新重试；若持续失败，请把这条信息反馈给维护者。';
      }
    }
  })();
})();
