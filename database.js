const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取 Supabase 连接配置
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ 警告: 缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量！');
  console.warn('如果您是在本地运行，请在 .env 文件中配置这些变量。如果您已部署至 Vercel，请在 Vercel 仪表板中配置 Environment Variables。');
}

// 初始化 Supabase 客户端
const db = createClient(supabaseUrl, supabaseKey);

function initDatabase() {
  console.log('📡 Supabase 数据库客户端已就绪');
  return db;
}

module.exports = { db, initDatabase };
