CREATE TABLE "exam_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"weight" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nursing_disciplines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"discipline_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"chapter_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"difficulty" integer NOT NULL,
	"importance" integer NOT NULL,
	"keywords" text[],
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_banks" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"year" integer,
	"total_questions" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_bank_id" integer NOT NULL,
	"knowledge_point_id" integer,
	"question_type" text NOT NULL,
	"content" text NOT NULL,
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"explanation" text NOT NULL,
	"difficulty" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "knowledge_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"daily_task_id" integer NOT NULL,
	"knowledge_point_id" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "subject_ids" integer[];--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "discipline_ids" integer[];--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "exam_year" integer;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "custom_settings" jsonb;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_discipline_id_nursing_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."nursing_disciplines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_points" ADD CONSTRAINT "knowledge_points_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_points" ADD CONSTRAINT "knowledge_points_subject_id_exam_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_banks" ADD CONSTRAINT "test_banks_subject_id_exam_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_test_bank_id_test_banks_id_fk" FOREIGN KEY ("test_bank_id") REFERENCES "public"."test_banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_knowledge_point_id_knowledge_points_id_fk" FOREIGN KEY ("knowledge_point_id") REFERENCES "public"."knowledge_points"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_tasks" ADD CONSTRAINT "knowledge_tasks_daily_task_id_daily_tasks_id_fk" FOREIGN KEY ("daily_task_id") REFERENCES "public"."daily_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_tasks" ADD CONSTRAINT "knowledge_tasks_knowledge_point_id_knowledge_points_id_fk" FOREIGN KEY ("knowledge_point_id") REFERENCES "public"."knowledge_points"("id") ON DELETE no action ON UPDATE no action;