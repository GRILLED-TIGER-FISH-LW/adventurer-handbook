/* ============================================================
 * 游逸旅闻编辑器 · 逻辑
 * 【本次改动】renderForm 里上移/下移按钮 class：btn-sm → float-btn
 * ============================================================ */
(function () {
  'use strict';

  const DRAFT_KEY = 'genshin_travelers_tales_editor_draft_v1';
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
   * 2. 工具函数
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
      .replace(/"/g, '\\"')
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
    versionTrigger: $('versionTrigger'),
    versionLabel: $('versionLabel'),
    visibilityTrigger: $('visibilityTrigger'),
    visibilityLabel: $('visibilityLabel'),
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
   * 6. 状态 + 头像缓存 + 角色排序
   * ============================================================ */
  function buildAvatarCache() {
    const cache = new Map();
    const dict = window.ICON_DICT;
    if (!dict?.characters) return cache;
    const cfg = dict.config?.characters;
    for (const [key, item] of Object.entries(dict.characters)) {
      if (!item?.name) continue;
      let url;
      if (item.url) url = item.url;
      else if (!cfg) continue;
      else if (/\.(webp|png|jpe?g)$/i.test(key)) url = cfg.prefix + key;
      else url = cfg.prefix + key + cfg.ext;
      cache.set(item.name, url);
    }
    return cache;
  }

  function buildCharList() {
    const dict = window.ICON_DICT;
    if (!dict?.characters) return [];
    return Object.values(dict.characters)
      .filter((x) => x?.name)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      .map((x) => x.name);
  }

  const ORDER_MAP = (() => {
    const m = new Map();
    const dict = window.ICON_DICT;
    if (dict?.characters) {
      for (const item of Object.values(dict.characters)) {
        if (item?.name) m.set(item.name, item.order ?? 9999);
      }
    }
    return m;
  })();

  const state = {
    data: null,
    selectedId: null,
    isNew: false,
    search: '',
    versionFilter: 'all',
    visibilityFilter: 'all',
    dirty: false,
    avatarCache: buildAvatarCache(),
    charList: buildCharList()
  };

  const avatarUrl = (name) => state.avatarCache.get(name) || '';

  /* ============================================================
   * 7. 草稿持久化
   * ============================================================ */
  let draftTimer = null;

  function saveDraft() {
    if (!state.data) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state.data)); } catch (e) {}
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
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
   * 8. 数据解析 / 序列化
   * ============================================================ */
  function parseDataJs(text) {
    const prev = window.TRAVELERS_TALES;
    try {
      new Function(text)();
      const data = window.TRAVELERS_TALES;
      if (!data || typeof data !== 'object') throw new Error('解析结果不是对象');
      if (!Array.isArray(data.entries)) throw new Error('缺少 entries 数组');
      if (!Array.isArray(data.versions)) data.versions = [];
      if (!data.meta) data.meta = {};
      return data;
    } catch (e) {
      throw new Error(e.message || '语法错误');
    } finally {
      window.TRAVELERS_TALES = prev;
    }
  }

  function serializeData(data) {
    const versionSet = new Set(data.versions);
    for (const e of data.entries) {
      if (e.version && !versionSet.has(e.version)) {
        versionSet.add(e.version);
        data.versions.push(e.version);
      }
    }

    const grouped = new Map();
    data.versions.forEach((v) => grouped.set(v, []));
    for (const e of data.entries) {
      if (!grouped.has(e.version)) grouped.set(e.version, []);
      grouped.get(e.version).push(e);
    }

    for (const list of grouped.values()) {
      list.sort((a, b) => {
        const oa = ORDER_MAP.get(a.character) ?? 9999;
        const ob = ORDER_MAP.get(b.character) ?? 9999;
        if (oa !== ob) return oa - ob;
        return (a.id ?? 0) - (b.id ?? 0);
      });
    }

    const lines = [];
    lines.push('/* ============================================================');
    lines.push(' * 原神 · 游逸旅闻 数据字典');
    lines.push(' * 生成时间：' + todayStr());
    lines.push(' * ============================================================ */');
    lines.push('');
    lines.push('window.TRAVELERS_TALES = {');
    lines.push('  meta: {');
    lines.push('    version: "' + escJs(data.meta.version || '') + '",');
    lines.push('    total: ' + data.entries.length + ',');
    lines.push('    updatedAt: "' + todayStr() + '",');
    lines.push('    source: "' + escJs(data.meta.source || '') + '"');
    lines.push('  },');
    lines.push('');
    lines.push('  versions: [' + data.versions.map((v) => '"' + escJs(v) + '"').join(', ') + '],');
    lines.push('');
    lines.push('  entries: [');

    let first = true;
    for (const [v, list] of grouped) {
      if (!list.length) continue;
      if (!first) lines.push('');
      lines.push('    /* ==================== ' + v + ' ==================== */');
      for (const e of list) {
        lines.push(
          '    { id: ' + (e.id || 0) +
          ', character: "' + escJs(e.character) + '"' +
          ', version: "' + escJs(e.version) + '"' +
          ', title: "' + escJs(e.title) + '"' +
          ', hidden: ' + (e.hidden ? 'true' : 'false') + ','
        );
        lines.push(
          '      location: "' + escJs(e.location) + '"' +
          ', trigger: "' + escJs(e.trigger) + '"' +
          ', prerequisite: "' + escJs(e.prerequisite) + '",'
        );
        lines.push('      description: "' + escJs(e.description) + '" },');
        lines.push('');
      }
      first = false;
    }
    while (lines.length && lines[lines.length - 1] === '') lines.pop();

    lines.push('  ]');
    lines.push('};');
    return lines.join('\n');
  }

  /* ============================================================
   * 9. 排序
   * ============================================================ */
  function getVersionIndex() {
    const m = new Map();
    (state.data?.versions || []).forEach((v, i) => m.set(v, i));
    return m;
  }

  function entryComparator(vIdx) {
    return (a, b) => {
      const oa = ORDER_MAP.get(a.character) ?? 9999;
      const ob = ORDER_MAP.get(b.character) ?? 9999;
      if (oa !== ob) return oa - ob;
      const va = vIdx.get(a.version) ?? 9999;
      const vb = vIdx.get(b.version) ?? 9999;
      if (va !== vb) return va - vb;
      return (a.id ?? 0) - (b.id ?? 0);
    };
  }

  function allSortedEntries() {
    if (!state.data) return [];
    return state.data.entries.slice().sort(entryComparator(getVersionIndex()));
  }

  function getFilteredEntries() {
    if (!state.data) return [];
    const kw = state.search.trim().toLowerCase();
    const list = state.data.entries.filter((e) => {
      if (state.versionFilter !== 'all' && e.version !== state.versionFilter) return false;
      if (state.visibilityFilter === 'normal' && e.hidden) return false;
      if (state.visibilityFilter === 'hidden' && !e.hidden) return false;
      if (kw) {
        const hay = ((e.character || '') + ' ' + (e.title || '')).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    return list.sort(entryComparator(getVersionIndex()));
  }

  /* ============================================================
   * 10. 渲染：列表
   * ============================================================ */
  function renderList() {
    if (!state.data) {
      els.edList.innerHTML = '<div class="ed-list-empty">数据未加载<br>点「重载」或「导入」</div>';
      return;
    }
    const list = getFilteredEntries();
    if (!list.length) {
      els.edList.innerHTML = '<div class="ed-list-empty">没有匹配的条目</div>';
      return;
    }

    els.edList.innerHTML = list
      .map((e) => {
        const url = avatarUrl(e.character);
        const initial = e.character ? e.character.charAt(0) : '?';
        const avatarInner = url
          ? '<img src="' + esc(url) + '" alt="" loading="lazy" onerror="this.remove()">' + esc(initial)
          : esc(initial);
        const active = e.id === state.selectedId ? ' active' : '';
        const hiddenCls = e.hidden ? ' hidden-title' : '';
        return (
          '<div class="ed-list-item' + active + '" data-id="' + e.id + '">' +
            '<div class="ed-list-item-avatar">' + avatarInner + '</div>' +
            '<div class="ed-list-item-body">' +
              '<div class="ed-list-item-title' + hiddenCls + '">' + esc(e.title || '(无标题)') + '</div>' +
              '<div class="ed-list-item-sub">' + esc(e.character || '?') + ' · ' + esc(e.version || '?') + '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  /* ============================================================
   * 11. 渲染：表单
   * ============================================================ */
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
          '<div>从左侧选择条目开始编辑<br>或点击「新增条目」</div>' +
        '</div>';
      return;
    }

    const entry = state.data.entries.find((x) => x.id === state.selectedId);
    if (!entry) {
      els.edFormPane.innerHTML = '<div class="ed-form-empty"><div>条目不存在</div></div>';
      return;
    }

    const url = avatarUrl(entry.character);
    const initial = entry.character ? entry.character.charAt(0) : '?';
    const avatarInner = url
      ? '<img src="' + esc(url) + '" alt="" onerror="this.remove()">' + esc(initial)
      : esc(initial);

    const headingSub = state.isNew
      ? '新建条目 · id ' + entry.id
      : (entry.hidden ? '隐藏旅闻' : '正常旅闻') + ' · id ' + entry.id;

    const comboboxAvatar = url
      ? '<div class="ed-combobox-avatar">' + avatarInner + '</div>'
      : '';

    els.edFormPane.innerHTML =
      '<div class="ed-form">' +

        '<button type="button" class="btn-sm ed-mobile-back" id="btnMobileBack">' +
          '<span class="ic" data-icon="back"></span>' +
          '<span>返回列表</span>' +
        '</button>' +

        '<div class="ed-form-heading">' +
          '<div class="ed-form-heading-avatar">' + avatarInner + '</div>' +
          '<div class="ed-form-heading-info">' +
            '<h2 class="ed-form-heading-name">' + esc(entry.character || '(未命名角色)') + ' · ' + esc(entry.title || '(无标题)') + '</h2>' +
            '<div class="ed-form-heading-sub">' + esc(headingSub) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ed-row-2">' +
          '<div class="ed-group">' +
            '<label class="ed-label">id <span class="ed-label-hint">可手动改，需唯一</span></label>' +
            '<div class="ed-id-wrap">' +
              '<input type="text" data-field="id" value="' + esc(entry.id) + '" inputmode="numeric" autocomplete="off">' +
              /* 【改动】上移按钮：btn-sm ed-id-move → float-btn */
              '<button type="button" class="float-btn" id="btnIdUp" title="上移">' +
                '<span class="ic" data-icon="ui.arrowUp"></span>' +
              '</button>' +
              /* 【改动】下移按钮：btn-sm ed-id-move → float-btn */
              '<button type="button" class="float-btn" id="btnIdDown" title="下移">' +
                '<span class="ic icon-flip-y" data-icon="ui.arrowUp"></span>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="ed-group">' +
            '<label class="ed-label">版本 <span class="ed-label-hint">输入可新建</span></label>' +
            '<div class="ed-combobox" data-combobox="version">' +
              '<div class="ed-combobox-input-wrap">' +
                '<input type="text" data-field="version" value="' + esc(entry.version || '') + '" autocomplete="off" spellcheck="false">' +
              '</div>' +
              '<div class="ed-combobox-popup" hidden></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">角色名 <span class="ed-label-hint">从字典联想，可自定义</span></label>' +
          '<div class="ed-combobox' + (url ? ' has-avatar' : '') + '" data-combobox="character">' +
            '<div class="ed-combobox-input-wrap">' +
              comboboxAvatar +
              '<input type="text" data-field="character" value="' + esc(entry.character || '') + '" autocomplete="off" spellcheck="false">' +
            '</div>' +
            '<div class="ed-combobox-popup" hidden></div>' +
          '</div>' +
          (entry.character && !url ? '<div class="ed-hint warn">字典中无此角色，将显示首字占位</div>' : '') +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">旅闻名</label>' +
          '<input type="text" data-field="title" value="' + esc(entry.title || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">隐藏</label>' +
          '<label class="ed-checkbox-wrap">' +
            '<input type="checkbox" data-field="hidden"' + (entry.hidden ? ' checked' : '') + '>' +
            '<span>标记为隐藏旅闻（主界面红色加粗）</span>' +
          '</label>' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">地点</label>' +
          '<input type="text" data-field="location" value="' + esc(entry.location || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">触发条件</label>' +
          '<input type="text" data-field="trigger" value="' + esc(entry.trigger || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">前置旅闻 <span class="ed-label-hint">只填旅闻名</span></label>' +
          '<input type="text" data-field="prerequisite" value="' + esc(entry.prerequisite || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">描述 <span class="ed-label-hint">支持换行</span></label>' +
          '<textarea data-field="description" rows="6">' + esc(entry.description || '') + '</textarea>' +
        '</div>' +

        '<div class="ed-actions">' +
          '<button type="button" class="btn-sm btn-danger" id="btnDelete">删除此条</button>' +
        '</div>' +

      '</div>';

    injectIcons(els.edFormPane);
    bindFormEvents(entry);
  }

  /* ============================================================
   * 12. 表单事件
   * ============================================================ */
  function bindFormEvents(entry) {
    els.edFormPane.querySelectorAll('[data-field]').forEach((input) => {
      const field = input.dataset.field;
      const eventName = input.type === 'checkbox' ? 'change' : 'input';

      const handler = () => {
        let value;
        if (input.type === 'checkbox') {
          value = input.checked;
        } else if (field === 'id') {
          const num = parseInt(input.value, 10);
          const isDup =
            !Number.isNaN(num) &&
            state.data.entries.some((x) => x !== entry && x.id === num);
          input.classList.toggle('ed-invalid', isDup || Number.isNaN(num));
          value = Number.isNaN(num) ? 0 : num;
        } else {
          value = input.value;
        }

        if (field === 'id') {
          entry.id = value;
          state.selectedId = value;
        } else {
          entry[field] = value;
        }

        markDirty();

        if (['title', 'character', 'version', 'hidden', 'id'].includes(field)) {
          renderList();
        }

        const nameEl = els.edFormPane.querySelector('.ed-form-heading-name');
        if (nameEl && (field === 'character' || field === 'title')) {
          nameEl.textContent =
            (entry.character || '(未命名角色)') + ' · ' + (entry.title || '(无标题)');
        }
        const subEl = els.edFormPane.querySelector('.ed-form-heading-sub');
        if (subEl && (field === 'id' || field === 'hidden')) {
          subEl.textContent = state.isNew
            ? '新建条目 · id ' + entry.id
            : (entry.hidden ? '隐藏旅闻' : '正常旅闻') + ' · id ' + entry.id;
        }

        if (field === 'character') {
          const url = avatarUrl(entry.character);
          const initial2 = entry.character ? entry.character.charAt(0) : '?';
          const avatarInner = url
            ? '<img src="' + esc(url) + '" alt="" onerror="this.remove()">' + esc(initial2)
            : esc(initial2);

          const combobox = els.edFormPane.querySelector('.ed-combobox[data-combobox="character"]');
          if (combobox) {
            combobox.classList.toggle('has-avatar', !!url);
            const slot = combobox.querySelector('.ed-combobox-avatar');
            if (slot) {
              slot.innerHTML = avatarInner;
            } else if (url) {
              const wrap = combobox.querySelector('.ed-combobox-input-wrap');
              if (wrap) {
                const d = document.createElement('div');
                d.className = 'ed-combobox-avatar';
                d.innerHTML = avatarInner;
                wrap.prepend(d);
              }
            }
          }
          const headAvatar = els.edFormPane.querySelector('.ed-form-heading-avatar');
          if (headAvatar) headAvatar.innerHTML = avatarInner;
        }
      };

      input.addEventListener(eventName, handler);
    });

    setupCombobox(
      els.edFormPane.querySelector('.ed-combobox[data-combobox="version"]'),
      {
        items: () => state.data.versions,
        allowCustom: true,
        customLabel: (v) => '＋ 新增版本：' + v,
        onSelect: (v) => {
          entry.version = v;
          if (!state.data.versions.includes(v)) state.data.versions.push(v);
          markDirty();
          renderList();
        }
      }
    );

    setupCombobox(
      els.edFormPane.querySelector('.ed-combobox[data-combobox="character"]'),
      {
        items: () => state.charList,
        allowCustom: true,
        onSelect: (name) => {
          entry.character = name;
          markDirty();
          renderList();
        }
      }
    );

    const btnIdUp = $('btnIdUp');
    const btnIdDown = $('btnIdDown');

    const moveEntry = (direction) => {
      const sorted = allSortedEntries();
      const idx = sorted.indexOf(entry);
      if (idx < 0) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) return;

      const a = sorted[idx];
      const b = sorted[targetIdx];
      [a.id, b.id] = [b.id, a.id];

      state.selectedId = a.id;
      markDirty();
      renderList();
      renderForm();
    };

    btnIdUp?.addEventListener('click', () => moveEntry('up'));
    btnIdDown?.addEventListener('click', () => moveEntry('down'));

    $('btnDelete')?.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: '删除条目',
        message:
          '确定删除「' + (entry.character || '?') + ' · ' + (entry.title || '?') +
          '」吗？此操作不可撤销。',
        okText: '删除',
        danger: true
      });
      if (!ok) return;
      const idx = state.data.entries.indexOf(entry);
      if (idx >= 0) state.data.entries.splice(idx, 1);
      state.selectedId = null;
      state.isNew = false;
      markDirty();
      renderList();
      renderForm();
    });

    $('btnMobileBack')?.addEventListener('click', () => {
      els.edListPane.classList.remove('mobile-hidden');
      els.edFormPane.classList.remove('mobile-visible');
    });
  }

  /* ============================================================
   * 13. Combobox
   * ============================================================ */
  function setupCombobox(box, opts) {
    if (!box) return;
    const input = box.querySelector('input[data-field]');
    const popup = box.querySelector('.ed-combobox-popup');
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
          return '<div class="' + cls + '" data-idx="' + i + '">' + esc(label) + '</div>';
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

    input.addEventListener('focus', () => {
      highlight = 0;
      refresh(input.value);
    });
    input.addEventListener('input', () => {
      highlight = 0;
      refresh(input.value);
    });
    input.addEventListener('keydown', (e) => {
      if (popup.hidden) {
        if (e.key === 'ArrowDown') {
          refresh(input.value);
          e.preventDefault();
        }
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
   * 14. 主流程事件
   * ============================================================ */
  function bindHeaderEvents() {
    els.btnTheme.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
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

    els.versionTrigger.addEventListener('click', () => {
      if (!state.data) return;
      const items = [{ value: 'all', label: '全部版本' }];
      state.data.versions.forEach((v) => items.push({ value: v, label: v }));
      openSheet({
        header: '版本',
        items,
        current: state.versionFilter,
        onSelect: (v) => {
          state.versionFilter = v;
          els.versionLabel.textContent = v === 'all' ? '全部版本' : v;
          els.versionTrigger.classList.toggle('active', v !== 'all');
          renderList();
        }
      });
    });

    els.visibilityTrigger.addEventListener('click', () => {
      openSheet({
        header: '类型',
        items: [
          { value: 'all', label: '全部' },
          { value: 'normal', label: '正常' },
          { value: 'hidden', label: '隐藏' }
        ],
        current: state.visibilityFilter,
        onSelect: (v) => {
          state.visibilityFilter = v;
          els.visibilityLabel.textContent =
            v === 'all' ? '全部' : v === 'normal' ? '正常' : '隐藏';
          els.visibilityTrigger.classList.toggle('active', v !== 'all');
          renderList();
        }
      });
    });

    els.btnRenumber.addEventListener('click', async () => {
      if (!state.data) return toast('数据未加载', 'error');
      const sorted = allSortedEntries();
      const n = sorted.length;
      const ok = await confirmDialog({
        title: '重排 id',
        message: '将按当前显示顺序重新编号 1 ~ ' + n + '，原有 id 会被覆盖。',
        okText: '重排',
        danger: true
      });
      if (!ok) return;

      const selObj = state.selectedId != null
        ? state.data.entries.find((x) => x.id === state.selectedId)
        : null;

      sorted.forEach((e, i) => { e.id = i + 1; });
      if (selObj) state.selectedId = selObj.id;

      markDirty();
      renderList();
      renderForm();
      toast('已重排 ' + n + ' 条 id', 'success');
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
        const res = await fetch('../tales/data.js?t=' + Date.now(), { cache: 'no-store' });
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
        toast('已重载 ' + data.entries.length + ' 条', 'success');
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
          toast('已导入 ' + data.entries.length + ' 条', 'success');
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
      for (const e of state.data.entries) {
        if (!e.character) warnings.push('id ' + e.id + ' 缺少角色名');
        if (!e.version) warnings.push('id ' + e.id + ' 缺少版本');
        if (!e.title) warnings.push('id ' + e.id + ' 缺少旅闻名');
        if (idSet.has(e.id)) warnings.push('id ' + e.id + ' 重复');
        idSet.add(e.id);
        if (e.version && !state.data.versions.includes(e.version)) {
          warnings.push('id ' + e.id + ' 的版本「' + e.version + '」不在 versions 列表');
        }
      }
      if (warnings.length) {
        const msg =
          '发现 ' + warnings.length + ' 项问题：\n\n' +
          warnings.slice(0, 10).join('\n') +
          (warnings.length > 10 ? '\n…还有 ' + (warnings.length - 10) + ' 项' : '') +
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
      if (!state.data) return toast('数据未加载，请先「重载」或「导入」', 'error');
      const newId = state.data.entries.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
      const entry = {
        id: newId,
        character: '',
        version: '',
        title: '',
        hidden: false,
        location: '',
        trigger: '',
        prerequisite: '',
        description: ''
      };
      state.data.entries.push(entry);
      state.data.meta.total = state.data.entries.length;
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
        els.edFormPane.querySelector('input[data-field="character"]')?.focus();
      }, 60);
    });

    window.addEventListener('beforeunload', (e) => {
      if (state.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /* ============================================================
   * 15. 启动
   * ============================================================ */
  (function init() {
    injectIcons(document);
    bindHeaderEvents();

    const draft = loadDraft();
    if (draft?.entries) {
      state.data = draft;
      state.data.versions ||= [];
      state.data.meta ||= {};
      renderList();
      renderForm();
      state.dirty = true;
      els.dirtyDot.hidden = false;
      toast('已恢复草稿（未导出）', 'success');
    } else if (window.TRAVELERS_TALES?.entries) {
      state.data = structuredClone(window.TRAVELERS_TALES);
      state.data.versions ||= [];
      state.data.meta ||= {};
      renderList();
      renderForm();
    } else {
      renderList();
      renderForm();
    }

    document.body.classList.add('ready');
  })();
})();
