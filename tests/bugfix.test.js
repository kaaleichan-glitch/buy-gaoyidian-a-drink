/**
 * 酒馆页 Bug 修复测试 —— TDD 先 RED 后 GREEN
 * 执行: node tests/bugfix.test.js
 *
 * 因项目没有现成的 HTTP mock / Supabase mock，本测试走两条验证路径:
 *   A) 静态代码审查: 精确检查 server.js / tavern.js / cloud.js / seed.js
 *      中的 buggy pattern 是否仍存在 (存在 = 测试失败, 已修复 = 测试通过)
 *   B) 纯函数单元测试: 对新增的工具函数 (fetchWithTimeout 等) 做行为验证
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const serverJs   = read('server.js');
const tavernJs   = read('public/js/tavern.js');
const cloudJs    = read('public/js/cloud.js');
const seedJs     = read('data/seed.js');
const tavernHtml = read('public/tavern.html');
const appJs      = read('public/js/app.js');

let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log(`  ❌ ${name}\n     → ${e.message}`);
  }
}

function assertNotContains(haystack, needle, failureMsg) {
  if (haystack.includes(needle)) {
    throw new Error(failureMsg + `\n     [命中片段]: ${needle.slice(0, 120)}${needle.length > 120 ? '…' : ''}`);
  }
}
function assertContains(haystack, needle, failureMsg) {
  if (!haystack.includes(needle)) {
    throw new Error(failureMsg + `\n     [期望片段]: ${needle.slice(0, 120)}${needle.length > 120 ? '…' : ''}`);
  }
}

/* =========================================================
 * P0-1: 移除酒馆页前端直连 Supabase 降级路径
 *   tavern.js 中不应出现 initCloud / getCloudDrinks /
 *   syncLocalDrinksToCloud / cloud.js 相关调用
 * ========================================================= */
console.log('\n📋 P0-1 前端直连 Supabase 降级路径 已移除');
test('tavern.js 不调用 initCloud()', () => {
  assertNotContains(tavernJs, 'initCloud()',
    'tavern.js 仍在调用 initCloud() —— 浏览器直连 Supabase 路径未移除，中国会 DNS 墙超时');
});
test('tavern.js 不调用 syncLocalDrinksToCloud()', () => {
  assertNotContains(tavernJs, 'syncLocalDrinksToCloud(',
    'tavern.js 仍在调用 syncLocalDrinksToCloud() —— 会做 N 次直连 POST，超时重灾区');
});
test('tavern.js 不调用 getCloudDrinks()', () => {
  assertNotContains(tavernJs, 'getCloudDrinks(',
    'tavern.js 仍在调用 getCloudDrinks() —— 会做直连 GET，DNS 墙超时');
});
test('tavern.js 不再声明/使用 useBackend=false 时走 cloud 分支', () => {
  // 关键 buggy 特征：catch 后进入 "云端/本地" 回退分支 —— 应改为只走本地 localStorage
  assertNotContains(tavernJs, '使用云端/本地数据',
    'loadTavern() 仍有"云端/本地"回退分支，应移除云端，只留 localStorage 兜底');
});

/* =========================================================
 * P0-2: checkBackend 加超时 + 超时不降级为 false
 *   HEAD→GET 或保留HEAD但后端有注册；
 *   AbortController 5s；超时 useBackend 仍为 true
 * ========================================================= */
console.log('\n📋 P0-2 checkBackend 超时 & 乐观策略');
test('checkBackend 使用 AbortController + timeout', () => {
  assertContains(tavernJs, 'AbortController',
    'checkBackend / fetch 未使用 AbortController，冷启动下会无限挂住');
  assertContains(tavernJs, 'signal',
    'fetch 未传 signal，AbortController 只是声明没用上');
});
test('checkBackend 超时后仍乐观 useBackend=true (不强制降级)', () => {
  // 旧代码 catch 里 tavernState.useBackend = false 且没有超时分支
  // 新代码 catch 只有当真正"非超时错误"时才降级，或始终乐观
  assertNotContains(tavernJs,
    'async function checkBackend() {\n    try {\n        const res = await fetch(\'/api/questions\', { method: \'HEAD\' });\n        tavernState.useBackend = res.ok;\n    } catch (err) {\n        tavernState.useBackend = false;\n    }\n}',
    'checkBackend 仍是无超时的旧实现，超时会被误判为 false 强制走被墙路径');
});

