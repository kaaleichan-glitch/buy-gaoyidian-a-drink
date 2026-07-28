const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { db, initDatabase } = require('./database');
const { seedDatabase } = require('./data/seed');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_APP_SITE_ID = process.env.APP_APP_SITE_ID || 'default';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

initDatabase();
// 异步执行数据库自动播种(Seeding)
seedDatabase().catch(err => console.error('🔴 数据库初始化播种失败:', err));

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// 异步进行酒谱匹配
async function matchDrinkRecipe(tagList) {
  const { data: recipes, error } = await db.from('drink_recipes').select('*');
  if (error) throw error;
  
  const tagWeights = {};
  for (const tag of tagList) {
    tagWeights[tag] = (tagWeights[tag] || 0) + 1;
  }

  let bestScore = -1;
  let bestRecipes = [];

  for (const recipe of recipes) {
    // Supabase PostgreSQL JSONB 格式直返，不需要 JSON.parse
    const recipeTags = Array.isArray(recipe.tags) ? recipe.tags : JSON.parse(recipe.tags || '[]');
    let score = 0;
    for (const tag of recipeTags) {
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
    tags: Array.isArray(winner.tags) ? winner.tags : JSON.parse(winner.tags || '[]'),
    ingredients: Array.isArray(winner.ingredients) ? winner.ingredients : JSON.parse(winner.ingredients || '[]'),
    score: bestScore
  };
}

// 1. 获取问答库 API
app.get('/api/questions', async (req, res) => {
  try {
    const { data: questions, error } = await db
      .from('questions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const result = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      sort_order: q.sort_order,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
    }));
    
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. 获取所有配方模板 API
app.get('/api/recipes', async (req, res) => {
  try {
    const { data: recipes, error } = await db.from('drink_recipes').select('*');
    if (error) throw error;

    const result = recipes.map(r => ({
      id: r.id,
      drink_name: r.drink_name,
      english_name: r.english_name,
      drink_type: r.drink_type,
      image: r.image,
      story: r.story,
      tags: Array.isArray(r.tags) ? r.tags : JSON.parse(r.tags || '[]'),
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : JSON.parse(r.ingredients || '[]')
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. 匹配并保存调配结果 API
app.post('/api/match', async (req, res) => {
  try {
    const { answers, bartender_name, owner_token } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, error: '请提供回答' });
    }
    if (!bartender_name || !bartender_name.trim()) {
      return res.status(400).json({ success: false, error: '请提供调酒师名字' });
    }

    const allTags = [];
    for (const answer of answers) {
      if (answer.tags && Array.isArray(answer.tags)) {
        allTags.push(...answer.tags);
      }
    }

    // 匹配酒谱
    const matched = await matchDrinkRecipe(allTags);

    const drinkId = generateId();
    const finalOwnerToken = owner_token || generateToken();

    // 插入数据到 Supabase
    const { error: insertError } = await db
      .from('drinks')
      .insert([{
        id: drinkId,
        owner_token: finalOwnerToken,
        recipe_id: matched.id,
        bartender_name: bartender_name.trim(),
        answers: answers,
        tags: allTags,
        site_id: APP_SITE_ID
      }]);

    if (insertError) throw insertError;

    res.json({
      success: true,
      data: {
        drink_id: drinkId,
        owner_token: finalOwnerToken,
        recipe: {
          id: matched.id,
          drink_name: matched.drink_name,
          english_name: matched.english_name,
          drink_type: matched.drink_type,
          image: matched.image,
          story: matched.story,
          ingredients: matched.ingredients,
          tags: matched.tags
        },
        bartender_name: bartender_name.trim(),
        match_score: matched.score
      }
    });
  } catch (err) {
    console.error('匹配失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. 保存手动调制结果 API
app.post('/api/drinks', async (req, res) => {
  try {
    const { id, owner_token, recipe_id, bartender_name, answers, tags, created_at } = req.body;

    if (!id || !owner_token || !recipe_id || !bartender_name) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const { data: existing, error: checkError } = await db
      .from('drinks')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return res.status(409).json({ success: false, error: '酒记录已存在' });
    }

    const { error: insertError } = await db
      .from('drinks')
      .insert([{
        id,
        owner_token,
        recipe_id,
        bartender_name: bartender_name.trim(),
        answers: answers || [],
        tags: tags || [],
        created_at: created_at || new Date().toISOString(),
        site_id: APP_SITE_ID
      }]);

    if (insertError) throw insertError;

    // 查询配方和刚刚插入的酒记录
    const { data: recipe, error: recipeError } = await db
      .from('drink_recipes')
      .select('*')
      .eq('id', recipe_id)
      .single();

    if (recipeError) throw recipeError;

    res.json({
      success: true,
      data: {
        drink_id: id,
        bartender_name: bartender_name.trim(),
        recipe: {
          id: recipe.id,
          drink_name: recipe.drink_name,
          english_name: recipe.english_name,
          drink_type: recipe.drink_type,
          image: recipe.image,
          story: recipe.story,
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]'),
          tags: Array.isArray(recipe.tags) ? recipe.tags : JSON.parse(recipe.tags || '[]')
        }
      }
    });
  } catch (err) {
    console.error('保存失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. 获取某杯调配详情 API
app.get('/api/drink/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: drink, error: drinkError } = await db
      .from('drinks')
      .select('*')
      .eq('id', id)
      .eq('site_id', APP_SITE_ID)
      .single();

    if (drinkError || !drink) {
      return res.status(404).json({ success: false, error: '酒记录不存在' });
    }

    const { data: recipe, error: recipeError } = await db
      .from('drink_recipes')
      .select('*')
      .eq('id', drink.recipe_id)
      .single();

    if (recipeError || !recipe) {
      return res.status(404).json({ success: false, error: '酒谱不存在' });
    }

    res.json({
      success: true,
      data: {
        drink_id: drink.id,
        bartender_name: drink.bartender_name,
        created_at: drink.created_at,
        recipe: {
          id: recipe.id,
          drink_name: recipe.drink_name,
          english_name: recipe.english_name,
          drink_type: recipe.drink_type,
          image: recipe.image,
          story: recipe.story,
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]'),
          tags: Array.isArray(recipe.tags) ? recipe.tags : JSON.parse(recipe.tags || '[]')
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. 获取私人酒架历史记录（带左外连接匹配，统计解锁状态）
app.get('/api/tavern/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // 获取所有酒谱模板
    const { data: recipes, error: rError } = await db
      .from('drink_recipes')
      .select('*')
      .order('id', { ascending: true });

    if (rError) throw rError;

    // 获取该 token 下的所有解锁过的酒，并联合查询酒谱详情
    const { data: drinks, error: dError } = await db
      .from('drinks')
      .select('*, drink_recipes(*)')
      .eq('owner_token', token)
      .eq('site_id', APP_SITE_ID)
      .order('created_at', { ascending: false });

    if (dError) throw dError;

    const collectedMap = {};
    drinks.forEach(d => {
      if (!collectedMap[d.recipe_id] || new Date(d.created_at) > new Date(collectedMap[d.recipe_id].created_at)) {
        collectedMap[d.recipe_id] = d;
      }
    });

    const result = recipes.map(r => {
      const collected = collectedMap[r.id];
      if (collected) {
        return {
          recipe_id: r.id,
          drink_id: collected.id,
          bartender_name: collected.bartender_name,
          created_at: collected.created_at,
          drink_name: r.drink_name,
          english_name: r.english_name,
          drink_type: r.drink_type,
          image: r.image,
          collected: true
        };
      } else {
        return {
          recipe_id: r.id,
          drink_id: null,
          bartender_name: null,
          created_at: null,
          drink_name: r.drink_name,
          english_name: r.english_name,
          drink_type: r.drink_type,
          image: r.image,
          collected: false
        };
      }
    });

    res.json({ 
      success: true, 
      data: result, 
      all_drinks: drinks,
      total: recipes.length, 
      collected_count: Object.keys(collectedMap).length 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. 获取单杯特配酒解锁故事详情 API
app.get('/api/tavern/:token/detail/:id', async (req, res) => {
  try {
    const { token, id } = req.params;
    
    const { data: drink, error: dError } = await db
      .from('drinks')
      .select('*, drink_recipes(*)')
      .eq('id', id)
      .eq('owner_token', token)
      .eq('site_id', APP_SITE_ID)
      .single();

    if (dError || !drink) {
      return res.status(404).json({ success: false, error: '酒不存在或无权访问' });
    }

    const recipe = drink.drink_recipes;

    res.json({
      success: true,
      data: {
        drink_id: drink.id,
        bartender_name: drink.bartender_name,
        created_at: drink.created_at,
        answers: Array.isArray(drink.answers) ? drink.answers : JSON.parse(drink.answers || '[]'),
        tags: Array.isArray(drink.tags) ? drink.tags : JSON.parse(drink.tags || '[]'),
        recipe: {
          id: recipe.id,
          drink_name: recipe.drink_name,
          english_name: recipe.english_name,
          drink_type: recipe.drink_type,
          image: recipe.image,
          story: recipe.story,
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : JSON.parse(recipe.ingredients || '[]'),
          tags: Array.isArray(recipe.tags) ? recipe.tags : JSON.parse(recipe.tags || '[]')
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. 线上后台数据一键清空 API (支持 GET 和 POST，方便管理员直接在浏览器中打开网址清除数据)
app.all('/api/admin/purge', async (req, res) => {
  try {
    const systemAdminKey = process.env.ADMIN_KEY || 'gaoyidian_clear';
    const clientKey = req.headers['x-admin-key'] || req.body.admin_key || req.query.admin_key;

    if (!clientKey) {
      return res.status(401).json({ success: false, error: '未授权：请提供管理员密钥。' });
    }

    if (clientKey !== systemAdminKey) {
      return res.status(403).json({ success: false, error: '拒绝访问：密钥不正确。' });
    }

    // 清空 drinks 表中所有测试调酒数据（针对文本类型的 owner_token 进行不等于过滤，避免 id 列作为 bigint 时对空字符串 '' 的强制转换报错）
    const { error } = await db
      .from('drinks')
      .delete()
      .eq('site_id', APP_SITE_ID)
      .neq('owner_token', '_clear_all_records_');

    if (error) throw error;

    console.log(`🔒 管理员通过 API 成功调用了一键清空，Supabase 所有测试数据已被安全抹去。`);
    
    res.json({ 
      success: true, 
      message: '🎉 成功！Supabase 上的所有测试调酒记录已安全清空，高一点的私人酒柜已重置为最纯净状态。' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. 渲染私人酒馆页面静态路径
app.get('/tavern', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tavern.html'));
});

// 仅在本地非 Vercel 环境下执行 app.listen (Vercel 会作为 Serverless 处理器自动托管)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🍸 请高一点喝一杯 服务器已启动`);
    console.log(`📍 本地地址: http://localhost:${PORT}`);
  });
}

// 导出模块以供 Vercel 无缝加载
module.exports = app;
