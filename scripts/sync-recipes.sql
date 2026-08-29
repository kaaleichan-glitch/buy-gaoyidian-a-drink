-- =========================================================
-- sync-recipes.sql:  一键同步 Supabase drink_recipes 表
-- 把每杯酒的 drink_name / english_name / drink_type /
-- image / story / ingredients / tags 都重新写回 seedData.js
-- 的权威版本。直接复制到 Supabase SQL Editor 按 RUN 即可。
-- =========================================================
BEGIN;

-- id=1  Pingu的海边假期 / PINGU'S BEACH VACATION
UPDATE drink_recipes
   SET drink_name    = 'Pingu的海边假期',
       english_name  = 'PINGU''S BEACH VACATION',
       drink_type    = 'Gin Cocktail',
       image         = '',
       story         = '企鹅离开冰原，第一次喝到夏天的味道。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌊","name":"海盐","meaning":"带来一点海风般的清醒"},{"emoji":"🍋","name":"柠檬","meaning":"制造跳跃感，像突然冒出的鬼点子"},{"emoji":"🌙","name":"月光","meaning":"留下柔软的余温"}]'::jsonb
 WHERE id = 1;

-- id=2  清醒素-001 / SOBER ELEMENT-001
UPDATE drink_recipes
   SET drink_name    = '清醒素-001',
       english_name  = 'SOBER ELEMENT-001',
       drink_type    = 'Vodka Cocktail',
       image         = '',
       story         = '昨天熬夜做实验，今天依旧准时出现。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌿","name":"薄荷","meaning":"带来清醒感，像凌晨打开培养箱的冷空气"},{"emoji":"🥒","name":"黄瓜","meaning":"铺开清新，像实验数据里突然出现的新发现"},{"emoji":"🏔️","name":"山泉","meaning":"留下干净回甘，像重新回到工作台前"}]'::jsonb
 WHERE id = 2;

-- id=3  人生发酵液 / LIFE FERMENTATION
UPDATE drink_recipes
   SET drink_name    = '人生发酵液',
       english_name  = 'LIFE FERMENTATION',
       drink_type    = 'Whisky Cocktail',
       image         = '',
       story         = '把经历过的一切慢慢发酵，最后酿成自己的味道。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🍯","name":"蜂蜜","meaning":"像保存多年的一句话，终于有人拆开"},{"emoji":"🍊","name":"橙子","meaning":"带来一点明亮，像翻到旧照片背面的日期"},{"emoji":"📜","name":"烟熏","meaning":"慢慢散去，只留下时间发酵后的温度"}]'::jsonb
 WHERE id = 3;

-- id=4  安可之后 / AFTER ENCORE
UPDATE drink_recipes
   SET drink_name    = '安可之后',
       english_name  = 'AFTER ENCORE',
       drink_type    = 'Tequila Cocktail',
       image         = '',
       story         = '人群散去，但身体还记得节奏。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"✨","name":"星尘","meaning":"像灯牌亮起，全场同时进入副歌"},{"emoji":"🍊","name":"西柚","meaning":"炸开酸甜感，舞台突然换了一套造型"},{"emoji":"🌶️","name":"辣椒","meaning":"留下热度，提醒你散场不是结束"}]'::jsonb
 WHERE id = 4;

-- id=5  黄梅天 / PLUM RAIN SEASON
UPDATE drink_recipes
   SET drink_name    = '黄梅天',
       english_name  = 'PLUM RAIN SEASON',
       drink_type    = 'Sake Cocktail',
       image         = '',
       story         = '雨还没有停，但院子里的花已经开了。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌸","name":"樱花","meaning":"像雨里突然出现的一点粉色"},{"emoji":"🎋","name":"竹叶","meaning":"带来巷子里的清凉，像骑车穿过放学路"},{"emoji":"💧","name":"雨露","meaning":"留下湿润的回忆，像回到小时候的院子"}]'::jsonb
 WHERE id = 5;

