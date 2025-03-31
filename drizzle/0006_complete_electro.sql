ALTER TABLE "attendance_process" ALTER COLUMN "start_time" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "attendance_process" ALTER COLUMN "start_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_process" ALTER COLUMN "end_time" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "attendance_process" ALTER COLUMN "end_time" SET NOT NULL;