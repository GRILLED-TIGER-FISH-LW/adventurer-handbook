<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SolarIcon from './SolarIcon.vue'

const open = defineModel({ type: Boolean, default: false })

const route = useRoute()
const router = useRouter()

/* 首页不在路由条目里，菜单入口单独写一行 */
const items = computed(() => [
  { path: '/', label: '首页', icon: 'home' },
  ...router.options.routes
    .filter((r) => r.meta?.label)
    .map((r) => ({ path: r.path, label: r.meta.label, icon: r.meta.icon })),
])

const isActive = (path) => route.path === path

function close() {
  open.value = false
}

watch(() => route.fullPath, close)

/* 抽屉打开时把背景整块设成 inert：读屏和 Tab 都跑不到后面去。
   el-drawer 内部就是 focus-trap 组件（loop + 关闭时归还焦点），Esc 和点遮罩关闭也由它处理，
   所以这里不用再手写键盘循环。 */
const appRoot = document.getElementById('app')

watch(open, (v) => {
  if (appRoot) appRoot.inert = v
})

onBeforeUnmount(() => {
  if (appRoot) appRoot.inert = false
})

function go(path) {
  router.push(path)
  close()
}
</script>

<template>
  <Teleport to="body">
    <el-drawer
      v-model="open"
      direction="ltr"
      size="256px"
      title="功能导航"
      aria-label="功能导航"
      class="ah-drawer"
    >
      <nav class="ah-drawer__nav" aria-label="功能菜单">
        <el-menu :default-active="route.path" class="ah-drawer__menu" @select="go">
          <el-menu-item v-for="item in items" :key="item.path" :index="item.path">
            <span
              class="grid size-5 mr-2 shrink-0 place-items-center"
              :class="isActive(item.path) ? 'text-accent-strong' : 'text-muted'"
              aria-hidden="true"
            >
              <SolarIcon :name="item.icon" :bold="isActive(item.path)" size="20" />
            </span>
            <span class="min-w-0 truncate">{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
      </nav>
    </el-drawer>
  </Teleport>
</template>

<style scoped>
.ah-drawer {
  border-right: 1px solid var(--color-line);
  background-color: var(--color-canvas);
}

.ah-drawer__nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.ah-drawer__menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--color-body);
  --el-menu-hover-bg-color: var(--color-hover);
  --el-menu-active-color: var(--color-ink);
  border: 0;
  background: transparent;
}

/* 行高不再覆盖：EP 默认 56px，比硬压到 32px 宽松，跟官方演示一致 */
.ah-drawer__menu :deep(.el-menu-item) {
  border-radius: var(--el-border-radius-base);
  color: var(--color-body);
}

.ah-drawer__menu :deep(.el-menu-item.is-active) {
  /* 垫色：--color-surface 跟 --color-canvas 只差 5/255，肉眼等于没有；
     改用 accent-soft（陶土橙 12%/18%），跟汇总条、首页图标同一套路 */
  background-color: var(--color-accent-soft);
  color: var(--color-ink);
  font-weight: 600;
}

.ah-drawer__menu :deep(.el-menu-item:focus-visible) {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}
</style>
