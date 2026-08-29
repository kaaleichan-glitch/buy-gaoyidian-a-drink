const QUESTIONS = [
  {
    id: 1,
    category: '风味',
    question_text: '第一口是什么味道？',
    sort_order: 1,
    options: [
      { text: '冰冻的桂花混着碎星屑的凉', tags: ['清凉', '花香', '甜', '轻盈', '梦幻'] },
      { text: '被月光晒过的海盐柚子皮', tags: ['咸鲜', '酸', '清爽', '柑橘', '深邃'] },
      { text: '带点苦的银耳煮过头的焦香', tags: ['苦', '焦香', '温润', '醇厚', '木质'] },
      { text: '一种能把舌尖染蓝的野生浆果的野', tags: ['果味', '酸', '神秘', '浓郁', '野生'] }
    ]
  },
  {
    id: 2,
    category: '风味',
    question_text: '这杯酒的回味是什么？',
    sort_order: 2,
    options: [
      { text: '冻干覆盆子酸粉，像粉色静电', tags: ['酸', '果味', '轻盈', '活泼', '甜'] },
      { text: '烘焙过的椰子片碎成雪', tags: ['奶香', '坚果', '温润', '醇厚', '甜'] },
      { text: '海盐与跳跳糖的混合物', tags: ['咸鲜', '气泡', '活泼', '清凉', '惊喜'] },
      { text: '伯爵茶叶碾成的微苦香尘', tags: ['苦', '茶香', '沉稳', '醇厚', '木质'] }
    ]
  },
  {
    id: 3,
    category: '风味',
    question_text: '如果这杯酒有香气，会来自哪里？',
    sort_order: 3,
    options: [
      { text: '接骨木花的冷香与细密酸', tags: ['花香', '酸', '清凉', '梦幻', '轻盈'] },
      { text: '海盐菠萝汁的刺麻', tags: ['咸鲜', '果味', '热带', '活泼', '浓郁'] },
      { text: '现磨黑胡椒的辛辣喷嚏感', tags: ['辛辣', '刺激', '浓郁', '热烈', '香料'] },
      { text: '铁观音的微涩回甘雾气', tags: ['茶香', '苦', '温润', '沉稳', '回甘'] }
    ]
  },
  {
    id: 4,
    category: '风味',
    question_text: '你希望这杯酒的质地如何呈现？',
    sort_order: 4,
    options: [
      { text: '竹席上西瓜汁渗进木缝的锈甜', tags: ['果味', '甜', '清新', '夏日', '轻盈'] },
      { text: '暴雨前空气里压低的尘土与臭氧', tags: ['矿物', '清冷', '深邃', '神秘', '厚重'] },
      { text: '融化的橘子冰棍滴在滚烫水泥地上的蒸汽甜', tags: ['果味', '甜', '柑橘', '活泼', '夏日'] },
      { text: '旧风扇叶片割碎阳光后掉落的机油混着热风', tags: ['厚重', '温润', '复古', '浓郁', '木质'] }
    ]
  },
  {
    id: 5,
    category: '风味',
    question_text: '酒液在口腔里如何行走？',
    sort_order: 5,
    options: [
      { text: '直行，消失在咽喉尽头', tags: ['清爽', '直接', '轻盈', '干净', '利落'] },
      { text: '绕道，在脸颊内侧徘徊', tags: ['酸', '活泼', '果香', '跳跃', '灵动'] },
      { text: '下沉，坠入舌根的深井', tags: ['苦', '厚重', '深沉', '醇厚', '回甘'] },
      { text: '铺开，覆盖上颚的穹顶', tags: ['浓郁', '绵密', '温润', '饱满', '奶香'] }
    ]
  },
  {
    id: 6,
    category: '风味',
    question_text: '如果酒体有呼吸，它的节奏是？',
    sort_order: 6,
    options: [
      { text: '被冰块压住后的浅促喘息', tags: ['清凉', '气泡', '轻盈', '紧张', '活泼'] },
      { text: '加热后缓慢舒张的吐纳', tags: ['温热', '醇厚', '舒缓', '温润', '沉稳'] },
      { text: '摇壶中剧烈翻滚的憋气', tags: ['气泡', '浓烈', '活泼', '力量', '刺激'] },
      { text: '静置时几乎察觉不到的起伏', tags: ['安静', '柔和', '清淡', '优雅', '细腻'] }
    ]
  },
  {
    id: 7,
    category: '风味',
    question_text: '选一种你想撒在今晚云端的粉末',
    sort_order: 7,
    options: [
      { text: '冻硬的蜂蜜脆壳，碎裂时甜瞬间释放', tags: ['甜', '脆', '惊喜', '花香', '轻盈'] },
      { text: '烤过的海苔，薄脆带鲜咸', tags: ['咸鲜', '酥脆', '海洋', '深邃', '独特'] },
      { text: '糖渍姜片，辛辣的纤维迸发', tags: ['辛辣', '甜', '刺激', '热烈', '香料'] },
      { text: '用液氮急冻的芒果酸奶，冷脆成沙', tags: ['果味', '奶香', '清凉', '热带', '甜'] }
    ]
  },
  {
    id: 8,
    category: '风味',
    question_text: '选一种能包裹坏心情的油脂',
    sort_order: 8,
    options: [
      { text: '融化的布朗尼，稠密地糊住上颚', tags: ['巧克力', '甜', '浓郁', '醇厚', '治愈'] },
      { text: '牛油果与酱油的醇厚混着咸鲜', tags: ['咸鲜', '醇厚', '绵密', '独特', '温润'] },
      { text: '温热的咸蛋黄流沙，沙沙绵绵', tags: ['咸鲜', '甜', '绵密', '温润', '浓郁'] },
      { text: '黑芝麻酱的焦苦浓郁', tags: ['苦', '坚果', '浓郁', '醇厚', '深沉'] }
    ]
  },
  {
    id: 9,
    category: '风味',
    question_text: '给"微醺"配一个嗅觉底色',
    sort_order: 9,
    options: [
      { text: '刚掰开的新鲜罗勒叶，青辣带甜', tags: ['草本', '清新', '辛辣', '甜', '活泼'] },
      { text: '被体温捂热的柚子皮油', tags: ['柑橘', '清新', '温润', '酸', '果香'] },
      { text: '雨后柏油路升起的热汽', tags: ['矿物', '湿润', '泥土', '清新', '独特'] },
      { text: '旧书页间藏的一朵干枯茉莉', tags: ['花香', '复古', '温柔', '淡雅', '书卷'] }
    ]
  },
  {
    id: 10,
    category: '时间地点',
    question_text: '这杯酒让房间变大了，还是变小了？',
    sort_order: 10,
    options: [
      { text: '变大了，吧台延伸到看不见的尽头', tags: ['空旷', '深邃', '孤独', '夜晚', '延伸'] },
      { text: '变小了，天花板压到了头顶', tags: ['狭小', '压抑', '亲密', '温暖', '包围'] },
      { text: '没变，但窗户显得更远了', tags: ['疏离', '安静', '距离感', '沉思', '独立'] },
      { text: '变形了，墙壁开始弯曲', tags: ['迷幻', '梦幻', '超现实', '艺术', '流动'] }
    ]
  },
  {
    id: 11,
    category: '时间地点',
    question_text: '喝完这杯酒，时间会变快还是变慢？',
    sort_order: 11,
    options: [
      { text: '变快，像被剪掉了十分钟', tags: ['快', '轻快', '消失', '利落', '活力'] },
      { text: '变慢，像走进了平行时空', tags: ['慢', '永恒', '梦幻', '深邃', '拉长'] },
      { text: '不变，像什么都没发生', tags: ['平静', '淡然', '当下', '自然', '无痕'] },
      { text: '停止，那一晚永远在杯底', tags: ['静止', '永恒', '凝固', '深刻', '记忆'] }
    ]
  },
  {
    id: 12,
    category: '时间地点',
    question_text: '这杯酒送给几岁的高一点？',
    sort_order: 12,
    options: [
      { text: '20岁，还不知道自己要什么', tags: ['年轻', '迷茫', '青涩', '活力', '未知'] },
      { text: '35岁，刚好学会闭嘴', tags: ['成熟', '克制', '沉稳', '独立', '深度'] },
      { text: '50岁，开始欣赏苦味', tags: ['醇厚', '智慧', '沉淀', '苦', '岁月'] },
      { text: '70岁，什么都无所谓了', tags: ['淡然', '自由', '通透', '豁达', '岁月'] }
    ]
  },
  {
    id: 13,
    category: '时间地点',
    question_text: '高一点此刻身在何处？',
    sort_order: 13,
    options: [
      { text: '在另一个时区，正在睡觉', tags: ['远方', '距离', '夜晚', '思念', '安静'] },
      { text: '在同一个房间，但没在喝酒', tags: ['陪伴', '日常', '温暖', '当下', '亲近'] },
      { text: '在记忆里，不在现实中', tags: ['怀旧', '过去', '思念', '深刻', '回忆'] },
      { text: '在将来某一天，还不认识你', tags: ['未来', '期待', '未知', '希望', '遇见'] }
    ]
  },
  {
    id: 14,
    category: '时间地点',
    question_text: '如果喝下它的瞬间被定格为一帧胶片，那是第几帧？',
    sort_order: 14,
    options: [
      { text: '片头字幕升起的最后一帧', tags: ['开始', '期待', '序幕', '希望', '新鲜'] },
      { text: '片尾黑幕落下前的倒数第二帧', tags: ['结束', '告别', '尾声', '沉淀', '不舍'] },
      { text: '中间毫无意义的空镜头', tags: ['当下', '平淡', '真实', '日常', '存在'] },
      { text: '转场时两帧叠化的模糊', tags: ['过渡', '模糊', '变化', '梦幻', '朦胧'] }
    ]
  },
  {
    id: 15,
    category: '时间地点',
    question_text: '这杯酒所在的空间，墙纸是什么图案？',
    sort_order: 15,
    options: [
      { text: '反复出现的金色棕榈叶', tags: ['热带', '奢华', '复古', '热情', '度假'] },
      { text: '褪色的暗红条纹', tags: ['复古', '温暖', '醇厚', '经典', '沉稳'] },
      { text: '没对上的格子错位', tags: ['独特', '艺术', '迷幻', '创意', '不规则'] },
      { text: '被烟渍熏黄的纯色亚麻', tags: ['怀旧', '温暖', '沉稳', '岁月', '质感'] }
    ]
  },
  {
    id: 16,
    category: '时间地点',
    question_text: '你会在周几让高一点喝下这杯酒？',
    sort_order: 16,
    options: [
      { text: '星期四，我接近周五却还够不着', tags: ['期待', '距离', '盼望', '克制', '积累'] },
      { text: '星期六，所有人都已找到归属', tags: ['热闹', '庆祝', '归属', '快乐', '释放'] },
      { text: '星期二，纯粹的、无人打扰的空荡', tags: ['安静', '独处', '纯粹', '独立', '空白'] },
      { text: '星期一，带着周末残留的醉意', tags: ['过渡', '慵懒', '残留', '疲惫', '缓冲'] }
    ]
  },
  {
    id: 17,
    category: '时间地点',
    question_text: '这杯酒应该等待多久才喝？',
    sort_order: 17,
    options: [
      { text: '即刻，趁冰', tags: ['即时', '清凉', '新鲜', '直接', '活力'] },
      { text: '三分钟，等香气散开', tags: ['等待', '释放', '优雅', '层次', '渐入'] },
      { text: '十分钟，等酒体苏醒', tags: ['苏醒', '变化', '深度', '期待', '层次'] },
      { text: '一整夜，等时间沉淀', tags: ['沉淀', '醇厚', '岁月', '深度', '等待'] }
    ]
  },
  {
    id: 18,
    category: '时间地点',
    question_text: '这杯酒在你和高一点关系中的角色是？',
    sort_order: 18,
    options: [
      { text: '她做饭，我调酒，扯平了', tags: ['日常', '平等', '陪伴', '默契', '温暖'] },
      { text: '一个逗号，无需多言', tags: ['沉默', '陪伴', '默契', '温柔', '停顿'] },
      { text: '可能毫无意义，也可能意义不明的一群波浪号', tags: ['模糊', '玩味', '轻松', '不确定', '趣味'] },
      { text: '震撼❗美味👍️', tags: ['直接', '热烈', '直白', '快乐', '表达'] }
    ]
  },
  {
    id: 19,
    category: '时间地点',
    question_text: '喝完这杯酒，高一点会发什么刊？',
    sort_order: 19,
    options: [
      { text: 'NATURE', tags: ['自然', '本质', '深邃', '科学', '本源'] },
      { text: 'SCIENCE', tags: ['理性', '逻辑', '精确', '智慧', '分析'] },
      { text: 'CELL', tags: ['生命', '微观', '活力', '本质', '生长'] },
      { text: '实验室群聊', tags: ['日常', '轻松', '真实', '团队', '趣味'] }
    ]
  },
  {
    id: 20,
    category: '时间地点',
    question_text: '这杯酒适合配什么样的音乐？',
    sort_order: 20,
    options: [
      { text: '在清吧的爵士即兴现场', tags: ['慵懒', '夜晚', '室内', '浪漫', '爵士乐'] },
      { text: '高雅人士聆听古典弦乐四重奏', tags: ['优雅', '古典', '沉静', '室内', '艺术'] },
      { text: '午夜酒吧蹦迪', tags: ['热闹', '活力', '夜晚', '热烈', '跳舞'] },
      { text: '露营时帐篷外的雨声', tags: ['自然', '安静', '户外', '治愈', '雨声'] }
    ]
  },
  {
    id: 21,
    category: '祝酒词',
    question_text: '举杯的瞬间，你有和高一点对视吗？',
    sort_order: 21,
    options: [
      { text: '先看向灯光，再看向她', tags: ['温柔', '含蓄', '浪漫', '仪式', '渐进'] },
      { text: '先看向她，再举杯', tags: ['直接', '真诚', '专注', '勇敢', '对视'] },
      { text: '高高举起，只碰天花板', tags: ['自由', '独立', '奔放', '洒脱', '自我'] },
      { text: '停在半空，各喝各的', tags: ['疏离', '独立', '安静', '各自', '平行'] }
    ]
  },
  {
    id: 22,
    category: '祝酒词',
    question_text: '祝酒词的关键词，应该是哪个？',
    sort_order: 22,
    options: [
      { text: '重逢', tags: ['重逢', '喜悦', '温暖', '缘分', '再次遇见'] },
      { text: '告别', tags: ['告别', '不舍', '成长', '放手', '记忆'] },
      { text: '等待', tags: ['等待', '期待', '坚持', '时间', '耐心'] },
      { text: '开始', tags: ['开始', '希望', '新鲜', '勇气', '未知'] }
    ]
  },
  {
    id: 23,
    category: '祝酒词',
    question_text: '这杯酒应该纪念什么样的时间刻度？',
    sort_order: 23,
    options: [
      { text: '敬下一次，不管还有没有下次', tags: ['期待', '未来', '希望', '不确定', '勇敢'] },
      { text: '敬最后一次，确定再也没有了', tags: ['告别', '结束', '决绝', '记忆', '沉淀'] },
      { text: '敬这次，就是现在', tags: ['当下', '真实', '珍惜', '此刻', '存在'] },
      { text: '敬所有次，包括错过的那些', tags: ['包容', '岁月', '完整', '感恩', '全部'] }
    ]
  },
  {
    id: 24,
    category: '祝酒词',
    question_text: '调完这杯酒，你会对高一点说什么？',
    sort_order: 24,
    options: [
      { text: '敬那些未完成的句子', tags: ['遗憾', '未完', '含蓄', '诗意', '留白'] },
      { text: '敬我们不曾说出口的话', tags: ['沉默', '深度', '默契', '隐藏', '心照不宣'] },
      { text: '敬远方的灯火', tags: ['远方', '希望', '温暖', '距离', '指引'] },
      { text: '敬此刻的沉默', tags: ['沉默', '当下', '安静', '陪伴', '无需多言'] }
    ]
  },
  {
    id: 25,
    category: '祝酒词',
    question_text: '这杯酒在致敬高一点的哪部分？',
    sort_order: 25,
    options: [
      { text: '过去的一年', tags: ['过去', '成长', '纪念', '岁月', '回顾'] },
      { text: '未来的不确定', tags: ['未来', '未知', '期待', '勇气', '探索'] },
      { text: '一段具体的关系', tags: ['关系', '联结', '羁绊', '温暖', '两人'] },
      { text: '某一个瞬间', tags: ['瞬间', '当下', '珍贵', '记忆', '定格'] }
    ]
  },
  {
    id: 26,
    category: '祝酒词',
    question_text: '高一点和你碰杯时，她看向哪里？',
    sort_order: 26,
    options: [
      { text: '你的眼睛', tags: ['真诚', '对视', '专注', '连接', '勇敢'] },
      { text: '杯中的液体', tags: ['沉思', '内敛', '温柔', '害羞', '深度'] },
      { text: '窗外的远方', tags: ['远方', '思念', '自由', '独立', '向往'] },
      { text: '在表演的乐队', tags: ['热闹', '轻松', '当下', '享受', '环境'] }
    ]
  },
  {
    id: 27,
    category: '祝酒词',
    question_text: '这杯酒应该先敬谁？',
    sort_order: 27,
    options: [
      { text: '活着的人', tags: ['当下', '珍惜', '感恩', '生命', '陪伴'] },
      { text: '不在这里的人', tags: ['思念', '远方', '告别', '记忆', '遗憾'] },
      { text: '还未遇见的人', tags: ['未来', '期待', '希望', '缘分', '未知'] },
      { text: '曾经的自己', tags: ['成长', '告别', '接纳', '回顾', '和解'] }
    ]
  },
  {
    id: 28,
    category: '祝酒词',
    question_text: '来点祝酒的仪式感',
    sort_order: 28,
    options: [
      { text: '轻敲桌面三下', tags: ['克制', '含蓄', '温柔', '低调', '默契'] },
      { text: '举杯示意不碰杯', tags: ['独立', '尊重', '优雅', '距离', '礼貌'] },
      { text: '碰杯后凝视三秒', tags: ['浪漫', '专注', '连接', '深情', '仪式'] },
      { text: '一饮而尽后翻转杯口', tags: ['豪爽', '直接', '热烈', '彻底', '力量'] }
    ]
  },
  {
    id: 29,
    category: '祝酒词',
    question_text: '这杯酒敬的是过去还是未来？',
    sort_order: 29,
    options: [
      { text: '过去', tags: ['过去', '怀旧', '记忆', '沉淀', '岁月'] },
      { text: '未来', tags: ['未来', '希望', '期待', '勇气', '未知'] },
      { text: '现在', tags: ['当下', '真实', '珍惜', '此刻', '存在'] },
      { text: '永恒', tags: ['永恒', '超越', '深邃', '哲思', '时间'] }
    ]
  },
  {
    id: 30,
    category: '祝酒词',
    question_text: '这杯酒为谁而喝？',
    sort_order: 30,
    options: [
      { text: '高一点', tags: ['她', '专注', '敬意', '专属', '为她'] },
      { text: '你们', tags: ['两人', '关系', '羁绊', '共同', '一起'] },
      { text: '你', tags: ['自我', '独立', '关照', '自爱', '自己'] },
      { text: 'Ta', tags: ['未知', '神秘', '第三人称', '想象', '远方'] }
    ]
  }
];

