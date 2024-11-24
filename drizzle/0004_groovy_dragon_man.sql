CREATE TABLE IF NOT EXISTS "attendance_process" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "attendace_process_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD COLUMN "attendace_process_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "student_attendance" DROP COLUMN IF EXISTS "lesson_id";