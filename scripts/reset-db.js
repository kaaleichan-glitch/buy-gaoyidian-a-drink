const { db } = require('../database');

console.log('正在清空 Supabase 上的测试数据...');
(async () => {
  try {
    const { error } = await db
      .from('drinks')
      .delete()
      .neq('owner_token', '_clear_all_records_'); // 清空所有行的 drinks 数据，避免 bigint 转型报错

    if (error) throw error;

    console.log('🎉 成功！已清空 Supabase 上的所有测试调酒记录。');
    process.exit(0);
  } catch (err) {
    console.error('🔴 清空 Supabase 测试数据失败:', err.message);
    process.exit(1);
  }
})();
