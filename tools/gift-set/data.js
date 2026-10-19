/* ============================================================
 * 尘歌壶赠礼套装 · 数据字典
 * 生成时间：2026-10-19
 * ------------------------------------------------------------
 * · key 不含扩展名
 *   图片 URL = config.image.prefix + key + config.image.ext
 * · type: "exterior"（室外）| "interior"（室内）
 * · preferredCharacters 存角色中文名
 * · sets 按 id 升序排列
 * ============================================================ */

window.HOMEWORLD_GIFT_SETS = {

  config: {
    image: {
      prefix: 'https://gi.yatta.moe/assets/UI/furnitureSuite/',
      ext: '.png'
    }
  },

  meta: {
    total: 27,
    updatedAt: '2026-10-19',
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

  sets: [
    { id: 1, key: 'UI_Home_Suite_Interior_Mond_Room_Of_Recollection', name: '诗歌沉思间', type: 'interior', region: '蒙德', preferredCharacters: ['琴', '丽莎', '菲谢尔', '莫娜', '优菈', '塔利雅', '杜林'] },
    { id: 2, key: 'UI_Home_Suite_Interior_Mond_Room_Of_Whispers', name: '柔风低语间', type: 'interior', region: '蒙德', preferredCharacters: ['芭芭拉', '优菈', '诺艾尔'] },
    { id: 3, key: 'UI_Home_Suite_Interior_Liyue_Room_Of_Clouds', name: '绯云文斋', type: 'interior', region: '璃月', preferredCharacters: ['行秋', '钟离', '凝光', '云堇', '白术', '蓝砚', '兹白'] },
    { id: 4, key: 'UI_Home_Suite_Interior_Liyue_Room_Of_Dreams', name: '烟霞入梦阁', type: 'interior', region: '璃月', preferredCharacters: ['胡桃', '烟绯', '甘雨', '刻晴', '重云', '嘉明'] },
    { id: 5, key: 'UI_Home_Suite_Interior_Common_Arcane_Laboratory', name: '秘术研究所', type: 'interior', region: '蒙德', preferredCharacters: ['可莉', '砂糖', '阿贝多', '丽莎', '布伦妮'] },
    { id: 6, key: 'UI_Home_Suite_Interior_Common_Scented_Kitchen', name: '柴烟庖屋', type: 'interior', region: '璃月', preferredCharacters: ['达达利亚', '莫娜', '魈', '香菱', '雷泽', '瑶瑶', '米卡', '白术'] },
    { id: 7, key: 'UI_Home_Suite_Exterior_Common_Blacksmith_Shop', name: '兵刃锻造站', type: 'exterior', region: '蒙德', preferredCharacters: ['诺艾尔', '班尼特', '迪卢克', '迪奥娜', '法尔伽'] },
    { id: 8, key: 'UI_Home_Suite_Exterior_Mond_Pastoral_Village', name: '牧歌之镇', type: 'exterior', region: '蒙德', preferredCharacters: ['迪奥娜', '安柏', '雷泽'] },
    { id: 9, key: 'UI_Home_Suite_Exterior_Mond_Floral_Garden', name: '花鸟公园', type: 'exterior', region: '蒙德', preferredCharacters: ['温迪', '罗莎莉亚', '芭芭拉', '琴', '凯亚', '塔利雅'] },
    { id: 10, key: 'UI_Home_Suite_Exterior_Liyue_All_Delicacy', name: '千家饔飧坊', type: 'exterior', region: '璃月', preferredCharacters: ['北斗', '香菱', '甘雨', '辛焱', '达达利亚', '夜兰', '嘉明', '闲云'] },
    { id: 11, key: 'UI_Home_Suite_Exterior_Liyue_Shopping_Street', name: '百里琳琅街', type: 'exterior', region: '璃月', preferredCharacters: ['凝光', '刻晴', '烟绯', '行秋', '钟离', '申鹤', '云堇', '蓝砚'] },
    { id: 12, key: 'UI_Home_Suite_Exterior_Liyue_Qingce_Village', name: '轻策闲云居', type: 'exterior', region: '璃月', preferredCharacters: ['辛焱', '魈', '胡桃', '七七', '申鹤', '夜兰', '瑶瑶', '闲云', '兹白'] },
    { id: 13, key: 'UI_Home_Suite_Exterior_Common_Domu_Camp', name: '狩猎与歌舞之营', type: 'exterior', region: '蒙德', preferredCharacters: ['安柏', '砂糖', '可莉', '北斗', '洛恩'] },
    { id: 14, key: 'UI_Home_Suite_Exterior_Common_Journey_Of_Abyss', name: '星辰与深渊之旅', type: 'exterior', region: '蒙德', preferredCharacters: ['班尼特', '七七', '重云', '菲谢尔', '阿贝多', '米卡'] },
    { id: 15, key: 'UI_Home_Suite_Exterior_Common_Dawn_Orchard', name: '晨曦果园', type: 'exterior', region: '蒙德', preferredCharacters: ['迪卢克', '凯亚', '温迪', '罗莎莉亚'] },
    { id: 16, key: 'UI_Home_Suite_Exterior_Dq_Build_Courtyard', name: '正格之庭', type: 'exterior', region: '稻妻', preferredCharacters: ['九条裟罗', '神里绫人'] },
    { id: 17, key: 'UI_Home_Suite_Exterior_Dq_Build_Hotspring', name: '醒意汤泉', type: 'exterior', region: '稻妻', preferredCharacters: ['宵宫', '五郎', '八重神子', '鹿野院平藏', '千织', '梦见月瑞希'] },
    { id: 18, key: 'UI_Home_Suite_Exterior_Dq_Build_Village', name: '村中匿影', type: 'exterior', region: '稻妻', preferredCharacters: ['早柚', '五郎'] },
    { id: 19, key: 'UI_Home_Suite_Exterior_Dq_Field_Shrine', name: '枝社旧绪', type: 'exterior', region: '稻妻', preferredCharacters: ['雷电将军', '八重神子'] },
    { id: 20, key: 'UI_Home_Suite_Exterior_Dq_Field_Weapon', name: '千军致戎演兵场', type: 'exterior', region: '稻妻', preferredCharacters: ['九条裟罗'] },
    { id: 21, key: 'UI_Home_Suite_Exterior_Dq_Mountain_Outdoor', name: '琼片遍郁野', type: 'exterior', region: '稻妻', preferredCharacters: ['枫原万叶', '荒泷一斗'] },
    { id: 22, key: 'UI_Home_Suite_Exterior_Dq_Street_Fete', name: '夏夜的追想', type: 'exterior', region: '稻妻', preferredCharacters: ['神里绫华', '荒泷一斗', '神里绫人'] },
    { id: 23, key: 'UI_Home_Suite_Exterior_Dq_Street_Shopping', name: '樱染的街巷', type: 'exterior', region: '稻妻', preferredCharacters: ['宵宫', '托马', '久岐忍', '绮良良', '丝柯克'] },
    { id: 24, key: 'UI_Home_Suite_Interior_Dq_Room_of_Bedroom', name: '遐久瞬梦间', type: 'interior', region: '稻妻', preferredCharacters: ['早柚', '珊瑚宫心海', '鹿野院平藏'] },
    { id: 25, key: 'UI_Home_Suite_Interior_Dq_Room_of_Ground', name: '千振致业', type: 'interior', region: '稻妻', preferredCharacters: ['雷电将军', '神里绫华'] },
    { id: 26, key: 'UI_Home_Suite_Interior_Dq_Room_of_Study', name: '沉墨书舍', type: 'interior', region: '稻妻', preferredCharacters: ['珊瑚宫心海', '久岐忍'] },
    { id: 27, key: 'UI_Home_Suite_Interior_Dq_Room_of_Teahouse', name: '枫香茶雾一室中', type: 'interior', region: '稻妻', preferredCharacters: ['托马', '枫原万叶', '梦见月瑞希'] }
  ]
};