-- id=6  论文终稿提交前 / BEFORE FINAL SUBMISSION
UPDATE drink_recipes
   SET drink_name    = '论文终稿提交前',
       english_name  = 'BEFORE FINAL SUBMISSION',
       drink_type    = 'Rum Cocktail',
       image         = '',
       story         = '不是最好的一版，是终于完成的一版。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🔥","name":"肉桂","meaning":"是熬夜后的倔强"},{"emoji":"🍍","name":"菠萝","meaning":"给到突然出现的灵感"},{"emoji":"📖","name":"诗篇","meaning":"落下，终于不用再修改"}]'::jsonb
 WHERE id = 6;

-- id=7  顶刊一作 / TOP JOURNAL FIRST AUTHOR
UPDATE drink_recipes
   SET drink_name    = '顶刊一作',
       english_name  = 'TOP JOURNAL FIRST AUTHOR',
       drink_type    = 'Old Fashioned',
       image         = '',
       story         = '今天读别人的论文，未来写自己的名字。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"📚","name":"古书","meaning":"翻过无数页的积累，藏着前人留下的线索"},{"emoji":"🍷","name":"雪莉","meaning":"时间慢慢沉淀出的成熟，越久越有层次"},{"emoji":"🍊","name":"橙皮","meaning":"突然跳出的灵感火花，让平静里出现新的方向"}]'::jsonb
 WHERE id = 7;

-- id=8  云朵培养皿 / CLOUD PETRI DISH
UPDATE drink_recipes
   SET drink_name    = '云朵培养皿',
       english_name  = 'CLOUD PETRI DISH',
       drink_type    = 'Sweet Cocktail',
       image         = '',
       story         = '经过48小时观察，该云朵样本无攻击性，主要表现为可爱过量。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🍓","name":"草莓","meaning":"酸酸甜甜，像一只偷偷跑出来的小生命"},{"emoji":"🍦","name":"奶油","meaning":"流淌铺开，给快乐盖了一层软软培养基"},{"emoji":"☁️","name":"云朵","meaning":"继续飘荡，留下一个需要继续观察的好心情"}]'::jsonb
 WHERE id = 8;

-- id=9  彩虹极光 / RAINBOW AURORA
UPDATE drink_recipes
   SET drink_name    = '彩虹极光',
       english_name  = 'RAINBOW AURORA',
       drink_type    = 'Vodka Cocktail',
       image         = '',
       story         = '在没有边界的天空里，所有颜色都有机会出现。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌌","name":"极光","meaning":"落下瞬间置身严寒冷空气"},{"emoji":"🍋","name":"柠檬","meaning":"炸开时像天空突然加载出新颜色"},{"emoji":"❄️","name":"冰雪","meaning":"流动的是还没结束的幻想"}]'::jsonb
 WHERE id = 9;

-- id=10  今天遛猫不遛狗 / CAT WALK TODAY
UPDATE drink_recipes
   SET drink_name    = '今天遛猫不遛狗',
       english_name  = 'CAT WALK TODAY',
       drink_type    = 'Cider Cocktail',
       image         = '',
       story         = '有些幸福不是大事，只是回家时有猫猫狗狗等你开门。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🍎","name":"苹果","meaning":"清甜爽脆，像骑车路上突然吹来的夏风"},{"emoji":"🫧","name":"气泡","meaning":"蹦蹦跳跳，是猫狗一起冲出门的混乱现场"},{"emoji":"🌿","name":"薄荷","meaning":"留下遛完宠物后的轻松傍晚"}]'::jsonb
 WHERE id = 10;

-- id=11  高雅人士 / ELEGANT PERSON
UPDATE drink_recipes
   SET drink_name    = '高雅人士',
       english_name  = 'ELEGANT PERSON',
       drink_type    = 'Coffee Cocktail',
       image         = '',
       story         = '穿上西装的企鹅，决定优雅地喝完这一杯。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"☕","name":"冷萃","meaning":"端起杯子宣布自己很成熟"},{"emoji":"🍫","name":"可可","meaning":"一本正经地讲一个冷笑话"},{"emoji":"📖","name":"香草","meaning":"衬托出了滑稽的做作"}]'::jsonb
 WHERE id = 11;

