<script setup>
import { useRouter } from 'vue-router'
import SolarIcon from '../components/SolarIcon.vue'

/* 首页只列带 label 的路由，也就是两个工具入口 */
const router = useRouter()
const tools = router.options.routes.filter((r) => r.meta?.label)
</script>

<template>
  <el-row :gutter="12" class="ah-home">
    <el-col v-for="t in tools" :key="t.path" :xs="24" :sm="12" :md="8" :lg="6">
      <RouterLink :to="t.path" class="ah-home__link">
        <el-card shadow="never" class="ah-home__card">
          <span class="ah-home__icon" aria-hidden="true">
            <SolarIcon :name="t.meta.icon" :size="18" />
          </span>

          <div class="ah-home__body">
            <div class="ah-home__title">{{ t.meta.label }}</div>
            <div class="ah-home__desc">{{ t.meta.desc }}</div>
          </div>
        </el-card>
      </RouterLink>
    </el-col>
  </el-row>
</template>

<style scoped>
/* 这里只写 Element Plus 不提供的排版细节；
   颜色、圆角、字号、控件尺寸全部走 EP 变量 */
.ah-home {
  padding: 12px;
  /* el-row 的 gutter 只做左右间距，换行堆叠时的上下间距要自己给 */
  row-gap: 12px;
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

.ah-home__card {
  color: inherit;
  transition: background-color var(--el-transition-duration-fast);
}

.ah-home__link:hover .ah-home__card,
.ah-home__link:focus-visible .ah-home__card {
  background-color: var(--el-fill-color-dark);
}

.ah-home__card :deep(.el-card__body) {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.ah-home__icon {
  display: grid;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--el-border-radius-base);
  place-items: center;
  /* 垫色和图标色都固定，昼夜一致，不随主题切换。
     基准用暖白 #f5f0e8（= tokens.css 里白天的 canvas），不是纯白，
     否则陶土橙会被稀释成近白色 */
  background-color: color-mix(in srgb, var(--color-accent) 10%, #f5f0e8);
  color: color-mix(in srgb, var(--color-accent) 78%, #000000);
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
