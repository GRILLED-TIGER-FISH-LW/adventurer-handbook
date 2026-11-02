import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'

/* meta.label 同时供三处使用：顶栏标题、抽屉菜单项、首页卡片
   —— 单一来源，加一个工具只改这一个数组 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/tales',
    name: 'tales',
    component: () => import('./views/Tales.vue'),
    meta: { label: '游逸旅闻', desc: '156 条旅闻 · 完成记录' },
  },
  {
    path: '/gift-set',
    name: 'giftSet',
    component: () => import('./views/GiftSet.vue'),
    meta: { label: '尘歌壶赠礼套装', desc: '套装完成进度 · 角色偏好' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