-- id=12  泡菜之后 / AFTER KIMCHI
UPDATE drink_recipes
   SET drink_name    = '泡菜之后',
       english_name  = 'AFTER KIMCHI',
       drink_type    = 'Chinese Wine',
       image         = '',
       story         = '有些味道不是学会的，是从家里的厨房长出来的。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌸","name":"桃花","meaning":"浮起成都春天吹来的第一阵风"},{"emoji":"🍯","name":"蜂蜜","meaning":"铺开厨房里刚揭开的甜香"},{"emoji":"🍶","name":"米酒","meaning":"醪糟回甜，是妈妈酿的味道"}]'::jsonb
 WHERE id = 12;

-- id=13  远程办公申请书 / WFH APPLICATION
UPDATE drink_recipes
   SET drink_name    = '远程办公申请书',
       english_name  = 'WFH APPLICATION',
       drink_type    = 'Gin Cocktail',
       image         = '',
       story         = '世界都变成了她的办公室。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🐋","name":"蓝鲸","meaning":"游过时带来一封远方的信"},{"emoji":"🧂","name":"海盐","meaning":"是自由吹来的第一阵风留下的"},{"emoji":"💌","name":"信笺","meaning":"写着\"今天不用打卡\""}]'::jsonb
 WHERE id = 13;

-- id=14  快乐没有截止日期 / HAPPY NEVER EXPIRES
UPDATE drink_recipes
   SET drink_name    = '快乐没有截止日期',
       english_name  = 'HAPPY NEVER EXPIRES',
       drink_type    = 'Candy Cocktail',
       image         = '',
       story         = 'LET''S拒绝长大，丢掉快乐达咩。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🎠","name":"旋转木马","meaning":"偷偷落下，给生活加了一层滤镜"},{"emoji":"🍬","name":"棉花糖","meaning":"彩灯亮起，普通晚上突然变成舞台"},{"emoji":"🎪","name":"彩色灯","meaning":"旋转木马最后一圈旋转，还想再玩一次"}]'::jsonb
 WHERE id = 14;

-- id=15  小鼠冷静一下 / MOUSE CALM DOWN
UPDATE drink_recipes
   SET drink_name    = '小鼠冷静一下',
       english_name  = 'MOUSE CALM DOWN',
       drink_type    = 'Vodka Cocktail',
       image         = '',
       story         = '小鼠决定先不拯救世界，坐下来重新计算今天的实验变量。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🏔️","name":"雪山","meaning":"酸的那一下，像实验数据突然对上"},{"emoji":"🍋","name":"柠檬","meaning":"慢慢展开，给大脑降温"},{"emoji":"💎","name":"冰晶","meaning":"回甘，留下冷静的判断"}]'::jsonb
 WHERE id = 15;

-- id=16  今日心率偏高 / HEART RATE UP TODAY
UPDATE drink_recipes
   SET drink_name    = '今日心率偏高',
       english_name  = 'HEART RATE UP TODAY',
       drink_type    = 'Whisky Cocktail',
       image         = '',
       story         = '白天训练身体，晚上奖励灵魂。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🎷","name":"萨克斯","meaning":"升温象征着摘下拳套后的掌心余热"},{"emoji":"🥃","name":"波本","meaning":"奏响开始跟着节拍移动的脚步"},{"emoji":"🍒","name":"樱桃","meaning":"落下时像赢回自己的小奖励"}]'::jsonb
 WHERE id = 16;

