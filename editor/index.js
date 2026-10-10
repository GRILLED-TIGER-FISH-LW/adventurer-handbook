/* ============================================================
 * 游逸旅闻编辑器 - 逻辑
 * ============================================================ */
(function () {
  'use strict';

  /* ============ 常量 ============ */
  const DRAFT_KEY = 'genshin_travelers_tales_editor_draft_v1';
  const THEME_KEY = 'genshin_travelers_tales_theme_v1';

  /* ============ 状态 ============ */
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

  /* ============ 头像反查 ============ */
  function buildAvatarCache() {
    const cache = new Map();
    if (!window.ICON_DICT || !window.ICON_DICT.characters) return cache;
    const cfg = window.ICON_DICT.config && window.ICON_DICT.config.characters;
    if (!cfg) return cache;
    for (const key in window.ICON_DICT.characters) {
      const item = window.ICON_DICT.characters[key];
      if (!item || !item.name) continue;
      let url;
      if (item.url)                   url = item.url;
      else if (key.endsWith('.webp')) url = cfg.prefix + key;
      else                            url = cfg.prefix + key + cfg.ext;
      cache.set(item.name, url);
    }
    return cache;
  }

  function buildCharList() {
    if (!window.ICON_DICT || !window.ICON_DICT.characters) return [];
    const arr = [];
    for (const key in window.ICON_DICT.characters) {
      const item = window.ICON_DICT.characters[key];
      if (!item || !item.name) continue;
      arr.push({ name: item.name, order: item.order || 9999 });
    }
    arr.sort((a, b) => a.order - b.order);
    return arr.map(x => x.name);
  }

  function avatarUrl(name) {
    return state.avatarCache.get(name) || '';
  }

  /* ============ DOM ============ */
  const $ = (id) => document.getElementById(id);
  const els = {
    dirtyDot: $('dirtyDot'),
    btnReload: $('btnReload'),
    btnImport: $('btnImport'),
    btnExport: $('btnExport'),
    btnTheme: $('btnTheme'),
    fileInput: $('fileInput'),
    listPane: $('edListPane'),
    formPane: $('edFormPane'),
    searchInput: $('searchInput'),
    versionTrigger: $('versionTrigger'),
    versionLabel: $('versionLabel'),
    visibilityTrigger: $('visibilityTrigger'),
    visibilityLabel: $('visibilityLabel'),
    edList: $('edList'),
    btnAdd: $('btnAdd')
  };

  /* ============ 工具 ============ */
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escJs(str) {
    if (str == null) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/\t/g, '\\t');
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function toast(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:rgba(31,29,26,.9);color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;z-index:9999;pointer-events:none;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  function confirmBox(msg) {
    return window.confirm(msg);
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
  els.btnTheme.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  })();

  /* ============ 草稿 ============ */
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state.data));
    } catch (e) {}
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }
  function markDirty() {
    state.dirty = true;
    els.dirtyDot.hidden = false;
    saveDraft();
  }
  function clearDirty() {
    state.dirty = false;
    els.dirtyDot.hidden = true;
  }

  /* ============ 数据解析/序列化 ============ */
  function parseDataJs(text) {
    const cleaned = text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const match = cleaned.match(/window\.TRAVELERS_TALES\s*=\s*([\s\S]*?);?\s*$/);
    if (!match) throw new Error('未找到 window.TRAVELERS_TALES');
    let data;
    try {
      data = new Function('return ' + match[1])();
    } catch (e) {
      throw new Error('语法错误：' + e.message);
    }
    if (!data || typeof data !== 'object') throw new Error('解析结果不是对象');
    if (!Array.isArray(data.entries)) throw new Error('缺少 entries 数组');
    if (!Array.isArray(data.versions)) data.versions = [];
    if (!data.meta) data.meta = {};
    return data;
  }

  function serializeData(data) {
    const lines = [];
    lines.push('/* ============================================================');
    lines.push(' * 原神 · 游逸旅闻 数据字典');
    lines.push(' * 生成时间：' + todayStr());
    lines.push(' * ============================================================');
    lines.push(' * 说明：');
    lines.push(' *   · 只记录「主角色」（角色列为空的条目，向上继承最近的非空角色）');
    lines.push(' *   · hidden = 「隐藏（地图不显示）触发条件」列非空');
    lines.push(' *   · extra 字段保存「额外出场角色」，前端不展示，保留供以后使用');
    lines.push(' *   · 头像 URL 由 window.ICON_DICT 运行时匹配，本文件不含图片地址');
    lines.push(' *   · trigger / prerequisite 字段不含「备注：」「前置：」前缀，也不含 <br>');
    lines.push(' *   · id 已按「先版本、后同角色」重排，仅作字典内部排序用，页面不展示');
    lines.push(' *   · 标点统一用中文全角');
    lines.push(' * ============================================================ */');
    lines.push('');
    lines.push('window.TRAVELERS_TALES = {');
    lines.push('  meta: {');
    lines.push('    version: "' + escJs(data.meta.version || '') + '",');
    lines.push('    total: ' + (data.meta.total || data.entries.length) + ',');
    lines.push('    updatedAt: "' + todayStr() + '",');
    lines.push('    source: "' + escJs(data.meta.source || '') + '"');
    lines.push('  },');
    lines.push('');
    lines.push('  versions: [' + data.versions.map(v => '"' + escJs(v) + '"').join(', ') + '],');
    lines.push('');
    lines.push('  entries: [');

    const grouped = new Map();
    data.versions.forEach(v => grouped.set(v, []));
    for (const e of data.entries) {
      if (!grouped.has(e.version)) grouped.set(e.version, []);
      grouped.get(e.version).push(e);
    }
    for (const [, list] of grouped) {
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    let first = true;
    for (const [v, list] of grouped) {
      if (!list.length) continue;
      if (!first) lines.push('');
      lines.push('    /* ==================== ' + v + ' ==================== */');
      for (const e of list) {
        lines.push('    { id: ' + (e.id || 0) +
          ', character: "' + escJs(e.character) + '"' +
          ', version: "' + escJs(e.version) + '"' +
          ', title: "' + escJs(e.title) + '"' +
          ', hidden: ' + (e.hidden ? 'true' : 'false') + ',');
        lines.push('      location: "' + escJs(e.location) + '"' +
          ', trigger: "' + escJs(e.trigger) + '"' +
          ', prerequisite: "' + escJs(e.prerequisite) + '"' +
          ', extra: "' + escJs(e.extra) + '",');
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

  /* ============ 过滤 ============ */
  function getFilteredEntries() {
    if (!state.data) return [];
    const kw = state.search.trim().toLowerCase();
    return state.data.entries.filter(e => {
      if (state.versionFilter !== 'all' && e.version !== state.versionFilter) return false;
      if (state.visibilityFilter === 'normal' && e.hidden) return false;
      if (state.visibilityFilter === 'hidden' && !e.hidden) return false;
      if (kw) {
        const hay = ((e.character || '') + ' ' + (e.title || '')).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }

  /* ============ 渲染列表 ============ */
  function renderList() {
    if (!state.data) {
      els.edList.innerHTML = '<div class="ed-list-empty">数据未加载<br>点右上角「重载」或「导入本地」</div>';
      return;
    }
    const list = getFilteredEntries();
    if (!list.length) {
      els.edList.innerHTML = '<div class="ed-list-empty">没有匹配的条目</div>';
      return;
    }
    els.edList.innerHTML = list.map(e => {
      const url = avatarUrl(e.character);
      const initial = e.character ? e.character.charAt(0) : '?';
      const avatarHtml = url
        ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">${esc(initial)}`
        : esc(initial);
      const active = e.id === state.selectedId ? ' active' : '';
      const hiddenCls = e.hidden ? ' hidden-title' : '';
      return `<div class="ed-list-item${active}" data-id="${e.id}">` +
        `<div class="ed-list-item-avatar">${avatarHtml}</div>` +
        `<div class="ed-list-item-body">` +
          `<div class="ed-list-item-title${hiddenCls}">${esc(e.title || '(无标题)')}</div>` +
          `<div class="ed-list-item-sub">${esc(e.character || '?')} · ${esc(e.version || '?')}</div>` +
        `</div>` +
      `</div>`;
    }).join('');
  }

  /* ============ 渲染表单 ============ */
  function renderForm() {
    if (!state.data) {
      els.formPane.innerHTML =
        '<div class="ed-form-empty">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
            '<polyline points="14 2 14 8 20 8"></polyline>' +
          '</svg>' +
          '<div>数据未加载</div>' +
        '</div>';
      return;
    }

    if (state.selectedId == null) {
      els.formPane.innerHTML =
        '<div class="ed-form-empty">' +
          '<div>从左侧选择一个条目开始编辑<br>或点击「新增条目」</div>' +
        '</div>';
      return;
    }

    const e = state.data.entries.find(x => x.id === state.selectedId);
    if (!e) {
      els.formPane.innerHTML = '<div class="ed-form-empty"><div>条目不存在</div></div>';
      return;
    }

    const url = avatarUrl(e.character);
    const initial = e.character ? e.character.charAt(0) : '?';
    const avatarHtml = url
      ? `<img src="${esc(url)}" alt="" onerror="this.remove()">${esc(initial)}`
      : esc(initial);

    const headingSub = state.isNew
      ? '新建条目 · id ' + e.id
      : (e.hidden ? '隐藏旅闻' : '正常旅闻') + ' · id ' + e.id;

    els.formPane.innerHTML =
      '<div class="ed-form">' +

        '<button type="button" class="ed-mobile-back" id="btnMobileBack">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '<span>返回列表</span>' +
        '</button>' +

        '<div class="ed-form-heading">' +
          '<div class="ed-form-heading-avatar">' + avatarHtml + '</div>' +
          '<div class="ed-form-heading-info">' +
            '<h2 class="ed-form-heading-name">' + esc(e.character || '(未命名角色)') + ' · ' + esc(e.title || '(无标题)') + '</h2>' +
            '<div class="ed-form-heading-sub">' + esc(headingSub) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ed-row-2">' +
          '<div class="ed-group">' +
            '<label class="ed-label">id <span class="ed-label-hint">可手动改，需唯一</span></label>' +
            '<input type="text" class="ed-input" data-field="id" value="' + esc(e.id) + '">' +
          '</div>' +
          '<div class="ed-group">' +
            '<label class="ed-label">版本 <span class="ed-label-hint">打字可新建</span></label>' +
            '<div class="ed-combobox" data-combobox="version">' +
              '<input type="text" class="ed-input" data-field="version" value="' + esc(e.version || '') + '" autocomplete="off" spellcheck="false">' +
              '<div class="ed-combobox-popup" hidden></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">角色名 <span class="ed-label-hint">从字典联想，可自定义</span></label>' +
          '<div class="ed-combobox' + (url ? ' has-avatar' : '') + '" data-combobox="character">' +
            '<div class="ed-combobox-input-wrap">' +
              '<div class="ed-combobox-avatar">' + avatarHtml + '</div>' +
              '<input type="text" class="ed-input" data-field="character" value="' + esc(e.character || '') + '" autocomplete="off" spellcheck="false">' +
            '</div>' +
            '<div class="ed-combobox-popup" hidden></div>' +
          '</div>' +
          (e.character && !url ? '<div class="ed-hint warn">字典中无此角色，主界面将显示首字占位</div>' : '') +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">旅闻名</label>' +
          '<input type="text" class="ed-input" data-field="title" value="' + esc(e.title || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">隐藏</label>' +
          '<label class="ed-checkbox-wrap">' +
            '<input type="checkbox" data-field="hidden"' + (e.hidden ? ' checked' : '') + '>' +
            '<div class="ed-checkbox-box">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 13 10 18 19 7"></polyline></svg>' +
            '</div>' +
            '<span class="ed-checkbox-text">标记为隐藏旅闻（主界面红色加粗显示）</span>' +
          '</label>' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">地点</label>' +
          '<input type="text" class="ed-input" data-field="location" value="' + esc(e.location || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">触发条件</label>' +
          '<input type="text" class="ed-input" data-field="trigger" value="' + esc(e.trigger || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">前置旅闻 <span class="ed-label-hint">只填旅闻名，如「达达利亚·购票」</span></label>' +
          '<input type="text" class="ed-input" data-field="prerequisite" value="' + esc(e.prerequisite || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">额外出场角色 <span class="ed-label-hint">主界面不显示，仅存档用</span></label>' +
          '<input type="text" class="ed-input" data-field="extra" value="' + esc(e.extra || '') + '">' +
        '</div>' +

        '<div class="ed-group">' +
          '<label class="ed-label">描述 <span class="ed-label-hint">支持换行，换行会被保存</span></label>' +
          '<textarea class="ed-textarea" data-field="description" rows="6">' + esc(e.description || '') + '</textarea>' +
        '</div>' +

        '<div class="ed-actions">' +
          '<button type="button" class="ed-btn ed-btn-danger" id="btnDelete">删除此条</button>' +
        '</div>' +

      '</div>';

    bindFormEvents(e);
  }

  /* ============ 表单事件绑定 ============ */
  function bindFormEvents(entry) {
    els.formPane.querySelectorAll('[data-field]').forEach(input => {
      const field = input.dataset.field;
      const handler = () => {
        let value;
        if (input.type === 'checkbox') value = input.checked;
        else if (field === 'id') value = parseInt(input.value, 10) || 0;
        else value = input.value;

        if (field === 'id') {
          entry.id = value;
          state.selectedId = value;
        } else {
          entry[field] = value;
        }

        markDirty();
        if (field === 'title' || field === 'character' || field === 'version' || field === 'hidden' || field === 'id') {
          renderList();
        }
        if (field === 'character' || field === 'title') {
          const nameEl = els.formPane.querySelector('.ed-form-heading-name');
          if (nameEl) nameEl.textContent = (entry.character || '(未命名角色)') + ' · ' + (entry.title || '(无标题)');
        }
        if (field === 'character') {
          const url = avatarUrl(entry.character);
          const initial = entry.character ? entry.character.charAt(0) : '?';
          const avatarHtml = url
            ? `<img src="${esc(url)}" alt="" onerror="this.remove()">${esc(initial)}`
            : esc(initial);
          els.formPane.querySelectorAll('.ed-combobox-avatar, .ed-form-heading-avatar').forEach(el => {
            el.innerHTML = avatarHtml;
          });
          els.formPane.querySelectorAll('.ed-combobox').forEach(box => {
            box.classList.toggle('has-avatar', !!url);
          });
        }
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    setupCombobox(
      els.formPane.querySelector('.ed-combobox[data-combobox="version"]'),
      {
        items: () => state.data.versions,
        allowCustom: true,
        customLabel: (v) => '＋ 新增版本：' + v,
        onSelect: (v) => {
          entry.version = v;
          if (!state.data.versions.includes(v)) {
            state.data.versions.push(v);
          }
          markDirty();
          renderList();
        }
      }
    );

    setupCombobox(
      els.formPane.querySelector('.ed-combobox[data-combobox="character"]'),
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

    const btnDelete = $('btnDelete');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (!confirmBox('确定删除「' + (entry.character || '?') + ' · ' + (entry.title || '?') + '」吗？此操作不可撤销。')) return;
        const idx = state.data.entries.findIndex(x => x.id === entry.id);
        if (idx >= 0) state.data.entries.splice(idx, 1);
        state.selectedId = null;
        state.isNew = false;
        markDirty();
        renderList();
        renderForm();
      });
    }

    const btnBack = $('btnMobileBack');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        els.listPane.classList.remove('mobile-hidden');
        els.formPane.classList.remove('mobile-visible');
      });
    }
  }

  /* ============ Combobox ============ */
  function setupCombobox(box, opts) {
    if (!box) return;
    const input = box.querySelector('input[data-field]');
    const popup = box.querySelector('.ed-combobox-popup');
    let highlight = 0;
    let currentItems = [];

    function close() {
      popup.hidden = true;
      currentItems = [];
    }

    function refresh(query) {
      const all = opts.items() || [];
      const q = (query || '').trim().toLowerCase();
      let matched = q ? all.filter(x => x.toLowerCase().includes(q)) : all;
      matched = matched.slice(0, 40);

      currentItems = matched.map(x => ({ value: x, isNew: false }));

      if (opts.allowCustom) {
        const raw = (query || '').trim();
        if (raw && !all.some(x => x === raw)) {
          currentItems.push({ value: raw, isNew: true });
        }
      }

      if (!currentItems.length) {
        popup.innerHTML = '<div class="ed-combobox-empty">无匹配</div>';
        popup.hidden = false;
        return;
      }

      popup.innerHTML = currentItems.map((it, i) => {
        const cls = 'ed-combobox-option' + (it.isNew ? ' is-new' : '') + (i === highlight ? ' highlight' : '');
        const label = it.isNew && opts.customLabel ? opts.customLabel(it.value) : it.value;
        return '<div class="' + cls + '" data-idx="' + i + '">' + esc(label) + '</div>';
      }).join('');
      popup.hidden = false;
    }

    function select(idx) {
      const it = currentItems[idx];
      if (!it) return;
      input.value = it.value;
      opts.onSelect(it.value);
      close();
    }

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

    popup.addEventListener('mousedown', (e) => {
      const opt = e.target.closest('.ed-combobox-option');
      if (!opt) return;
      const idx = parseInt(opt.dataset.idx, 10);
      select(idx);
      e.preventDefault();
    });

    input.addEventListener('blur', () => {
      setTimeout(close, 150);
    });

    function refreshHighlight() {
      popup.querySelectorAll('.ed-combobox-option').forEach((el, i) => {
        el.classList.toggle('highlight', i === highlight);
      });
      const el = popup.querySelector('.ed-combobox-option.highlight');
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ============ 列表点击 ============ */
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
      els.listPane.classList.add('mobile-hidden');
      els.formPane.classList.add('mobile-visible');
    }
  });

  /* ============ 新增条目 ============ */
  els.btnAdd.addEventListener('click', () => {
    if (!state.data) {
      alert('数据未加载，请先点「重载」或「导入本地」');
      return;
    }
    const maxId = state.data.entries.reduce((m, x) => Math.max(m, x.id || 0), 0);
    const newId = maxId + 1;
    const e = {
      id: newId,
      character: '',
      version: '',
      title: '',
      hidden: false,
      location: '',
      trigger: '',
      prerequisite: '',
      extra: '',
      description: ''
    };
    state.data.entries.push(e);
    state.data.meta.total = state.data.entries.length;
    state.selectedId = newId;
    state.isNew = true;
    markDirty();
    renderList();
    renderForm();

    if (window.innerWidth <= 900) {
      els.listPane.classList.add('mobile-hidden');
      els.formPane.classList.add('mobile-visible');
    }
    setTimeout(() => {
      const ch = els.formPane.querySelector('input[data-field="character"]');
      if (ch) ch.focus();
    }, 50);
  });

  /* ============ 搜索 ============ */
  let searchTimer = null;
  els.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = els.searchInput.value;
      renderList();
    }, 150);
  });

  /* ============ 筛选下拉 ============ */
  function openFilterMenu(trigger, items, currentValue, onSelect) {
    const exist = document.querySelector('.ed-filter-menu');
    if (exist) exist.remove();

    const rect = trigger.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'ed-filter-menu';
    menu.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${rect.left}px;min-width:${rect.width}px;max-width:80vw;max-height:50vh;overflow-y:auto;background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-sm);box-shadow:0 4px 20px rgba(31,29,26,.15);z-index:100;padding:4px;`;

    items.forEach(item => {
      const el = document.createElement('div');
      el.style.cssText = `padding:8px 12px;font-size:12.5px;border-radius:var(--radius-sm);cursor:pointer;color:var(--text-primary);white-space:nowrap;`;
      el.textContent = item.label;
      if (item.value === currentValue) {
        el.style.background = 'var(--accent-soft)';
        el.style.color = 'var(--accent)';
        el.style.fontWeight = '600';
      }
      el.addEventListener('mouseenter', () => { el.style.background = 'var(--bg-hover)'; });
      el.addEventListener('mouseleave', () => {
        if (item.value === currentValue) {
          el.style.background = 'var(--accent-soft)';
        } else {
          el.style.background = 'transparent';
        }
      });
      el.addEventListener('click', () => {
        onSelect(item.value);
        menu.remove();
      });
      menu.appendChild(el);
    });

    document.body.appendChild(menu);

    setTimeout(() => {
      const closeMenu = (ev) => {
        if (!menu.contains(ev.target) && !trigger.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  els.versionTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.data) return;
    const items = [{ value: 'all', label: '全部版本' }];
    state.data.versions.forEach(v => items.push({ value: v, label: v }));
    openFilterMenu(els.versionTrigger, items, state.versionFilter, (v) => {
      state.versionFilter = v;
      els.versionLabel.textContent = v === 'all' ? '全部版本' : v;
      els.versionTrigger.classList.toggle('active', v !== 'all');
      renderList();
    });
  });

  els.visibilityTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const items = [
      { value: 'all', label: '全部' },
      { value: 'normal', label: '正常' },
      { value: 'hidden', label: '隐藏' }
    ];
    openFilterMenu(els.visibilityTrigger, items, state.visibilityFilter, (v) => {
      state.visibilityFilter = v;
      els.visibilityLabel.textContent = v === 'all' ? '全部' : v === 'normal' ? '正常' : '隐藏';
      els.visibilityTrigger.classList.toggle('active', v !== 'all');
      renderList();
    });
  });

  /* ============ 重载线上 ============ */
  els.btnReload.addEventListener('click', async () => {
    if (state.dirty && !confirmBox('当前有未保存的修改，重载会丢弃这些改动。继续吗？')) return;

    // file:// 打开时 fetch 会失败，直接提示
    if (location.protocol === 'file:') {
      alert('本地 file:// 打开时无法重载线上数据。请使用「导入本地」。');
      return;
    }

    try {
      const res = await fetch('../data.js?t=' + Date.now(), { cache: 'no-store' });
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
      toast('已重载线上数据（' + data.entries.length + ' 条）');
    } catch (err) {
      alert('重载失败：' + err.message);
    }
  });

  /* ============ 导入本地 ============ */
  els.btnImport.addEventListener('click', () => els.fileInput.click());

  els.fileInput.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
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
        toast('已导入 ' + data.entries.length + ' 条');
      } catch (err) {
        alert('导入失败：' + err.message);
      }
      els.fileInput.value = '';
    };
    reader.readAsText(file);
  });

  /* ============ 导出 ============ */
  els.btnExport.addEventListener('click', () => {
    if (!state.data) {
      alert('数据未加载');
      return;
    }
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
      const msg = '发现 ' + warnings.length + ' 项问题：\n\n' +
        warnings.slice(0, 10).join('\n') +
        (warnings.length > 10 ? '\n…还有 ' + (warnings.length - 10) + ' 项' : '') +
        '\n\n是否继续导出？';
      if (!confirmBox(msg)) return;
    }

    state.data.meta.total = state.data.entries.length;

    const text = serializeData(state.data);
    const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    clearDirty();
    toast('已导出 data.js');
  });

  /* ============ 离开提示 ============ */
  window.addEventListener('beforeunload', (e) => {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ============ 启动 ============ */
  (function init() {
    // 1. 优先草稿
    const draft = loadDraft();
    if (draft && Array.isArray(draft.entries)) {
      state.data = draft;
      if (!state.data.versions) state.data.versions = [];
      if (!state.data.meta) state.data.meta = {};
      renderList();
      renderForm();
      toast('已恢复上次编辑的草稿');
      return;
    }

    // 2. 用线上加载的 data.js
    if (window.TRAVELERS_TALES && Array.isArray(window.TRAVELERS_TALES.entries)) {
      state.data = JSON.parse(JSON.stringify(window.TRAVELERS_TALES));
      if (!state.data.versions) state.data.versions = [];
      if (!state.data.meta) state.data.meta = {};
      renderList();
      renderForm();
      return;
    }

    // 3. 都没有 → 空
    renderList();
    renderForm();
  })();

})();
