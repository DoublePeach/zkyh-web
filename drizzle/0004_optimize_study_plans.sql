-- 重构study_plans表，移除冗余列
-- 注意：此操作会删除overview、profession、targetTitle、subjectIds、disciplineIds、customSettings列的数据

-- 先备份可能需要的数据（可选，正式环境执行前请备份）
-- CREATE TABLE study_plans_backup AS SELECT * FROM study_plans;

-- 删除冗余列
ALTER TABLE "study_plans" 
DROP COLUMN IF EXISTS "overview",
DROP COLUMN IF EXISTS "profession",
DROP COLUMN IF EXISTS "target_title", 
DROP COLUMN IF EXISTS "subject_ids",
DROP COLUMN IF EXISTS "discipline_ids",
DROP COLUMN IF EXISTS "custom_settings";

-- 确保必需列存在并有默认值
ALTER TABLE "study_plans" ALTER COLUMN "plan_data" SET DEFAULT '{}'::jsonb; 