-- id=17  电瓶车漫游指南 / E-SCOOTER GUIDE
UPDATE drink_recipes
   SET drink_name    = '电瓶车漫游指南',
       english_name  = 'E-SCOOTER GUIDE',
       drink_type    = 'Sparkling Wine',
       image         = '',
       story         = '生活模式已开启，今天的目标是闲逛。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🧺","name":"野餐篮","meaning":"是骑车路上临时决定买的"},{"emoji":"🍑","name":"蜜桃","meaning":"陪伴了在公园坐一下午时光"},{"emoji":"🫧","name":"气泡","meaning":"野餐篮旁边有永不离开的小狗"}]'::jsonb
 WHERE id = 17;

-- id=18  我是什么很贱的人吗 / AM I A JOKE TO YOU
UPDATE drink_recipes
   SET drink_name    = '我是什么很贱的人吗',
       english_name  = 'AM I A JOKE TO YOU',
       drink_type    = 'Chocolate Cocktail',
       image         = '',
       story         = '人类最复杂的配方之一，就是一边说"烦死了"，一边偷偷把世界照顾得很好。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🍫","name":"黑巧","meaning":"苦中带着回甘，是说出口前，先在脑子里排练三遍的话"},{"emoji":"🍒","name":"樱桃","meaning":"是忍不住突然发出的那句吐槽"},{"emoji":"🏠","name":"木屋","meaning":"适合坐下来怀疑人生"}]'::jsonb
 WHERE id = 18;

-- id=19  云语十级 / CLOUD LANGUAGE LEVEL 10
UPDATE drink_recipes
   SET drink_name    = '云语十级',
       english_name  = 'CLOUD LANGUAGE LEVEL 10',
       drink_type    = 'Tea Cocktail',
       image         = '',
       story         = '这杯酒拒绝一切不合理要求，但拒绝的方式非常有礼貌。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🎋","name":"竹林","meaning":"清响，像一句拖长尾音的\"不——可——以\""},{"emoji":"🍵","name":"绿茶","meaning":"香展开，把普通一句话变成三分钟情绪剧"},{"emoji":"🌧️","name":"雨声","meaning":"让世界暂时安静，但吐槽还没结束"}]'::jsonb
 WHERE id = 19;

-- id=20  未来许愿池 / FUTURE WISHING WELL
UPDATE drink_recipes
   SET drink_name    = '未来许愿池',
       english_name  = 'FUTURE WISHING WELL',
       drink_type    = 'Sparkling Cocktail',
       image         = '',
       story         = '今天埋下的愿望，会在将来某天收到回复邮件。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"☄️","name":"彗星","meaning":"偷偷提交一份遥远的愿望"},{"emoji":"✨","name":"金箔","meaning":"闪耀着某天突然收到好消息"},{"emoji":"🫧","name":"气泡","meaning":"升起时看期待在前往更远的地方"}]'::jsonb
 WHERE id = 20;

-- id=21  下一场见 / SEE YOU NEXT SHOW
UPDATE drink_recipes
   SET drink_name    = '下一场见',
       english_name  = 'SEE YOU NEXT SHOW',
       drink_type    = 'Rum Cocktail',
       image         = '',
       story         = '不要只是喜欢。要去追逐，要去看见。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"💿","name":"黑胶","meaning":"转动，熟悉旋律重新上线"},{"emoji":"🍮","name":"焦糖","meaning":"融化，是等待抢票成功的甜"},{"emoji":"🎵","name":"音符","meaning":"散开，奔赴现场的期待还在"}]'::jsonb
 WHERE id = 21;

-- id=22  老黄历 / OLD ALMANAC
UPDATE drink_recipes
   SET drink_name    = '老黄历',
       english_name  = 'OLD ALMANAC',
       drink_type    = 'Tea Cocktail',
       image         = '',
       story         = '今日宜放过自己，忌强行营业。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌼","name":"茉莉","meaning":"飘开，宣布今天先不努力"},{"emoji":"🍵","name":"清茶","meaning":"慢慢展开，脑子终于停止转圈"},{"emoji":"🍐","name":"雪梨","meaning":"的甜味留下，允许自己休息一下"}]'::jsonb
 WHERE id = 22;

