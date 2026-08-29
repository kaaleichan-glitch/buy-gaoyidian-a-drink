const { db } = require('../database');
const { QUESTIONS, DRINK_RECIPES } = require('./seedData');

/** 记忆化标记：成功完成一次播种检查后，冷启动不再重复 COUNT 查询。 */
let seedDone = false;

/**
 * 深度比较两个值是否相等（支持原始类型 + JSON 序列化对象/数组，
 * 足以覆盖 ingredients、tags、options 等 jsonb 列）。
 */
function deepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (_) {
    return false;
  }
}

async function seedDatabase() {
  if (seedDone) return; // P2-7: 短路，避免每次冷启动争抢 Supabase 连接
  try {
    // 1. 检查并播种问题库
    const { count: questionCount, error: qError } = await db
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (qError) {
      console.warn('⚠️ 无法检查 questions 表，可能该表尚未在 Supabase 中创建。请先在 SQL Editor 中运行表创建脚本。');
      return;
    }

    if (questionCount === 0) {
      console.log('正在向 Supabase 插入初始问题库...');
      const payload = QUESTIONS.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options, // postgres jsonb 完美直存对象/数组，不需手动 JSON.stringify
        sort_order: q.sort_order
      }));

      const { error: insertQError } = await db.from('questions').insert(payload);
      if (insertQError) throw insertQError;
      console.log(`🎉 成功！已向 Supabase 播种 ${QUESTIONS.length} 个问题`);
    } else {
      console.log(`📡 Supabase 问题库已存在 (${questionCount} 个问题)，跳过播种`);
    }

    // 2. 检查并播种/同步鸡尾酒配方模板
    //    —— 不再只是"0 条才插"，而是对已存在数据按 id 对比修正，
    //       避免 story/drink_name/ingredients 等字段被污染后一直错下去。
    const { data: existingRecipes, error: rError } = await db
      .from('drink_recipes')
      .select('*')
      .order('id', { ascending: true });

    if (rError) throw rError;

    const recipeCount = existingRecipes ? existingRecipes.length : 0;

    if (recipeCount === 0) {
      console.log('正在向 Supabase 插入初始酒谱库...');
      const payload = DRINK_RECIPES.map(r => ({
        id: r.id,
        drink_name: r.drink_name,
        english_name: r.english_name,
        drink_type: r.drink_type,
        image: r.image || '',
        story: r.story,
        tags: [],
        ingredients: r.ingredients // jsonb 完美直存
      }));

      const { error: insertRError } = await db.from('drink_recipes').insert(payload);
      if (insertRError) throw insertRError;
      console.log(`🎉 成功！已向 Supabase 播种 ${DRINK_RECIPES.length} 个鸡尾酒配方模板`);
    } else {
      console.log(`📡 Supabase 鸡尾酒配方库已存在 (${recipeCount} 个配方)，开始逐行比对同步…`);

      // 以 id 建索引方便 O(1) 查找
      const byId = new Map((existingRecipes || []).map(r => [r.id, r]));
      let fixedCount = 0;

      for (const expected of DRINK_RECIPES) {
        const row = byId.get(expected.id);
        if (!row) {
          // 缺行：补插（通常不会发生，除非有人手动删了某条）
          console.log(`  🧩 id=${expected.id} 缺失，补插入 ${expected.drink_name}`);
          const { error } = await db.from('drink_recipes').insert({
            id: expected.id,
            drink_name: expected.drink_name,
            english_name: expected.english_name,
            drink_type: expected.drink_type,
            image: expected.image || '',
            story: expected.story,
            tags: [],
            ingredients: expected.ingredients
          });
          if (error) console.warn(`    ⚠️ 插入失败:`, error.message);
          else fixedCount++;
          continue;
        }

        // 按字段对比，仅收集有差异的列，避免无意义 UPDATE
        const patch = {};
        if (row.drink_name !== expected.drink_name)      patch.drink_name    = expected.drink_name;
        if (row.english_name !== expected.english_name)  patch.english_name  = expected.english_name;
        if (row.drink_type !== expected.drink_type)      patch.drink_type    = expected.drink_type;
        const expectedImg = expected.image || '';
        if ((row.image || '') !== expectedImg)            patch.image         = expectedImg;
        if (row.story !== expected.story)                 patch.story         = expected.story;
        // tags 目标值永远是 []；先把行值规范化成对象再深比较
        const rowTagsNorm = Array.isArray(row.tags)
          ? row.tags
          : (typeof row.tags === 'string' && row.tags ? JSON.parse(row.tags) : []);
        if (!deepEqual(rowTagsNorm, [])) patch.tags = [];
        // ingredients 同样先规范化再比较（Supabase jsonb 回来通常是数组，但防字符串）
        const rowIngNorm = Array.isArray(row.ingredients)
          ? row.ingredients
          : (typeof row.ingredients === 'string' && row.ingredients ? JSON.parse(row.ingredients) : []);
        if (!deepEqual(rowIngNorm, expected.ingredients)) {
          patch.ingredients = expected.ingredients;
        }

        if (Object.keys(patch).length > 0) {
          const diffs = Object.keys(patch).map(k => {
            if (k === 'story') return `story(${JSON.stringify(row.story)}→${JSON.stringify(expected.story).slice(0, 60)}${expected.story.length > 30 ? '…' : ''})`;
            if (k === 'ingredients') return 'ingredients(已修正)';
            return `${k}(${JSON.stringify(row[k])}→${JSON.stringify(patch[k]).slice(0, 80)})`;
          }).join(', ');
          console.log(`  ✏️  id=${expected.id} ${expected.drink_name} 同步字段: ${diffs}`);
          const { error } = await db
            .from('drink_recipes')
            .update(patch)
            .eq('id', expected.id);
          if (error) console.warn(`    ⚠️ UPDATE 失败:`, error.message);
          else fixedCount++;
        }
      }

      if (fixedCount === 0) {
        console.log(`✅ 32 杯酒的配方与数据库完全一致，无需修正。`);
      } else {
        console.log(`🔧 同步完成：修复/补插了 ${fixedCount} 条配方记录（含 story 文案一致性）。`);
      }
    }

    seedDone = true; // 两轮检查+播种+同步都通过才置位
  } catch (err) {
    console.error('🔴 Supabase 数据库播种/同步失败:', err.message);
  }
}

module.exports = { seedDatabase };