const DRINK_RECIPES = [
  {
    id: 1,
    drink_name: 'Pingu的海边假期',
    english_name: "PINGU'S BEACH VACATION",
    drink_type: 'Gin Cocktail',
    image: '',
    alcohol: 12,
    story: '企鹅离开冰原，第一次喝到夏天的味道。',
    flavor_tags: ['咸鲜', '酸', '清凉', '深邃', '清爽'],
    time_tags: ['夜晚', '深邃', '孤独', '静止', '远方'],
    toast_tags: ['沉默', '深度', '远方', '告别', '记忆'],
    conflict_tags: ['甜', '奶香', '热闹', '年轻', '活泼'],
    ingredients: [
      { emoji: '🌊', name: '海盐', meaning: '带来一点海风般的清醒' },
      { emoji: '🍋', name: '柠檬', meaning: '制造跳跃感，像突然冒出的鬼点子' },
      { emoji: '🌙', name: '月光', meaning: '留下柔软的余温' }
    ]
  },
  {
    id: 2,
    drink_name: '清醒素-001',
    english_name: 'SOBER ELEMENT-001',
    drink_type: 'Vodka Cocktail',
    image: '',
    alcohol: 15,
    story: '昨天熬夜做实验，今天依旧准时出现。',
    flavor_tags: ['清凉', '清新', '草本', '轻盈', '干净'],
    time_tags: ['清晨', '自由', '户外', '活力', '希望'],
    toast_tags: ['开始', '希望', '新鲜', '独立', '当下'],
    conflict_tags: ['醇厚', '苦', '夜晚', '厚重', '浓郁'],
    ingredients: [
      { emoji: '🌿', name: '薄荷', meaning: '带来清醒感，像凌晨打开培养箱的冷空气' },
      { emoji: '🥒', name: '黄瓜', meaning: '铺开清新，像实验数据里突然出现的新发现' },
      { emoji: '🏔️', name: '山泉', meaning: '留下干净回甘，像重新回到工作台前' }
    ]
  },
  {
    id: 3,
    drink_name: '人生发酵液',
    english_name: 'LIFE FERMENTATION',
    drink_type: 'Whisky Cocktail',
    image: '',
    alcohol: 22,
    story: '把经历过的一切慢慢发酵，最后酿成自己的味道。',
    flavor_tags: ['甜', '温润', '烟熏', '醇厚', '果香'],
    time_tags: ['黄昏', '温暖', '怀旧', '慢', '记忆'],
    toast_tags: ['告别', '遗憾', '记忆', '温柔', '过去'],
    conflict_tags: ['清凉', '辛辣', '热闹', '轻盈', '年轻'],
    ingredients: [
      { emoji: '🍯', name: '蜂蜜', meaning: '像保存多年的一句话，终于有人拆开' },
      { emoji: '🍊', name: '橙子', meaning: '带来一点明亮，像翻到旧照片背面的日期' },
      { emoji: '📜', name: '烟熏', meaning: '慢慢散去，只留下时间发酵后的温度' }
    ]
  },
  {
    id: 4,
    drink_name: '安可之后',
    english_name: 'AFTER ENCORE',
    drink_type: 'Tequila Cocktail',
    image: '',
    alcohol: 24,
    story: '人群散去，但身体还记得节奏。',
    flavor_tags: ['梦幻', '果香', '辛辣', '活泼', '惊喜'],
    time_tags: ['夜晚', '迷幻', '自由', '活力', '流动'],
    toast_tags: ['开始', '未来', '未知', '勇气', '探索'],
    conflict_tags: ['沉稳', '安静', '醇厚', '苦', '平淡'],
    ingredients: [
      { emoji: '✨', name: '星尘', meaning: '像灯牌亮起，全场同时进入副歌' },
      { emoji: '🍊', name: '西柚', meaning: '炸开酸甜感，舞台突然换了一套造型' },
      { emoji: '🌶️', name: '辣椒', meaning: '留下热度，提醒你散场不是结束' }
    ]
  },
  {
    id: 5,
    drink_name: '黄梅天',
    english_name: 'PLUM RAIN SEASON',
    drink_type: 'Sake Cocktail',
    image: '',
    alcohol: 10,
    story: '雨还没有停，但院子里的花已经开了。',
    flavor_tags: ['花香', '清新', '温润', '淡雅', '草本'],
    time_tags: ['安静', '当下', '陪伴', '慢', '治愈'],
    toast_tags: ['当下', '沉默', '陪伴', '温柔', '日常'],
    conflict_tags: ['辛辣', '浓郁', '热闹', '强烈', '刺激'],
    ingredients: [
      { emoji: '🌸', name: '樱花', meaning: '像雨里突然出现的一点粉色' },
      { emoji: '🎋', name: '竹叶', meaning: '带来巷子里的清凉，像骑车穿过放学路' },
      { emoji: '💧', name: '雨露', meaning: '留下湿润的回忆，像回到小时候的院子' }
    ]
  },
  {
    id: 6,
    drink_name: '论文终稿提交前',
    english_name: 'BEFORE FINAL SUBMISSION',
    drink_type: 'Rum Cocktail',
    image: '',
    alcohol: 20,
    story: '不是最好的一版，是终于完成的一版。',
    flavor_tags: ['辛辣', '甜', '浓郁', '热带', '热烈'],
    time_tags: ['热闹', '活力', '庆祝', '快', '夏日'],
    toast_tags: ['热烈', '当下', '庆祝', '勇敢', '全部'],
    conflict_tags: ['清淡', '安静', '清凉', '克制', '平和'],
    ingredients: [
      { emoji: '🔥', name: '肉桂', meaning: '是熬夜后的倔强' },
      { emoji: '🍍', name: '菠萝', meaning: '给到突然出现的灵感' },
      { emoji: '📖', name: '诗篇', meaning: '落下，终于不用再修改' }
    ]
  },
  {
    id: 7,
    drink_name: '顶刊一作',
    english_name: 'TOP JOURNAL FIRST AUTHOR',
    drink_type: 'Old Fashioned',
    image: '',
    alcohol: 28,
    story: '今天读别人的论文，未来写自己的名字。',
    flavor_tags: ['苦', '醇厚', '木质', '深邃', '回甘'],
    time_tags: ['安静', '深度', '夜晚', '慢', '书卷'],
    toast_tags: ['深度', '沉默', '过去', '岁月', '记忆'],
    conflict_tags: ['甜', '奶香', '热闹', '年轻', '轻盈'],
    ingredients: [
      { emoji: '📚', name: '古书', meaning: '翻过无数页的积累，藏着前人留下的线索' },
      { emoji: '🍷', name: '雪莉', meaning: '时间慢慢沉淀出的成熟，越久越有层次' },
      { emoji: '🍊', name: '橙皮', meaning: '突然跳出的灵感火花，让平静里出现新的方向' }
    ]
  },
  {
    id: 8,
    drink_name: '云朵培养皿',
    english_name: 'CLOUD PETRI DISH',
    drink_type: 'Sweet Cocktail',
    image: '',
    alcohol: 8,
    story: '经过48小时观察，该云朵样本无攻击性，主要表现为可爱过量。',
    flavor_tags: ['甜', '奶香', '绵密', '轻盈', '治愈'],
    time_tags: ['年轻', '治愈', '梦幻', '活力', '白日'],
    toast_tags: ['希望', '开始', '温柔', '治愈', '未来'],
    conflict_tags: ['辛辣', '苦', '深邃', '夜晚', '厚重'],
    ingredients: [
      { emoji: '🍓', name: '草莓', meaning: '酸酸甜甜，像一只偷偷跑出来的小生命' },
      { emoji: '🍦', name: '奶油', meaning: '流淌铺开，给快乐盖了一层软软培养基' },
      { emoji: '☁️', name: '云朵', meaning: '继续飘荡，留下一个需要继续观察的好心情' }
    ]
  },
  {
    id: 9,
    drink_name: '彩虹极光',
    english_name: 'RAINBOW AURORA',
    drink_type: 'Vodka Cocktail',
    image: '',
    alcohol: 18,
    story: '在没有边界的天空里，所有颜色都有机会出现。',
    flavor_tags: ['酸', '清凉', '梦幻', '神秘', '清爽'],
    time_tags: ['夜晚', '迷幻', '远方', '独立', '寒冷'],
    toast_tags: ['未知', '远方', '神秘', '未来', '期待'],
    conflict_tags: ['甜', '醇厚', '热闹', '温暖', '日常'],
    ingredients: [
      { emoji: '🌌', name: '极光', meaning: '落下瞬间置身严寒冷空气' },
      { emoji: '🍋', name: '柠檬', meaning: '炸开时像天空突然加载出新颜色' },
      { emoji: '❄️', name: '冰雪', meaning: '流动的是还没结束的幻想' }
    ]
  },
  {
    id: 10,
    drink_name: '今天遛猫不遛狗',
    english_name: 'CAT WALK TODAY',
    drink_type: 'Cider Cocktail',
    image: '',
    alcohol: 9,
    story: '有些幸福不是大事，只是回家时有猫猫狗狗等你开门。',
    flavor_tags: ['果味', '甜', '气泡', '清新', '活泼'],
    time_tags: ['夏日', '活力', '户外', '年轻', '热闹'],
    toast_tags: ['当下', '快乐', '希望', '活力', '开始'],
    conflict_tags: ['苦', '醇厚', '夜晚', '安静', '深沉'],
    ingredients: [
      { emoji: '🍎', name: '苹果', meaning: '清甜爽脆，像骑车路上突然吹来的夏风' },
      { emoji: '🫧', name: '气泡', meaning: '蹦蹦跳跳，是猫狗一起冲出门的混乱现场' },
      { emoji: '🌿', name: '薄荷', meaning: '留下遛完宠物后的轻松傍晚' }
    ]
  },
  {
    id: 11,
    drink_name: '高雅人士',
    english_name: 'ELEGANT PERSON',
    drink_type: 'Coffee Cocktail',
    image: '',
    alcohol: 16,
    story: '穿上西装的企鹅，决定优雅地喝完这一杯。',
    flavor_tags: ['苦', '醇厚', '咖啡', '沉稳', '回甘'],
    time_tags: ['安静', '深度', '书卷', '慢', '室内'],
    toast_tags: ['岁月', '沉淀', '深度', '过去', '当下'],
    conflict_tags: ['甜', '辛辣', '热闹', '年轻', '轻盈'],
    ingredients: [
      { emoji: '☕', name: '冷萃', meaning: '端起杯子宣布自己很成熟' },
      { emoji: '🍫', name: '可可', meaning: '一本正经地讲一个冷笑话' },
      { emoji: '📖', name: '香草', meaning: '衬托出了滑稽的做作' }
    ]
  },
  {
    id: 12,
    drink_name: '泡菜之后',
    english_name: 'AFTER KIMCHI',
    drink_type: 'Chinese Wine',
    image: '',
    alcohol: 14,
    story: '有些味道不是学会的，是从家里的厨房长出来的。',
    flavor_tags: ['甜', '花香', '温润', '淡雅', '果香'],
    time_tags: ['春日', '温柔', '浪漫', '慢', '东方'],
    toast_tags: ['温柔', '浪漫', '开始', '希望', '两人'],
    conflict_tags: ['辛辣', '苦', '浓烈', '夜晚', '厚重'],
    ingredients: [
      { emoji: '🌸', name: '桃花', meaning: '浮起成都春天吹来的第一阵风' },
      { emoji: '🍯', name: '蜂蜜', meaning: '铺开厨房里刚揭开的甜香' },
      { emoji: '🍶', name: '米酒', meaning: '醪糟回甜，是妈妈酿的味道' }
    ]
  },
  {
    id: 13,
    drink_name: '远程办公申请书',
    english_name: 'WFH APPLICATION',
    drink_type: 'Gin Cocktail',
    image: '',
    alcohol: 17,
    story: '世界都变成了她的办公室。',
    flavor_tags: ['咸鲜', '深邃', '甘甜', '清爽', '海洋'],
    time_tags: ['深邃', '沉默', '远方', '夜晚', '深度'],
    toast_tags: ['沉默', '深度', '思念', '远方', '记忆'],
    conflict_tags: ['甜', '奶香', '热闹', '辛辣', '轻盈'],
    ingredients: [
      { emoji: '🐋', name: '蓝鲸', meaning: '游过时带来一封远方的信' },
      { emoji: '🧂', name: '海盐', meaning: '是自由吹来的第一阵风留下的' },
      { emoji: '💌', name: '信笺', meaning: '写着"今天不用打卡"' }
    ]
  },
  {
    id: 14,
    drink_name: '快乐没有截止日期',
    english_name: 'HAPPY NEVER EXPIRES',
    drink_type: 'Candy Cocktail',
    image: '',
    alcohol: 13,
    story: "LET'S拒绝长大，丢掉快乐达咩。",
    flavor_tags: ['甜', '梦幻', '活泼', '惊喜', '果香'],
    time_tags: ['夜晚', '梦幻', '热闹', '年轻', '欢乐'],
    toast_tags: ['希望', '快乐', '童真', '开始', '未来'],
    conflict_tags: ['苦', '辛辣', '深邃', '沉稳', '安静'],
    ingredients: [
      { emoji: '🎠', name: '旋转木马', meaning: '偷偷落下，给生活加了一层滤镜' },
      { emoji: '🍬', name: '棉花糖', meaning: '彩灯亮起，普通晚上突然变成舞台' },
      { emoji: '🎪', name: '彩色灯', meaning: '旋转木马最后一圈旋转，还想再玩一次' }
    ]
  },
  {
    id: 15,
    drink_name: '小鼠冷静一下',
    english_name: 'MOUSE CALM DOWN',
    drink_type: 'Vodka Cocktail',
    image: '',
    alcohol: 13,
    story: '小鼠决定先不拯救世界，坐下来重新计算今天的实验变量。',
    flavor_tags: ['清凉', '酸', '纯净', '清爽', '干净'],
    time_tags: ['清晨', '独立', '户外', '寒冷', '清醒'],
    toast_tags: ['独立', '真诚', '当下', '清醒', '自我'],
    conflict_tags: ['甜', '醇厚', '热闹', '浓郁', '温暖'],
    ingredients: [
      { emoji: '🏔️', name: '雪山', meaning: '酸的那一下，像实验数据突然对上' },
      { emoji: '🍋', name: '柠檬', meaning: '慢慢展开，给大脑降温' },
      { emoji: '💎', name: '冰晶', meaning: '回甘，留下冷静的判断' }
    ]
  },
  {
    id: 16,
    drink_name: '今日心率偏高',
    english_name: 'HEART RATE UP TODAY',
    drink_type: 'Whisky Cocktail',
    image: '',
    alcohol: 23,
    story: '白天训练身体，晚上奖励灵魂。',
    flavor_tags: ['醇厚', '烟熏', '甜', '深邃', '木质'],
    time_tags: ['夜晚', '慵懒', '室内', '慢', '音乐'],
    toast_tags: ['浪漫', '当下', '默契', '温柔', '两人'],
    conflict_tags: ['清凉', '辛辣', '年轻', '轻盈', '热闹'],
    ingredients: [
      { emoji: '🎷', name: '萨克斯', meaning: '升温象征着摘下拳套后的掌心余热' },
      { emoji: '🥃', name: '波本', meaning: '奏响开始跟着节拍移动的脚步' },
      { emoji: '🍒', name: '樱桃', meaning: '落下时像赢回自己的小奖励' }
    ]
  },
  {
    id: 17,
    drink_name: '电瓶车漫游指南',
    english_name: 'E-SCOOTER GUIDE',
    drink_type: 'Sparkling Wine',
    image: '',
    alcohol: 10,
    story: '生活模式已开启，今天的目标是闲逛。',
    flavor_tags: ['甜', '花香', '气泡', '清新', '果香'],
    time_tags: ['春日', '户外', '活力', '温柔', '白日'],
    toast_tags: ['希望', '开始', '美好', '当下', '两人'],
    conflict_tags: ['苦', '辛辣', '深邃', '夜晚', '厚重'],
    ingredients: [
      { emoji: '🧺', name: '野餐篮', meaning: '是骑车路上临时决定买的' },
      { emoji: '🍑', name: '蜜桃', meaning: '陪伴了在公园坐一下午时光' },
      { emoji: '🫧', name: '气泡', meaning: '野餐篮旁边有永不离开的小狗' }
    ]
  },
  {
    id: 18,
    drink_name: '我是什么很贱的人吗',
    english_name: 'AM I A JOKE TO YOU',
    drink_type: 'Chocolate Cocktail',
    image: '',
    alcohol: 12,
    story: '人类最复杂的配方之一，就是一边说"烦死了"，一边偷偷把世界照顾得很好。',
    flavor_tags: ['巧克力', '苦', '甜', '醇厚', '酸'],
    time_tags: ['夜晚', '温暖', '深度', '室内', '慢'],
    toast_tags: ['深度', '陪伴', '温暖', '记忆', '两人'],
    conflict_tags: ['清凉', '轻盈', '辛辣', '热闹', '年轻'],
    ingredients: [
      { emoji: '🍫', name: '黑巧', meaning: '苦中带着回甘，是说出口前，先在脑子里排练三遍的话' },
      { emoji: '🍒', name: '樱桃', meaning: '是忍不住突然发出的那句吐槽' },
      { emoji: '🏠', name: '木屋', meaning: '适合坐下来怀疑人生' }
    ]
  },
  {
    id: 19,
    drink_name: '云语十级',
    english_name: 'CLOUD LANGUAGE LEVEL 10',
    drink_type: 'Tea Cocktail',
    image: '',
    alcohol: 10,
    story: '这杯酒拒绝一切不合理要求，但拒绝的方式非常有礼貌。',
    flavor_tags: ['茶香', '清新', '温润', '淡雅', '甜'],
    time_tags: ['安静', '当下', '自然', '慢', '治愈'],
    toast_tags: ['平静', '当下', '淡然', '治愈', '自我'],
    conflict_tags: ['辛辣', '浓郁', '热闹', '强烈', '刺激'],
    ingredients: [
      { emoji: '🎋', name: '竹林', meaning: '清响，像一句拖长尾音的"不——可——以"' },
      { emoji: '🍵', name: '绿茶', meaning: '香展开，把普通一句话变成三分钟情绪剧' },
      { emoji: '🌧️', name: '雨声', meaning: '让世界暂时安静，但吐槽还没结束' }
    ]
  },
  {
    id: 20,
    drink_name: '未来许愿池',
    english_name: 'FUTURE WISHING WELL',
    drink_type: 'Sparkling Cocktail',
    image: '',
    alcohol: 15,
    story: '今天埋下的愿望，会在将来某天收到回复邮件。',
    flavor_tags: ['果香', '气泡', '甜', '明亮', '清爽'],
    time_tags: ['夜晚', '活力', '耀眼', '快', '庆祝'],
    toast_tags: ['庆祝', '希望', '未来', '勇气', '耀眼'],
    conflict_tags: ['苦', '安静', '醇厚', '深沉', '平淡'],
    ingredients: [
      { emoji: '☄️', name: '彗星', meaning: '偷偷提交一份遥远的愿望' },
      { emoji: '✨', name: '金箔', meaning: '闪耀着某天突然收到好消息' },
      { emoji: '🫧', name: '气泡', meaning: '升起时看期待在前往更远的地方' }
    ]
  },
  {
    id: 21,
    drink_name: '下一场见',
    english_name: 'SEE YOU NEXT SHOW',
    drink_type: 'Rum Cocktail',
    image: '',
    alcohol: 18,
    story: '不要只是喜欢。要去追逐，要去看见。',
    flavor_tags: ['甜', '醇厚', '焦糖', '苦', '温润'],
    time_tags: ['怀旧', '慢', '温暖', '岁月', '夜晚'],
    toast_tags: ['过去', '记忆', '岁月', '告别', '沉淀'],
    conflict_tags: ['清凉', '辛辣', '年轻', '轻盈', '新鲜'],
    ingredients: [
      { emoji: '💿', name: '黑胶', meaning: '转动，熟悉旋律重新上线' },
      { emoji: '🍮', name: '焦糖', meaning: '融化，是等待抢票成功的甜' },
      { emoji: '🎵', name: '音符', meaning: '散开，奔赴现场的期待还在' }
    ]
  },
  {
    id: 22,
    drink_name: '老黄历',
    english_name: 'OLD ALMANAC',
    drink_type: 'Tea Cocktail',
    image: '',
    alcohol: 10,
    story: '今日宜放过自己，忌强行营业。',
    flavor_tags: ['花香', '茶香', '清新', '淡雅', '甜'],
    time_tags: ['安静', '白日', '温柔', '慢', '自然'],
    toast_tags: ['温柔', '当下', '安静', '陪伴', '淡然'],
    conflict_tags: ['辛辣', '浓郁', '热闹', '强烈', '刺激'],
    ingredients: [
      { emoji: '🌼', name: '茉莉', meaning: '飘开，宣布今天先不努力' },
      { emoji: '🍵', name: '清茶', meaning: '慢慢展开，脑子终于停止转圈' },
      { emoji: '🍐', name: '雪梨', meaning: '的甜味留下，允许自己休息一下' }
    ]
  },
  {
    id: 23,
    drink_name: '夜生活加载中',
    english_name: 'NIGHT LIFE LOADING',
    drink_type: 'Vodka Cocktail',
    image: '',
    alcohol: 21,
    story: '今晚唯一的研究课题：人类快乐产生机制观察。',
    flavor_tags: ['酸', '气泡', '清凉', '炫彩', '果味'],
    time_tags: ['夜晚', '热闹', '活力', '快', '都市'],
    toast_tags: ['当下', '快乐', '热闹', '庆祝', '自由'],
    conflict_tags: ['苦', '安静', '醇厚', '深沉', '清晨'],
    ingredients: [
      { emoji: '🌃', name: '霓虹', meaning: '亮起第一束灯光，城市开始苏醒' },
      { emoji: '🍋', name: '柠檬', meaning: '不断上升，像音乐响起后的心跳' },
      { emoji: '🫧', name: '气泡', meaning: '慢慢散开，留下今晚的快乐存档' }
    ]
  },
  {
    id: 24,
    drink_name: '山野同行',
    english_name: 'MOUNTAIN COMPANION',
    drink_type: 'Sake Cocktail',
    image: '',
    alcohol: 14,
    story: '世界是一张开放地图。每一次转弯，都可能加载出新的风景。',
    flavor_tags: ['酸', '清凉', '清新', '轻盈', '干净'],
    time_tags: ['白日', '户外', '活力', '自然', '年轻'],
    toast_tags: ['快乐', '当下', '自由', '简单', '希望'],
    conflict_tags: ['苦', '醇厚', '深邃', '夜晚', '厚重'],
    ingredients: [
      { emoji: '💧', name: '溪水', meaning: '穿过石头，像爬山路上的第一口清风' },
      { emoji: '🫐', name: '梅子', meaning: '酸酸甜甜，是走累后突然发现的小惊喜' },
      { emoji: '🐟', name: '小鱼', meaning: '游过水面，留下一起出发的记忆' }
    ]
  },
  {
    id: 25,
    drink_name: '人生样本观察报告',
    english_name: 'LIFE SAMPLE REPORT',
    drink_type: 'Red Wine',
    image: '',
    alcohol: 26,
    story: '经过多年培养，该样本已经适应复杂环境，并发展出独特风味。',
    flavor_tags: ['醇厚', '涩', '深邃', '果香', '木质'],
    time_tags: ['夜晚', '深度', '岁月', '慢', '室内'],
    toast_tags: ['岁月', '沉淀', '深度', '过去', '永恒'],
    conflict_tags: ['甜', '奶香', '年轻', '轻盈', '热闹'],
    ingredients: [
      { emoji: '🏰', name: '古堡', meaning: '开启记录第一条人生数据' },
      { emoji: '🍷', name: '红酒', meaning: '沉淀多年实验记录' },
      { emoji: '🪵', name: '橡木', meaning: '沉静得只剩自己的回声' }
    ]
  },
  {
    id: 26,
    drink_name: '猫狗双全认证',
    english_name: 'CAT & DOG CERTIFIED',
    drink_type: 'Sweet Cocktail',
    image: '',
    alcohol: 8,
    story: '✅ 高一点满意\n✅ 高爸满意\n✅ 老王满意\n✅ 豆豆满意\n✅ 薯条满意\n✅ 没礼貌满意\n✅ 西瓜满意\n✅ 养过的猫狗都满意\n✅ 家庭幸福指数超标\n✅ 认证通过',
    flavor_tags: ['甜', '奶香', '绵密', '果香', '温柔'],
    time_tags: ['年轻', '白日', '甜蜜', '活力', '可爱'],
    toast_tags: ['甜蜜', '开始', '希望', '温柔', '两人'],
    conflict_tags: ['辛辣', '苦', '深邃', '夜晚', '厚重'],
    ingredients: [
      { emoji: '🍓', name: '草莓', meaning: '跳进杯里，像刚回家的小狗扑过来' },
      { emoji: '🥛', name: '奶昔', meaning: '慢慢展开，装满猫咪晒太阳的下午' },
      { emoji: '🍬', name: '糖霜', meaning: '落下，盖上一层毛茸茸的幸福' }
    ]
  },
  {
    id: 27,
    drink_name: '自由职业预告片',
    english_name: 'FREELANCE TRAILER',
    drink_type: 'Tequila Cocktail',
    image: '',
    alcohol: 20,
    story: '主演：未来的自己。',
    flavor_tags: ['酸', '咸鲜', '浓烈', '热带', '果味'],
    time_tags: ['黄昏', '热烈', '户外', '自由', '海边'],
    toast_tags: ['告别', '勇气', '自由', '当下', '热烈'],
    conflict_tags: ['甜', '奶香', '安静', '深沉', '清淡'],
    ingredients: [
      { emoji: '🌅', name: '日落', meaning: '吹来第一阵自由的风，像终于不用赶时间' },
      { emoji: '🥃', name: '龙舌兰', meaning: '升起热烈感，像开始写自己的生活剧本' },
      { emoji: '🧂', name: '海盐', meaning: '慢慢沉下去，留下下一站的想象' }
    ]
  },
  {
    id: 28,
    drink_name: '今天也要活着上班',
    english_name: 'SURVIVE WORK TODAY',
    drink_type: 'Coffee Cocktail',
    image: '',
    alcohol: 12,
    story: '成年人的魔法，是在困倦里准时启动。',
    flavor_tags: ['苦', '醇厚', '咖啡', '奶香', '甜'],
    time_tags: ['清晨', '清醒', '效率', '室内', '日常'],
    toast_tags: ['清醒', '当下', '开始', '独立', '理性'],
    conflict_tags: ['甜腻', '梦幻', '混乱', '夜晚', '慵懒'],
    ingredients: [
      { emoji: '☕', name: '浓缩', meaning: '叫醒身体，提醒今天也别迟到' },
      { emoji: '🥛', name: '牛奶', meaning: '揉碎苦味，给打工魂加一点缓冲' },
      { emoji: '🍮', name: '焦糖', meaning: '留下甜味，奖励准时出现的自己' }
    ]
  },
  {
    id: 29,
    drink_name: '镜花水月',
    english_name: 'MIRROR FLOWER',
    drink_type: 'Sake Cocktail',
    image: '',
    alcohol: 18,
    story: '她一直以为自己只是水里的倒影，直到有人告诉她，月亮本来就存在。',
    flavor_tags: ['花香', '甜', '淡雅', '梦幻', '果香'],
    time_tags: ['梦幻', '夜晚', '温柔', '艺术', '朦胧'],
    toast_tags: ['浪漫', '朦胧', '美', '两人', '诗意'],
    conflict_tags: ['辛辣', '苦', '热闹', '厚重', '现实'],
    ingredients: [
      { emoji: '🪞', name: '镜子', meaning: '映出一个不敢确认那是自己的倒影' },
      { emoji: '🌸', name: '樱花', meaning: '落进水里，像那些被错过的喜欢' },
      { emoji: '🌙', name: '月影', meaning: '只剩一句：真的有人会留下吗' }
    ]
  },
  {
    id: 30,
    drink_name: '这把胡了',
    english_name: 'THIS HAND WINS',
    drink_type: 'Rum Cocktail',
    image: '',
    alcohol: 22,
    story: '没人知道下一张牌是什么。\n如果真的胡了，那就举杯庆祝。\n如果没胡，那就继续洗牌。',
    flavor_tags: ['甜', '浓郁', '热带', '烈', '果香'],
    time_tags: ['热带', '活力', '户外', '快', '夏日'],
    toast_tags: ['热烈', '当下', '冒险', '自由', '全部'],
    conflict_tags: ['清淡', '安静', '清凉', '克制', '深沉'],
    ingredients: [
      { emoji: '🌴', name: '椰树', meaning: '甜得嚣张，像摸牌前已经开始庆祝' },
      { emoji: '🥭', name: '芒果', meaning: '慢慢展开，成都夏夜的风吹进牌桌' },
      { emoji: '⛈️', name: '风暴', meaning: '突然落下，最后一张牌终于翻开' }
    ]
  },
  {
    id: 31,
    drink_name: 'Master Pingu',
    english_name: 'MASTER PINGU',
    drink_type: 'Chinese Tea',
    image: '',
    alcohol: 16,
    story: '如何成为一只优秀企鹅：聪明严肃可爱，还有论文之外。',
    flavor_tags: ['茶香', '花香', '清新', '淡雅', '甜'],
    time_tags: ['安静', '书卷', '白日', '慢', '东方'],
    toast_tags: ['智慧', '岁月', '沉淀', '优雅', '当下'],
    conflict_tags: ['辛辣', '浓郁', '热闹', '强烈', '刺激'],
    ingredients: [
      { emoji: '📚', name: '诗书', meaning: '第一页其实是实验记录本，写着今天的发现' },
      { emoji: '🍵', name: '龙井', meaning: '带来舒展的清醒，适合面对一整天的数据' },
      { emoji: '🌼', name: '桂花', meaning: '留下温柔气息，提醒自己别忘了生活' }
    ]
  },
  {
    id: 32,
    drink_name: '没有标准答案',
    english_name: 'NO STANDARD ANSWER',
    drink_type: 'Gin Cocktail',
    image: '',
    alcohol: 25,
    story: '这个世界没有规定每个人应该跳什么舞。',
    flavor_tags: ['花香', '酸', '梦幻', '神秘', '轻盈'],
    time_tags: ['夜晚', '迷幻', '自由', '寒冷', '流动'],
    toast_tags: ['自由', '告别', '美', '记忆', '遇见'],
    conflict_tags: ['甜腻', '醇厚', '安静', '深沉', '安稳'],
    ingredients: [
      { emoji: '🌌', name: '极光', meaning: '落下时，身体先于语言开始表达' },
      { emoji: '💃', name: '舞裙', meaning: '旋转着把所有颜色甩进夜空' },
      { emoji: '🌙', name: '月光', meaning: '是一道属于自己的轨迹' }
    ]
  }
];

