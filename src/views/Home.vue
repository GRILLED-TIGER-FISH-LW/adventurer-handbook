<script setup>
import { useRouter } from 'vue-router'
import SolarIcon from '../components/SolarIcon.vue'

/* 首页只列带 label 的路由，也就是两个工具入口 */
const router = useRouter()
const tools = router.options.routes.filter((r) => r.meta?.label)
</script>

<template>
  <el-scrollbar class="ah-home__scroll">
    <el-row class="ah-home" :gutter="[12, 12]">
      <el-col v-for="t in tools" :key="t.path" :span="12">
        <RouterLink :to="t.path" class="ah-home__link">
          <el-card shadow="never" class="ah-home__card">
            <div class="ah-home__inner">
              <span class="ah-home__icon" aria-hidden="true">
                <SolarIcon :name="t.meta.icon" :size="18" />
              </span>

              <div class="ah-home__body">
                <div class="ah-home__title">{{ t.meta.label }}</div>
                <div class="ah-home__desc">{{ t.meta.desc }}</div>
              </div>
            </div>
          </el-card>
        </RouterLink>
      </el-col>
    </el-row>
  </el-scrollbar>
</template>

<style scoped>
/* 只写 Element Plus 不提供的三件事：卡片固定高度、图标块尺寸、两行截断。
   宽度固定半栏由 el-col 的 :span="12" 决定，框间距由 el-row 的 gutter [12, 12] 决定，
   圆角 / 内边距 / 字号 / 颜色全部走 EP 默认值与站点令牌。 */
.ah-home__scroll {
  height: 100%;
}

.ah-home {
  padding: 12px;
}

.ah-home__link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.ah-home__link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* 固定高度：卡片不再随标题长短高低不齐 */
.ah-home__card {
  height: 104px;
  color: inherit;
  transition: background-color var(--el-transition-duration-fast);
}

.ah-home__link:hover .ah-home__card,
.ah-home__link:focus-visible .ah-home__card {
  background-color: var(--el-fill-color-dark);
}

/* EP 的 card 体默认不撑满，固定高度必须补这一行 */
.ah-home__card :deep(.el-card__body) {
  box-sizing: border-box;
  height: 100%;
}

.ah-home__inner {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 100%;
}

.ah-home__icon {
  display: grid;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--el-border-radius-base);
  place-items: center;
  /* 垫色昼夜各一档：白天 12% 陶土橙叠 #faf9f5，黑夜 18% 叠 #1f1e1b */
  background-color: color-mix(in srgb, var(--color-accent) 12%, #faf9f5);
  color: var(--color-accent-strong);
}

[data-theme='dark'] .ah-home__icon {
  background-color: color-mix(in srgb, var(--color-accent) 18%, #1f1e1b);
}

.ah-home__body {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.ah-home__title {
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ah-home__desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  overflow: hidden;
}
</style>
