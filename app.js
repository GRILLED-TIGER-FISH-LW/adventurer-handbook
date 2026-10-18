/* =========================================================================
 * 提瓦特冒险之证 · 外壳逻辑 (2026 现代容错版)
 * ========================================================================= */

'use strict';

const TOOLS = [
  {
    key: 'tales',
    label: '游逸旅闻',
    icon: 'character',
    iconBold: 'characterBold',
    src: 'tools/tales/index.html'
  },
  {
    key: 'teapot',
    label: '尘歌壶赠礼',
    icon: 'mapEditor',
    iconBold: 'mapEditorBold',
  }
];

const THEME_KEY = 'teyvat_handbook_theme_v1';

const DOM = {
  homeView: document.getElementById('homeView'),
  frameContainer: document.getElementById('frameContainer'),
  sidebarDrawer: document.getElementById('sidebarDrawer'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  sidebarMenu: document.getElementById('sidebarMenu'),
  loadingMask: document.getElementById('loadingMask'),
  navIcon: document.getElementById('navIcon'),
  navText: document.getElementById('navText'),
  btnMenu: document.getElementById('btnMenu'),
  btnClose: document.getElementById('btnClose'),
  btnTheme: document.getElementById('btnTheme'),
};

const frameCache = new Map();
let currentTheme = 'light';
let isHome = true;
let activeTool = '';

// 极限容错：如果外部图标库加载失败，用备用 SVG 顶替
const FALLBACKS = {
  burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
};

function safeIcon(path, fallbackSvg = '') {
  try {
    if (!window.ICONS) return fallbackSvg;
    const parts = path.split('.');
    let node = window.ICONS;
    for (let p of parts) {
      if (!node) return fallbackSvg;
      node = node[p];
    }
    return typeof node === 'string' ? node : fallbackSvg;
  } catch (e) {
    return fallbackSvg;
  }
}

function applyTheme(theme) {
  currentTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.add('theme-switching');
  document.documentElement.setAttribute('data-theme', currentTheme);

  frameCache.forEach(record => {
    if (!record.loaded) return;
    try {
      if (record.iframe.contentWindow) {
        record.iframe.contentWindow.postMessage({ type: 'theme', theme: currentTheme }, '*');
      }
    } catch (e) {}
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', currentTheme === 'dark' ? '#1A1816' : '#F4F1EA');

  DOM.btnTheme.innerHTML = currentTheme === 'dark' 
    ? safeIcon('app.moonBold', FALLBACKS.moon) 
    : safeIcon('app.sunBold', FALLBACKS.sun);
    
  try { localStorage.setItem(THEME_KEY, currentTheme); } catch (e) {}

  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-switching');
  }));
}

function renderMenu() {
  DOM.sidebarMenu.innerHTML = '';
  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.className = 'menu-main' + (isHome ? ' active' : '');
  homeBtn.innerHTML = `<span class="menu-main-icon">${safeIcon(isHome ? 'nav.homeBold' : 'nav.home', FALLBACKS.home)}</span><span class="menu-main-label">首页</span>`;
  homeBtn.addEventListener('click', goHome);
  DOM.sidebarMenu.appendChild(homeBtn);

  TOOLS.forEach(tool => {
    const isActive = !isHome && tool.key === activeTool;
    const mainBtn = document.createElement('button');
    mainBtn.type = 'button';
    mainBtn.className = 'menu-main' + (isActive ? ' active' : '');
    
    const iconSvg = safeIcon(`nav.${isActive ? tool.iconBold : tool.icon}`);
    mainBtn.innerHTML = `
      <span class="menu-main-icon">${iconSvg}</span>
      <span class="menu-main-label">${tool.label}</span>
    `;
    mainBtn.addEventListener('click', () => selectTool(tool.key));
    DOM.sidebarMenu.appendChild(mainBtn);
  });
}

function renderHome() {
  DOM.homeView.innerHTML = '';
  TOOLS.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'dash-card';
    card.innerHTML = `
      <div class="dash-card-icon">${safeIcon(`nav.${tool.icon}`)}</div>
      <div>
        <div class="dash-card-title">${tool.label}</div>
        ${!tool.src ? '<div class="dash-card-sub">规划中</div>' : ''}
      </div>
    `;
    card.addEventListener('click', () => {
      if (!tool.src) return;
      selectTool(tool.key);
    });
    DOM.homeView.appendChild(card);
  });
}

function openSidebar() {
  DOM.sidebarDrawer.classList.add('open');
  DOM.sidebarBackdrop.classList.add('active');
}
function closeSidebar() {
  DOM.sidebarDrawer.classList.remove('open');
  DOM.sidebarBackdrop.classList.remove('active');
}

function ensureFrame(tool) {
  if (frameCache.has(tool.key)) return frameCache.get(tool.key);

  const ts = window.__pageLoadTs || Date.now();
  const src = tool.src + (tool.src.indexOf('?') >= 0 ? '&' : '?') + 't=' + ts;

  const view = document.createElement('div');
  view.className = 'frame-view';
  view.dataset.key = tool.key;

  const iframe = document.createElement('iframe');
  iframe.title = tool.label;
  iframe.setAttribute('loading', 'lazy');
  iframe.src = src;

  const record = { view, iframe, loaded: false };

  iframe.addEventListener('load', () => {
    record.loaded = true;
    if (view.classList.contains('active')) DOM.loadingMask.classList.remove('show');
    try {
      if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'theme', theme: currentTheme }, '*');
    } catch (e) {}
  });

  view.appendChild(iframe);
  DOM.frameContainer.appendChild(view);
  frameCache.set(tool.key, record);
  return record;
}

function goHome() {
  isHome = true;
  activeTool = '';
  DOM.frameContainer.classList.remove('active');
  DOM.homeView.classList.remove('hidden');
  DOM.loadingMask.classList.remove('show');
  DOM.navIcon.innerHTML = '';
  DOM.navText.textContent = '提瓦特冒险之证';
  renderMenu();
  closeSidebar();
}

function selectTool(toolKey) {
  const tool = TOOLS.find(t => t.key === toolKey);
  if (!tool || !tool.src) return;

  isHome = false;
  activeTool = tool.key;

  DOM.homeView.classList.add('hidden');
  DOM.frameContainer.classList.add('active');

  DOM.navIcon.innerHTML = safeIcon(`nav.${tool.iconBold}`);
  DOM.navText.textContent = tool.label;

  renderMenu();

  const record = ensureFrame(tool);
  frameCache.forEach(r => r.view.classList.toggle('active', r === record));
  DOM.loadingMask.classList.toggle('show', !record.loaded);

  closeSidebar();
}

(async function init() {
  try {
    await window.__bootPromise; 
  } catch (e) { 
    console.warn('资源加载异常，已启用降级方案', e); 
  }

  DOM.btnMenu.innerHTML = safeIcon('app.hamburger', FALLBACKS.burger);
  DOM.btnClose.innerHTML = safeIcon('app.close', FALLBACKS.close);

  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
  applyTheme(savedTheme);

  renderHome();
  goHome(); 

  DOM.btnMenu.addEventListener('click', openSidebar);
  DOM.btnClose.addEventListener('click', closeSidebar);
  DOM.sidebarBackdrop.addEventListener('click', closeSidebar);
  DOM.btnTheme.addEventListener('click', () => {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  document.body.classList.add('ready');
})();
