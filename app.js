/* =========================================================================
 * 提瓦特冒险之证 · 外壳逻辑 (2026 现代 ES6+ 版)
 * ========================================================================= */

'use strict';

const TOOLS = [
  {
    key: 'tales',
    label: '游逸旅闻',
    icon: 'character',      // 暂时借用，后续可换
    iconBold: 'characterBold',
    src: 'tools/tales/index.html'
  },
  {
    key: 'teapot',
    label: '尘歌壶赠礼',
    icon: 'mapEditor',
    iconBold: 'mapEditorBold',
    // src 暂未开发
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

/* =========================================================================
 * 主题控制
 * ========================================================================= */
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

  DOM.btnTheme.innerHTML = currentTheme === 'dark' ? ICONS.app.moonBold : ICONS.app.sunBold;
  try { localStorage.setItem(THEME_KEY, currentTheme); } catch (e) {}

  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-switching');
  }));
}

/* =========================================================================
 * 菜单渲染
 * ========================================================================= */
function renderMenu() {
  DOM.sidebarMenu.innerHTML = '';

  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.className = 'menu-main' + (isHome ? ' active' : '');
  const homeIcon = isHome ? ICONS.nav.homeBold : ICONS.nav.home;
  homeBtn.innerHTML = `<span class="menu-main-icon">${homeIcon}</span><span class="menu-main-label">首页</span>`;
  homeBtn.addEventListener('click', goHome);
  DOM.sidebarMenu.appendChild(homeBtn);

  TOOLS.forEach(tool => {
    const isActive = !isHome && tool.key === activeTool;
    const mainBtn = document.createElement('button');
    mainBtn.type = 'button';
    mainBtn.className = 'menu-main' + (isActive ? ' active' : '');
    
    const iconSvg = (ICONS.nav && ICONS.nav[isActive ? tool.iconBold : tool.icon]) || '';
    mainBtn.innerHTML = `
      <span class="menu-main-icon">${iconSvg}</span>
      <span class="menu-main-label">${tool.label}</span>
    `;
    mainBtn.addEventListener('click', () => selectTool(tool.key));
    DOM.sidebarMenu.appendChild(mainBtn);
  });
}

/* =========================================================================
 * 首页渲染
 * ========================================================================= */
function renderHome() {
  DOM.homeView.innerHTML = '';
  TOOLS.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'dash-card';
    card.innerHTML = `
      <div class="dash-card-icon">${ICONS.nav[tool.icon] || ''}</div>
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

/* =========================================================================
 * 侧边栏开关
 * ========================================================================= */
function openSidebar() {
  DOM.sidebarDrawer.classList.add('open');
  DOM.sidebarBackdrop.classList.add('active');
}
function closeSidebar() {
  DOM.sidebarDrawer.classList.remove('open');
  DOM.sidebarBackdrop.classList.remove('active');
}

/* =========================================================================
 * iframe 管理与工具切换
 * ========================================================================= */
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

  DOM.navIcon.innerHTML = (ICONS.nav && ICONS.nav[tool.iconBold]) || '';
  DOM.navText.textContent = tool.label;

  renderMenu();

  const record = ensureFrame(tool);
  frameCache.forEach(r => r.view.classList.toggle('active', r === record));
  DOM.loadingMask.classList.toggle('show', !record.loaded);

  closeSidebar();
}

/* =========================================================================
 * 初始化
 * ========================================================================= */
(async function init() {
  try { await window.__bootPromise; } catch (e) { console.warn(e); }

  DOM.btnMenu.innerHTML = ICONS.app.hamburger;
  DOM.btnClose.innerHTML = ICONS.app.close;

  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
  applyTheme(savedTheme);

  renderHome();
  goHome(); // 默认先回首页

  DOM.btnMenu.addEventListener('click', openSidebar);
  DOM.btnClose.addEventListener('click', closeSidebar);
  DOM.sidebarBackdrop.addEventListener('click', closeSidebar);
  DOM.btnTheme.addEventListener('click', () => {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  document.body.classList.add('ready');
})();
