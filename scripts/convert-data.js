// scripts/convert-data.js
// 将 H5 版 data.js 复制/转化为小程序版 utils/data.js，并同步修改"酒"类敏感文案
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'public', 'js', 'data.js');
const dstPath = path.join(__dirname, '..', 'mini-program', 'utils', 'data.js');

let s = fs.readFileSync(srcPath, 'utf8');

// 去掉 BOM
s = s.replace(/\uFEFF/g, '');

// ======= 问题/选项中的 "酒"字改软 =======
const replaceMap = [
  ['这杯酒的回味是什么？', '这杯特调的余味是什么？'],
  ['如果这杯酒有香气，会来自哪里？', '如果这杯特调有香气，会来自哪里？'],
  ['你希望这杯酒的质地如何呈现？', '你希望这杯特调的质地如何呈现？'],
  ['酒液在口腔里如何行走？', '风味在舌尖上如何流淌？'],
  ['如果酒体有呼吸，它的节奏是？', '如果风味层有呼吸，它的节奏是？'],
  ['给"微醺"配一个嗅觉底色', '给"风味呼吸感"配一个嗅觉底色'],
  ['这杯酒让房间变大了，还是变小了？', '这杯特调让房间变大了，还是变小了？'],
  ['喝完这杯酒，时间会变快还是变慢？', '饮完这杯特调，时间会变快还是变慢？'],
  ['这杯酒送给几岁的高一点？', '这杯特调送给几岁的高一点？'],
  ['在同一个房间，但没在喝酒', '在同一个房间，但没在品特调'],
  ['这杯酒所在的空间，墙纸是什么图案？', '这杯特调所在的空间，墙纸是什么图案？'],
  ['你会在周几让高一点喝下这杯酒？', '你会在周几让高一点品完这杯特调？'],
  ['这杯酒应该等待多久才喝？', '这杯特调应该等待多久才品？'],
  ['十分钟，等酒体苏醒', '十分钟，等风味层苏醒'],
  ['这杯酒在你和高一点关系中的角色是？', '这杯特调在你和高一点关系中的角色是？'],
  ['她做饭，我调酒，扯平了', '她做饭，我调特饮，扯平了'],
  ['喝完这杯酒，高一点会发什么刊？', '饮完这杯特调，高一点会发什么刊？'],
  ['这杯酒适合配什么样的音乐？', '这杯特调适合配什么样的音乐？'],
  ['午夜酒吧蹦迪', '午夜舞池跳舞'],
  ['这杯酒应该纪念什么样的时间刻度？', '这杯特调应该纪念什么样的时间刻度？'],
  ['调完这杯酒，你会对高一点说什么？', '调完这杯特调，你会对高一点说什么？'],
  ['这杯酒在致敬高一点的哪部分？', '这杯特调在致敬高一点的哪部分？'],
  ['这杯酒应该先敬谁？', '这杯特调应该先敬谁？'],
  ['这杯酒敬的是过去还是未来？', '这杯特调敬的是过去还是未来？'],
  ['这杯酒为谁而喝？', '这杯特调为谁而品？'],
];
for (const [a, b] of replaceMap) {
  s = s.split(a).join(b);
}

// ======= drink_type 映射（英文 Cocktail → 中文"XX 风味特调"）=======
const drinkTypeMap = {
  "'Gin Cocktail'": "'金酒风味特调'",
  "'Vodka Cocktail'": "'清冽风味特调'",
  "'Whisky Cocktail'": "'木桶陈酿特调'",
  "'Tequila Cocktail'": "'热烈香料特调'",
  "'Sake Cocktail'": "'米酿风味特调'",
  "'Rum Cocktail'": "'热带甘蔗特调'",
  "'Old Fashioned'": "'经典复古特调'",
  "'Sweet Cocktail'": "'甜蜜风味特调'",
  "'Cider Cocktail'": "'苹果特调'",
  "'Coffee Cocktail'": "'咖啡风味特调'",
  "'Chinese Wine'": "'中式米酿特调'",
  "'Candy Cocktail'": "'糖果风味特调'",
  "'Sparkling Wine'": "'气泡特调'",
  "'Chocolate Cocktail'": "'巧克力风味特调'",
  "'Tea Cocktail'": "'茶饮风味特调'",
  "'Sparkling Cocktail'": "'气泡动感特调'",
  "'Red Wine'": "'红葡萄风味特调'",
  "'Chinese Tea'": "'中式茶饮特调'",
};
for (const [a, b] of Object.entries(drinkTypeMap)) {
  s = s.split('drink_type: ' + a).join('drink_type: ' + b);
}

// alcohol → intensity（避免"酒精"暗示）
s = s.replace(/alcohol:\s*(\d+)/g, (_, a) => 'intensity: ' + a);

// ingredients / DRINK_ANIMATIONS 中具体的酒类 ingredient 名
const ingredientMap = [
  ["name: '米酒'", "name: '醪糟酿'"],
  ["name: '红酒'", "name: '红葡萄风味'"],
  ['name: "米酒"', 'name: "醪糟酿"'],
  ['name: "红酒"', 'name: "红葡萄风味"'],
];
for (const [a, b] of ingredientMap) {
  s = s.split(a).join(b);
}

// 附加 CommonJS 导出（小程序 require）
if (!s.includes('module.exports')) {
  s += '\n\nmodule.exports = { QUESTIONS, DRINK_RECIPES, DRINK_ANIMATIONS };\n';
}

fs.mkdirSync(path.dirname(dstPath), { recursive: true });
fs.writeFileSync(dstPath, s, 'utf8');

// 快速校验
const checks = ['QUESTIONS', 'DRINK_RECIPES', 'DRINK_ANIMATIONS', 'module.exports'];
for (const c of checks) {
  console.log(c, s.includes(c) ? 'OK' : 'MISSING');
}
// 校验"这杯酒"是否还有剩余
const bad = [...s.matchAll(/这杯酒/g)];
console.log('剩余"这杯酒"出现次数:', bad.length);
const bad2 = [...s.matchAll(/Cocktail|drink_type:.*Wine|alcohol:/g)];
console.log('剩余 Cocktail/alcohol/英文wine出现次数:', bad2.length);
console.log('输出 bytes:', s.length);