const DRINK_ANIMATIONS = {
  1: {
    glass: 'cocktail',
    liquidColor: 'linear-gradient(180deg, #1a3a5c 0%, #0d2137 100%)',
    pencilLayers: [
      { color: '#1a3a5c', height: 80, delay: 0, emoji: '🌊', name: '海盐' },
      { color: '#ffd700', height: 160, delay: 600, emoji: '🍋', name: '柠檬' },
      { color: '#e6e6fa', height: 240, delay: 1200, emoji: '🌙', name: '月光' }
    ],
    ingredients: []
  },
  2: {
    glass: 'collins',
    liquidColor: 'linear-gradient(180deg, #a8d5ba 0%, #6b9e7e 100%)',
    pencilLayers: [
      { color: '#98fb98', height: 80, delay: 0, emoji: '🌿', name: '薄荷' },
      { color: '#90ee90', height: 160, delay: 600, emoji: '🥒', name: '黄瓜' },
      { color: '#b0e0e6', height: 240, delay: 1200, emoji: '🏔️', name: '山泉' }
    ],
    ingredients: []
  },
  3: {
    glass: 'rocks',
    liquidColor: 'linear-gradient(180deg, #d4a574 0%, #8b6914 100%)',
    pencilLayers: [
      { color: '#daa520', height: 80, delay: 0, emoji: '🍯', name: '蜂蜜' },
      { color: '#ffa500', height: 160, delay: 600, emoji: '🍊', name: '橙子' },
      { color: '#8b4513', height: 240, delay: 1200, emoji: '📜', name: '烟熏' }
    ],
    ingredients: []
  },
  4: {
    glass: 'margarita',
    liquidColor: 'linear-gradient(180deg, #e0a0ff 0%, #9932cc 100%)',
    pencilLayers: [
      { color: '#e6e6fa', height: 80, delay: 0, emoji: '✨', name: '星尘' },
      { color: '#ff7f50', height: 160, delay: 600, emoji: '🍊', name: '西柚' },
      { color: '#dc143c', height: 240, delay: 1200, emoji: '🌶️', name: '辣椒' }
    ],
    ingredients: []
  },
  5: {
    glass: 'sake',
    liquidColor: 'linear-gradient(180deg, #ffc0cb 0%, #ffb6c1 100%)',
    pencilLayers: [
      { color: '#ffb7c5', height: 80, delay: 0, emoji: '🌸', name: '樱花' },
      { color: '#7ccd7c', height: 160, delay: 600, emoji: '🎋', name: '竹叶' },
      { color: '#87ceeb', height: 240, delay: 1200, emoji: '💧', name: '雨露' }
    ],
    ingredients: []
  },
  6: {
    glass: 'tiki',
    liquidColor: 'linear-gradient(180deg, #ff6347 0%, #ff4500 100%)',
    pencilLayers: [
      { color: '#ffd700', height: 80, delay: 0, emoji: '🍍', name: '菠萝' },
      { color: '#ff6347', height: 160, delay: 600, emoji: '🔥', name: '肉桂' },
      { color: '#8b0000', height: 240, delay: 1200, emoji: '📖', name: '诗篇' }
    ],
    ingredients: []
  },
  7: {
    glass: 'old_fashioned',
    liquidColor: 'linear-gradient(180deg, #b8860b 0%, #8b6914 100%)',
    pencilLayers: [
      { color: '#5d4037', height: 80, delay: 0, emoji: '📚', name: '古书' },
      { color: '#8b0000', height: 160, delay: 600, emoji: '🍷', name: '雪莉' },
      { color: '#ff8c00', height: 240, delay: 1200, emoji: '🍊', name: '橙皮' }
    ],
    ingredients: []
  },
  8: {
    glass: 'dessert',
    liquidColor: 'linear-gradient(180deg, #fff0f5 0%, #ffb6c1 100%)',
    pencilLayers: [
      { color: '#e91e63', height: 80, delay: 0, emoji: '🍓', name: '草莓' },
      { color: '#fff0f5', height: 160, delay: 600, emoji: '🍦', name: '奶油' },
      { color: '#f0f8ff', height: 240, delay: 1200, emoji: '☁️', name: '云朵' }
    ],
    ingredients: []
  },
  9: {
    glass: 'highball',
    liquidColor: 'linear-gradient(180deg, #40e0d0 0%, #4169e1 100%)',
    pencilLayers: [
      { color: '#40e0d0', height: 80, delay: 0, emoji: '🌌', name: '极光' },
      { color: '#ffd700', height: 160, delay: 600, emoji: '🍋', name: '柠檬' },
      { color: '#f0ffff', height: 240, delay: 1200, emoji: '❄️', name: '冰雪' }
    ],
    ingredients: []
  },
  10: {
    glass: 'pint',
    liquidColor: 'linear-gradient(180deg, #f0e68c 0%, #daa520 100%)',
    pencilLayers: [
      { color: '#ff6b6b', height: 80, delay: 0, emoji: '🍎', name: '苹果' },
      { color: '#f5f5f5', height: 160, delay: 600, emoji: '🫧', name: '气泡' },
      { color: '#98fb98', height: 240, delay: 1200, emoji: '🌿', name: '薄荷' }
    ],
    ingredients: []
  },
  11: {
    glass: 'irish',
    liquidColor: 'linear-gradient(180deg, #4a2c2a 0%, #2d1810 100%)',
    pencilLayers: [
      { color: '#4a2c2a', height: 80, delay: 0, emoji: '☕', name: '冷萃' },
      { color: '#8b4513', height: 160, delay: 600, emoji: '🍫', name: '可可' },
      { color: '#fffaf0', height: 240, delay: 1200, emoji: '📖', name: '香草' }
    ],
    ingredients: []
  },
  12: {
    glass: 'ceramic',
    liquidColor: 'linear-gradient(180deg, #ffc0cb 0%, #ff69b4 100%)',
    pencilLayers: [
      { color: '#ffb7c5', height: 80, delay: 0, emoji: '🌸', name: '桃花' },
      { color: '#daa520', height: 160, delay: 600, emoji: '🍯', name: '蜂蜜' },
      { color: '#faf0e6', height: 240, delay: 1200, emoji: '🍶', name: '米酒' }
    ],
    ingredients: []
  },
  13: {
    glass: 'wine',
    liquidColor: 'linear-gradient(180deg, #003366 0%, #001a33 100%)',
    pencilLayers: [
      { color: '#003366', height: 80, delay: 0, emoji: '🐋', name: '蓝鲸' },
      { color: '#d3d3d3', height: 160, delay: 600, emoji: '🧂', name: '海盐' },
      { color: '#fff8dc', height: 240, delay: 1200, emoji: '💌', name: '信笺' }
    ],
    ingredients: []
  },
  14: {
    glass: 'bulb',
    liquidColor: 'linear-gradient(180deg, #ff9966 0%, #ff5e62 100%)',
    pencilLayers: [
      { color: '#ff69b4', height: 80, delay: 0, emoji: '🎠', name: '旋转木马' },
      { color: '#ffb6c1', height: 160, delay: 600, emoji: '🍬', name: '棉花糖' },
      { color: '#9370db', height: 240, delay: 1200, emoji: '🎪', name: '彩色灯' }
    ],
    ingredients: []
  },
  15: {
    glass: 'rocks_tall',
    liquidColor: 'linear-gradient(180deg, #e6f2ff 0%, #b3d9ff 100%)',
    pencilLayers: [
      { color: '#fffaf0', height: 80, delay: 0, emoji: '🏔️', name: '雪山' },
      { color: '#ffd700', height: 160, delay: 600, emoji: '🍋', name: '柠檬' },
      { color: '#add8e6', height: 240, delay: 1200, emoji: '💎', name: '冰晶' }
    ],
    ingredients: []
  },
  16: {
    glass: 'coupe',
    liquidColor: 'linear-gradient(180deg, #8b0000 0%, #4a0000 100%)',
    pencilLayers: [
      { color: '#b8860b', height: 80, delay: 0, emoji: '🎷', name: '萨克斯' },
      { color: '#cd853f', height: 160, delay: 600, emoji: '🥃', name: '波本' },
      { color: '#c71585', height: 240, delay: 1200, emoji: '🍒', name: '樱桃' }
    ],
    ingredients: []
  },
  17: {
    glass: 'flute',
    liquidColor: 'linear-gradient(180deg, #ffe4e1 0%, #ffb6c1 100%)',
    pencilLayers: [
      { color: '#d2b48c', height: 80, delay: 0, emoji: '🧺', name: '野餐篮' },
      { color: '#ffdab9', height: 160, delay: 600, emoji: '🍑', name: '蜜桃' },
      { color: '#f5f5f5', height: 240, delay: 1200, emoji: '🫧', name: '气泡' }
    ],
    ingredients: []
  },
  18: {
    glass: 'mug',
    liquidColor: 'linear-gradient(180deg, #2d1810 0%, #1a0f0a 100%)',
    pencilLayers: [
      { color: '#2d1810', height: 80, delay: 0, emoji: '🍫', name: '黑巧' },
      { color: '#dc143c', height: 160, delay: 600, emoji: '🍒', name: '樱桃' },
      { color: '#8b4513', height: 240, delay: 1200, emoji: '🏠', name: '木屋' }
    ],
    ingredients: []
  },
  19: {
    glass: 'gaiwan',
    liquidColor: 'linear-gradient(180deg, #c1e1c1 0%, #8fbc8f 100%)',
    pencilLayers: [
      { color: '#7ccd7c', height: 80, delay: 0, emoji: '🎋', name: '竹林' },
      { color: '#90ee90', height: 160, delay: 600, emoji: '🍵', name: '绿茶' },
      { color: '#87ceeb', height: 240, delay: 1200, emoji: '🌧️', name: '雨声' }
    ],
    ingredients: []
  },
  20: {
    glass: 'coupe_tall',
    liquidColor: 'linear-gradient(180deg, #ffd700 0%, #daa520 100%)',
    pencilLayers: [
      { color: '#ffd700', height: 80, delay: 0, emoji: '☄️', name: '彗星' },
      { color: '#fffaf0', height: 160, delay: 600, emoji: '✨', name: '金箔' },
      { color: '#f5f5f5', height: 240, delay: 1200, emoji: '🫧', name: '气泡' }
    ],
    ingredients: []
  },
  21: {
    glass: 'old_fashioned2',
    liquidColor: 'linear-gradient(180deg, #8b4513 0%, #5d3a1a 100%)',
    pencilLayers: [
      { color: '#2f2f2f', height: 80, delay: 0, emoji: '💿', name: '黑胶' },
      { color: '#c68c53', height: 160, delay: 600, emoji: '🍮', name: '焦糖' },
      { color: '#191970', height: 240, delay: 1200, emoji: '🎵', name: '音符' }
    ],
    ingredients: []
  },
  22: {
    glass: 'tea_glass',
    liquidColor: 'linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 100%)',
    pencilLayers: [
      { color: '#fffaf0', height: 80, delay: 0, emoji: '🌼', name: '茉莉' },
      { color: '#90ee90', height: 160, delay: 600, emoji: '🍵', name: '清茶' },
      { color: '#d1e231', height: 240, delay: 1200, emoji: '🍐', name: '雪梨' }
    ],
    ingredients: []
  },
  23: {
    glass: 'highball2',
    liquidColor: 'linear-gradient(180deg, #9400d3 0%, #4169e1 100%)',
    pencilLayers: [
      { color: '#9400d3', height: 80, delay: 0, emoji: '🌃', name: '霓虹' },
      { color: '#ffd700', height: 160, delay: 600, emoji: '🍋', name: '柠檬' },
      { color: '#f5f5f5', height: 240, delay: 1200, emoji: '🫧', name: '气泡' }
    ],
    ingredients: []
  },
  24: {
    glass: 'tumbler',
    liquidColor: 'linear-gradient(180deg, #e0ffff 0%, #afeeee 100%)',
    pencilLayers: [
      { color: '#87ceeb', height: 80, delay: 0, emoji: '💧', name: '溪水' },
      { color: '#9370db', height: 160, delay: 600, emoji: '🫐', name: '梅子' },
      { color: '#ffa500', height: 240, delay: 1200, emoji: '🐟', name: '小鱼' }
    ],
    ingredients: []
  },
  25: {
    glass: 'burgundy',
    liquidColor: 'linear-gradient(180deg, #800020 0%, #4a0018 100%)',
    pencilLayers: [
      { color: '#4a0080', height: 80, delay: 0, emoji: '🏰', name: '古堡' },
      { color: '#800020', height: 160, delay: 600, emoji: '🍷', name: '红酒' },
      { color: '#a0522d', height: 240, delay: 1200, emoji: '🪵', name: '橡木' }
    ],
    ingredients: []
  },
  26: {
    glass: 'milkshake',
    liquidColor: 'linear-gradient(180deg, #ff69b4 0%, #ffb6c1 100%)',
    pencilLayers: [
      { color: '#e91e63', height: 80, delay: 0, emoji: '🍓', name: '草莓' },
      { color: '#fffaf0', height: 160, delay: 600, emoji: '🥛', name: '奶昔' },
      { color: '#ffe4e1', height: 240, delay: 1200, emoji: '🍬', name: '糖霜' }
    ],
    ingredients: []
  },
  27: {
    glass: 'tequila',
    liquidColor: 'linear-gradient(180deg, #ff6347 0%, #ff4500 50%, #8b4513 100%)',
    pencilLayers: [
      { color: '#ff4500', height: 80, delay: 0, emoji: '🌅', name: '日落' },
      { color: '#c0c0c0', height: 160, delay: 600, emoji: '🥃', name: '龙舌兰' },
      { color: '#d3d3d3', height: 240, delay: 1200, emoji: '🧂', name: '海盐' }
    ],
    ingredients: []
  },
  28: {
    glass: 'latte',
    liquidColor: 'linear-gradient(180deg, #d2b48c 0%, #8b7355 100%)',
    pencilLayers: [
      { color: '#4a2c2a', height: 80, delay: 0, emoji: '☕', name: '浓缩' },
      { color: '#fffaf0', height: 160, delay: 600, emoji: '🥛', name: '牛奶' },
      { color: '#c68c53', height: 240, delay: 1200, emoji: '🍮', name: '焦糖' }
    ],
    ingredients: []
  },
  29: {
    glass: 'lotus',
    liquidColor: 'linear-gradient(180deg, #fff0f5 0%, #ffe4e1 100%)',
    pencilLayers: [
      { color: '#c0c0c0', height: 80, delay: 0, emoji: '🪞', name: '镜子' },
      { color: '#ffb7c5', height: 160, delay: 600, emoji: '🌸', name: '樱花' },
      { color: '#fffaf0', height: 240, delay: 1200, emoji: '🌙', name: '月影' }
    ],
    ingredients: []
  },
  30: {
    glass: 'hurricane',
    liquidColor: 'linear-gradient(180deg, #ffa500 0%, #ff8c00 100%)',
    pencilLayers: [
      { color: '#8b7355', height: 80, delay: 0, emoji: '🌴', name: '椰树' },
      { color: '#ffb347', height: 160, delay: 600, emoji: '🥭', name: '芒果' },
      { color: '#4682b4', height: 240, delay: 1200, emoji: '⛈️', name: '风暴' }
    ],
    ingredients: []
  },
  31: {
    glass: 'zisha',
    liquidColor: 'linear-gradient(180deg, #daa520 0%, #b8860b 100%)',
    pencilLayers: [
      { color: '#2f4f4f', height: 80, delay: 0, emoji: '📚', name: '诗书' },
      { color: '#90ee90', height: 160, delay: 600, emoji: '🍵', name: '龙井' },
      { color: '#ffd700', height: 240, delay: 1200, emoji: '🌼', name: '桂花' }
    ],
    ingredients: []
  },
  32: {
    glass: 'cocktail_tall',
    liquidColor: 'linear-gradient(180deg, #7fffd4 0%, #9370db 100%)',
    pencilLayers: [
      { color: '#40e0d0', height: 80, delay: 0, emoji: '🌌', name: '极光' },
      { color: '#ff1493', height: 160, delay: 600, emoji: '💃', name: '舞裙' },
      { color: '#fffaf0', height: 240, delay: 1200, emoji: '🌙', name: '月光' }
    ],
    ingredients: []
  }
};

