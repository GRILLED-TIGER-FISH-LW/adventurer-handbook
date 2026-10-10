
/* ============================================================
 * 原神 · 游逸旅闻 数据字典
 * 生成时间：2026-10-11
 * ============================================================
 * 说明：
 *   · 只记录「主角色」（角色列为空的条目，向上继承最近的非空角色）
 *   · hidden = 「隐藏（地图不显示）触发条件」列非空
 *   · extra 字段保存「额外出场角色」，前端不展示，保留供以后使用
 *   · 头像 URL 由 window.ICON_DICT 运行时匹配，本文件不含图片地址
 * ============================================================ */

window.TRAVELERS_TALES = {
  meta: {
    version: "7.1",
    total: 156,
    updatedAt: "2026-10-11",
    source: "原神 · 游逸旅闻汇总"
  },

  /* 版本筛选顺序 */
  versions: ["5.4", "5.7", "月之一", "月之二", "月之五", "月之六", "7.1"],

  entries: [
    /* ---------- 5.4 蒙德 ---------- */
    { id: 1, character: "迪卢克", version: "5.4", title: "定价", hidden: false,
      location: "蒙德-晨曦酒庄", trigger: "", prerequisite: "", extra: "",
      description: "在晨曦酒庄，你遇见了刚看完酒庄销售汇报的迪卢克。气候易变，人情与人心却不易改。" },

    { id: 2, character: "砂糖", version: "5.4", title: "观测", hidden: false,
      location: "蒙德-千风神殿", trigger: "", prerequisite: "", extra: "",
      description: "在千风神殿附近，你遇见了正在观察白鸽与遗迹守卫的砂糖。提瓦特上未知的秘密还有很多，而这也是「出行」才能带来的收获。" },

    { id: 3, character: "诺艾尔", version: "5.4", title: "剑术", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "",
      description: "在西风骑士团旁，你遇见了正在练习着武艺的诺艾尔。但从现场情况来看，她练习得似乎并不顺利…" },

    { id: 4, character: "诺艾尔", version: "5.4", title: "进步法", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "琴",
      description: "在西风骑士团旁，你遇见了正指导诺艾尔练习剑术的琴。有了她的指导，或许诺艾尔的剑技能够再进一步。" },

    { id: 5, character: "罗莎莉亚", version: "5.4", title: "工作", hidden: true,
      location: "蒙德-蒙德城", trigger: "备注：需游戏内夜间出现", prerequisite: "", extra: "",
      description: "在西风大教堂旁，你遇见了正在完成教会「慈善帮助工作」的罗莎莉亚。就结果来看…她其实还完成得不错？" },

    { id: 6, character: "罗莎莉亚", version: "5.4", title: "本职工作", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "",
      description: "在「天使的馈赠」，你遇见了正在盯梢可疑人员的罗莎莉亚。她目光炯炯，出手利落，如深夜的月光一样寒冷、锐利…" },

    { id: 7, character: "罗莎莉亚", version: "5.4", title: "假日", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "温迪",
      description: "在猫尾酒馆旁，你遇见了正在望风的罗莎莉亚。你应吟游诗人的邀请，加入了这场短暂的聚会，在美妙的碰杯声中度过了一段自由的时光。" },

    { id: 8, character: "菲谢尔", version: "5.4", title: "修订", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "",
      description: "蒙德图书馆中，断罪皇女菲谢尔与她的忠友奥兹降临于此，从他们佶屈聱牙的话语中勉强得知，他们此行的目的是修订一本名为《断罪圣诰之书》的辞典…" },

    { id: 9, character: "菲谢尔", version: "5.4", title: "魔女", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "",
      description: "《断罪圣诰之书》的修订工作并不顺利，那位司书的魔女似乎意图与伟大的幽夜净土主宰为敌…" },

    { id: 10, character: "菲谢尔", version: "5.4", title: "命运时刻", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "",
      description: "用断罪皇女的语言来说，那命运承诺的时刻终于在今天显现了…" },

    { id: 11, character: "迪奥娜", version: "5.4", title: "打猎", hidden: false,
      location: "蒙德-奔狼领", trigger: "", prerequisite: "", extra: "",
      description: "在奔狼领，你遇见了正在独自打猎的迪奥娜。凯茨莱茵家的猎手听觉敏锐，却也会带来害怕狼群的小小麻烦。" },

    { id: 12, character: "迪奥娜", version: "5.4", title: "委托", hidden: false,
      location: "蒙德-清泉镇", trigger: "", prerequisite: "", extra: "砂糖",
      description: "在清泉镇上，你遇见了和砂糖进行货品交换的迪奥娜。用富含胡萝卜素的落落莓作为诱饵…到底会吸引具有哪种口味偏好的动物呢？" },

    { id: 13, character: "迪奥娜", version: "5.4", title: "空空如也", hidden: false,
      location: "蒙德-奔狼领", trigger: "", prerequisite: "", extra: "",
      description: "在奔狼领，你遇见了失落沮丧的迪奥娜，她说自己布下的陷阱空空如也。看来，只有抓到那个什么都吃的坏家伙，才能保住迪奥娜的尊严了…" },

    { id: 14, character: "迪奥娜", version: "5.4", title: "猎物的真面目", hidden: false,
      location: "蒙德-奔狼领", trigger: "", prerequisite: "", extra: "雷泽",
      description: "在奔狼领，你遇见了快要晕倒的雷泽。原来他将诱饵当作了来自清泉镇的礼物，这才误食了药草。这啼笑皆非的误会波及的受害者，好像还有一人…" },

    { id: 15, character: "安柏", version: "5.4", title: "你好，旅行者", hidden: false,
      location: "蒙德-低语森林", trigger: "", prerequisite: "", extra: "",
      description: "在蒙德城外，你遇见了一个火红色的身影。蒙德城的侦察骑士向你问好。" },

    { id: 16, character: "安柏", version: "5.4", title: "蒙德城的猫", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "",
      description: "在蒙德城的城墙上，你遇见了安柏，她刚把一只调皮的小猫送回了它主人的家中。希望那只小猫别再跑出来了…" },

    { id: 17, character: "安柏", version: "5.4", title: "区区史莱姆", hidden: false,
      location: "蒙德-坠星山谷", trigger: "", prerequisite: "", extra: "",
      description: "在星落湖旁，你遇见了正在执行任务的安柏。区区史莱姆，不在话下。" },

    { id: 18, character: "安柏", version: "5.4", title: "飞起来看看", hidden: false,
      location: "蒙德-奔狼领", trigger: "", prerequisite: "", extra: "",
      description: "在奔狼领，你遇见了气喘吁吁的安柏，为了帮可莉将礼物送给雷泽，她正在四处搜寻。但雷泽…看来并不是那么容易遇到…" },

    { id: 19, character: "安柏", version: "5.4", title: "休息日", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "", extra: "",
      description: "在西风大教堂的顶端，你与安柏度过了一段休息时间。但是，这位蒙德城最好的「侦察骑士」的休息时间也如同风一般来去匆匆…" },

    /* ---------- 5.4 璃月 ---------- */
    { id: 20, character: "刻晴", version: "5.4", title: "奔走", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "",
      description: "在「不卜庐」外，你遇见了前来拿药的刻晴。她前几天在探查山林时不小心扭到了脚腕，好在如今已经痊愈。但看她神情，似乎还有许多工作要做…" },

    { id: 21, character: "七七", version: "5.4", title: "烹饪", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "（锅巴）",
      description: "在万民堂，你遇见了钻研烹饪之道的七七。在锅巴的帮助下，她准备好了郊游的菜肴…辛苦了，锅巴。" },

    { id: 22, character: "钟离", version: "5.4", title: "茶", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "",
      description: "在说书人刘苏的摊位旁，你刚巧遇见了打算品尝枫丹茶叶的钟离，在他的邀请下，你坐下来与他共品新茶，小谈了片刻。或许是钟离泡茶手法得当，枫丹的茶叶与璃月的泉水完美交融，味道十分出色。" },

    { id: 23, character: "钟离", version: "5.4", title: "书", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "",
      description: "在万文集舍的摊位旁，你遇见了若有所思的钟离。据他所说，是受「往生堂」堂主胡桃所托，前来购买几本「轻小说」。在稍微翻看了几本后，钟离也似乎对这种小说产生了兴趣…" },

    { id: 24, character: "钟离", version: "5.4", title: "戏", hidden: false,
      location: "璃月-遗珑埠", trigger: "", prerequisite: "", extra: "",
      description: "在遗珑埠的戏台下，你遇见了正听完了一场戏的钟离。他因为听云堇唱戏入了神，不小心凉了一壶好茶，但好在戏曲余味无穷，倒也算不上亏了摩拉。" },

    { id: 25, character: "申鹤", version: "5.4", title: "萦怀", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "",
      description: "在万民堂内，你遇见了独自看店的申鹤。旧友的到来让她感到欣喜，主动下厨烹饪你们喜欢的菜式。过程虽有插曲，但结果美味不减。" },

    { id: 26, character: "闲云", version: "5.4", title: "弟子的礼物", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "申鹤",
      description: "在闲云的屋宅附近，你遇见了正在劝导申鹤的闲云，原来申鹤用自己的工钱为闲云报名了旅行团，闲云虽嘴上说着拒绝，但喜悦溢于言表…" },

    { id: 27, character: "闲云", version: "5.4", title: "摘星崖掠影", hidden: false,
      location: "蒙德-摘星崖", trigger: "", prerequisite: "", extra: "",
      description: "在摘星崖崖顶，你遇见了初来蒙德游览的闲云，她心情不错。在闲云看来，美丽的风光和难忘的心绪一样值得留念，于是她拿出了留影机…" },

    { id: 28, character: "闲云", version: "5.4", title: "蒙德印象", hidden: false,
      location: "蒙德-坠星山谷", trigger: "", prerequisite: "", extra: "",
      description: "在蒙德城门前，你遇见了正在关注禽鸟动态的闲云，她对接下来要拍的画片构图有独特审美，这一点在她此前拍过的所有蒙德画片中均有呈现。仙人品味，果真非同凡响。" },

    { id: 29, character: "闲云", version: "5.4", title: "奔狼巧遇", hidden: false,
      location: "蒙德-奔狼领", trigger: "", prerequisite: "", extra: "雷泽",
      description: "在奔狼领附近，你遇见了一脸愁容的闲云和茫然无措的雷泽，热心的闲云似乎难以接受成长期的少年独自在野外游荡，无论如何，都没办法放任不管吧？" },

    { id: 30, character: "闲云", version: "5.4", title: "叨光受赞", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "申鹤",
      description: "在闲云的屋宅外，闲云被上门致谢的群众团团围住，原来是申鹤打倒黑心旅团的义举惠及了不少街坊，作为家长表率的闲云正忙于回应，乐在其中。而在另一个安静的角落，申鹤也有要感谢的人…" },

    { id: 31, character: "凝光", version: "5.4", title: "重任", hidden: false,
      location: "璃月-天衡山", trigger: "", prerequisite: "", extra: "白术",
      description: "在「群玉阁」上，你发现凝光的神色有些疲惫。原来是不小心染上了风寒。但是，即便身体有恙，璃月港的「天权星」依旧坚持着工作。毕竟，她重任在肩。" },

    { id: 32, character: "香菱", version: "5.4", title: "甜甜香膏", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "胡桃",
      description: "在万民堂外，你遇见了香菱和胡桃。香菱最近似乎拿到了一款杏仁豆腐味道的新型香膏，抹上身后非常好闻。唔…但这次的香膏是杏仁豆腐味，那下次，不会是水煮鱼味吧…" },

    { id: 33, character: "瑶瑶", version: "5.4", title: "练枪", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "",
      description: "在玉京台附近，你遇见了努力练枪的瑶瑶。她向师父告了假，计划着要和好友七七一起去轻策庄郊游…" },

    { id: 34, character: "瑶瑶", version: "5.4", title: "郊游", hidden: false,
      location: "璃月-碧水原", trigger: "", prerequisite: "", extra: "七七",
      description: "在轻策庄郊外，你遇见了正在欣赏璃月风光的七七和瑶瑶。女孩们手牵着手，许下的约定由山和水和你见证。" },

    { id: 35, character: "云堇", version: "5.4", title: "他山之石", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "",
      description: "在刘苏的摊位旁，你遇见了正在听刘苏说书的云堇。听云堇所说的话，她似乎正准备排一场新戏…" },

    { id: 36, character: "云堇", version: "5.4", title: "来者是客", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "可莉、凯亚",
      description: "在和裕茶馆，你遇见了凯亚与可莉。看可莉的模样，似乎玩得非常高兴，也非常喜欢云堇这位「唱璃月戏的大姐姐」。" },

    { id: 37, character: "行秋", version: "5.4", title: "书剑之一", hidden: false,
      location: "璃月-碧水原", trigger: "", prerequisite: "", extra: "",
      description: "在轻策庄外的竹林里，你遇见了正在以剑入书的行秋，他打算用舞剑的方式练习书法。虽不知结果如何，但看周围宛如秋风过境般的竹林，想必行秋也是勤奋练了很久吧…" },

    { id: 38, character: "行秋", version: "5.4", title: "书剑之二", hidden: false,
      location: "璃月-碧水原", trigger: "", prerequisite: "", extra: "",
      description: "在轻策庄外的竹林里，行秋依然在尝试以剑入书。但是，他好像又看书入了神，忘记了练剑…" },

    { id: 39, character: "行秋", version: "5.4", title: "事急从权！", hidden: false,
      location: "璃月-碧水原", trigger: "", prerequisite: "", extra: "重云",
      description: "在轻策庄外的竹林里，你遇见了急到六神无主的行秋。一问才知，往日里帮行秋誊写小说的编辑病倒了，他请来重云帮忙，但听着好友念诵自己的小说，行秋又羞得不知如何是好。不过，为了让小说稿件赶上出版日，行秋也只能事急从权了…" },

    { id: 40, character: "行秋", version: "5.4", title: "一字千金", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "",
      description: "在万文集舍，你遇见了似乎正若有所思的行秋，顺着他的指引，你看见了书架上许多一样内容的书籍，但是，凭着扉页签字笔画不同，这些书却被硬生生分出了三六九等，有人说「一字如金」，或许也不外如是吧…" },

    /* ---------- 5.4 稻妻 ---------- */
    { id: 41, character: "珊瑚宫心海", version: "5.4", title: "孤梦", hidden: false,
      location: "稻妻-海祇岛", trigger: "", prerequisite: "", extra: "",
      description: "在鲜有人知的「海祇岛秘密基地」里，你遇见了熟睡的心海。桌上散落着各种文件，以及少女写满心事的日记。" },

    { id: 42, character: "珊瑚宫心海", version: "5.4", title: "团聚", hidden: false,
      location: "稻妻-珊瑚宫", trigger: "", prerequisite: "", extra: "",
      description: "在海祇岛，故地重游仍有故人相伴。山长水阔，前路漫漫，有人在此遥寄一番思念。" },

    { id: 43, character: "枫原万叶", version: "5.4", title: "远望天地", hidden: false,
      location: "璃月-云来海", trigger: "", prerequisite: "", extra: "",
      description: "归离原以南的山野，你遇见了抒发诗兴的万叶。偶遇故人自是一件趣事，人生何处不相逢？" },

    { id: 44, character: "枫原万叶", version: "5.4", title: "旅途小感", hidden: false,
      location: "璃月-云来海", trigger: "", prerequisite: "", extra: "",
      description: "璃月港北方的海边，你遇见了眺望大海的万叶。你们说起旅途的快乐与疲惫…生活难有真正的圆满，唯有心静可解万般愁绪。" },

    { id: 45, character: "枫原万叶", version: "5.4", title: "剑与酒", hidden: true,
      location: "璃月-天衡山", trigger: "备注：需游戏内夜间出现", prerequisite: "", extra: "",
      description: "天衡山以北，你遇见了夜晚练剑的万叶。天亮时，你们就要各自踏上旅程，但无论路途多么遥远，仍在同一片星空之下。" },

    /* ---------- 5.7 稻妻 ---------- */
    { id: 46, character: "八重神子", version: "5.7", title: "好运气", hidden: false,
      location: "稻妻-鸣神大社", trigger: "", prerequisite: "", extra: "【玄冬林擒】",
      description: "在八重神子的「帮助」下，你抽到了一根特殊的签。总之…还是好好收起来吧。说不定，真有神奇的力量…？" },

    { id: 47, character: "神里绫人", version: "5.7", title: "事务", hidden: false,
      location: "稻妻-稻妻城", trigger: "", prerequisite: "", extra: "",
      description: "在你的帮助下，神里绫人挑选好了布匹。按照他的说法，过几天这些布匹应该就会被送到「神里屋敷」里了…" },

    { id: 48, character: "梦见月瑞希", version: "5.7", title: "新患者", hidden: false,
      location: "稻妻-稻妻城-秋沙钱汤", trigger: "", prerequisite: "", extra: "莱依拉",
      description: "在导师的建议下，莱依拉来到了「秋沙钱汤」。在放松的同时，也想寻求梦见月瑞希的帮助。但是，莱依拉的状况似乎越来越糟糕…或许，梦见月瑞希会有什么办法…" },

    { id: 49, character: "梦见月瑞希", version: "5.7", title: "诊疗", hidden: false,
      location: "稻妻-稻妻城-秋沙钱汤", trigger: "", prerequisite: "", extra: "莱依拉",
      description: "在诊疗过程里，莱依拉又进入了「梦游状态」。在和「莱依拉」聊过后，梦见月瑞希更加了解了莱依拉如今的状态。或许，她能想出一个更加完备的治疗方案…？" },

    { id: 50, character: "早柚", version: "5.7", title: "长高的…方法？", hidden: false,
      location: "稻妻 稻妻城", trigger: "", prerequisite: "前置：游逸旅闻（鹿野院平藏·静待…）", extra: "多莉",
      description: "在你的「监督」下，多莉终于答应免费将药水提供给早柚先行体验。不过，这位商人永远不会做亏本的生意，或许…这一次的「优惠」也早就在她的预料之内了…？" },

    { id: 51, character: "托马", version: "5.7", title: "培训考试", hidden: false,
      location: "稻妻-稻妻城", trigger: "", prerequisite: "", extra: "久岐忍",
      description: "社奉行组织的技能培训课与考试得到了许多人的认可，忙前忙后的托马即将迎来悠长假期…" },

    { id: 52, character: "托马", version: "5.7", title: "悠长假期", hidden: false,
      location: "蒙德-蒙德城-天使的馈赠", trigger: "", prerequisite: "", extra: "凯亚",
      description: "为了完成母亲的嘱托，久未归乡的托马回到了蒙德城。酒馆、街道还有热情的朋友，蒙德依然像他记忆中一样温暖。" },

    { id: 53, character: "绮良良", version: "5.7", title: "热腾腾", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "香菱",
      description: "在桌子上用来洗菜的水不知道换了多少杯之后，绮良良终于吃饱了。…但下次，能不能把这道菜做成不辣的呢？" },

    { id: 54, character: "绮良良", version: "5.7", title: "凉丝丝", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "香菱、重云",
      description: "在重云的帮助下，绮良良总算是吃到了一份好吃的凉菜，同时，绮良良也答应重云，将他带去稻妻，并且把五百藏与荒泷一斗介绍给他认识。等重云收拾好行李后，他们就会出发。" },

    { id: 55, character: "绮良良", version: "5.7", title: "我的快递！", hidden: false,
      location: "稻妻-镇守之森", trigger: "", prerequisite: "", extra: "【五百藏】【刑部小判】",
      description: "在镇守之森里，绮良良被五百藏拦住，陪着小妖狸们不停地玩着捉迷藏。虽然五百藏让另外一只小妖狸将快递送给了收件人…" },

    { id: 56, character: "鹿野院平藏", version: "5.7", title: "怪案", hidden: false,
      location: "稻妻-稻妻城", trigger: "", prerequisite: "", extra: "",
      description: "在花见坂，你遇见了正在因为一桩「怪案」而苦恼的鹿野院平藏。据他说，犯罪者私自闯入居民家中，但却什么也没有偷。而且，所有被入室的民宅里都有一个共同点，那就是收藏着一本罪案小说：《应避忌的食人树》。以此为线索，鹿野院平藏有了一个初步的推理。以他的推理为基础，天领奉行已经外出巡查，准备去缉拿这位奇怪的罪犯。" },

    { id: 57, character: "鹿野院平藏", version: "5.7", title: "真相", hidden: false,
      location: "稻妻-稻妻城", trigger: "", prerequisite: "", extra: "",
      description: "犯下那桩「怪案」的犯人被缉拿归案。而这位犯人做下罪案的原因，则是因为自己无心将一份「表白信」夹在了一本旧书之中，当他意识到问题，并赶去店里想要拿回表白信时，却得知那本陈旧的《应避忌的食人树》已然被他人买走。六神无主之下，他决定按照书中描述的犯罪方法，将自己的那封信偷回来…" },

    { id: 58, character: "鹿野院平藏", version: "5.7", title: "追缉", hidden: false,
      location: "稻妻-稻妻城", trigger: "", prerequisite: "", extra: "",
      description: "又一桩案件找上了鹿野院平藏。这次的犯罪团伙似乎颇有经验和手段，鹿野院平藏一时半会居然找不到案件的突破口。" },

    { id: 59, character: "鹿野院平藏", version: "5.7", title: "静待…", hidden: true,
      location: "稻妻-白狐之野", trigger: "备注：随机持续1~5日，但不重复获得逸闻印签，<br>后随机触发（鹿野院平藏·破案日）", prerequisite: "", extra: "",
      description: "鹿野院平藏似乎暂时没有找到案件的突破口。但是，线索一定存在于某个地方…" },

    { id: 60, character: "鹿野院平藏", version: "5.7", title: "破案日", hidden: false,
      location: "稻妻-白狐之野", trigger: "", prerequisite: "前置：游逸旅闻（早柚·长高的…方法？）", extra: "",
      description: "在多莉的「慷慨帮助」下，鹿野院平藏终于找到了贩卖违禁药物的元凶，并且将其绳之以法。但是，那位商人…似乎也已经拿到了自己的「报酬」。" },

    { id: 61, character: "鹿野院平藏", version: "月之一", title: "他人之罪", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇-旗舰酒馆", trigger: "", prerequisite: "", extra: "雅珂达",
      description: "在那夏镇，你遇见了因查案而抵达挪德卡莱的鹿野院平藏，他所找到的向导正好是「秘闻馆」的雅珂达。不过，怎么感觉雅珂达和平藏聊天时，显得有些紧张…？" },

    /* ---------- 5.7 枫丹 / 须弥 ---------- */
    { id: 62, character: "迪希雅", version: "5.7", title: "机关舞步", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "",
      description: "迪希雅正拍摄着科培琉司的舞步，预备着带回去给妮露和迪娜泽黛看看。据迪希雅说，如果需要的话，她也可以…跳男步？" },

    { id: 63, character: "迪希雅", version: "5.7", title: "裙子", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "千织",
      description: "在千织的建议下，迪希雅决定为自己买一条新裙子。听起来，会是一条很漂亮的裙子。" },

    { id: 64, character: "赛诺", version: "5.7", title: "估量", hidden: false,
      location: "须弥-二净甸", trigger: "", prerequisite: "", extra: "提纳里",
      description: "这一份有关于蘑菇的笑话，不知道会让赛诺在晚餐时喝多少蘑菇汤。" },

    { id: 65, character: "赛诺", version: "5.7", title: "食物", hidden: false,
      location: "须弥-二净甸", trigger: "", prerequisite: "", extra: "",
      description: "蘑菇虽然是「树食主义者」。但请不要为了验证这个说法，而去挑衅翠翎恐蕈。它可不是吃素的。" },

    { id: 66, character: "赛诺", version: "5.7", title: "职责", hidden: false,
      location: "须弥-寂静园", trigger: "", prerequisite: "", extra: "【乃亚卜】",
      description: "大风纪官，即将履行他的职责。昨日，今日，明日，每日皆如此。" },

    { id: 67, character: "柯莱", version: "5.7", title: "学习会", hidden: false,
      location: "须弥-教令院-智慧宫", trigger: "", prerequisite: "", extra: "【耶佳娜】",
      description: "在提纳里的帮助下，柯莱站上讲台，主持了一场盛大的学习会。看来，她正在学习之路上稳步前行。" },

    { id: 68, character: "林尼", version: "5.7", title: "魔术", hidden: false,
      location: "枫丹-枫丹动能工程科学研究院区", trigger: "", prerequisite: "", extra: "",
      description: "在枫丹科学院外，遇见了正打算去科学院做魔术交流的林尼。听起来，他对于那种「近景魔术」也很感兴趣。等等，他刚才是不是已经变过一次「近景魔术」了？" },

    { id: 69, character: "林尼", version: "7.1", title: "表演场所", hidden: true,
      location: "至冬-科洛列夫茨基剧院（内）", trigger: "剧院内路过概率概率出现", prerequisite: "", extra: "琳妮特",
      description: "在剧院里，你遇见了正在讨论表演问题的林尼和琳妮特，他们好像正在讨论和魔术表演有关的问题…？" },

    { id: 70, character: "那维莱特", version: "5.7", title: "雨中", hidden: false,
      location: "枫丹-伊黎耶林区", trigger: "", prerequisite: "", extra: "",
      description: "看来，淋雨只是那维莱特的「私人爱好」。" },

    { id: 71, character: "那维莱特", version: "5.7", title: "礼物", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "",
      description: "在塞德娜的建议下，那维莱特继续采购着预备送给美露莘们的礼物——每一位美露莘都有份。" },

    { id: 72, character: "那维莱特", version: "5.7", title: "拜访", hidden: false,
      location: "枫丹 厄里那斯", trigger: "", prerequisite: "", extra: "",
      description: "每一位美露莘都有的礼物，来自那维莱特。…而「鱼鱼咏唱派」，则来自美露莘。" },

    { id: 73, character: "琳妮特", version: "5.7", title: "修理…？", hidden: false,
      location: "枫丹-枫丹廷-灰河", trigger: "", prerequisite: "", extra: "",
      description: "琳妮特在灰河里帮助大家不断「修坏」着机器，被她碰过的机器，都安安静静地不再动弹了。或许，这也是一种…出色的能力？" },

    { id: 74, character: "菲米尼", version: "5.7", title: "故事", hidden: false,
      location: "枫丹-塞洛海原（水下）", trigger: "", prerequisite: "", extra: "",
      description: "在水下，菲米尼对膨膨兽讲完了自己手上绘本的故事。希望，这个故事里的人和膨膨兽能有一个好结局。" },

    { id: 75, character: "夏沃蕾", version: "5.7", title: "再加把劲！", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "",
      description: "继续训练！别掉队了！在夏沃蕾的督促下，特巡队队员们继续展开着艰苦的训练…" },

    { id: 76, character: "夏洛蒂", version: "5.7", title: "耐心", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "",
      description: "夏洛蒂小姐最终还是没有等来她的「采访对象」。但在她的采访簿上，并不存在「气馁」这个词。很快，她就要奔向下一个地点了…" },

    { id: 77, character: "夏洛蒂", version: "5.7", title: "糟糕糟糕", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "",
      description: "再完美的计划，也总是会因为一点小疏忽而被破坏。夏洛蒂想要前往纳塔的企图被主编看穿，并被阻拦了下来。但是，她很快找到了下一个目的地——挪德卡莱。" },

    { id: 78, character: "夏洛蒂", version: "5.7", title: "新目的地", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "千织",
      description: "说服了父母后，夏洛蒂终于获得了前往挪德卡莱的机会。或许在那片土地上，她会发现更多「有趣的故事」。" },

    { id: 79, character: "夏洛蒂", version: "7.1", title: "新闻团队", hidden: false,
      location: "至冬-至冬堡", trigger: "", prerequisite: "", extra: "【爱拉尼】",
      description: "在至冬堡，你遇见了夏洛蒂和爱拉尼。她们虽然因为各自不同的目的来此，但是，好像也有合作的可能…？" },

    /* ---------- 5.7 纳塔 ---------- */
    { id: 80, character: "基尼奇", version: "5.7", title: "委托", hidden: true,
      location: "纳塔-冒险家协会", trigger: "与纳塔凯瑟琳对话后概率出现", prerequisite: "", extra: "",
      description: "在冒险家协会旁遇见了基尼奇，他似乎已经完成了手上的委托。如果有机会的话…下次挑选委托时，或许能请基尼奇过来给点意见？" },

    { id: 81, character: "希诺宁", version: "5.7", title: "面谈实务", hidden: true,
      location: "纳塔-冒险家协会", trigger: "与纳塔凯瑟琳对话后概率出现", prerequisite: "", extra: "",
      description: "希诺宁接到了一封委托信，当她正准备以「必须面谈」的理由将信退回原处时。这次委托的「客户」玛薇卡，却已经在希诺宁的工坊里，等着和她「面谈」了。" },

    { id: 82, character: "伊法", version: "5.7", title: "药物", hidden: true,
      location: "纳塔-合成台", trigger: "使用纳塔合成台后概率出现", prerequisite: "", extra: "",
      description: "为了治疗小龙们的厌食症，伊法来到这里想要制作一些药物带回去。这次，可不能让咔库库偷吃了。「继续吃！哥们！" },

    { id: 83, character: "伊安珊", version: "5.7", title: "训练问题", hidden: true,
      location: "纳塔-合成台", trigger: "使用纳塔合成台后概率出现", prerequisite: "", extra: "",
      description: "为了治疗因为训练而受伤的部族成员，伊安珊来到这里，想要制作一些药物带回去…自由器械有风险，强上重量需谨慎。" },

    /* ---------- 月之一 挪德卡莱 ---------- */
    { id: 84, character: "菈乌玛", version: "月之一", title: "聚会", hidden: false,
      location: "挪德卡莱-希汐岛-霜月之坊", trigger: "", prerequisite: "", extra: "",
      description: "在希汐岛，你遇见了正在休息的菈乌玛，虽然已经很小心了，但还是被她注意到了…不，应该是一开始就被那只小猫注意到了吧。" },

    { id: 85, character: "菈乌玛", version: "月之一", title: "可承之重", hidden: false,
      location: "挪德卡莱-希汐岛-霜月之坊", trigger: "", prerequisite: "", extra: "",
      description: "在希汐岛，你遇见了正在休息的菈乌玛，但她好像正因为自己「角冠」的重量问题而略有苦恼…" },

    { id: 86, character: "伊涅芙", version: "月之一", title: "语言问题", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "爱诺",
      description: "在叮铃哐啷蛋卷工坊里，你遇见了正在给伊涅芙做整修的爱诺。据说是伊涅芙请求爱诺，帮自己提升「幽默度」。但这个提升幅度，是否有些…" },

    { id: 87, character: "伊涅芙", version: "月之一", title: "冥想时间", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "雅珂达",
      description: "在叮铃哐啷蛋卷工坊里，你遇见了正在「冥想」的伊涅芙。原来她在试图帮助失眠的雅珂达正常入眠，但是，伊涅芙所谓的「冥想」，真的不是「关机」吗?" },

    { id: 88, character: "伊涅芙", version: "月之一", title: "事关蛋卷", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "",
      description: "在那夏镇，你遇见了正在采集蛋卷原料的伊涅芙。看起来，她的幽默度已经被爱诺调低了不少…" },

    { id: 89, character: "奈芙尔", version: "月之一", title: "靠谱与否", hidden: true,
      location: "挪德卡莱-伦波岛-那夏镇-秘谜书屋", trigger: "与书店老板对话后概率出现", prerequisite: "", extra: "",
      description: "你遇见了正在买书的奈芙尔。虽然奈芙尔所购买的书籍很不靠谱，但她似乎想要用这本书试探一下雅珂达…？" },

    { id: 90, character: "奈芙尔", version: "月之一", title: "贵客登门", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇-旗舰酒馆", trigger: "", prerequisite: "", extra: "夜兰",
      description: "在「旗舰」内，奈芙尔和夜兰正聊着「生意」。虽然两人的言语都十分礼貌，但聊天的氛围已经算是剑拔弩张了…不、不然还是先离这两位远一点吧…" },

    { id: 91, character: "奈芙尔", version: "月之一", title: "旧客登门", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇-秘闻馆", trigger: "", prerequisite: "", extra: "多莉",
      description: "在「秘闻馆」内，你遇见了似乎正在聊生意的奈芙尔与多莉，听她们的说法，多莉似乎曾经在挪德卡莱做了某些…准备？" },

    { id: 92, character: "菲林斯", version: "月之一", title: "力有未逮", hidden: false,
      location: "挪德卡莱-伦波岛-空寂走廊", trigger: "", prerequisite: "", extra: "伊涅芙",
      description: "你遇见了正看着伊涅芙修理路灯的菲林斯。看来，执灯士也有很多需要重新学习的东西啊…" },

    { id: 93, character: "菲林斯", version: "月之一", title: "巡视", hidden: true,
      location: "挪德卡莱-帕哈岛-圣遗物副本（霜凝的机枢）", trigger: "进入圣遗物副本（消耗体力）退出副本后概率出现", prerequisite: "", extra: "",
      description: "在郊外，你遇见了正巡逻至此的菲林斯。有这么一位可靠的人在巡逻，周围应该安全的不得了吧…应该。" },

    { id: 94, character: "菲林斯", version: "月之一", title: "藏品", hidden: true,
      location: "挪德卡莱-伦波岛-那夏镇-伏尼契商会（地图钻石图标）", trigger: "伏尼契商会对话后概率出现", prerequisite: "", extra: "",
      description: "你遇见了正在购买藏品的菲林斯，虽然这块怀表不算便宜，但菲林斯似乎非常喜欢它…" },

    { id: 95, character: "菲林斯", version: "月之一", title: "古币", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇", trigger: "", prerequisite: "", extra: "",
      description: "在那夏镇，你遇见了正等着收购古币的菲林斯，他对于古币这一收藏品似乎颇有研究。不过，古币的收藏价值应该大于实际价值吧…" },

    { id: 96, character: "菲林斯", version: "月之一", title: "日常所需", hidden: false,
      location: "挪德卡莱-帕哈岛-终夜长茔", trigger: "", prerequisite: "", extra: "",
      description: "你遇见了正在整理屋子的菲林斯，也听他讲起了自己的「高效」的进食方式。但是，听起来菲林斯对肉脯和干饼的味道依然印象深刻…" },

    { id: 97, character: "菲林斯", version: "月之一", title: "意外助手", hidden: false,
      location: "挪德卡莱-帕哈岛-终夜长茔", trigger: "", prerequisite: "", extra: "",
      description: "你遇见了正在制作骨拼图的菲林斯，而且，他似乎有一只不知名的狗做助手…" },

    { id: 98, character: "雅珂达", version: "月之一", title: "对应酬劳", hidden: true,
      location: "挪德卡莱-伦波岛-那夏镇-冒险家协会", trigger: "与凯瑟琳对话后概率出现", prerequisite: "", extra: "",
      description: "在冒险家协会旁，你遇见了气冲冲的雅珂达。听起来，她执行委托的过程似乎并不顺利…" },

    { id: 99, character: "雅珂达", version: "月之一", title: "猫！喂！猫——", hidden: true,
      location: "挪德卡莱-帕哈岛-圣遗物副本（霜凝的机枢）", trigger: "进入圣遗物副本（消耗体力）退出副本后概率出现", prerequisite: "", extra: "",
      description: "在郊外，你遇见了正在寻找猫的雅珂达。她似乎被那一只乱跑的猫耍得团团转。无论如何，祝你好运，雅珂达。" },

    { id: 100, character: "雅珂达", version: "月之一", title: "对不起嘛！伊涅芙——", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "伊涅芙、爱诺",
      description: "在叮铃哐啷蛋卷工坊里，你遇见了前来拜访，心里也在努力思考如何向伊涅芙道歉的雅珂达。虽然此事过程有所波折，但所幸，雅珂达和伊涅芙的友谊似乎未曾受到影响…" },

    { id: 101, character: "雅珂达", version: "7.1", title: "盗贼末路", hidden: false,
      location: "至冬-至冬堡", trigger: "", prerequisite: "前置：拥有角色【雅珂达】，并完成世界任务【曾抛弃过去的人】", extra: "",
      description: "在至冬堡，你遇见了雅珂达。她似乎追寻着有关「海钩帮」的新线索，一路到达了至冬堡…" },

    { id: 102, character: "爱诺", version: "月之一", title: "救治", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "伊涅芙",
      description: "在叮铃哐啷蛋卷工坊里，你遇见了正在照顾一只小鹿的爱诺与伊涅芙，爱诺很喜欢小鹿，但…将它送归自然，或许是更好的选择。" },

    { id: 103, character: "爱诺", version: "月之一", title: "选择…", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "伊涅芙",
      description: "将小鹿送归自然，或许是一个更好的选择，但是…" },

    { id: 104, character: "爱诺", version: "月之一", title: "时间足够你道别", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "伊涅芙、菈乌玛",
      description: "即使万分不舍，但爱诺依然决定将小鹿送归自然，菈乌玛会帮助小鹿寻找到它的家人。在小鹿真正离开之前，时间或许足够道别…" },

    { id: 105, character: "爱诺", version: "月之一", title: "猫，可爱！", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "伊涅芙",
      description: "在叮铃哐啷蛋卷工坊里，你遇见了打算给伊涅芙做一身猫猫套服的爱诺，在短暂——而且非常严谨——的思考后，她决定给派蒙也做一套。" },

    { id: 106, character: "爱诺", version: "月之一", title: "运转吧，伊涅芙", hidden: true,
      location: "挪德卡莱-伦波岛-那夏镇-合成台", trigger: "使用合成台后概率出现", prerequisite: "", extra: "伊涅芙",
      description: "你遇见了正在为伊涅芙制作新型润滑剂的爱诺，不知道，这种润滑剂到底能不能发挥作用…" },

    { id: 107, character: "丝柯克", version: "月之一", title: "日常所需", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇", trigger: "", prerequisite: "", extra: "多莉",
      description: "在那夏镇，你遇见了…丝柯克？！好吧，看来她只是来找多莉卖一些杂物，以获取日常所需的摩拉。不知道，下次会在哪里遇见她…" },

    { id: 108, character: "米卡", version: "月之一", title: "为信而来", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇", trigger: "", prerequisite: "", extra: "",
      description: "在挪德卡莱，你遇见了米卡。他正准备把骑士团的信件送给法尔伽。不过，他到底是怎么带上这么多礼物的，难道这就是西风骑士的实力么？" },

    { id: 109, character: "辛焱", version: "月之一", title: "新演出", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇-旗舰酒馆", trigger: "", prerequisite: "", extra: "",
      description: "在那夏镇，你遇见了辛焱。她似乎在这里找到了新的灵感，或许，她之后会在那夏镇举办一场盛大的演出…？" },

    { id: 110, character: "烟绯", version: "月之一", title: "学术所致", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇", trigger: "", prerequisite: "", extra: "",
      description: "在挪德卡莱，你遇见了烟排。这位律法咨询师似乎正在为了研究学术而取材。不过，她到底想在这片[无法之地」里取得何种材料？这种材料又能怎样帮助她研究律法问题呢？" },

    { id: 111, character: "烟绯", version: "月之一", title: "噢，角…", hidden: false,
      location: "挪德卡莱-希汐岛-霜月之坊", trigger: "", prerequisite: "", extra: "菈乌玛",
      description: "在希汐岛，你遇见了烟绯。她似乎已经将自己的仙人血脉之事告诉了菈乌玛，而菈乌玛也…似乎很平静地接受了这个事实，并且允许了烟绯去「霜月之子」的书库查阅资料…好吧，看来一切都很顺利。" },

    { id: 112, character: "夜兰", version: "月之二", title: "所为所求", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇", trigger: "", prerequisite: "前置：魔神任务【空月之歌第四幕】「回望湮灭的月光」", extra: "",
      description: "在那夏镇，你遇见了夜兰。她似乎是为了向「秘闻馆」求购情报才远道而来。但听她的口气，似乎对「秘闻馆」的老板奈芙尔很是提防…" },

    /* ---------- 月之五 ---------- */
    { id: 113, character: "尼可", version: "月之五", title: "灵感来！", hidden: false,
      location: "挪德卡莱-聚所共建·西风戍垒", trigger: "", prerequisite: "", extra: "",
      description: "在挪德卡莱的西风骑士团驻地，你遇见了正准备刺杀法尔伽的尼可，大惊过后，才知道尼可只是在寻找下一本小说的灵感，最后，尼可还是放弃了对法尔伽进行实体（或者非实体）的攻击，转而研究起了另一份灵感…" },

    { id: 114, character: "克洛琳德", version: "月之五", title: "桌上剧团", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇-旗舰酒馆", trigger: "", prerequisite: "", extra: "娜维娅、雅珂达、叶洛亚",
      description: "在「旗舰」，你遇见了正在游玩「桌上剧团」的克洛琳德与娜维娅…还有雅珂达与叶洛亚，看来，大家确实玩得很开心…" },

    { id: 115, character: "克洛琳德", version: "7.1", title: "桌上剧团", hidden: false,
      location: "至冬-老庭院餐厅(内)", trigger: "", prerequisite: "", extra: "提纳里、娜维娅、沃雅妮莎",
      description: "在至冬堡，你遇见了正在主持桌上剧团的克洛琳德，当然了，还有娜维娅…和几位新朋友。" },

    { id: 116, character: "嘉明", version: "月之五", title: "好好味", hidden: false,
      location: "璃月-碧水原", trigger: "", prerequisite: "", extra: "",
      description: "在璃月的郊外，你遇见了正在…呃，烹饪的嘉明，在他的招呼下，你确实是享用了一顿大餐…" },

    { id: 117, character: "卡齐娜", version: "月之五", title: "第一步", hidden: false,
      location: "纳塔-流泉之众", trigger: "", prerequisite: "", extra: "玛拉妮、基尼奇、（库胡勒阿乔）",
      description: "在纳塔，你遇见了正在帮玛拉妮看店的卡齐娜，而基尼奇则被玛拉妮拜托，在远处默默看着周围的动静，以防发生意外情况…最终，卡齐娜圆满地照顾好了店铺，向着自己的梦想迈出了第一步。" },

    { id: 118, character: "艾梅莉埃", version: "月之五", title: "另有他用", hidden: false,
      location: "璃月-璃月港", trigger: "", prerequisite: "", extra: "胡桃、香菱",
      description: "在璃月港，你遇见了艾梅莉埃，她似乎为香菱和胡桃制作了一款新香水，而胡桃则眼珠一转，想出了一些新点子…" },

    { id: 119, character: "久岐忍", version: "月之五", title: "请依法办", hidden: false,
      location: "枫丹-枫丹廷", trigger: "", prerequisite: "", extra: "荒泷一斗",
      description: "在枫丹，你遇见了正在处理事务的久岐忍，也听她说了一斗一行人所做之事，和目前所在之处。唔…果然还是依法办事比较好呢…" },

    { id: 120, character: "莱欧斯利", version: "月之五", title: "珀有所得", hidden: false,
      location: "枫丹-梅洛彼得堡", trigger: "", prerequisite: "", extra: "那维莱特",
      description: "在梅洛彼得堡，你遇见了被莫名带入堡内的珀西芙，听莱欧斯利所说，似乎是因为珀西芙误入了探照灯范围，从而被尽职的守卫们带了进来…但从结果上来说，守卫们尽了职责，珀西芙吃了汐藻，莱欧斯利认识了新客人，那维莱特获得了新知识，可谓是可喜可贺。" },

    { id: 121, character: "兹白", version: "月之五", title: "又见仙法", hidden: false,
      location: "璃月-沉玉谷·上谷", trigger: "", prerequisite: "", extra: "七七",
      description: "在璃月郊外，你遇见了正在与七七交谈的兹白。听她所说，七七也曾被施了三尸法，而且如今那道镇压她魂魄的仙箓也即将丧失功效，必须要想想办法…" },

    { id: 122, character: "杜林", version: "月之五", title: "学习时间", hidden: true,
      location: "挪德卡莱-伦波岛-那夏镇-合成台", trigger: "使用合成台后概率出现", prerequisite: "", extra: "阿贝多",
      description: "在挪德卡莱，你遇见了正在向阿贝多学习炼金术的杜林，希望他的学习一切顺利…" },

    { id: 123, character: "杜林", version: "月之五", title: "买书记", hidden: true,
      location: "挪德卡莱-伦波岛-那夏镇-秘谜书屋", trigger: "与书店老板对话后概率出现", prerequisite: "", extra: "雅珂达",
      description: "在那夏镇，你遇见了正拜托雅珂达帮忙买书的杜林。在雅珂达的大力帮助下，杜林想买的书得到了一个大折扣…" },

    { id: 124, character: "宵宫", version: "月之五", title: "长途旅行", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇", trigger: "", prerequisite: "", extra: "",
      description: "在那夏镇，你意外遇见了前来旅行的宵宫，她似乎正准备去拜访爱诺，并定制一份礼物…" },

    { id: 125, character: "宵宫", version: "月之五", title: "在童年", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "伊涅芙、爱诺",
      description: "在叮铃哐啷蛋卷工坊，你看见了已经和爱诺玩成一团的宵宫，还有宵宫委托爱诺制作的新玩具…但在那之前，还是容爱诺和宵宫姐姐先玩个痛快吧。" },

    { id: 126, character: "叶洛亚", version: "月之五", title: "一课又一课", hidden: false,
      location: "挪德卡莱-伦波岛-叮铃哐啷蛋卷工坊", trigger: "", prerequisite: "", extra: "菲林斯、伊涅芙、爱诺",
      description: "在叮铃哐啷蛋卷工坊里，你遇见了正在上课的叶洛亚。不过，他从菲林斯那边所学来的逃课技巧，似乎已经全部被伊涅芙识破，还好菲林斯在紧要关头赶到，将叶洛亚带离了学习的苦海…但话说回来，为什么菲林斯没有上课？" },

    { id: 127, character: "叶洛亚", version: "月之五", title: "机关又算尽", hidden: false,
      location: "挪德卡莱-聚所共建·望崖营壁", trigger: "", prerequisite: "", extra: "菲林斯",
      description: "在望崖营壁，你又见到了叶洛亚与菲林斯，听他们所说，爱诺似乎马上就要前去执灯士总部开办大型课程。对二位执灯士来说，如今最紧要的事务，乃是如何合理合规地离开学堂…" },

    { id: 128, character: "法尔伽", version: "月之五", title: "饮无尽头", hidden: true,
      location: "挪德卡莱-伦波岛-那夏镇-冒险家协会", trigger: "与凯瑟琳对话后概率出现", prerequisite: "", extra: "",
      description: "在挪德卡莱的冒险家协会前，你遇见了正在和凯瑟琳讨论新一轮酒类运输委托的法尔伽。看来，他似乎又把酒喝光了…" },

    { id: 129, character: "法尔伽", version: "月之五", title: "忙碌", hidden: true,
      location: "挪德卡莱-烟硌山峰-圣遗物副本（月童的库藏）", trigger: "进入圣遗物副本（消耗体力）退出副本后概率出现", prerequisite: "", extra: "",
      description: "在挪德卡莱的郊外，你遇见了似乎正来此处理事务的法尔伽。作为西风骑士团的大团长，果然每天都很忙碌啊…" },

    { id: 130, character: "法尔伽", version: "月之五", title: "新武器", hidden: true,
      location: "挪德卡莱-聚所共建·西风戍垒", trigger: "与聚所对话后概率出现（台阶下）", prerequisite: "", extra: "",
      description: "在西风成垒，你遇见了正在训练的法尔伽，他似乎还是没能为自己和诺艾尔找到合适的武器一一或合适的矿石。看来，这件事只能回蒙德城再议了…" },

    { id: 131, character: "法尔伽", version: "月之五", title: "通讯", hidden: true,
      location: "挪德卡莱-聚所共建·西风戍垒", trigger: "与聚所对话后概率出现", prerequisite: "", extra: "米卡",
      description: "在西风戍垒，你遇见了正在给米卡发令的法尔伽。在如此之多的命令里，或许最重要的是…最后那一条？" },

    { id: 132, character: "法尔伽", version: "月之五", title: "品酒", hidden: false,
      location: "挪德卡莱-伦波岛-那夏镇-旗舰酒馆", trigger: "", prerequisite: "", extra: "菲林斯",
      description: "在「旗舰」，你遇见了正在喝酒的菲林斯与法尔伽，很快，你也被拉入了这场豪饮之中。而为了庆祝如此偶然而又圆满的相逢，法尔伽又喝了不少酒…" },

    { id: 133, character: "法尔伽", version: "月之五", title: "骑士的恋情", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "前置：传说任务（法尔伽）【天狼之章第一幕】「致予远征之人」", extra: "",
      description: "在蒙德城，你遇见了正在和古德温讨论着什么的法尔伽，听他们的说法，古德温似乎终于要面对那个…他始终在逃避的问题…" },

    { id: 134, character: "法尔伽", version: "月之五", title: "骑士的选择", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "前置：游逸旅闻（法尔伽·骑士的恋情）", extra: "",
      description: "在法尔伽的敦促下，古德温最终还是做出了自己的选择…" },

    { id: 135, character: "法尔伽", version: "月之六", title: "劳碌之故", hidden: true,
      location: "蒙德-蒙德城", trigger: "与凯瑟琳对话后概率出现", prerequisite: "前置：游逸旅闻（塔利雅·告解日）", extra: "",
      description: "你在蒙德城冒险家协会前遇见了法尔伽与西蒙·佩奇，他们似乎正在谈论着什么…" },

    { id: 136, character: "塔利雅", version: "月之六", title: "告解日", hidden: false,
      location: "蒙德-蒙德城", trigger: "", prerequisite: "前置：魔神任务【空月之歌第八幕】「真实之月」", extra: "芭芭拉",
      description: "塔利雅的「告解」结束了，但那位聆听他告解的「枢机卿」，却依然若有所思…" },

    /* ---------- 7.1 至冬 ---------- */
    { id: 137, character: "沃雅妮莎", version: "7.1", title: "票务问题", hidden: false,
      location: "至冬-科洛列夫茨基剧院（外）", trigger: "", prerequisite: "", extra: "",
      description: "在至冬堡，你遇见了正在琢磨票贩子广告的沃雅妮莎，她似乎…有一些新想法。" },

    { id: 138, character: "沃雅妮莎", version: "7.1", title: "我都要了！", hidden: false,
      location: "至冬-商店（钻石图标）", trigger: "", prerequisite: "", extra: "",
      description: "在至冬堡，你遇见了正在购物的沃雅妮莎，她正在以收获日落果的气势购买着各种东西…" },

    { id: 139, character: "沃雅妮莎", version: "7.1", title: "聆听我声", hidden: false,
      location: "至冬-科洛列夫茨基剧院（外）", trigger: "", prerequisite: "前置：游逸旅闻（沃雅妮莎·票务问题）", extra: "",
      description: "跟随着沃雅妮莎，你前往了她收藏信件的小屋。在这里，沃雅妮莎收藏着无数过去的时光..." },

    { id: 140, character: "沃雅妮莎", version: "7.1", title: "列车装饰", hidden: true,
      location: "至冬-列车总站", trigger: "列车总站站台使用（灰眸）召唤列车概率出现", prerequisite: "", extra: "",
      description: "沃雅妮莎十分在意列车上的内饰..." },

    { id: 141, character: "桑多涅", version: "7.1", title: "寻迹", hidden: true,
      location: "至冬-圣遗物副本（逆悬的冰河）", trigger: "进入圣遗物副本（消耗体力）退出副本后概率出现", prerequisite: "", extra: "",
      description: "桑多涅似乎正在寻找一台失控的机关，以她的实力，应该不会太困难吧…" },

    { id: 142, character: "桑多涅", version: "7.1", title: "委托", hidden: true,
      location: "至冬-冒险家协会", trigger: "与凯瑟琳对话后概率出现", prerequisite: "备注：不要使用桑多涅与凯瑟琳对话", extra: "【潘塔罗涅】",
      description: "在至冬堡的冒险家协会面前，你遇见了正在讨论着什么的桑多涅和潘塔罗涅…" },

    { id: 143, character: "奥黛塔", version: "7.1", title: "练习日", hidden: true,
      location: "至冬-天赋书副本（荒坠的圣迹）", trigger: "进入天赋副本（消耗体力）退出副本后概率出现", prerequisite: "", extra: "",
      description: "奥黛塔依然在练习着芭蕾舞…" },

    { id: 144, character: "奥黛塔", version: "7.1", title: "食无小事", hidden: false,
      location: "至冬-老庭院餐厅(内)", trigger: "", prerequisite: "", extra: "沃雅妮莎",
      description: "在至冬堡，你遇见了正在用餐的奥黛塔。她在吃什么好吃的呢…" },

    { id: 145, character: "奥黛塔", version: "7.1", title: "顺带一程", hidden: true,
      location: "至冬-列车总站", trigger: "列车总站站台使用（灰眸）召唤列车概率出现", prerequisite: "", extra: "",
      description: "奥黛塔似乎因为某事而误了自己应当搭乘的列车，或许，你能带她一程。" },

    { id: 146, character: "阿罗夏", version: "7.1", title: "追猎", hidden: true,
      location: "至冬-地图BOSS(游雪的护刃)", trigger: "经过地图Boss(游雪的护刃)附近概率出现", prerequisite: "", extra: "",
      description: "在察觉到了前方的危险后，阿罗夏正在思考，如何前进…" },

    { id: 147, character: "阿罗夏", version: "7.1", title: "顽皮小狗", hidden: true,
      location: "至冬-凝露镇", trigger: "凝露镇使用（灰眸）召唤列车概率出现", prerequisite: "", extra: "",
      description: "阿罗夏的小狗，似乎有些贪玩地跑到了列车上…" },

    { id: 148, character: "达达利亚", version: "7.1", title: "购票", hidden: true,
      location: "至冬-科洛列夫茨基剧院（门口）", trigger: "路过概率出现", prerequisite: "", extra: "",
      description: "在剧院门口，你遇见了很不幸没有为自己的弟弟妹妹买到票的达达利亚…" },

    { id: 149, character: "达达利亚", version: "7.1", title: "有所收获", hidden: true,
      location: "至冬-科洛列夫茨基剧院（门口）", trigger: "路过概率出现", prerequisite: "前置：游逸旅闻（达达利亚·购票）", extra: "阿蕾奇诺",
      description: "在剧院门口，你遇见了正在聊天的阿蕾奇诺和达达利亚，看来，达达利亚还是为自己的弟弟妹妹拿到了票。" },

    { id: 150, character: "达达利亚", version: "7.1", title: "归家", hidden: true,
      location: "至冬-海屑镇", trigger: "海屑镇车站概率出现", prerequisite: "前置：游逸旅闻（达达利亚·有所收获）", extra: "",
      description: "在海屑镇，达达利亚正在清点给家里人带的礼物。" },

    { id: 151, character: "达达利亚", version: "7.1", title: "约定", hidden: true,
      location: "至冬-海屑镇", trigger: "海屑镇达达利亚家门口概率出现", prerequisite: "前置：游逸旅闻（达达利亚·归家）", extra: "【冬妮娅】",
      description: "在海屑镇，达达利亚正在和冬妮娅讨论着下次什么时候能回家陪陪家人..." },

    { id: 152, character: "达达利亚", version: "7.1", title: "冬钓", hidden: true,
      location: "至冬-海屑镇", trigger: "海屑镇上方传送锚点-往后转视角-上楼梯直走到头概率出现", prerequisite: "前置：游逸旅闻（达达利亚·归家）", extra: "",
      description: "在海屑镇，达达利亚正准备出去冰钓..." },

    { id: 153, character: "薇斯纳", version: "7.1", title: "票务的另一个问题", hidden: false,
      location: "至冬-至冬堡", trigger: "", prerequisite: "前置：游逸旅闻（沃雅妮莎·票务问题）", extra: "沃雅妮莎",
      description: "在至冬堡，你遇见了正在琢磨票贩子广告的薇斯纳。但是，她为什么会琢磨这些问题...？" },

    { id: 154, character: "薇斯纳", version: "7.1", title: "皆大欢喜", hidden: false,
      location: "至冬-至冬堡", trigger: "", prerequisite: "前置：游逸旅闻（薇斯纳·票务的另一个问题）", extra: "沃雅妮莎",
      description: "在至冬堡，你遇见了正在聊天的沃雅妮莎和薇斯纳，她们似乎...正在讨论和门票有关的问题...？" },

    { id: 155, character: "薇斯纳", version: "7.1", title: "追缉", hidden: true,
      location: "至冬-地图BOSS(游雪的护刃)", trigger: "经过地图Boss(游雪的护刃)附近概率出现", prerequisite: "", extra: "",
      description: "追逐着通缉犯，薇斯纳一直追到了雪原深处..." },

    { id: 156, character: "薇斯纳", version: "7.1", title: "休息日...?", hidden: true,
      location: "至冬-圣遗物副本（逆悬的冰河）", trigger: "进入圣遗物副本（消耗体力）退出副本后概率出现", prerequisite: "", extra: "",
      description: "正打算休息的薇斯纳，似乎又要因为某事而奔忙起来了..." }
  ]
};
