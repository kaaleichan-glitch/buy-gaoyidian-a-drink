/* ============================================================
 * 诊断脚本：遍历 32 杯酒，排查液面动画/杯型 CSS 是否齐全
 * 用法：在项目根目录执行 →  node tests/audit-32-drinks.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');

// 1. 读 data.js & style.css & tavern.js
const dataJS   = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'data.js'),   'utf8');
const tavernJS = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'tavern.js'), 'utf8');
const styleCSS = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'style.css'),'utf8');

// 2. 在 jsdom-less 环境下直接把 data.js 执行（它只会往 global 挂 DRINK_RECIPES / DRINK_ANIMATIONS 两个常量）
const sandbox = { window: {}, console };
// eslint-disable-next-line no-new-func
const vm = require('vm');
const ctx = vm.createContext({ ...global, console });
vm.runInContext(
  dataJS + `\n; globalThis.__DR__ = DRINK_RECIPES; globalThis.__DA__ = DRINK_ANIMATIONS;`,
  ctx
);

const DRINK_RECIPES   = ctx.__DR__;
const DRINK_ANIMATIONS = ctx.__DA__;

console.log(`\n============================================================`);
console.log(`🔍 32 杯酒液面动画诊断报告`);
console.log(`============================================================\n`);

const total = DRINK_RECIPES.length;
console.log(`DRINK_RECIPES 共 ${total} 杯 ； DRINK_ANIMATIONS 配置了 ${Object.keys(DRINK_ANIMATIONS).length} 杯\n`);

// 3. 从 style.css 里把所有声明过的 .tavern-glass.glass-XXX 类名抽出来
const tavernGlassSet = new Set();
const re = /\.tavern-glass\s*\.glass-([a-zA-Z0-9_]+)/g;
let m;
while ((m = re.exec(styleCSS)) !== null) tavernGlassSet.add(m[1]);

// 4. 抽 tavern.js 里的 generateDrinkSVG 函数本体（不加载整个文件，因为 tavern.js 顶层就会访问 document）
const fnMatch = tavernJS.match(/function generateDrinkSVG\(animConfig\) \{[\s\S]*?\n\}/);
if (!fnMatch) throw new Error('找不到 generateDrinkSVG 函数');
vm.runInContext(
  fnMatch[0] + `\n; globalThis.__G__ = { generateDrinkSVG };`,
  ctx
);
const generateDrinkSVG = ctx.__G__.generateDrinkSVG;

// 5. 一杯一杯查
const errors = [];
const warnings = [];

for (const recipe of DRINK_RECIPES) {
  const { id } = recipe;
  const name_cn = recipe.name_cn || recipe.drink_name || '?';
  const name_en = recipe.name_en || recipe.english_name || '?';
  const prefix = `[id=${String(id).padStart(2,' ')}] ${name_en} / ${name_cn}`;

  // 5a. animation_config 存在吗？
  const ac = recipe.animation_config;
  if (!ac) {
    errors.push(`${prefix}  ❌ animation_config 为 null（DRINK_ANIMATIONS[${id}] 缺失）`);
    continue;
  }

  // 5b. glass 类型是否在 tavern.css 中被定义
  if (!tavernGlassSet.has(ac.glass)) {
    errors.push(`${prefix}  ❌ 杯型 glass-${ac.glass} 缺少 .tavern-glass.glass-${ac.glass} CSS 样式（导致 DOM 有 SVG 但无宽高，显示空白）`);
  }

  // 5c. pencilLayers 存在且非空？
  const layers = ac.pencilLayers || [];
  if (layers.length === 0) {
    errors.push(`${prefix}  ❌ animation_config.pencilLayers 为空数组（不会产生任何液面层）`);
  } else if (layers.length < 2) {
    warnings.push(`${prefix}  ⚠️  只有 ${layers.length} 层液面，建议 ≥2 层才好看`);
  }

  // 5d. generateDrinkSVG 跑一遍，看输出里是否有 tavern-pencil-layer（液面）
  let svg;
  try {
    svg = generateDrinkSVG(ac);
  } catch (e) {
    errors.push(`${prefix}  ❌ generateDrinkSVG() 抛异常: ${e.message}`);
    continue;
  }
  if (!/tavern-pencil-layer/.test(svg)) {
    errors.push(`${prefix}  ❌ generateDrinkSVG() 输出里没有 tavern-pencil-layer（液面为空）`);
  }
  if (!/class="tavern-glass glass-/.test(svg)) {
    errors.push(`${prefix}  ❌ 输出里找不到 tavern-glass 类（容器缺失）`);
  }
}

// 6. 额外检查：DRINK_ANIMATIONS 里是否有任何 recipe.id 没覆盖到的条目
const recipeIds = new Set(DRINK_RECIPES.map(r => r.id));
for (const k of Object.keys(DRINK_ANIMATIONS)) {
  if (!recipeIds.has(Number(k))) {
    warnings.push(`[id=${k}] ⚠️  DRINK_ANIMATIONS 有配置，但 DRINK_RECIPES 里并没有这个 id 的酒（孤儿配置）`);
  }
}

// 7. 汇总
console.log(`——— 错误（${errors.length}） ———`);
if (errors.length) errors.forEach(e => console.log(e)); else console.log('✅ 无错误');
console.log('');
console.log(`——— 警告（${warnings.length}） ———`);
if (warnings.length) warnings.forEach(w => console.log(w)); else console.log('✅ 无警告');

console.log(`\n============================================================`);
if (errors.length === 0) {
  console.log(`🎉 32 杯酒的液面动画全部齐全！`);
  process.exit(0);
} else {
  console.log(`💔 有 ${errors.length} 处错误需要修复`);
  process.exit(1);
}
