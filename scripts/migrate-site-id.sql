-- 迁移脚本：清空旧数据 + 添加 site_id 字段实现多站点数据隔离
-- 在 Supabase SQL Editor 中执行以下语句

-- 1. 清空所有调酒记录（目前有 2 杯测试数据）
DELETE FROM drinks;

-- 2. 添加 site_id 字段，用于区分不同站点的数据
ALTER TABLE drinks ADD COLUMN IF NOT EXISTS site_id TEXT DEFAULT 'default';

-- 3. 为 site_id 添加索引，提升查询性能
CREATE INDEX IF NOT EXISTS idx_drinks_site_id ON drinks(site_id);