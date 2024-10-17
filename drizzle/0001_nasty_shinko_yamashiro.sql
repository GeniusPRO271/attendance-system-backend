CREATE TABLE IF NOT EXISTS "student_attendance" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lesson_id" uuid,
	"student_id" uuid,
	"status" varchar(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ALTER COLUMN "user_id" SET NOT NULL;