const cache = new Map()

/**
 * 从 public/ 加载「挂全局变量」的数据脚本，同一 src 只请求一次。
 * 例：loadGlobalScript('data/tales.js', 'TRAVELERS_TALES')
 */
export function loadGlobalScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName])
  if (cache.has(src)) return cache.get(src)

  const url = new URL(src, import.meta.env.BASE_URL).href

  const task = new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = url
    el.async = true
    el.onload = () => {
      const value = window[globalName]
      if (value === undefined) {
        reject(new Error(`${globalName} 未定义，检查 ${src}`))
        return
      }
      resolve(value)
    }
    el.onerror = () => reject(new Error(`加载失败：${url}`))
    document.head.appendChild(el)
  })

  cache.set(src, task)
  return task
}

export const loadTalesData = () => loadGlobalScript('data/tales.js', 'TRAVELERS_TALES')
export const loadGiftSetData = () => loadGlobalScript('data/gift-set.js', 'HOMEWORLD_GIFT_SETS')