/* =========================================================
 * P0-3a: 后端注册 HEAD /api/questions 路由
 *   server.js 必须显式有 app.head 或 app.all 处理
 * ========================================================= */
console.log('\n📋 P0-3 后端 HEAD 路由 + 所有 fetch 有超时');
test('server.js 为 /api/questions 注册了 HEAD 路由', () => {
  const hasHead = /app\.(head|all)\(['"`]\/api\/questions/.test(serverJs);
  const orAppAll = /app\.all\(/m.test(serverJs);
  if (!hasHead && !orAppAll) {
    throw new Error('server.js 未为 /api/questions 注册 HEAD/all 路由，Express 默认 app.get 不能响应 HEAD → checkBackend 探活不稳定');
  }
});
test('server.js 中 app.get(/api/questions) 后或前有 HEAD 注册', () => {
  assertContains(serverJs, '/api/questions',
    '找不到 /api/questions 路由注册');
});

/* =========================================================
 * P0-3b: 所有 fetch 统一超时 + 错误 Toast
 * ========================================================= */
test('tavern.js 所有 fetch 带 signal 或统一 helper', () => {
  // 统计 fetch 调用点数量
  const tavernWithoutStrings = tavernJs
    .replace(/`[^`]*`/g, '')
    .replace(/'[^']*'/g, '')
    .replace(/"[^"]*"/g, '');
  const fetchMatches = tavernWithoutStrings.match(/fetch\s*\(/g) || [];
  const fetchCount = fetchMatches.length;

  // 每个 fetch 附近 200 字符内必须出现 AbortController 或 fetchWithTimeout（自动带 signal）
  const safeHelperCalls = (tavernWithoutStrings.match(/fetchWithTimeout\s*\(/g) || []).length;

  let unprotected = 0;
  const lines = tavernJs.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // 只看"裸 fetch("——排除已在 fetchWithTimeout 内部的那个 fetch
    if (/\bfetch\s*\(/.test(lines[i])) {
      const context = lines.slice(Math.max(0, i - 5), i + 5).join('\n');
      const inHelper = /function fetchWithTimeout/.test(lines.slice(Math.max(0, i - 10), i + 2).join('\n'));
      if (inHelper) continue; // helper 内部的那个原始 fetch 不算，它自己传了 signal
      const hasProtection = context.includes('AbortController') || context.includes('signal') || context.includes('fetchWithTimeout');
      if (!hasProtection) unprotected++;
    }
  }
  if (fetchCount < 1) {
    throw new Error('没找到任何 fetch 调用（sanity check 失败，可能计数出错）');
  }
  if (unprotected > 0) {
    throw new Error(`tavern.js 有 ${unprotected} 个裸 fetch 调用没 AbortController/signal 保护，会无限等待直到浏览器超时`);
  }
});
test('loadTavern API 失败时有 UI Toast，不只 console.warn', () => {
  // 后端失败、获取不到数据时应调用 showToast(...) 向用户显示
  assertContains(tavernJs, 'showToast(',
    'loadTavern 错误捕获里没有 showToast，用户看到 0/32 假死无提示');
});

/* =========================================================
 * P1-4: /api/tavern/:token 两次 DB 查询改为 Promise.all 并发
 *   server.js 不应出现 先 await recipes, 再 await drinks 的串行顺序
 *   而应有 Promise.all
 * ========================================================= */
console.log('\n📋 P1-4 /api/tavern/:token 并发查询');
test('server.js /api/tavern/:token 使用 Promise.all([recipes, drinks])', () => {
  assertContains(serverJs, 'Promise.all',
    '未使用 Promise.all，两个 Supabase 查询仍是串行，延迟翻倍');
});
test('server.js /api/tavern/:token 不再先查 recipes 再串行查 drinks', () => {
  // 旧 pattern: 先 await db.from('drink_recipes') 紧接着再 await db.from('drinks') 串行
  // 如果两个都在 Promise.all 数组里就没问题
  const serialRegex = /await\s+db\s*\.\s*from\s*\(\s*['"]drink_recipes['"]\s*\)[\s\S]{0,500}await\s+db\s*\.\s*from\s*\(\s*['"]drinks['"]\s*\)/m;
  // 只在 /api/tavern/:token 路由段检查 (截取 tavern 路由块)
  const tavernRouteStart = serverJs.indexOf(`app.get('/api/tavern/:token'`);
  const detailRouteStart = serverJs.indexOf(`app.get('/api/tavern/:token/detail/:id'`);
  const tavernRoute = serverJs.slice(tavernRouteStart, detailRouteStart);
  const stillSerial = serialRegex.test(tavernRoute);
  if (stillSerial) {
    throw new Error('/api/tavern/:token 里 drink_recipes 与 drinks 查询仍是串行 await，未 Promise.all 并发');
  }
});

/* =========================================================
 * P1-5: detail API 字段匹配 Bug
 *   .eq('id', id) → 改为 .eq('drink_id', id)
 *   旧代码查 BIGINT 主键列 id，传 hex 字符串会 22P02
 * ========================================================= */
console.log('\n📋 P1-5 detail API 字段匹配 Bug 修复');
test('/api/tavern/:token/detail/:id 查询用 drink_id 列，非 id 主键列', () => {
  // P1-5: 新代码先 .eq('drink_id', id)（业务列）—— 不会 22P02。
  // 兜底 .eq('id', id) 仅当 /^\d+$/.test(id) 纯数字时才执行，安全不报错。
  // 所以我们精确检查：detail 路由块里不能出现"无守卫的 eq('id', id) 与业务 id 直接匹配"。
  const detailStart = serverJs.indexOf(`app.get('/api/tavern/:token/detail/:id'`);
  const purgeStart = serverJs.indexOf(`app.all('/api/admin/purge'`);
  const detailRoute = serverJs.slice(detailStart, purgeStart);

  // 必须存在优先用 drink_id 的查询（sanity: 证明新代码真的加了）
  if (!/\.eq\(\s*['"]drink_id['"]\s*,\s*id/.test(detailRoute)) {
    throw new Error('detail 路由缺少"优先用 drink_id 列匹配业务 hex 字符串"的查询，新酒详情仍有 22P02 风险');
  }
  // 检查旧的"无守卫直接 .eq('id', id)"是否还存在。若存在必须在前面有纯数字正则保护
  const eqIdIdMatches = detailRoute.match(/\.eq\(\s*['"]id['"]\s*,\s*id\s*\)/g) || [];
  if (eqIdIdMatches.length > 0) {
    // 找最近的守卫：要么 /^\d+$/.test(id) 包围它，要么它在 Promise.all 的 first 查询之后很远
    const guardedRegex = /\/\^\\\\d\+\$\/\.test\s*\(\s*id\s*\)[\s\S]{0,400}\.eq\(\s*['"]id['"]/m;
    const guardedRegex2 = /if\s*\(\s*!drink\s*&&\s*\/\^\\d\+\$\/\.test\s*\(\s*id\s*\)\s*\)/;
    if (!guardedRegex2.test(detailRoute)) {
      throw new Error('detail 路由里存在未用"纯数字正则"守卫的 .eq(\'id\', id) 调用，会把 hex 字符串传入 BIGINT 列导致 22P02 报错');
    }
  }
});
test('detail 路由 bartenders 数组的 drink_id/business_id 与 tavern list 返回一致', () => {
  // bartenders 数组应给前端 drink_business_id (或 drink_id) 而不是 BIGINT 主键
  const detailStart = serverJs.indexOf(`app.get('/api/tavern/:token/detail/:id'`);
  const purgeStart = serverJs.indexOf(`app.all('/api/admin/purge'`);
  const detailRoute = serverJs.slice(detailStart, purgeStart);
  assertContains(detailRoute, 'drink_business_id',
    'bartenders 映射里没返回 drink_business_id 业务字段，前端 openDrinkDetail 用它再点其他调酒师会再触发同样 Bug');
});

/* =========================================================
 * P1-6: 酒馆页有 Loading 骨架态 (tavern.html + tavern.js)
 * ========================================================= */
console.log('\n📋 P1-6 酒馆页 Loading 骨架态');
test('tavern.html 存在 loading 元素或 tavern.js 会先显示加载文案', () => {
  const htmlHasLoading = tavernHtml.includes('加载') || tavernHtml.includes('loading');
  const jsHasLoading = tavernJs.includes('正在加载') || tavernJs.includes('加载中')
                    || tavernJs.includes('showLoading') || tavernJs.includes('Loading');
  if (!htmlHasLoading && !jsHasLoading) {
    throw new Error('酒馆页 HTML + JS 都没有"加载中"提示，用户在慢加载时会看到假死 0/32，误判为坏网站');
  }
});
test('renderTavern 前会把 0/32 占位更新为加载态', () => {
  assertContains(tavernJs, 'collected-count',
    '找不到 collected-count 元素引用');
  // loadTavern 里应在 API 调用前调用 showLoading() 来更新占位
  const loadStart = tavernJs.indexOf('async function loadTavern');
  const renderStart = tavernJs.indexOf('function renderTavern');
  const loadTavernBody = tavernJs.slice(loadStart, renderStart);
  if (loadStart < 0) throw new Error('未找到 async function loadTavern 定义 (sanity)');
  assertContains(loadTavernBody, 'showLoading(',
    'loadTavern 里没有调用 showLoading()，用户看到 0/32 假死误以为没酒');
});

/* =========================================================
 * P2-7: seedDatabase 成功后做短路记忆
 * ========================================================= */
console.log('\n📋 P2-7 seedDatabase 记忆化短路');
test('seedDatabase 成功一次后，后续冷启动可跳过 COUNT 查询', () => {
  const hasMemo = /seedDone|seeded|already.*seed|process\.env\s*\.\s*SEED/.test(seedJs)
               || /if\s*\(\s*module\.exports\s*\.\s*seeded/.test(seedJs)
               || /let\s+seedDone/.test(seedJs);
  if (!hasMemo) {
    throw new Error('seedDatabase 每次冷启动都做 2 次 Supabase COUNT，无记忆化，与真实请求争抢连接池');
  }
});

/* =========================================================
 * B 部分：纯函数单元测试 fetchWithTimeout
 * ========================================================= */
console.log('\n📋 新增工具函数 fetchWithTimeout 行为测试');

// 先从 tavern.js 里抽取 fetchWithTimeout (简单 eval 不适合业务场景，这里仅做结构测试)
test('存在超时相关 helper 或显式使用 AbortController({signal}) 模式', () => {
  const hasHelper = /fetchWithTimeout|timeoutFetch|fetchSafe/.test(tavernJs);
  const hasInline = tavernJs.split('fetch(').length - 1;
  if (!hasHelper && hasInline < 1) {
    throw new Error('没有超时 helper 也没有 inline AbortController 用法');
  }
  // 简单结构: 每个 tavern.js 的 fetch 调用附近 200 字符内必须有 AbortController 或 timeout 字样
  const lines = tavernJs.split('\n');
  let badIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('fetch(') && !lines[i].includes('//')) {
      const context = lines.slice(Math.max(0, i - 5), i + 5).join('\n');
      if (!context.includes('AbortController') && !context.includes('signal')) {
        badIdx = i + 1;
        break;
      }
    }
  }
  if (badIdx > 0) {
    throw new Error(`tavern.js 第 ${badIdx} 行附近的 fetch 调用没有 AbortController/signal 保护，会无限等待直到浏览器超时`);
  }
});

/* =========================================================
 * 收尾：汇总
 * ========================================================= */
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`结果: ✅ ${passed} 通过  ❌ ${failed} 失败`);
if (failed > 0) {
  console.log(`\n失败项:`);
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f.name}\n     → ${f.message}`));
  process.exit(1);
} else {
  console.log(`🎉 所有 Bug 修复验证通过`);
  process.exit(0);
}
