import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'

/* meta 同时供多处使用：
   · label  → 进导航（首页卡片 + 侧栏菜单）
   · title  → 只做顶栏标题，不进导航（内部页用）
   · icon   → 顶栏与卡片图标
   注意：desc 不要写数量，数据更新时不想再改这里 */
const routes = [
  { path: '/', name: 'home', component: Home },
  {
    path: '/tales',
    name: 'tales',
    component: () => import('./views/Tales.vue'),
    meta: { label: '游逸旅闻', desc: '旅闻查询 · 完成记录', icon: 'handbook.tales' },
  },
  {
    path: '/gift-set',
    name: 'giftSet',
    component: () => import('./views/GiftSet.vue'),
    meta: { label: '尘歌壶赠礼套装', desc: '套装进度 · 角色偏好', icon: 'handbook.giftSet' },
  },
  {
    path: '/tales-editor',
    name: 'talesEditor',
    component: () => import('./views/TalesEditor.vue'),
    meta: { title: '游逸旅闻编辑器', icon: 'handbook.tales' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
