<script setup>
import { theme, toggleTheme } from './composables/useTheme.js'
</script>

<template>
  <div class="grid min-h-dvh grid-rows-[auto_1fr]">
    <header
      class="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-line bg-canvas px-4"
    >
      <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-ink">提瓦特冒险之证</h1>
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-ctl border border-line-2 bg-surface text-ink"
        :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
        @click="toggleTheme"
      >
        <span class="text-xs" aria-hidden="true">{{ theme === 'dark' ? '浅' : '深' }}</span>
      </button>
    </header>

    <main class="grid content-start gap-6 p-4">
      <section class="grid gap-2">
        <h2 class="text-xs font-semibold text-muted">表面</h2>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div class="rounded-panel border border-line bg-canvas p-3 text-xs text-body">canvas</div>
          <div class="rounded-panel border border-line bg-surface p-3 text-xs text-body">
            surface
          </div>
          <div class="rounded-panel border border-line bg-surface-2 p-3 text-xs text-body">
            surface-2
          </div>
          <div class="rounded-panel border border-line bg-sunken p-3 text-xs text-body">
            sunken
          </div>
          <div class="rounded-panel border border-line bg-hover p-3 text-xs text-body">hover</div>
        </div>
      </section>

      <section class="grid gap-2">
        <h2 class="text-xs font-semibold text-muted">文字</h2>
        <div class="grid gap-1 rounded-panel border border-line bg-surface p-3">
          <p class="text-sm text-ink">ink · 主文本 17.5:1</p>
          <p class="text-sm text-body">body · 正文 10.3:1</p>
          <p class="text-sm text-muted">muted · 次要标签 5.13:1</p>
          <p class="text-sm text-faint">faint · 仅装饰 3.23:1</p>
        </div>
      </section>

      <section class="grid gap-2">
        <h2 class="text-xs font-semibold text-muted">强调</h2>
        <div class="flex flex-wrap items-center gap-2">
          <span class="size-9 rounded-ctl bg-accent" aria-hidden="true"></span>
          <span class="rounded-ctl bg-accent-solid px-3 py-2 text-xs text-on-accent">
            accent-solid · 承载文字用这个
          </span>
          <span class="rounded-ctl bg-accent-soft px-3 py-2 text-xs text-accent-strong">
            accent-soft
          </span>
          <span class="text-sm text-accent-strong underline">链接文字 4.81:1</span>
        </div>
        <p class="text-xs text-faint">
          左一纯色块是 accent（#cc785c），只做图形，不要在上面写字
        </p>
      </section>

      <section class="grid gap-2">
        <h2 class="text-xs font-semibold text-muted">控件</h2>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="h-9 rounded-ctl bg-accent-solid px-4 text-sm font-medium text-on-accent"
          >
            主要
          </button>
          <button
            type="button"
            class="h-9 rounded-ctl border border-line-2 bg-surface px-4 text-sm font-medium text-ink"
          >
            次要
          </button>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-ctl border border-line-2 bg-surface text-ink"
            aria-label="更多操作"
          >
            ⋯
          </button>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-ctl border border-line-2 bg-surface text-ink opacity-50"
            disabled
          >
            ×
          </button>
        </div>
        <input
          class="h-10 w-full min-w-0 rounded-ctl border border-line-2 bg-surface px-3 text-sm text-ink placeholder:text-muted"
          placeholder="输入框 h-10（40px），比按钮高一档"
        />
      </section>

      <section class="grid gap-2">
        <h2 class="text-xs font-semibold text-muted">圆角</h2>
        <div class="flex flex-wrap gap-2">
          <div class="size-16 rounded-ctl border border-line-3 bg-sunken" aria-hidden="true"></div>
          <div class="size-16 rounded-panel border border-line-3 bg-sunken" aria-hidden="true"></div>
          <div class="size-16 rounded-full border border-line-3 bg-sunken" aria-hidden="true"></div>
        </div>
        <p class="text-xs text-faint">8px 控件 · 12px 面板 · 999px 仅标签与 tab</p>
      </section>
    </main>
  </div>
</template>