for (const recipe of DRINK_RECIPES) {
  if (DRINK_ANIMATIONS[recipe.id]) {
    recipe.animation_config = DRINK_ANIMATIONS[recipe.id];
  }
}

function matchDrinkRecipe(tagList) {
  const tagWeights = {};
  for (const tag of tagList) {
    tagWeights[tag] = (tagWeights[tag] || 0) + 1;
  }

  let validRecipes = [];
  for (const recipe of DRINK_RECIPES) {
    let hasConflict = false;
    for (const conflictTag of recipe.conflict_tags) {
      if (tagWeights[conflictTag]) {
        hasConflict = true;
        break;
      }
    }
    if (!hasConflict) {
      validRecipes.push(recipe);
    }
  }

  if (validRecipes.length === 0) {
    validRecipes = DRINK_RECIPES;
  }

  let bestScore = -1;
  let bestRecipes = [];

  for (const recipe of validRecipes) {
    let score = 0;
    const allTags = [...recipe.flavor_tags, ...recipe.time_tags, ...recipe.toast_tags];
    for (const tag of allTags) {
      if (tagWeights[tag]) {
        score += tagWeights[tag];
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRecipes = [recipe];
    } else if (score === bestScore) {
      bestRecipes.push(recipe);
    }
  }

  const winner = bestRecipes[Math.floor(Math.random() * bestRecipes.length)];
  return {
    ...winner,
    score: bestScore
  };
}

function generateId() {
  return Math.random().toString(16).slice(2, 10) + Date.now().toString(16);
}

function generateToken() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

module.exports = { QUESTIONS, DRINK_RECIPES, matchDrinkRecipe, generateId };
