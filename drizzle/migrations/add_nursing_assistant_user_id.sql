-- Add nursing_assistant_user_id column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nursing_assistant_user_id" text; 