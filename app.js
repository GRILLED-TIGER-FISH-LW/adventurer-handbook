/* =========================================================================
 * 提瓦特冒险之证 · 外壳逻辑 (2026 现代免缓存+智能裁切版)
 * ========================================================================= */

'use strict';

const TOOLS = [
  { key: 'tales', label: '游逸旅闻', icon: 'tales', iconBold: 'talesBold', src: 'tools/tales/index.html' },
  { key: 'gift-set', label: '尘歌壶赠礼套装', icon: 'gift-set', iconBold: 'gift-setBold' }
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

const FALLBACKS = {
  burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
};

function getSvgIcon(key, fallbackSvg = '') {
  if (window.LOCAL_ICONS && window.LOCAL_ICONS[key]) return window.LOCAL_ICONS[key];
  try {
    if (!window.ICONS) return fallbackSvg;
    const parts = key.split('.');
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

/* =========================================================================
 * 【核心黑科技】前端 Canvas 像素级智能去白边裁切
 * ========================================================================= */
function autoCropImages() {
  document.querySelectorAll('.auto-crop-img').forEach(img => {
    if (img.dataset.cropped) return;
    
    // 必须是完全加载完的图片
    if (img.complete && img.naturalWidth > 0) {
      processCrop(img);
    } else {
      img.addEventListener('load', () => processCrop(img), { once: true });
    }
  });
}

function processCrop(img) {
  // 防止重复处理
  if (img.dataset.cropped) return;
  img.dataset.cropped = '1';

  try {
    const cvs = document.createElement('canvas');
    cvs.width = img.naturalWidth;
    cvs.height = img.naturalHeight;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    
    const w = cvs.width;
    const h = cvs.height;
    const imgData = ctx.getImageData(0, 0, w, h).data;
    
    let top = h, left = w, right = 0, bottom = 0;
    
    // 逐像素扫描，找到非透明区域（Alpha > 0）的边界
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = imgData[(y * w + x) * 4 + 3];
        if (alpha > 10) { // 容差，忽略极浅的噪点
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }

    // 如果找到了有效边界，就重新绘制并替换原图
    if (top < bottom && left < right) {
      // 为了防止边缘太锐利，稍微往外扩 1px 安全区
      top = Math.max(0, top - 1);
      left = Math.max(0, left - 1);
      bottom = Math.min(h, bottom + 1);
      right = Math.min(w, right + 1);

      const cropW = right - left;
      const cropH = bottom - top;

      const newCvs = document.createElement('canvas');
      newCvs.width = cropW;
      newCvs.height = cropH;
      const newCtx = newCvs.getContext('2d');
      
      newCtx.drawImage(cvs, left, top, cropW, cropH, 0, 0, cropW, cropH);
      
      // 用裁切后的数据覆盖图片源
      img.src = newCvs.toDataURL('image/png');
    }
  } catch (e) {
    console.warn("由于跨域限制，图片无法进行前端像素裁切", e);
  }
}

/* =========================================================================
 * 业务逻辑
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

  DOM.btnTheme.innerHTML = currentTheme === 'dark' 
    ? getSvgIcon('app.moonBold', FALLBACKS.moon) 
    : getSvgIcon('app.sunBold', FALLBACKS.sun);
    
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
  homeBtn.innerHTML = `<span class="menu-main-icon">${getSvgIcon(isHome ? 'nav.homeBold' : 'nav.home', FALLBACKS.home)}</span><span class="menu-main-label">首页</span>`;
  homeBtn.addEventListener('click', goHome);
  DOM.sidebarMenu.appendChild(homeBtn);

  TOOLS.forEach(tool => {
    const isActive = !isHome && tool.key === activeTool;
    const mainBtn = document.createElement('button');
    mainBtn.type = 'button';
    mainBtn.className = 'menu-main' + (isActive ? ' active' : '');
    
    const iconSvg = getSvgIcon(isActive ? tool.iconBold : tool.icon);
    mainBtn.innerHTML = `
      <span class="menu-main-icon">${iconSvg}</span>
      <span class="menu-main-label">${tool.label}</span>
    `;
    mainBtn.addEventListener('click', () => selectTool(tool.key));
    DOM.sidebarMenu.appendChild(mainBtn);
  });
  
  // 侧边栏渲染完后，触发自动裁切
  autoCropImages();
}

function renderHome() {
  DOM.homeView.innerHTML = '';
  TOOLS.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'dash-card';
    card.innerHTML = `
      <div class="dash-card-icon">${getSvgIcon(tool.icon)}</div>
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
  
  // 首页渲染完后，触发自动裁切
  autoCropImages();
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

  DOM.navIcon.innerHTML = getSvgIcon(tool.iconBold);
  DOM.navText.textContent = tool.label;

  renderMenu();
  
  // 顶栏图标更新后，也触发一次自动裁切
  autoCropImages();

  const record = ensureFrame(tool);
  frameCache.forEach(r => r.view.classList.toggle('active', r === record));
  DOM.loadingMask.classList.toggle('show', !record.loaded);

  closeSidebar();
}

(async function init() {
  try { await window.__bootPromise; } catch (e) { console.warn('资源加载异常', e); }

  DOM.btnMenu.innerHTML = getSvgIcon('app.hamburger', FALLBACKS.burger);
  DOM.btnClose.innerHTML = getSvgIcon('app.close', FALLBACKS.close);

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