-- id=23  夜生活加载中 / NIGHT LIFE LOADING
UPDATE drink_recipes
   SET drink_name    = '夜生活加载中',
       english_name  = 'NIGHT LIFE LOADING',
       drink_type    = 'Vodka Cocktail',
       image         = '',
       story         = '今晚唯一的研究课题：人类快乐产生机制观察。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌃","name":"霓虹","meaning":"亮起第一束灯光，城市开始苏醒"},{"emoji":"🍋","name":"柠檬","meaning":"不断上升，像音乐响起后的心跳"},{"emoji":"🫧","name":"气泡","meaning":"慢慢散开，留下今晚的快乐存档"}]'::jsonb
 WHERE id = 23;

-- id=24  山野同行 / MOUNTAIN COMPANION
UPDATE drink_recipes
   SET drink_name    = '山野同行',
       english_name  = 'MOUNTAIN COMPANION',
       drink_type    = 'Sake Cocktail',
       image         = '',
       story         = '世界是一张开放地图。每一次转弯，都可能加载出新的风景。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"💧","name":"溪水","meaning":"穿过石头，像爬山路上的第一口清风"},{"emoji":"🫐","name":"梅子","meaning":"酸酸甜甜，是走累后突然发现的小惊喜"},{"emoji":"🐟","name":"小鱼","meaning":"游过水面，留下一起出发的记忆"}]'::jsonb
 WHERE id = 24;

-- id=25  人生样本观察报告 / LIFE SAMPLE REPORT
UPDATE drink_recipes
   SET drink_name    = '人生样本观察报告',
       english_name  = 'LIFE SAMPLE REPORT',
       drink_type    = 'Red Wine',
       image         = '',
       story         = '经过多年培养，该样本已经适应复杂环境，并发展出独特风味。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🏰","name":"古堡","meaning":"开启记录第一条人生数据"},{"emoji":"🍷","name":"红酒","meaning":"沉淀多年实验记录"},{"emoji":"🪵","name":"橡木","meaning":"沉静得只剩自己的回声"}]'::jsonb
 WHERE id = 25;

-- id=26  猫狗双全认证 / CAT & DOG CERTIFIED
UPDATE drink_recipes
   SET drink_name    = '猫狗双全认证',
       english_name  = 'CAT & DOG CERTIFIED',
       drink_type    = 'Sweet Cocktail',
       image         = '',
       story         = '✅ 高一点满意
✅ 高爸满意
✅ 老王满意
✅ 豆豆满意
✅ 薯条满意
✅ 没礼貌满意
✅ 西瓜满意
✅ 养过的猫狗都满意
✅ 家庭幸福指数超标
✅ 认证通过',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🍓","name":"草莓","meaning":"跳进杯里，像刚回家的小狗扑过来"},{"emoji":"🥛","name":"奶昔","meaning":"慢慢展开，装满猫咪晒太阳的下午"},{"emoji":"🍬","name":"糖霜","meaning":"落下，盖上一层毛茸茸的幸福"}]'::jsonb
 WHERE id = 26;

-- id=27  自由职业预告片 / FREELANCE TRAILER
UPDATE drink_recipes
   SET drink_name    = '自由职业预告片',
       english_name  = 'FREELANCE TRAILER',
       drink_type    = 'Tequila Cocktail',
       image         = '',
       story         = '主演：未来的自己。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌅","name":"日落","meaning":"吹来第一阵自由的风，像终于不用赶时间"},{"emoji":"🥃","name":"龙舌兰","meaning":"升起热烈感，像开始写自己的生活剧本"},{"emoji":"🧂","name":"海盐","meaning":"慢慢沉下去，留下下一站的想象"}]'::jsonb
 WHERE id = 27;

-- id=28  今天也要活着上班 / SURVIVE WORK TODAY
UPDATE drink_recipes
   SET drink_name    = '今天也要活着上班',
       english_name  = 'SURVIVE WORK TODAY',
       drink_type    = 'Coffee Cocktail',
       image         = '',
       story         = '成年人的魔法，是在困倦里准时启动。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"☕","name":"浓缩","meaning":"叫醒身体，提醒今天也别迟到"},{"emoji":"🥛","name":"牛奶","meaning":"揉碎苦味，给打工魂加一点缓冲"},{"emoji":"🍮","name":"焦糖","meaning":"留下甜味，奖励准时出现的自己"}]'::jsonb
 WHERE id = 28;

