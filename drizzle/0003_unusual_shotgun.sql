CREATE TABLE IF NOT EXISTS "subjects_to_teacher" (
	"subject_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	CONSTRAINT "subjects_to_teacher_teacher_id_subject_id_pk" PRIMARY KEY("teacher_id","subject_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subjects_to_teacher" ADD CONSTRAINT "subjects_to_teacher_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subjects_to_teacher" ADD CONSTRAINT "subjects_to_teacher_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
