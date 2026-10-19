/* ============================================================
 * 尘歌壶赠礼套装编辑器 · 逻辑
 * ============================================================ */
(function () {
  'use strict';

  const DRAFT_KEY = 'genshin_homeworld_gift_sets_editor_draft_v1';
  const THEME_KEY = 'genshin_travelers_tales_theme_v1';

  /* ============================================================
   * 1. 兜底图标
   * ============================================================ */
  const FALLBACK_ICONS = {
    reload:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M224 48v48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h28.69l-14.63-14.63a79.56 79.56 0 0 0-56.13-23.43h-.45a79.52 79.52 0 0 0-55.89 22.77a8 8 0 0 1-11.18-11.44a96 96 0 0 1 135 .79L208 76.69V48a8 8 0 0 1 16 0m-37.59 135.29a80 80 0 0 1-112.47-.66L59.31 168H88a8 8 0 0 0 0-16H40a8 8 0 0 0-8 8v48a8 8 0 0 0 16 0v-28.69l14.63 14.63A95.43 95.43 0 0 0 130 222.06h.53a95.36 95.36 0 0 0 67.07-27.33a8 8 0 0 0-11.18-11.44Z"/></svg>',
    reorder:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M237.66 178.34a8 8 0 0 1 0 11.32l-24 24a8 8 0 0 1-11.32-11.32L212.69 192h-11.75a72.12 72.12 0 0 1-58.59-30.15l-41.72-58.4A56.1 56.1 0 0 0 55.06 80H32a8 8 0 0 1 0-16h23.06a72.12 72.12 0 0 1 58.59 30.15l41.72 58.4A56.1 56.1 0 0 0 200.94 176h11.75l-10.35-10.34a8 8 0 0 1 11.32-11.32ZM143 107a8 8 0 0 0 11.16-1.86l1.2-1.67A56.1 56.1 0 0 1 200.94 80h11.75l-10.35 10.34a8 8 0 0 0 11.32 11.32l24-24a8 8 0 0 0 0-11.32l-24-24a8 8 0 0 0-11.32 11.32L212.69 64h-11.75a72.12 72.12 0 0 0-58.59 30.15l-1.2 1.67A8 8 0 0 0 143 107m-30 42a8 8 0 0 0-11.16 1.86l-1.2 1.67A56.1 56.1 0 0 1 55.06 176H32a8 8 0 0 0 0 16h23.06a72.12 72.12 0 0 0 58.59-30.15l1.2-1.67A8 8 0 0 0 113 149"/></svg>',
    back:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M232 184a8 8 0 0 1-16 0a88 88 0 0 0-150.22-62.22L43.4 144H88a8 8 0 0 1 0 16H24a8 8 0 0 1-8-8V88a8 8 0 0 1 16 0v44.77l22.48-22.33A104 104 0 0 1 232 184"/></svg>',
    file:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="m213.66 82.34l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V88a8 8 0 0 0-2.34-5.66M160 51.31L188.69 80H160ZM200 216H56V40h88v48a8 8 0 0 0 8 8h48z"/></svg>'
  };

  /* ============================================================
   * 2. 工具函数 + 地区/类型推断
   * ============================================================ */
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
    typeTrigger: $('typeTrigger'),
    typeLabel: $('typeLabel'),
    regionTrigger: $('regionTrigger'),
    regionLabel: $('regionLabel'),
    edListPane: $('edListPane'),
    edList: $('edList'),
    btnAdd: $('btnAdd'),
    edFormPane: $('edFormPane'),
    fileInput: $('fileInput'),
    toastContainer: $('toastContainer'),
    modalBackdrop: $('modalBackdrop'),
    modalTitle: $('modalTitle'),
    modalMessage: $('modalMessage'),
    modalActions: $('modalActions'),
    sheetBackdrop: $('sheetBackdrop'),
    sheet: $('sheet'),
    sheetHeader: $('sheetHeader'),
    sheetList: $('sheetList')
  };

  /* ============================================================
   * 4. Toast / 确认框 / 下拉抽屉
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

  function openSheet({ header, items, current, onSelect }) {
    els.sheetHeader.textContent = header || '';
    els.sheetList.innerHTML = '';

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab-sheet-item' + (item.value === current ? ' active' : '');
      btn.innerHTML =
        '<span>' + esc(item.label) + '</span>' +
        '<span class="tab-sheet-item-check"><span class="ic" data-icon="ui.check"></span></span>';
      btn.addEventListener('click', () => {
        closeSheet();
        onSelect(item.value);
      });
      els.sheetList.appendChild(btn);
    });
    injectIcons(els.sheetList);

    els.sheetBackdrop.classList.add('show');
    els.sheet.classList.add('show');

    const onBackdrop = (e) => {
      if (e.target === els.sheetBackdrop) closeSheet();
    };
    els.sheetBackdrop.addEventListener('click', onBackdrop);

    function closeSheet() {
      els.sheetBackdrop.classList.remove('show');
      els.sheet.classList.remove('show');
      els.sheetBackdrop.removeEventListener('click', onBackdrop);
    }
  }

  /* ============================================================
   * 5. 主题
   * ============================================================ */
  const currentTheme = () =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  function applyTheme(theme) {
    document.documentElement.classList.add('theme-switching');
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    setTimeout(() => document.documentElement.classList.remove('theme-switching'), 120);
  }

  /* ============================================================
   * 6. 数据骨架 + 规范化
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

  /**
   * 规范化数据：
   * 1. 补全 config / meta / regions / sets
   * 2. regions：丢弃旧的含糊值 '蒙德/璃月'（它是「或」的意思，不是「和」），
   *    确保 '蒙德' '璃月' 存在，按官方顺序重排，新增地区追加末尾
   * 3. sets：region === '蒙德/璃月' 时用 key 推断覆盖；
   *    推断失败则保留原值，让用户在 UI 上手动修正
   */
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

    /* ---- regions ---- */
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

    /* ---- sets ---- */
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
   * 7. 状态 + 角色映射
   * ============================================================ */
  function buildCharMaps() {
    const keyMap = new Map();
    const list = [];
    const dict = window.ICON_DICT;
    if (!dict?.characters) return { keyMap, list };
    for (const [key, item] of Object.entries(dict.characters)) {
      if (!item?.name) continue;
      keyMap.set(item.name, key);
      list.push({ name: item.name, order: item.order ?? 9999 });
    }
    list.sort((a, b) => a.order - b.order);
    return { keyMap, list: list.map((x) => x.name) };
  }

  const charMaps = buildCharMaps();

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
    els.dirtyDot.hidden = false;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 400);
  }
  function clearDirty() {
    state.dirty = false;
    els.dirtyDot.hidden = true;
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
    /* 补全 regions（跳过旧的含糊值 '蒙德/璃月'，不写进 regions 数组） */
    const regionSet = new Set(data.regions);
    for (const s of data.sets) {
      if (s.region && s.region !== '蒙德/璃月' && !regionSet.has(s.region)) {
        regionSet.add(s.region);
        data.regions.push(s.region);
      }
    }

    const grouped = new Map();
    data.regions.forEach((r) => grouped.set(r, []));
    for (const s of data.sets) {
      if (!grouped.has(s.region)) grouped.set(s.region, []);
      grouped.get(s.region).push(s);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    }

    const lines = [];
    lines.push('/* ============================================================');
    lines.push(' * 尘歌壶赠礼套装 · 数据字典');
    lines.push(' * 生成时间：' + todayStr());
    lines.push(' * ------------------------------------------------------------');
    lines.push(' * · key 不含扩展名');
    lines.push(' *   图片 URL = config.image.prefix + key + config.image.ext');
    lines.push(' * · type: "exterior"（室外）| "interior"（室内）');
    lines.push(' * · preferredCharacters 存角色中文名');
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

    const setLines = [];
    for (const [region, list] of grouped) {
      if (!list.length) continue;
      if (setLines.length) setLines.push('');
      setLines.push(`    /* ==================== ${region} ==================== */`);
      for (const s of list) {
        const chars = (s.preferredCharacters || []).map((c) => `'${escJs(c)}'`).join(', ');
        setLines.push(
          `    { id: ${s.id}, key: '${escJs(s.key)}', name: '${escJs(s.name)}', ` +
          `type: '${escJs(s.type)}', region: '${escJs(s.region)}', preferredCharacters: [${chars}] },`
        );
      }
    }
    if (setLines.length) {
      const last = setLines.length - 1;
      if (setLines[last].endsWith(',')) setLines[last] = setLines[last].slice(0, -1);
    }
    lines.push(...setLines);

    lines.push('  ]');
    lines.push('};');
    return lines.join('\n');
  }

  /* ============================================================
   * 11. 排序 / 过滤
   * ============================================================ */
  function regionIndex() {
    const m = new Map();
    (state.data?.regions || []).forEach((r, i) => m.set(r, i));
    return m;
  }

  function setComparator(ridx) {
    return (a, b) => {
      const ra = ridx.get(a.region) ?? 9999;
      const rb = ridx.get(b.region) ?? 9999;
      if (ra !== rb) return ra - rb;
      return (a.id ?? 0) - (b.id ?? 0);
    };
  }

  function allSortedSets() {
    if (!state.data) return [];
    return state.data.sets.slice().sort(setComparator(regionIndex()));
  }

  function getFilteredSets() {
    if (!state.data) return [];
    const kw = state.search.trim().toLowerCase();
    const list = state.data.sets.filter((s) => {
      if (state.typeFilter !== 'all' && s.type !== state.typeFilter) return false;
      if (state.regionFilter !== 'all' && s.region !== state.regionFilter) return false;
      if (kw) {
        const hay =
          (s.name || '') + ' ' + (s.preferredCharacters || []).join(' ');
        if (!hay.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
    return list.sort(setComparator(regionIndex()));
  }

  /* ============================================================
   * 12. 渲染列表
   * ============================================================ */
  function renderList() {
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

    els.edList.innerHTML = list
      .map((s) => {
        const url = getSetImageUrl(s);
        const thumbInner = url
          ? `<img src="${esc(url)}" alt="" loading="lazy">`
          : '';
        const active = s.id === state.selectedId ? ' active' : '';
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
      })
      .join('');
  }

  /* ============================================================
   * 13. 渲染 chips
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

  function renderChipsInner(entry) {
    const chars = entry.preferredCharacters || [];
    if (!chars.length) {
      return '<span class="pg-char-empty">尚未添加角色</span>';
    }
    return chars.map((name) => {
      return (
        `<span class="pg-chip" data-char="${esc(name)}">` +
          `<span class="pg-chip-avatar">${buildChipAvatar(name)}</span>` +
          `<span class="pg-chip-name">${esc(name)}</span>` +
          `<button type="button" class="pg-chip-remove" data-remove="${esc(name)}">` +
            '<span class="ic" data-icon="app.close"></span>' +
          '</button>' +
        '</span>'
      );
    }).join('');
  }

  function renderCharArea(entry) {
    const area = els.edFormPane.querySelector('#pgCharArea');
    if (!area) return;
    area.innerHTML =
      `<div class="pg-char-list" id="pgCharList">${renderChipsInner(entry)}</div>` +
      '<div class="ed-combobox" data-combobox="character-add">' +
        '<div class="ed-combobox-input-wrap">' +
          '<input type="text" placeholder="输入角色名添加…" autocomplete="off" spellcheck="false">' +
        '</div>' +
        '<div class="ed-combobox-popup" hidden></div>' +
      '</div>';

    injectIcons(area);
    bindCharAreaEvents(entry);
    upgradeChipImages(entry);
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
      els.edFormPane.querySelector('.ed-combobox[data-combobox="character-add"]'),
      {
        items: () => state.charList.filter((n) => !entry.preferredCharacters.includes(n)),
        allowCustom: true,
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
    for (const chip of chips) {
      const name = chip.dataset.char;
      if (!name) continue;
      const key = state.charKeyMap.get(name);
      if (!key) continue;
      const dataURL = await getChipImage(name);
      if (!dataURL) continue;
      if (!document.contains(chip)) continue;
      const avatar = chip.querySelector('.pg-chip-avatar');
      if (!avatar) continue;
      avatar.innerHTML = `<img src="${esc(dataURL)}" alt="">`;
    }
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
          `<h2 class="pg-preview-name">${esc(name)}</h2>` +
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
    if (!state.data) {
      els.edFormPane.innerHTML =
        '<div class="ed-form-empty">' +
          '<span class="ic" data-icon="file"></span>' +
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

    const segInterior = entry.type === 'interior' ? ' active' : '';
    const segExterior = entry.type === 'exterior' ? ' active' : '';
    const urlValue = getSetImageUrl(entry);
    const keyHint = entry.key ? 'key: ' + entry.key : '';

    els.edFormPane.innerHTML =
      '<div class="ed-form">' +

        '<button type="button" class="btn-sm ed-mobile-back" id="btnMobileBack">' +
          '<span class="ic" data-icon="back"></span>' +
          '<span>返回列表</span>' +
        '</button>' +

        renderPreviewHtml(entry) +

        '<div class="ed-row-2">' +
          '<div class="ed-group">' +
            '<label class="ed-label">id <span class="ed-label-hint">可手动改，需唯一</span></label>' +
            '<div class="ed-id-wrap">' +
              `<input type="text" data-field="id" value="${esc(entry.id)}" inputmode="numeric" autocomplete="off">` +
              '<button type="button" class="float-btn" id="btnIdUp" title="上移">' +
                '<span class="ic" data-icon="ui.arrowUp"></span>' +
              '</button>' +
              '<button type="button" class="float-btn" id="btnIdDown" title="下移">' +
                '<span class="ic icon-flip-y" data-icon="ui.arrowUp"></span>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="ed-group">' +
            '<label class="ed-label">地区 <span class="ed-label-hint">输入可新建</span></label>' +
            '<div class="ed-combobox" data-combobox="region">' +
              '<div class="ed-combobox-input-wrap">' +
                `<input type="text" data-field="region" value="${esc(entry.region || '')}" autocomplete="off" spellcheck="false">` +
              '</div>' +
              '<div class="ed-combobox-popup" hidden></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">套装图 URL <span class="ed-label-hint">粘贴后自动识别 key / 类型 / 地区</span></label>' +
          '<div class="pg-url-wrap">' +
            `<input type="text" id="pgUrlInput" value="${esc(urlValue)}" placeholder="粘贴图片直链…" autocomplete="off" spellcheck="false">` +
            '<button type="button" class="btn-sm" id="btnRecognize">识别</button>' +
          '</div>' +
          `<div class="pg-url-key" id="pgUrlKey">${esc(keyHint)}</div>` +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">名称</label>' +
          `<input type="text" data-field="name" value="${esc(entry.name || '')}">` +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">室内 / 室外</label>' +
          '<div class="seg-control" id="pgTypeSeg">' +
            `<button type="button" class="seg-btn${segInterior}" data-type="interior">室内</button>` +
            `<button type="button" class="seg-btn${segExterior}" data-type="exterior">室外</button>` +
          '</div>' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">偏好角色</label>' +
          '<div id="pgCharArea"></div>' +
        '</div>' +

        '<div class="ed-actions">' +
          '<button type="button" class="btn-sm btn-danger" id="btnDelete">删除此套</button>' +
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
      els.edFormPane.querySelector('.ed-combobox[data-combobox="region"]'),
      {
        items: () => state.data.regions,
        allowCustom: true,
        customLabel: (r) => '＋ 新增地区：' + r,
        onSelect: (r) => {
          entry.region = r;
          if (!state.data.regions.includes(r)) state.data.regions.push(r);
          markDirty();
          renderList();
          updatePreview(entry);
        }
      }
    );

    /* ---------- URL 识别（key 变化才推断覆盖） ---------- */
    const urlInput = $('pgUrlInput');
    const urlKeyEl = $('pgUrlKey');
    const btnRecognize = $('btnRecognize');

    const syncTypeSeg = () => {
      const seg = $('pgTypeSeg');
      if (!seg) return;
      seg.querySelectorAll('.seg-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.type === entry.type);
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
          urlKeyEl.classList.remove('warn');
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
        urlKeyEl.classList.add('warn');
        return false;
      }

      if (key === entry.key) return false;

      urlInput.classList.remove('ed-invalid');
      urlKeyEl.classList.remove('warn');
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

    /* ---------- 类型段控 ---------- */
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

    /* ---------- 上移 / 下移 ---------- */
    const btnIdUp = $('btnIdUp');
    const btnIdDown = $('btnIdDown');
    const move = (dir) => {
      const sorted = allSortedSets();
      const idx = sorted.indexOf(entry);
      if (idx < 0) return;
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) return;
      const a = sorted[idx];
      const b = sorted[targetIdx];
      [a.id, b.id] = [b.id, a.id];
      state.selectedId = a.id;
      markDirty();
      renderList();
      renderForm();
    };
    btnIdUp?.addEventListener('click', () => move('up'));
    btnIdDown?.addEventListener('click', () => move('down'));

    /* ---------- 删除 ---------- */
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

      /* 移动端：删除后自动回到列表页 */
      if (window.innerWidth <= 900) {
        els.edListPane.classList.remove('mobile-hidden');
        els.edFormPane.classList.remove('mobile-visible');
      }
    });

    /* ---------- 移动端返回 ---------- */
    $('btnMobileBack')?.addEventListener('click', () => {
      els.edListPane.classList.remove('mobile-hidden');
      els.edFormPane.classList.remove('mobile-visible');
    });
  }

  /* ============================================================
   * 16. Combobox
   * ============================================================ */
  function setupCombobox(box, opts) {
    if (!box) return;
    const input = box.querySelector('input');
    const popup = box.querySelector('.ed-combobox-popup');
    if (!input || !popup) return;

    let highlight = 0;
    let currentItems = [];

    const close = () => {
      popup.hidden = true;
      currentItems = [];
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
        popup.innerHTML = '<div class="ed-combobox-empty">无匹配</div>';
        popup.hidden = false;
        return;
      }

      popup.innerHTML = currentItems
        .map((it, i) => {
          const cls =
            'ed-combobox-option' +
            (it.isNew ? ' is-new' : '') +
            (i === highlight ? ' highlight' : '');
          const label = it.isNew && opts.customLabel ? opts.customLabel(it.value) : it.value;
          return `<div class="${cls}" data-idx="${i}">${esc(label)}</div>`;
        })
        .join('');
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
    input.addEventListener('input', () => { highlight = 0; refresh(input.value); });
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
      const opt = e.target.closest('.ed-combobox-option');
      if (!opt) return;
      const idx = parseInt(opt.dataset.idx, 10);
      select(idx);
      e.preventDefault();
    });

    input.addEventListener('blur', () => setTimeout(close, 150));

    const refreshHighlight = () => {
      popup.querySelectorAll('.ed-combobox-option').forEach((el, i) => {
        el.classList.toggle('highlight', i === highlight);
      });
      popup.querySelector('.ed-combobox-option.highlight')?.scrollIntoView({ block: 'nearest' });
    };
  }

  /* ============================================================
   * 17. 主流程事件
   * ============================================================ */
  function bindHeaderEvents() {
    els.btnTheme.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch {}
    });

    let searchTimer = null;
    els.searchInput.addEventListener('input', () => {
      els.searchClear.classList.toggle('show', els.searchInput.value.length > 0);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = els.searchInput.value;
        renderList();
      }, 150);
    });
    els.searchClear.addEventListener('click', () => {
      els.searchInput.value = '';
      els.searchClear.classList.remove('show');
      state.search = '';
      renderList();
    });

    els.typeTrigger.addEventListener('click', () => {
      openSheet({
        header: '类型',
        items: [
          { value: 'all', label: '全部类型' },
          { value: 'interior', label: '室内' },
          { value: 'exterior', label: '室外' }
        ],
        current: state.typeFilter,
        onSelect: (v) => {
          state.typeFilter = v;
          els.typeLabel.textContent =
            v === 'all' ? '全部类型' : v === 'interior' ? '室内' : '室外';
          els.typeTrigger.classList.toggle('active', v !== 'all');
          renderList();
        }
      });
    });

    els.regionTrigger.addEventListener('click', () => {
      if (!state.data) return;
      const items = [{ value: 'all', label: '全部地区' }];
      state.data.regions.forEach((r) => items.push({ value: r, label: r }));
      openSheet({
        header: '地区',
        items,
        current: state.regionFilter,
        onSelect: (v) => {
          state.regionFilter = v;
          els.regionLabel.textContent = v === 'all' ? '全部地区' : v;
          els.regionTrigger.classList.toggle('active', v !== 'all');
          renderList();
        }
      });
    });

    els.btnRenumber.addEventListener('click', async () => {
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

    els.btnReload.addEventListener('click', async () => {
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
        const data = parseDataJs(text);
        state.data = data;
        state.selectedId = null;
        state.isNew = false;
        clearDirty();
        clearDraft();
        renderList();
        renderForm();
        toast(`已重载 ${data.sets.length} 条`, 'success');
      } catch (err) {
        toast('重载失败：' + err.message, 'error');
      }
    });

    els.btnImport.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = parseDataJs(reader.result);
          state.data = data;
          state.selectedId = null;
          state.isNew = false;
          clearDirty();
          saveDraft();
          renderList();
          renderForm();
          toast(`已导入 ${data.sets.length} 条`, 'success');
        } catch (err) {
          toast('导入失败：' + err.message, 'error');
        }
        els.fileInput.value = '';
      };
      reader.readAsText(file);
    });

    els.btnExport.addEventListener('click', async () => {
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

    els.edList.addEventListener('click', (e) => {
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

    els.btnAdd.addEventListener('click', () => {
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
        els.edFormPane.querySelector('#pgUrlInput')?.focus();
      }, 60);
    });

    window.addEventListener('beforeunload', (e) => {
      if (state.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    document.addEventListener('error', (e) => {
      const img = e.target;
      if (img.tagName !== 'IMG') return;
      if (!img.closest('.pg-list-thumb, .pg-preview-frame, .pg-chip-avatar')) return;
      img.remove();
    }, true);
  }

  /* ============================================================
   * 18. 启动
   * ============================================================ */
  (function init() {
    injectIcons(document);
    bindHeaderEvents();

    const draft = loadDraft();
    if (draft?.sets) {
      state.data = normalizeData(draft);
      renderList();
      renderForm();
      state.dirty = true;
      els.dirtyDot.hidden = false;
      toast('已恢复草稿（未导出）', 'success');
    } else if (window.HOMEWORLD_GIFT_SETS) {
      state.data = normalizeData(structuredClone(window.HOMEWORLD_GIFT_SETS));
      renderList();
      renderForm();
    } else {
      state.data = normalizeData(null);
      renderList();
      renderForm();
    }

    document.body.classList.add('ready');
  })();
})();
