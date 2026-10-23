/* ============================================================
 * 尘歌壶赠礼套装编辑器 · app.js
 * ------------------------------------------------------------
 * v2 变更（对齐 index.html v2 / style.css v2）：
 *  1. 【图标】删除 FALLBACK_ICONS，全部改用 ui.reload / ui.reorder /
 *     ui.back / ui.file / ui.close
 *  2. 【主题】删除 THEME_KEY / currentTheme / applyTheme，改用 Theme.toggle()
 *  3. 【类名】Toast / 弹窗 / 搜索清除 → .is-visible
 *  4. 【下拉】删除 tab-sheet 一整套（openSheet / els.sheet*），
 *     筛选改用共享 dropdown.js + dropdown:select
 *  5. 【联想】.ed-combobox* → 共享 .combobox*，highlight → is-highlight
 *  6. 【表单】.ed-group / .ed-label / .ed-row-2 → .field / .field-label / .field-row
 *  7. 【按钮】.btn-sm / .ios-btn-fill → .btn；.ic → .icon-slot
 *  8. 【状态类】.active → .is-active；.warn → .is-warn
 *  9. 【健壮】init 改为 async + 等待 __bootPromise + 全流程 try/catch
 * 10. 「重排 ID」按钮位置在 HTML 里已移到列表底部，ID 不变、逻辑不变
 * ============================================================ */

