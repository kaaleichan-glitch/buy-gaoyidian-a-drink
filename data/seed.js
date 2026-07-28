const { db } = require('../database');
const { QUESTIONS, DRINK_RECIPES } = require('./seedData');

async function seedDatabase() {
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

    // 2. 检查并播种鸡尾酒配方模板
    const { count: recipeCount, error: rError } = await db
      .from('drink_recipes')
      .select('*', { count: 'exact', head: true });

    if (rError) throw rError;

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
      console.log(`📡 Supabase 鸡尾酒配方库已存在 (${recipeCount} 个配方)，跳过播种`);
    }
  } catch (err) {
    console.error('🔴 Supabase 数据库播种失败:', err.message);
  }
}

module.exports = { seedDatabase };
