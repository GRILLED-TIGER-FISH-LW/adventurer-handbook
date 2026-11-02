import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // 唯一不能写错的东西。主仓库是 '/genshin-guide/'，这里是 '/adventurer-handbook/'
  base: '/adventurer-handbook/',
  plugins: [vue(), tailwindcss()],
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
})
