import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'

/* meta 同时供三处使用：顶栏标题、抽屉菜单、首页卡片
   —— 加一个工具只改这个数组。
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
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