-- id=29  镜花水月 / MIRROR FLOWER
UPDATE drink_recipes
   SET drink_name    = '镜花水月',
       english_name  = 'MIRROR FLOWER',
       drink_type    = 'Sake Cocktail',
       image         = '',
       story         = '她一直以为自己只是水里的倒影，直到有人告诉她，月亮本来就存在。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🪞","name":"镜子","meaning":"映出一个不敢确认那是自己的倒影"},{"emoji":"🌸","name":"樱花","meaning":"落进水里，像那些被错过的喜欢"},{"emoji":"🌙","name":"月影","meaning":"只剩一句：真的有人会留下吗"}]'::jsonb
 WHERE id = 29;

-- id=30  这把胡了 / THIS HAND WINS
UPDATE drink_recipes
   SET drink_name    = '这把胡了',
       english_name  = 'THIS HAND WINS',
       drink_type    = 'Rum Cocktail',
       image         = '',
       story         = '没人知道下一张牌是什么。如果真的胡了，那就举杯庆祝。如果没胡，那就继续洗牌。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌴","name":"椰树","meaning":"甜得嚣张，像摸牌前已经开始庆祝"},{"emoji":"🥭","name":"芒果","meaning":"慢慢展开，成都夏夜的风吹进牌桌"},{"emoji":"⛈️","name":"风暴","meaning":"突然落下，最后一张牌终于翻开"}]'::jsonb
 WHERE id = 30;

-- id=31  Master Pingu / MASTER PINGU
UPDATE drink_recipes
   SET drink_name    = 'Master Pingu',
       english_name  = 'MASTER PINGU',
       drink_type    = 'Chinese Tea',
       image         = '',
       story         = '如何成为一只优秀企鹅：聪明严肃可爱，还有论文之外。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"📚","name":"诗书","meaning":"第一页其实是实验记录本，写着今天的发现"},{"emoji":"🍵","name":"龙井","meaning":"带来舒展的清醒，适合面对一整天的数据"},{"emoji":"🌼","name":"桂花","meaning":"留下温柔气息，提醒自己别忘了生活"}]'::jsonb
 WHERE id = 31;

-- id=32  没有标准答案 / NO STANDARD ANSWER
UPDATE drink_recipes
   SET drink_name    = '没有标准答案',
       english_name  = 'NO STANDARD ANSWER',
       drink_type    = 'Gin Cocktail',
       image         = '',
       story         = '这个世界没有规定每个人应该跳什么舞。',
       tags          = '[]'::jsonb,
       ingredients   = '[{"emoji":"🌌","name":"极光","meaning":"落下时，身体先于语言开始表达"},{"emoji":"💃","name":"舞裙","meaning":"旋转着把所有颜色甩进夜空"},{"emoji":"🌙","name":"月光","meaning":"是一道属于自己的轨迹"}]'::jsonb
 WHERE id = 32;

-- 顺手补齐 site_id 默认值（防御性，多跑无害）
ALTER TABLE drinks ALTER COLUMN site_id SET DEFAULT 'default';
COMMIT;

-- ==========  验证查询：COMMIT 成功后再单独跑  ==========
-- 验证 id=4 星尘漫步者/安可之后:
SELECT id, drink_name, english_name, left(story, 80) AS story_preview FROM drink_recipes WHERE id = 4;
-- 预期: story_preview = 人群散去，但身体还记得节奏。

-- 验证 id=26 猫狗双全认证:
SELECT id, drink_name, english_name, story FROM drink_recipes WHERE id = 26;
-- 预期: story 共 10 行，第一行是 ✅ 高一点满意，最后一行是 ✅ 认证通过