(function () {
  'use strict';

  const DRAFT_KEY = 'genshin_homeworld_gift_sets_editor_draft_v1';
  const CHAR_SPLIT_RE = /[\s，,、;；]+/;
  const CHAR_SPLIT_TEST = /[\s，,、;；]/;

  /* ============================================================
   * 1. 图标
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
   * 2. 工具函数 + 地区/类型推断
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

  const escJs = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/\t/g, '\\t');
  };

  const todayStr = () => {
    const d = new Date();
    return (
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
    );
  };

  const REGION_CODE_MAP = {
    mond: '蒙德',
    liyue: '璃月',
    dq: '稻妻',
    xm: '须弥',
    fd: '枫丹',
    nt: '纳塔',
    ndkl: '挪德卡莱',
    zd: '至冬'
  };

  function inferType(key) {
    if (!key) return null;
    if (/exterior/i.test(key)) return 'exterior';
    if (/interior/i.test(key)) return 'interior';
    return null;
  }

  function inferRegion(key) {
    if (!key) return null;
    const m = key.match(/(?:Exterior|Interior)_([A-Za-z]+)(?:_|$)/i);
    if (!m) return null;
    return REGION_CODE_MAP[m[1].toLowerCase()] || null;
  }

  const typeLabel = (t) => (t === 'exterior' ? '室外' : t === 'interior' ? '室内' : '?');

  /* ============================================================
   * 3. DOM 引用
   * ============================================================ */
  const $ = (id) => document.getElementById(id);
  const els = {
    dirtyDot: $('dirtyDot'),
    btnReload: $('btnReload'),
    btnImport: $('btnImport'),
    btnRenumber: $('btnRenumber'),
    btnExport: $('btnExport'),
    btnTheme: $('btnTheme'),
    searchInput: $('searchInput'),
    searchClear: $('searchClear'),
    typeLabel: $('typeLabel'),
    typePanel: $('typePanel'),
    regionLabel: $('regionLabel'),
    regionPanel: $('regionPanel'),
    edListPane: $('edListPane'),
    edList: $('edList'),
    btnAdd: $('btnAdd'),
    edFormPane: $('edFormPane'),
    fileInput: $('fileInput'),
    toastContainer: $('toastContainer'),
    modalBackdrop: $('modalBackdrop'),
    modalTitle: $('modalTitle'),
    modalMessage: $('modalMessage'),
    modalActions: $('modalActions')
  };

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
   * 5. 数据骨架 + 规范化
   * ============================================================ */
  function defaultData() {
    return {
      config: {
        image: {
          prefix: 'https://gi.yatta.moe/assets/UI/furnitureSuite/',
          ext: '.png'
        }
      },
      meta: { total: 0, updatedAt: '', source: '' },
      regions: ['蒙德', '璃月', '稻妻', '须弥', '枫丹', '纳塔', '挪德卡莱', '至冬'],
      sets: []
    };
  }

  function normalizeData(data) {
    const base = defaultData();
    if (!data || typeof data !== 'object') return base;

    if (!data.config?.image) data.config = base.config;
    else {
      data.config.image.prefix ||= base.config.image.prefix;
      data.config.image.ext ||= base.config.image.ext;
    }
    if (!data.meta) data.meta = base.meta;
    if (!Array.isArray(data.sets)) data.sets = [];

    const rawRegions = Array.isArray(data.regions) ? data.regions : [];
    const regionSet = new Set();
    for (const r of rawRegions) {
      if (!r || r === '蒙德/璃月') continue;
      regionSet.add(r);
    }
    regionSet.add('蒙德');
    regionSet.add('璃月');

    const ordered = [];
    for (const r of base.regions) {
      if (regionSet.has(r)) {
        ordered.push(r);
        regionSet.delete(r);
      }
    }
    for (const r of regionSet) ordered.push(r);
    data.regions = ordered.length ? ordered : base.regions;

    data.sets.forEach((s) => {
      s.preferredCharacters ||= [];
      if (s.region === '蒙德/璃月') {
        const inferred = inferRegion(s.key);
        if (inferred) s.region = inferred;
      }
    });

    return data;
  }

  /* ============================================================
   * 6. 角色字典（含 order）
   * ============================================================ */
  function buildCharMaps() {
    const keyMap = new Map();
    const orderMap = new Map();
    const list = [];
    const dict = window.ICON_DICT;
    if (!dict?.characters) return { keyMap, orderMap, list };
    for (const [key, item] of Object.entries(dict.characters)) {
      if (!item?.name) continue;
      const order = item.order ?? 9999;
      keyMap.set(item.name, key);
      orderMap.set(item.name, order);
      list.push({ name: item.name, order });
    }
    list.sort((a, b) => a.order - b.order);
    return { keyMap, orderMap, list: list.map((x) => x.name) };
  }

  const charMaps = buildCharMaps();

  function sortCharsByOrder(chars) {
    if (!Array.isArray(chars)) return [];
    return chars.slice().sort((a, b) => {
      const oa = charMaps.orderMap.get(a) ?? 9999;
      const ob = charMaps.orderMap.get(b) ?? 9999;
      return oa - ob;
    });
  }

  /* ============================================================
   * 7. 状态
   * ============================================================ */
  const state = {
    data: null,
    selectedId: null,
    isNew: false,
    search: '',
    typeFilter: 'all',
    regionFilter: 'all',
    dirty: false,
    charKeyMap: charMaps.keyMap,
    charList: charMaps.list,
    chipCache: new Map(),
    chipPromiseCache: new Map()
  };

  /* ============================================================
   * 8. URL
   * ============================================================ */
  function getSetImageUrl(set) {
    if (!set?.key || !state.data?.config?.image) return '';
    const { prefix, ext } = state.data.config.image;
    return prefix + set.key + ext;
  }

  function parseSetUrl(text) {
    const raw = (text || '').trim();
    if (!raw) return null;
    let url;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }
    const last = url.pathname.split('/').filter(Boolean).pop() || '';
    if (!last) return null;
    const key = last.replace(/\.[^.]+$/, '');
    if (!/^UI_[A-Za-z0-9_]+$/i.test(key)) return null;
    return key;
  }

  /* ============================================================
   * 9. 草稿
   * ============================================================ */
  let draftTimer = null;

  function saveDraft() {
    if (!state.data) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state.data)); } catch {}
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }
  function markDirty() {
    state.dirty = true;
    if (els.dirtyDot) els.dirtyDot.hidden = false;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 400);
  }
  function clearDirty() {
    state.dirty = false;
    if (els.dirtyDot) els.dirtyDot.hidden = true;
    clearTimeout(draftTimer);
  }

  /* ============================================================
   * 10. 解析 / 序列化
   * ============================================================ */
  function parseDataJs(text) {
    const prev = window.HOMEWORLD_GIFT_SETS;
    try {
      new Function(text)();
      const data = window.HOMEWORLD_GIFT_SETS;
      if (!data || typeof data !== 'object') throw new Error('解析结果不是对象');
      return normalizeData(data);
    } catch (e) {
      throw new Error(e.message || '语法错误');
    } finally {
      window.HOMEWORLD_GIFT_SETS = prev;
    }
  }

  function serializeData(data) {
    const regionSet = new Set(data.regions);
    for (const s of data.sets) {
      if (s.region && s.region !== '蒙德/璃月' && !regionSet.has(s.region)) {
        regionSet.add(s.region);
        data.regions.push(s.region);
      }
    }

    const sorted = data.sets.slice().sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

    const lines = [];
    lines.push('/* ============================================================');
    lines.push(' * 尘歌壶赠礼套装 · 数据字典');
    lines.push(' * 生成时间：' + todayStr());
    lines.push(' * ------------------------------------------------------------');
    lines.push(' * · key 不含扩展名');
    lines.push(' *   图片 URL = config.image.prefix + key + config.image.ext');
    lines.push(' * · type: "exterior"（室外）| "interior"（室内）');
    lines.push(' * · preferredCharacters 存角色中文名，按 icon-dict order 升序');
    lines.push(' * · sets 按 id 升序排列');
    lines.push(' * ============================================================ */');
    lines.push('');
    lines.push('window.HOMEWORLD_GIFT_SETS = {');
    lines.push('');
    lines.push('  config: {');
    lines.push('    image: {');
    lines.push(`      prefix: '${escJs(data.config.image.prefix)}',`);
    lines.push(`      ext: '${escJs(data.config.image.ext)}'`);
    lines.push('    }');
    lines.push('  },');
    lines.push('');
    lines.push('  meta: {');
    lines.push(`    total: ${data.sets.length},`);
    lines.push(`    updatedAt: '${todayStr()}',`);
    lines.push(`    source: '${escJs(data.meta.source || '')}'`);
    lines.push('  },');
    lines.push('');
    lines.push('  regions: [');
    data.regions.forEach((r, i) => {
      const comma = i === data.regions.length - 1 ? '' : ',';
      lines.push(`    '${escJs(r)}'${comma}`);
    });
    lines.push('  ],');
    lines.push('');
    lines.push('  sets: [');

    sorted.forEach((s, i) => {
      const comma = i === sorted.length - 1 ? '' : ',';
      const sortedChars = sortCharsByOrder(s.preferredCharacters || []);
      const chars = sortedChars.map((c) => `'${escJs(c)}'`).join(', ');
      lines.push(
        `    { id: ${s.id}, key: '${escJs(s.key)}', name: '${escJs(s.name)}', ` +
        `type: '${escJs(s.type)}', region: '${escJs(s.region)}', preferredCharacters: [${chars}] }${comma}`
      );
    });

    lines.push('  ]');
    lines.push('};');
    return lines.join('\n');
  }

  /* ============================================================
   * 11. 排序 / 过滤
   * ============================================================ */
  function setComparator() {
    return (a, b) => (a.id ?? 0) - (b.id ?? 0);
  }

  function allSortedSets() {
    if (!state.data) return [];
    return state.data.sets.slice().sort(setComparator());
  }

  function getFilteredSets() {
    if (!state.data) return [];
    const kw = state.search.trim().toLowerCase();
    const list = state.data.sets.filter((s) => {
      if (state.typeFilter !== 'all' && s.type !== state.typeFilter) return false;
      if (state.regionFilter !== 'all' && s.region !== state.regionFilter) return false;
      if (kw) {
        const hay = (s.name || '') + ' ' + (s.preferredCharacters || []).join(' ');
        if (!hay.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
    return list.sort(setComparator());
  }

  /* ============================================================
   * 12. 渲染列表
   * ============================================================ */
  function renderList() {
    if (!els.edList) return;

    if (!state.data) {
      els.edList.innerHTML = '<div class="ed-list-empty">数据未加载<br>点「重载」或「导入」</div>';
      return;
    }
    const list = getFilteredSets();
    if (!list.length) {
      const msg = state.data.sets.length
        ? '没有匹配的套装'
        : '暂无套装<br>点下方「新增套装」开始';
      els.edList.innerHTML = `<div class="ed-list-empty">${msg}</div>`;
      return;
    }

    els.edList.innerHTML = list.map((s) => {
      const url = getSetImageUrl(s);
      const thumbInner = url ? `<img src="${esc(url)}" alt="" loading="lazy">` : '';
      const active = s.id === state.selectedId ? ' is-active' : '';
      const chars = (s.preferredCharacters || []).length;
      const sub = [s.region || '?', typeLabel(s.type), chars + ' 人'].join(' · ');
      return (
        `<div class="ed-list-item${active}" data-id="${s.id}">` +
          `<div class="pg-list-thumb">${thumbInner}</div>` +
          '<div class="ed-list-item-body">' +
            `<div class="ed-list-item-title">${esc(s.name || '(未命名套装)')}</div>` +
            `<div class="ed-list-item-sub">${esc(sub)}</div>` +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ============================================================
   * 13. 渲染 chips（按 order 升序）
   * ============================================================ */
  function buildChipAvatar(name) {
    const key = state.charKeyMap.get(name);
    const initial = name ? name.charAt(0) : '?';
    if (!key) return esc(initial);
    const cached = state.chipCache.get(key);
    if (cached) return `<img src="${esc(cached)}" alt="">`;
    const originalUrl = window.ICON_LIB?.getPath?.('characters', key) || '';
    return originalUrl
      ? `<img src="${esc(originalUrl)}" alt="">${esc(initial)}`
      : esc(initial);
  }

  function renderChipHtml(name) {
    return (
      `<span class="pg-chip" data-char="${esc(name)}">` +
        `<span class="pg-chip-avatar">${buildChipAvatar(name)}</span>` +
        `<span class="pg-chip-name">${esc(name)}</span>` +
        `<button type="button" class="pg-chip-remove" data-remove="${esc(name)}">` +
          '<span class="icon-slot" data-icon="ui.close"></span>' +
        '</button>' +
      '</span>'
    );
  }

  function renderChipsInner(entry) {
    const chars = sortCharsByOrder(entry.preferredCharacters || []);
    if (!chars.length) return '<span class="pg-char-empty">尚未添加角色</span>';
    return chars.map(renderChipHtml).join('');
  }

  function appendChips(entry, newNames) {
    const listEl = els.edFormPane.querySelector('#pgCharList');
    if (!listEl || !newNames.length) return;
    listEl.innerHTML = renderChipsInner(entry);
    injectIcons(listEl);
    upgradeChipImages(entry);
  }

  function renderCharArea(entry) {
    const area = els.edFormPane.querySelector('#pgCharArea');
    if (!area) return;
    area.innerHTML =
      `<div class="pg-char-list" id="pgCharList">${renderChipsInner(entry)}</div>` +
      '<div class="combobox" data-combobox="character-add">' +
        '<div class="combobox-input-wrap">' +
          '<input type="text" placeholder="输入角色名，多个用逗号/空格分隔" autocomplete="off" spellcheck="false">' +
        '</div>' +
        '<div class="combobox-popup" hidden></div>' +
      '</div>';

    injectIcons(area);
    bindCharAreaEvents(entry);
    upgradeChipImages(entry);
  }

  function processCharInput(input, entry, { blur = false } = {}) {
    const val = input.value;
    if (!val) return;

    const hasSep = CHAR_SPLIT_TEST.test(val);

    if (!hasSep) {
      if (!blur) return;
      const name = val.trim();
      if (!name) { input.value = ''; return; }
      if (state.charKeyMap.has(name) && !entry.preferredCharacters.includes(name)) {
        entry.preferredCharacters.push(name);
        markDirty();
        appendChips(entry, [name]);
        renderList();
        updatePreview(entry);
        input.value = '';
      }
      return;
    }

    const parts = val.split(CHAR_SPLIT_RE);
    const lastIsSep = parts[parts.length - 1] === '';

    let remaining = '';
    let toProcess;
    if (blur || lastIsSep) {
      toProcess = parts.filter(Boolean);
    } else {
      remaining = parts[parts.length - 1];
      toProcess = parts.slice(0, -1);
    }

    const toAdd = [];
    const notInDict = [];
    for (const name of toProcess) {
      if (!name) continue;
      if (entry.preferredCharacters.includes(name)) continue;
      if (state.charKeyMap.has(name)) {
        toAdd.push(name);
      } else {
        notInDict.push(name);
      }
    }

    input.value = remaining;

    if (toAdd.length) {
      entry.preferredCharacters.push(...toAdd);
      markDirty();
      appendChips(entry, toAdd);
      renderList();
      updatePreview(entry);
    }

    if (notInDict.length) {
      toast('字典中未找到：' + notInDict.join('、'), 'error');
    }

    const popup = input.closest('.combobox')?.querySelector('.combobox-popup');
    if (popup) popup.hidden = true;
  }

  function bindCharAreaEvents(entry) {
    const listEl = els.edFormPane.querySelector('#pgCharList');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.pg-chip-remove');
        if (!btn) return;
        const name = btn.dataset.remove;
        const idx = entry.preferredCharacters.indexOf(name);
        if (idx < 0) return;
        entry.preferredCharacters.splice(idx, 1);
        markDirty();
        renderCharArea(entry);
        renderList();
        updatePreview(entry);
      });
    }

    setupCombobox(
      els.edFormPane.querySelector('.combobox[data-combobox="character-add"]'),
      {
        items: () => state.charList.filter((n) => !entry.preferredCharacters.includes(n)),
        allowCustom: true,
        multiline: true,
        onSelect: (name) => {
          const trimmed = (name || '').trim();
          if (!trimmed) return;
          if (entry.preferredCharacters.includes(trimmed)) return;
          entry.preferredCharacters.push(trimmed);
          markDirty();
          renderCharArea(entry);
          renderList();
          updatePreview(entry);
        }
      }
    );

    const input = els.edFormPane.querySelector(
      '.combobox[data-combobox="character-add"] input'
    );
    if (!input) return;

    let composing = false;
    let lastValue = input.value;

    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; });

    input.addEventListener('input', (e) => {
      if (composing) return;

      const currentValue = input.value;
      const delta = currentValue.length - lastValue.length;
      lastValue = currentValue;

      const isPasteByType =
        e.inputType === 'insertFromPaste' ||
        e.inputType === 'insertFromYank';
      const isPasteByLength =
        delta >= 4 && CHAR_SPLIT_TEST.test(currentValue);
      const isPaste = isPasteByType || isPasteByLength;

      processCharInput(input, entry, { blur: isPaste });
    }, true);

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (composing) return;
      if (CHAR_SPLIT_TEST.test(input.value)) {
        e.preventDefault();
        e.stopPropagation();
        processCharInput(input, entry, { blur: true });
      }
    }, true);

    input.addEventListener('blur', () => {
      setTimeout(() => processCharInput(input, entry, { blur: true }), 160);
    });
  }

  async function getChipImage(name) {
    const key = state.charKeyMap.get(name);
    if (!key) return null;
    if (state.chipCache.has(key)) return state.chipCache.get(key);
    if (state.chipPromiseCache.has(key)) return state.chipPromiseCache.get(key);
    if (!window.ICON_LIB?.load) return null;

    const promise = (async () => {
      try {
        const dataURL = await window.ICON_LIB.load('characters', key, { size: 128 });
        state.chipCache.set(key, dataURL);
        return dataURL;
      } catch {
        return null;
      } finally {
        state.chipPromiseCache.delete(key);
      }
    })();
    state.chipPromiseCache.set(key, promise);
    return promise;
  }

  async function upgradeChipImages(entry) {
    const chips = els.edFormPane.querySelectorAll('.pg-chip[data-char]');
    const tasks = [];
    for (const chip of chips) {
      const name = chip.dataset.char;
      if (!name) continue;
      const key = state.charKeyMap.get(name);
      if (!key) continue;
      const avatar = chip.querySelector('.pg-chip-avatar');
      if (!avatar) continue;
      const img = avatar.querySelector('img');
      if (img && state.chipCache.has(key)) continue;

      tasks.push(
        getChipImage(name).then((dataURL) => {
          if (!dataURL) return;
          if (!document.contains(chip)) return;
          const a = chip.querySelector('.pg-chip-avatar');
          if (!a) return;
          a.innerHTML = `<img src="${esc(dataURL)}" alt="">`;
        })
      );
    }
    await Promise.all(tasks);
  }

  /* ============================================================
   * 14. 渲染表单
   * ============================================================ */
  function buildPreviewSub(entry) {
    const parts = [];
    if (entry.region) parts.push(entry.region);
    if (entry.type === 'exterior' || entry.type === 'interior') parts.push(typeLabel(entry.type));
    const n = (entry.preferredCharacters || []).length;
    if (n) parts.push(n + ' 角色');
    parts.push('id ' + (entry.id ?? 0));
    return parts.join(' · ');
  }

  function renderPreviewHtml(entry) {
    const url = getSetImageUrl(entry);
    const frameInner = url
      ? `<img src="${esc(url)}" alt="">`
      : '<span class="pg-preview-fallback">尚未设置图片</span>';
    const name = entry.name || '(未命名套装)';
    return (
      '<div class="pg-preview">' +
        `<div class="pg-preview-frame">${frameInner}</div>` +
        '<div class="pg-preview-info">' +
          `<div class="pg-preview-name">${esc(name)}</div>` +
          `<div class="pg-preview-sub">${esc(buildPreviewSub(entry))}</div>` +
        '</div>' +
      '</div>'
    );
  }

  function updatePreview(entry) {
    const node = els.edFormPane.querySelector('.pg-preview');
    if (!node) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = renderPreviewHtml(entry);
    node.replaceWith(tmp.firstElementChild);
  }

  function renderForm() {
    if (!els.edFormPane) return;

    if (!state.data) {
      els.edFormPane.innerHTML =
        '<div class="ed-form-empty">' +
          '<span class="empty-icon" data-icon="ui.file"></span>' +
          '<div>数据未加载<br>请点右上角「重载」或「导入」</div>' +
        '</div>';
      injectIcons(els.edFormPane);
      return;
    }

    if (state.selectedId == null) {
      els.edFormPane.innerHTML =
        '<div class="ed-form-empty">' +
          '<div>从左侧选择套装开始编辑<br>或点击「新增套装」</div>' +
        '</div>';
      return;
    }

    const entry = state.data.sets.find((x) => x.id === state.selectedId);
    if (!entry) {
      els.edFormPane.innerHTML = '<div class="ed-form-empty"><div>套装不存在</div></div>';
      return;
    }

    const segInterior = entry.type === 'interior' ? ' is-active' : '';
    const segExterior = entry.type === 'exterior' ? ' is-active' : '';
    const urlValue = getSetImageUrl(entry);
    const keyHint = entry.key ? 'key: ' + entry.key : '';

    els.edFormPane.innerHTML =
      '<div class="ed-form">' +

        '<button type="button" class="btn ed-mobile-back" id="btnMobileBack">' +
          '<span class="icon-slot" data-icon="ui.back"></span>' +
          '<span class="btn-text">返回列表</span>' +
        '</button>' +

        renderPreviewHtml(entry) +

        '<div class="field-row">' +
          '<div class="field">' +
            '<span class="field-label">id <span class="ed-label-hint">可手动改，需唯一</span></span>' +
            '<div class="ed-id-wrap">' +
              `<input type="text" data-field="id" value="${esc(entry.id)}" inputmode="numeric" autocomplete="off">` +
              '<button type="button" class="float-btn" id="btnIdUp" title="上移">' +
                '<span class="icon-slot" data-icon="ui.arrowUp"></span>' +
              '</button>' +
              '<button type="button" class="float-btn" id="btnIdDown" title="下移">' +
                '<span class="icon-slot icon-flip-y" data-icon="ui.arrowUp"></span>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<span class="field-label">地区 <span class="ed-label-hint">输入可新建</span></span>' +
            '<div class="combobox" data-combobox="region">' +
              '<div class="combobox-input-wrap">' +
                `<input type="text" data-field="region" value="${esc(entry.region || '')}" autocomplete="off" spellcheck="false">` +
              '</div>' +
              '<div class="combobox-popup" hidden></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<span class="field-label">套装图 URL <span class="ed-label-hint">粘贴后自动识别 key / 类型 / 地区</span></span>' +
          '<div class="pg-url-wrap">' +
            `<input type="text" id="pgUrlInput" value="${esc(urlValue)}" placeholder="粘贴图片直链…" autocomplete="off" spellcheck="false">` +
            '<button type="button" class="btn" id="btnRecognize">识别</button>' +
          '</div>' +
          `<div class="pg-url-key" id="pgUrlKey">${esc(keyHint)}</div>` +
        '</div>' +

        '<div class="field">' +
          '<span class="field-label">名称</span>' +
          `<input type="text" data-field="name" value="${esc(entry.name || '')}">` +
        '</div>' +

        '<div class="field">' +
          '<span class="field-label">室内 / 室外</span>' +
          '<div class="seg-control" id="pgTypeSeg">' +
            `<button type="button" class="seg-btn${segInterior}" data-type="interior">室内</button>` +
            `<button type="button" class="seg-btn${segExterior}" data-type="exterior">室外</button>` +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<span class="field-label">偏好角色 <span class="ed-label-hint">支持逗号/空格/顿号分隔批量输入；显示按 icon-dict order 升序</span></span>' +
          '<div id="pgCharArea"></div>' +
        '</div>' +

        '<div class="ed-actions">' +
          '<button type="button" class="btn btn-danger" id="btnDelete">删除此套</button>' +
        '</div>' +

      '</div>';

    injectIcons(els.edFormPane);
    renderCharArea(entry);
    bindFormEvents(entry);
  }

  /* ============================================================
   * 15. 表单事件
   * ============================================================ */
  function bindFormEvents(entry) {
    els.edFormPane.querySelectorAll('[data-field]').forEach((input) => {
      const field = input.dataset.field;
      if (field === 'region') return;

      input.addEventListener('input', () => {
        let value;
        if (field === 'id') {
          const num = parseInt(input.value, 10);
          const invalid =
            Number.isNaN(num) ||
            state.data.sets.some((x) => x !== entry && x.id === num);
          input.classList.toggle('ed-invalid', invalid);
          value = Number.isNaN(num) ? 0 : num;
          if (entry.id !== value) {
            entry.id = value;
            state.selectedId = value;
          }
        } else {
          value = input.value;
          entry[field] = value;
        }
        markDirty();
        renderList();
        updatePreview(entry);
      });
    });

    setupCombobox(
      els.edFormPane.querySelector('.combobox[data-combobox="region"]'),
      {
        items: () => state.data.regions,
        allowCustom: true,
        customLabel: (r) => '＋ 新增地区：' + r,
        onSelect: (r) => {
          entry.region = r;
          if (!state.data.regions.includes(r)) state.data.regions.push(r);
          markDirty();
          renderFilters();
          renderList();
          updatePreview(entry);
        }
      }
    );

    const urlInput = $('pgUrlInput');
    const urlKeyEl = $('pgUrlKey');
    const btnRecognize = $('btnRecognize');

    const syncTypeSeg = () => {
      const seg = $('pgTypeSeg');
      if (!seg) return;
      seg.querySelectorAll('.seg-btn').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.type === entry.type);
      });
    };

    const syncRegionInput = () => {
      const regionInput = els.edFormPane.querySelector('input[data-field="region"]');
      if (regionInput) regionInput.value = entry.region || '';
    };

    const tryApply = (text) => {
      const normalized = (text || '').trim();

      if (!normalized) {
        if (entry.key) {
          entry.key = '';
          urlInput.classList.remove('ed-invalid');
          urlKeyEl.textContent = '';
          urlKeyEl.classList.remove('is-warn');
          markDirty();
          renderList();
          updatePreview(entry);
        }
        return false;
      }

      const key = parseSetUrl(normalized);
      if (!key) {
        urlInput.classList.add('ed-invalid');
        urlKeyEl.textContent = '无法识别该 URL，请检查链接';
        urlKeyEl.classList.add('is-warn');
        return false;
      }

      if (key === entry.key) return false;

      urlInput.classList.remove('ed-invalid');
      urlKeyEl.classList.remove('is-warn');
      entry.key = key;

      const inferredType = inferType(key);
      if (inferredType) entry.type = inferredType;

      const inferredRegion = inferRegion(key);
      if (inferredRegion) {
        entry.region = inferredRegion;
        if (!state.data.regions.includes(inferredRegion)) {
          state.data.regions.push(inferredRegion);
        }
      }

      urlKeyEl.textContent = 'key: ' + key;
      markDirty();
      renderFilters();
      renderList();
      updatePreview(entry);
      syncTypeSeg();
      syncRegionInput();

      return true;
    };

    urlInput.addEventListener('blur', () => {
      tryApply(urlInput.value.trim());
    });

    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnRecognize?.click();
      }
    });

    btnRecognize?.addEventListener('click', () => {
      const v = urlInput.value.trim();
      if (!v) {
        toast('请先粘贴图片链接', 'error');
        return;
      }
      const key = parseSetUrl(v);
      if (!key) {
        tryApply(v);
        return;
      }
      if (key === entry.key) {
        toast('URL 未变化，无需重新识别');
        return;
      }
      tryApply(v);
    });

    $('pgTypeSeg')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      const t = btn.dataset.type;
      if (entry.type === t) return;
      entry.type = t;
      syncTypeSeg();
      markDirty();
      renderList();
      updatePreview(entry);
    });

    /* ---------- 上移 / 下移：± 1，冲突时交换 ---------- */
    const btnIdUp = $('btnIdUp');
    const btnIdDown = $('btnIdDown');
    const move = (dir) => {
      const delta = dir === 'up' ? -1 : 1;
      const nextId = (entry.id ?? 0) + delta;
      if (nextId < 1) return;

      const conflict = state.data.sets.find((x) => x !== entry && x.id === nextId);
      if (conflict) conflict.id = entry.id;
      entry.id = nextId;
      state.selectedId = nextId;

      markDirty();
      renderList();
      renderForm();
    };
    btnIdUp?.addEventListener('click', () => move('up'));
    btnIdDown?.addEventListener('click', () => move('down'));

    $('btnDelete')?.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: '删除套装',
        message: `确定删除「${entry.name || '(未命名)'}」吗？此操作不可撤销。`,
        okText: '删除',
        danger: true
      });
      if (!ok) return;
      const idx = state.data.sets.indexOf(entry);
      if (idx >= 0) state.data.sets.splice(idx, 1);
      state.selectedId = null;
      state.isNew = false;
      markDirty();
      renderList();
      renderForm();

      if (window.innerWidth <= 900) {
        els.edListPane.classList.remove('mobile-hidden');
        els.edFormPane.classList.remove('mobile-visible');
      }
    });

    $('btnMobileBack')?.addEventListener('click', () => {
      els.edListPane.classList.remove('mobile-hidden');
      els.edFormPane.classList.remove('mobile-visible');
    });
  }

  /* ============================================================
   * 16. Combobox（共享 .combobox 结构）
   * ============================================================ */
  function setupCombobox(box, opts) {
    if (!box) return;
    const input = box.querySelector('input');
    const popup = box.querySelector('.combobox-popup');
    if (!input || !popup) return;

    let highlight = 0;
    let currentItems = [];

    const close = () => {
      popup.hidden = true;
      currentItems = [];
    };

    const refreshHighlight = () => {
      popup.querySelectorAll('.combobox-option').forEach((el, i) => {
        el.classList.toggle('is-highlight', i === highlight);
      });
      popup.querySelector('.combobox-option.is-highlight')?.scrollIntoView({ block: 'nearest' });
    };

    const refresh = (query) => {
      const all = opts.items() || [];
      const q = (query || '').trim().toLowerCase();
      let matched = q ? all.filter((x) => x.toLowerCase().includes(q)) : all;
      matched = matched.slice(0, 40);
      currentItems = matched.map((x) => ({ value: x, isNew: false }));

      if (opts.allowCustom) {
        const raw = (query || '').trim();
        if (raw && !all.some((x) => x === raw)) {
          currentItems.push({ value: raw, isNew: true });
        }
      }

      if (!currentItems.length) {
        popup.innerHTML = '<div class="combobox-empty">无匹配</div>';
        popup.hidden = false;
        return;
      }

      popup.innerHTML = currentItems.map((it, i) => {
        const cls =
          'combobox-option' +
          (it.isNew ? ' is-new' : '') +
          (i === highlight ? ' is-highlight' : '');
        const label = it.isNew && opts.customLabel ? opts.customLabel(it.value) : it.value;
        return `<div class="${cls}" data-idx="${i}">${esc(label)}</div>`;
      }).join('');
      popup.hidden = false;
    };

    const select = (idx) => {
      const it = currentItems[idx];
      if (!it) return;
      input.value = it.value;
      opts.onSelect(it.value);
      close();
    };

    input.addEventListener('focus', () => { highlight = 0; refresh(input.value); });

    input.addEventListener('input', () => {
      if (opts.multiline && (!input.value || CHAR_SPLIT_TEST.test(input.value))) {
        popup.hidden = true;
        currentItems = [];
        return;
      }
      highlight = 0;
      refresh(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (popup.hidden) {
        if (e.key === 'ArrowDown') { refresh(input.value); e.preventDefault(); }
        return;
      }
      if (e.key === 'ArrowDown') {
        highlight = Math.min(highlight + 1, currentItems.length - 1);
        refreshHighlight();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        highlight = Math.max(highlight - 1, 0);
        refreshHighlight();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        select(highlight);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        close();
      }
    });

    popup.addEventListener('pointerdown', (e) => {
      const opt = e.target.closest('.combobox-option');
      if (!opt) return;
      const idx = parseInt(opt.dataset.idx, 10);
      select(idx);
      e.preventDefault();
    });

    input.addEventListener('blur', () => setTimeout(close, 150));
  }

  /* ============================================================
   * 17. 筛选下拉
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
      els.typePanel,
      [
        { value: 'all', label: '全部类型' },
        { value: 'interior', label: '室内' },
        { value: 'exterior', label: '室外' }
      ],
      state.typeFilter
    );

    const regions = [{ value: 'all', label: '全部地区' }]
      .concat((state.data?.regions || []).map((r) => ({ value: r, label: r })));
    renderDropdownOptions(els.regionPanel, regions, state.regionFilter);
  }

  /* ============================================================
   * 18. 主流程事件
   * ============================================================ */
  function bindEvents() {
    /* ---- 主题 ---- */
    els.btnTheme?.addEventListener('click', () => {
      if (window.Theme?.toggle) window.Theme.toggle();
    });

    /* ---- 搜索 ---- */
    let searchTimer = null;
    els.searchInput?.addEventListener('input', () => {
      els.searchClear?.classList.toggle('is-visible', els.searchInput.value.length > 0);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = els.searchInput.value;
        renderList();
      }, 150);
    });
    els.searchClear?.addEventListener('click', () => {
      els.searchInput.value = '';
      els.searchClear.classList.remove('is-visible');
      state.search = '';
      renderList();
    });

    /* ---- 筛选下拉 ---- */
    document.addEventListener('dropdown:select', (e) => {
      const { dropdown, value } = e.detail || {};
      const filter = dropdown?.dataset?.filter;
      if (!filter || value == null) return;

      if (filter === 'type') {
        state.typeFilter = value;
        if (els.typeLabel) {
          els.typeLabel.textContent =
            value === 'all' ? '全部类型' : value === 'interior' ? '室内' : '室外';
        }
      } else if (filter === 'region') {
        state.regionFilter = value;
        if (els.regionLabel) {
          els.regionLabel.textContent = value === 'all' ? '全部地区' : value;
        }
      }

      renderFilters();
      renderList();
    });

    /* ---- 重排 ID ---- */
    els.btnRenumber?.addEventListener('click', async () => {
      if (!state.data) return toast('数据未加载', 'error');
      const sorted = allSortedSets();
      const n = sorted.length;
      if (!n) return toast('没有套装可重排', 'error');
      const ok = await confirmDialog({
        title: '重排 id',
        message: `将按当前显示顺序重新编号 1 ~ ${n}，原有 id 会被覆盖。`,
        okText: '重排',
        danger: true
      });
      if (!ok) return;

      const selObj = state.selectedId != null
        ? state.data.sets.find((x) => x.id === state.selectedId)
        : null;
      sorted.forEach((s, i) => { s.id = i + 1; });
      if (selObj) state.selectedId = selObj.id;

      markDirty();
      renderList();
      renderForm();
      toast(`已重排 ${n} 条 id`, 'success');
    });

    /* ---- 重载 ---- */
    els.btnReload?.addEventListener('click', async () => {
      if (state.dirty) {
        const ok = await confirmDialog({
          title: '放弃修改',
          message: '当前有未导出的修改，重载会丢弃这些改动。',
          okText: '重载',
          danger: true
        });
        if (!ok) return;
      }
      if (location.protocol === 'file:') {
        toast('file:// 下无法重载，请用「导入」', 'error');
        return;
      }
      try {
        const res = await fetch('../gift-set/data.js?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        state.data = parseDataJs(text);
        state.selectedId = null;
        state.isNew = false;
        clearDirty();
        clearDraft();
        renderFilters();
        renderList();
        renderForm();
        toast(`已重载 ${state.data.sets.length} 条`, 'success');
      } catch (err) {
        toast('重载失败：' + err.message, 'error');
      }
    });

    /* ---- 导入 ---- */
    els.btnImport?.addEventListener('click', () => els.fileInput?.click());
    els.fileInput?.addEventListener('change', (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          state.data = parseDataJs(reader.result);
          state.selectedId = null;
          state.isNew = false;
          clearDirty();
          saveDraft();
          renderFilters();
          renderList();
          renderForm();
          toast(`已导入 ${state.data.sets.length} 条`, 'success');
        } catch (err) {
          toast('导入失败：' + err.message, 'error');
        }
        els.fileInput.value = '';
      };
      reader.readAsText(file);
    });

    /* ---- 导出 ---- */
    els.btnExport?.addEventListener('click', async () => {
      if (!state.data) return toast('数据未加载', 'error');

      const warnings = [];
      const idSet = new Set();
      const regionSet = new Set(state.data.regions);
      for (const s of state.data.sets) {
        if (idSet.has(s.id)) warnings.push(`id ${s.id} 重复`);
        idSet.add(s.id);
        if (!s.key) warnings.push(`id ${s.id} 缺少 key（图片未识别）`);
        if (!s.name) warnings.push(`id ${s.id} 缺少名称`);
        if (!s.region) {
          warnings.push(`id ${s.id} 缺少地区`);
        } else if (!regionSet.has(s.region)) {
          warnings.push(`id ${s.id} 地区「${s.region}」不在地区列表中`);
        }
        if (s.type !== 'exterior' && s.type !== 'interior') {
          warnings.push(`id ${s.id} 类型不是室内/室外`);
        }
      }
      if (warnings.length) {
        const msg =
          `发现 ${warnings.length} 项问题：\n\n` +
          warnings.slice(0, 10).join('\n') +
          (warnings.length > 10 ? `\n…还有 ${warnings.length - 10} 项` : '') +
          '\n\n是否继续导出？';
        const ok = await confirmDialog({
          title: '导出前检查',
          message: msg,
          okText: '继续导出'
        });
        if (!ok) return;
      }

      const text = serializeData(state.data);
      const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.js';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      clearDirty();
      clearDraft();
      toast('已导出 data.js', 'success');
    });

    /* ---- 列表点选 ---- */
    els.edList?.addEventListener('click', (e) => {
      const item = e.target.closest('.ed-list-item');
      if (!item) return;
      const id = parseInt(item.dataset.id, 10);
      if (Number.isNaN(id)) return;
      state.selectedId = id;
      state.isNew = false;
      renderList();
      renderForm();
      if (window.innerWidth <= 900) {
        els.edListPane.classList.add('mobile-hidden');
        els.edFormPane.classList.add('mobile-visible');
      }
    });

    /* ---- 新增 ---- */
    els.btnAdd?.addEventListener('click', () => {
      if (!state.data) state.data = normalizeData(null);
      const newId = state.data.sets.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
      const entry = {
        id: newId,
        key: '',
        name: '',
        type: '',
        region: '',
        preferredCharacters: []
      };
      state.data.sets.push(entry);
      state.data.meta.total = state.data.sets.length;
      state.selectedId = newId;
      state.isNew = true;
      markDirty();
      renderList();
      renderForm();

      if (window.innerWidth <= 900) {
        els.edListPane.classList.add('mobile-hidden');
        els.edFormPane.classList.add('mobile-visible');
      }
      setTimeout(() => {
        els.edFormPane.querySelector('input[data-field="name"]')?.focus();
      }, 60);
    });

    window.addEventListener('beforeunload', (e) => {
      if (state.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    /* ---- 图片加载失败兜底 ---- */
    document.addEventListener('error', (e) => {
      const img = e.target;
      if (img.tagName !== 'IMG') return;
      if (!img.closest('.pg-list-thumb, .pg-preview-frame, .pg-chip-avatar')) return;
      img.remove();
    }, true);
  }

  /* ============================================================
   * 19. 启动
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

      injectIcons(document);
      bindEvents();

      const draft = loadDraft();
      if (draft?.sets) {
        state.data = normalizeData(draft);
        renderFilters();
        renderList();
        renderForm();
        state.dirty = true;
        if (els.dirtyDot) els.dirtyDot.hidden = false;
        toast('已恢复草稿（未导出）', 'success');
      } else if (window.HOMEWORLD_GIFT_SETS) {
        state.data = normalizeData(structuredClone(window.HOMEWORLD_GIFT_SETS));
        renderFilters();
        renderList();
        renderForm();
      } else {
        state.data = normalizeData(null);
        renderFilters();
        renderList();
        renderForm();
      }

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
