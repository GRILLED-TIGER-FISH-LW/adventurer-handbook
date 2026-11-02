<script setup>
import { ref } from 'vue'
import AppNav from './components/AppNav.vue'
import AppDrawer from './components/AppDrawer.vue'
import ToastHost from './components/ToastHost.vue'

const drawerOpen = ref(false)
</script>

<template>
  <div class="grid h-dvh grid-rows-[auto_minmax(0,1fr)] bg-canvas">
    <AppNav @open-menu="drawerOpen = true" />
    <AppDrawer v-model="drawerOpen" />

    <main class="min-h-0 overflow-y-auto">
      <RouterView v-slot="{ Component }">
        <KeepAlive :max="3">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <ToastHost />
  </div>
</template>
