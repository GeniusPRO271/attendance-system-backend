ALTER TABLE "users" ADD COLUMN "device_uuid" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "device_lastChange" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN IF EXISTS "device_uuid";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN IF EXISTS "device_lastChange";