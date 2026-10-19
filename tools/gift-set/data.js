/* ============================================================
 * 尘歌壶赠礼套装 · 数据字典
 * ------------------------------------------------------------
 * · key 不含扩展名
 *   图片 URL = config.image.prefix + key + config.image.ext
 * · type: "exterior"（室外）| "interior"（室内）
 * · region 取值来自 regions 数组
 * · preferredCharacters 存角色中文名（对应 icon-dict.js 的 name）
 * ============================================================ */

window.HOMEWORLD_GIFT_SETS = {

  config: {
    image: {
      prefix: 'https://gi.yatta.moe/assets/UI/furnitureSuite/',
      ext: '.png'
    }
  },

  meta: {
    total: 0,
    updatedAt: '',
    source: ''
  },

  regions: [
    '蒙德',
    '璃月',
    '稻妻',
    '须弥',
    '枫丹',
    '纳塔',
    '挪德卡莱',
    '至冬'
  ],

  sets: []
};
