-- 添加学习模式字段到用户表
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "study_mode" text DEFAULT 'normal'; 