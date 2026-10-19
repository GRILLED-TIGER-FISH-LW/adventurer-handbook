/* ============================================================
 * 尘歌壶赠礼套装 · 数据字典
 * 生成时间：2026-10-20
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
    total: 79,
    updatedAt: '2026-10-20',
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
    { id: 13, key: 'UI_Home_Suite_Exterior_Common_Domu_Camp', name: '狩猎与歌舞之营', type: 'exterior', region: '蒙德', preferredCharacters: ['安柏', '砂糖', '可莉', '北斗', '埃洛伊', '洛恩'] },
    { id: 14, key: 'UI_Home_Suite_Exterior_Common_Journey_Of_Abyss', name: '星辰与深渊之旅', type: 'exterior', region: '蒙德', preferredCharacters: ['班尼特', '七七', '重云', '菲谢尔', '阿贝多', '埃洛伊', '米卡'] },
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
    { id: 27, key: 'UI_Home_Suite_Interior_Dq_Room_of_Teahouse', name: '枫香茶雾一室中', type: 'interior', region: '稻妻', preferredCharacters: ['托马', '枫原万叶', '梦见月瑞希'] },
    { id: 28, key: 'UI_Home_Suite_Interior_Xm_Room_Of_Forest', name: '巡林常途的百千趣事', type: 'interior', region: '须弥', preferredCharacters: ['提纳里', '柯莱'] },
    { id: 29, key: 'UI_Home_Suite_Interior_Xm_Room_Of_Jewelry', name: '凝停的绮璨明彩', type: 'interior', region: '须弥', preferredCharacters: ['多莉', '妮露'] },
    { id: 30, key: 'UI_Home_Suite_Interior_Xm_Room_Of_Barbecue', name: '至烈至强的醇香', type: 'interior', region: '须弥', preferredCharacters: ['艾尔海森', '迪希雅', '赛索斯'] },
    { id: 31, key: 'UI_Home_Suite_Interior_Xm_Room_Of_Library', name: '识见沉降之地', type: 'interior', region: '须弥', preferredCharacters: ['赛诺', '珐露珊', '艾尔海森', '丝柯克'] },
    { id: 32, key: 'UI_Home_Suite_Interior_Xm_Room_Of_Sleep', name: '暂别喧扰与烦忧', type: 'interior', region: '须弥', preferredCharacters: ['纳西妲', '莱依拉'] },
    { id: 33, key: 'UI_Home_Suite_Interior_Xm_Room_Of_Village', name: '存身于尘沙之境', type: 'interior', region: '须弥', preferredCharacters: ['坎蒂丝'] },
    { id: 34, key: 'UI_Home_Suite_Exterior_Xm_Street_Bazaar', name: '繁闹畅旺的市集', type: 'exterior', region: '须弥', preferredCharacters: ['多莉', '珐露珊', '赛索斯'] },
    { id: 35, key: 'UI_Home_Suite_Exterior_Xm_Forest_Village', name: '栖凭于清森深处', type: 'exterior', region: '须弥', preferredCharacters: ['柯莱', '赛诺'] },
    { id: 36, key: 'UI_Home_Suite_Exterior_Xm_Build_Theater', name: '翛然旋舞的姿影', type: 'exterior', region: '须弥', preferredCharacters: ['妮露', '卡维'] },
    { id: 37, key: 'UI_Home_Suite_Exterior_Xm_Street_Fish', name: '水畔的宁静时光', type: 'exterior', region: '须弥', preferredCharacters: ['流浪者'] },
    { id: 38, key: 'UI_Home_Suite_Exterior_Xm_Build_Village', name: '婉拒风蚀的聚落', type: 'exterior', region: '须弥', preferredCharacters: ['坎蒂丝', '莱依拉'] },
    { id: 39, key: 'UI_Home_Suite_Exterior_Xm_Build_Camp', name: '旅团的兵阵雄姿', type: 'exterior', region: '须弥', preferredCharacters: ['迪希雅'] },
    { id: 40, key: 'UI_Home_Suite_Exterior_Xm_Build_Garden', name: '幽芳与恬谧之中', type: 'exterior', region: '须弥', preferredCharacters: ['纳西妲', '卡维', '绮良良'] },
    { id: 41, key: 'UI_Home_Suite_Exterior_Xm_Field_Vegetation', name: '林野与沙漠的合奏', type: 'exterior', region: '须弥', preferredCharacters: ['提纳里', '流浪者'] },
    { id: 42, key: 'UI_Home_Suite_Interior_Fd_Room_Houses', name: '稳定作息的重要因素', type: 'interior', region: '枫丹', preferredCharacters: ['夏洛蒂', '夏沃蕾'] },
    { id: 43, key: 'UI_Home_Suite_Interior_Fd_Room_Office', name: '严守流程的办公准则', type: 'interior', region: '枫丹', preferredCharacters: ['那维莱特', '克洛琳德'] },
    { id: 44, key: 'UI_Home_Suite_Interior_Fd_Room_Hotel', name: '美食美酒的华丽外衣', type: 'interior', region: '枫丹', preferredCharacters: ['芙宁娜', '娜维娅', '爱可菲'] },
    { id: 45, key: 'UI_Home_Suite_Interior_Fd_Room_Stage', name: '恰到好处的视线聚焦', type: 'interior', region: '枫丹', preferredCharacters: ['琳妮特', '林尼', '阿蕾奇诺'] },
    { id: 46, key: 'UI_Home_Suite_Interior_Fd_Room_Machinery', name: '持续旋转的灵感发条', type: 'interior', region: '枫丹', preferredCharacters: ['菲米尼'] },
    { id: 47, key: 'UI_Home_Suite_Interior_Fd_Room_Meropide', name: '禁止触犯的规则之源', type: 'interior', region: '枫丹', preferredCharacters: ['莱欧斯利'] },
    { id: 48, key: 'UI_Home_Suite_Exterior_Fd_Build_Residential', name: '正义之廷的平淡日常', type: 'exterior', region: '枫丹', preferredCharacters: ['夏洛蒂', '阿蕾奇诺'] },
    { id: 49, key: 'UI_Home_Suite_Exterior_Fd_Street_Commercial', name: '正义之廷的繁荣商贸', type: 'exterior', region: '枫丹', preferredCharacters: ['琳妮特', '林尼', '千织'] },
    { id: 50, key: 'UI_Home_Suite_Exterior_Fd_Build_Square', name: '正义之廷的清新水雾', type: 'exterior', region: '枫丹', preferredCharacters: ['那维莱特', '芙宁娜', '艾梅莉埃'] },
    { id: 51, key: 'UI_Home_Suite_Exterior_Fd_Build_Town', name: '朴实无华的白淞街镇', type: 'exterior', region: '枫丹', preferredCharacters: ['娜维娅'] },
    { id: 52, key: 'UI_Home_Suite_Exterior_Fd_Build_Village', name: '静隐水下的海沫浮光', type: 'exterior', region: '枫丹', preferredCharacters: ['菲米尼', '希格雯'] },
    { id: 53, key: 'UI_Home_Suite_Exterior_Fd_Fortress_Meropide', name: '禁限之堡的「拳力以赴」', type: 'exterior', region: '枫丹', preferredCharacters: ['莱欧斯利', '夏沃蕾', '希格雯'] },
    { id: 54, key: 'UI_Home_Suite_Exterior_Fd_Field_Vegetation', name: '水之国度的斑驳色彩', type: 'exterior', region: '枫丹', preferredCharacters: ['克洛琳德', '艾梅莉埃', '爱可菲', '桑多涅'] },
    { id: 55, key: 'UI_Home_Suite_Interior_Nt_Room_Office', name: '言谈之前的沉思', type: 'interior', region: '纳塔', preferredCharacters: ['恰斯卡', '玛薇卡'] },
    { id: 56, key: 'UI_Home_Suite_Interior_Nt_Room_Hotel', name: '竞技场的欢聚胜饮', type: 'interior', region: '纳塔', preferredCharacters: ['玛薇卡'] },
    { id: 57, key: 'UI_Home_Suite_Interior_Nt_Room_Universal', name: '安寝吧，于那舒适的梦乡', type: 'interior', region: '纳塔', preferredCharacters: ['卡齐娜', '茜特菈莉', '瓦雷莎'] },
    { id: 58, key: 'UI_Home_Suite_Exterior_Nt_Build_Market', name: '忙碌市集的潮流风物', type: 'exterior', region: '纳塔', preferredCharacters: ['玛拉妮'] },
    { id: 59, key: 'UI_Home_Suite_Exterior_Nt_Build_Mine', name: '于最灼热的炉火中诞生', type: 'exterior', region: '纳塔', preferredCharacters: ['希诺宁', '伊安珊'] },
    { id: 60, key: 'UI_Home_Suite_Exterior_Nt_Field_Nature', name: '我们的冒险，我们的路', type: 'exterior', region: '纳塔', preferredCharacters: ['基尼奇', '欧洛伦'] },
    { id: 61, key: 'UI_Home_Suite_Exterior_Nt_Build_Tepetlisaurus', name: '「回声之子」的热血', type: 'exterior', region: '纳塔', preferredCharacters: ['卡齐娜', '希诺宁'] },
    { id: 62, key: 'UI_Home_Suite_Exterior_Nt_Build_Koholasaurus', name: '「流泉之众」的悠然', type: 'exterior', region: '纳塔', preferredCharacters: ['玛拉妮'] },
    { id: 63, key: 'UI_Home_Suite_Exterior_Nt_Build_Yumkasaurus', name: '「悬木人」的实践', type: 'exterior', region: '纳塔', preferredCharacters: ['基尼奇'] },
    { id: 64, key: 'UI_Home_Suite_Exterior_Nt_Build_Qucusaurus', name: '「花羽会」的征途', type: 'exterior', region: '纳塔', preferredCharacters: ['恰斯卡', '伊法'] },
    { id: 65, key: 'UI_Home_Suite_Exterior_Nt_Build_Iktomisaurus', name: '「烟谜主」的安适', type: 'exterior', region: '纳塔', preferredCharacters: ['欧洛伦', '茜特菈莉'] },
    { id: 66, key: 'UI_Home_Suite_Exterior_Nt_Build_Tatankasaurus', name: '「沃陆之邦」的勇进', type: 'exterior', region: '纳塔', preferredCharacters: ['伊安珊', '瓦雷莎'] },
    { id: 67, key: 'UI_Home_Suite_Exterior_Nt_Field_Saurus', name: '伙伴与家园', type: 'exterior', region: '纳塔', preferredCharacters: ['伊法'] },
    { id: 68, key: 'UI_Home_Suite_Interior_Ndkl_Room_Bedroom', name: '各方来客的舒心居室', type: 'interior', region: '挪德卡莱', preferredCharacters: ['莉奈娅', '尼可'] },
    { id: 69, key: 'UI_Home_Suite_Interior_Ndkl_Room_Shuangyue', name: '月下的安眠', type: 'interior', region: '挪德卡莱', preferredCharacters: ['菈乌玛'] },
    { id: 70, key: 'UI_Home_Suite_Interior_Ndkl_Room_Miwenguan', name: '秘闻的有序经纬', type: 'interior', region: '挪德卡莱', preferredCharacters: ['奈芙尔', '雅珂达'] },
    { id: 71, key: 'UI_Home_Suite_Interior_Ndkl_Room_Workshop', name: '最棒最温暖的家', type: 'interior', region: '挪德卡莱', preferredCharacters: ['伊涅芙', '爱诺'] },
    { id: 72, key: 'UI_Home_Suite_Interior_Ndkl_Room_Zhidengren', name: '战前的小憩', type: 'interior', region: '挪德卡莱', preferredCharacters: ['菲林斯', '叶洛亚'] },
    { id: 73, key: 'UI_Home_Suite_Interior_Ndkl_Room_Factory', name: '暇间的茶会', type: 'interior', region: '挪德卡莱', preferredCharacters: ['桑多涅'] },
    { id: 74, key: 'UI_Home_Suite_Exterior_Ndkl_Field_Nature', name: '终北之地的原野', type: 'exterior', region: '挪德卡莱', preferredCharacters: ['杜林', '莉奈娅', '尼可'] },
    { id: 75, key: 'UI_Home_Suite_Exterior_Ndkl_Build_Naxia', name: '繁忙的边地小镇', type: 'exterior', region: '挪德卡莱', preferredCharacters: ['奈芙尔', '雅珂达', '法尔伽', '洛恩', '布伦妮'] },
    { id: 76, key: 'UI_Home_Suite_Exterior_Ndkl_Build_Shuangyue', name: '月下的恬静祷歌', type: 'exterior', region: '挪德卡莱', preferredCharacters: ['菈乌玛', '哥伦比娅'] },
    { id: 77, key: 'UI_Home_Suite_Exterior_Ndkl_Build_Zhidengren', name: '漫漫长夜中的孤灯', type: 'exterior', region: '挪德卡莱', preferredCharacters: ['菲林斯', '叶洛亚'] },
    { id: 78, key: 'UI_Home_Suite_Exterior_Ndkl_Build_Workshop', name: '方兴未艾的工坊', type: 'exterior', region: '挪德卡莱', preferredCharacters: ['伊涅芙', '爱诺'] },
    { id: 79, key: 'UI_Home_Suite_Exterior_Ndkl_Build_Yinyue', name: '新月的谧景', type: 'exterior', region: '挪德卡莱', preferredCharacters: ['哥伦比娅'] }
  ]
};