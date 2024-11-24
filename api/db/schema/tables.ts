import { relations } from "drizzle-orm";
import { pgTable, text, integer, uuid, timestamp, primaryKey, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";


// Attendance Process Model
export const AttendanceProcessTable = pgTable('attendance_process', {
  id: uuid('id').primaryKey(),
  lesson_id: uuid('lesson_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  start_time: date('start_time'),
  end_time: date('end_time')
});

// Student Attendance Model
export const StudentAttendanceTable = pgTable('student_attendance', {
  id: uuid('id').primaryKey(),
  attendace_process_id: uuid("attendace_process_id").notNull(),
  student_id: uuid('student_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
});

// Faculty Model
export const FacultyTable = pgTable("faculties", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  dean: text("dean").notNull(),
});

// Direction Model
export const DirectionTable = pgTable("directions", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  faculty: uuid("faculty")
});

// Group Model
export const GroupTable = pgTable("groups", {
  id: uuid("id").primaryKey(),
  groupName: text("group_name").notNull(),
  direction: uuid("direction"),
  year: integer("year").notNull()
});

// Lesson database schema
export const LessonTable = pgTable('lesson', {
  id: uuid("id").primaryKey(),
  teacher_id: uuid("teacher_id").notNull(),
  subject_id: uuid("subject_id").notNull(),
  group_id: uuid("group_id").notNull(),
  attendance_process_id: uuid("attendace_process_id").notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date())
    .defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subject database schema
export const SubjectTable = pgTable('subject', {
  id: uuid('id').primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date())
    .defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Many to Many relation table between Subejct and Group
export const subjectsToTeacherTable = pgTable(
  'subjects_to_teacher',
  {
    subject_id: uuid('subject_id')
      .notNull()
      .references(() => SubjectTable.id),
    teacher_id: uuid('teacher_id')
      .notNull()
      .references(() => TeacherTable.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.teacher_id, t.subject_id] }),
  }),
);

// Many to Many relation table between Subejct and Group
export const subjectsToGroupsTable = pgTable(
  'subjects_to_groups',
  {
    subject_id: uuid('subject_id')
      .notNull()
      .references(() => SubjectTable.id),
    group_id: uuid('group_id')
      .notNull()
      .references(() => GroupTable.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.group_id, t.subject_id] }),
  }),
);

export const UserTable = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  student_id: uuid("student_id"),
  teacher_id: uuid("teacher_id"),
  role: text("role").notNull(),
});

export const TeacherTable = pgTable("teachers", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(),
});

export const StudentTable = pgTable("students", {
  id: uuid("id").primaryKey(),
  user_id: uuid("user_id").notNull(),
  group_id: text("group_id").notNull(),
});

export const studentRelatons = relations(StudentTable, ({ one }) => ({
  group: one(GroupTable, {
    fields: [StudentTable.group_id],
    references: [GroupTable.id],
  }),
  user: one(UserTable, {
    fields: [StudentTable.user_id],
    references: [UserTable.id],
  }),
}));

export const teacherRelatons = relations(TeacherTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [TeacherTable.user_id],
    references: [UserTable.id],
  }),
  subjectToTeacher: many(subjectsToTeacherTable),
}));

export const userRelation = relations(UserTable, ({ one }) => ({
  student: one(StudentTable, {
    fields: [UserTable.student_id],
    references: [StudentTable.id],
  }),
  teacher: one(TeacherTable, {
    fields: [UserTable.teacher_id],
    references: [TeacherTable.id],
  }),
}));

export const subjectRelations = relations(SubjectTable, ({ many }) => ({
  classes: many(LessonTable),
  subjectsTogroups: many(subjectsToGroupsTable),
  subjectToTeacher: many(subjectsToTeacherTable),
}));

export const lessonRelations = relations(LessonTable, ({ one }) => ({
  subject: one(SubjectTable, {
    fields: [LessonTable.subject_id],
    references: [SubjectTable.id],
  }),
  group: one(GroupTable, {
    fields: [LessonTable.group_id],
    references: [GroupTable.id],
  }),
  attendance_process: one(AttendanceProcessTable, {
    fields: [LessonTable.attendance_process_id],
    references: [AttendanceProcessTable.id],
  }),
}));


export const directionRelationsManyGroup = relations(DirectionTable, ({ many }) => ({
  groups: many(GroupTable),
}));

export const facultyRelationsManyDirections = relations(FacultyTable, ({ many }) => ({
  directions: many(DirectionTable),
}));


export const groupRelationsOneDirection = relations(GroupTable, ({ one }) => ({
  direction: one(DirectionTable, {
    fields: [GroupTable.direction],
    references: [DirectionTable.id],
  }),
}));

export const groupRelationsMany = relations(GroupTable, ({ many }) => ({
  subjectsTogroups: many(subjectsToGroupsTable),
  students: many(StudentTable)
}));

export const directionRelationsOneFaculty = relations(DirectionTable, ({ one }) => ({
  faculty: one(FacultyTable, {
    fields: [DirectionTable.faculty],
    references: [FacultyTable.id],
  }),
}));

export const subjectsToTeacherRelations = relations(subjectsToTeacherTable, ({ one }) => ({
  teacher: one(TeacherTable, {
    fields: [subjectsToTeacherTable.teacher_id],
    references: [TeacherTable.id],
  }),
  subject: one(SubjectTable, {
    fields: [subjectsToTeacherTable.subject_id],
    references: [SubjectTable.id],
  }),
}));

export const subjectsToGroupsRelations = relations(subjectsToGroupsTable, ({ one }) => ({
  group: one(GroupTable, {
    fields: [subjectsToGroupsTable.group_id],
    references: [GroupTable.id],
  }),
  subject: one(SubjectTable, {
    fields: [subjectsToGroupsTable.subject_id],
    references: [SubjectTable.id],
  }),
}));

export const attendanceProcessRelations = relations(AttendanceProcessTable, ({ many, one }) => ({
  lesson: one(LessonTable, {
    fields: [AttendanceProcessTable.lesson_id],
    references: [LessonTable.id],
  }),
  studentAttendance: many(StudentAttendanceTable)
}));

export const studentAttendanceRelations = relations(StudentAttendanceTable, ({ one }) => ({
  attendance_process: one(AttendanceProcessTable, {
    fields: [StudentAttendanceTable.attendace_process_id],
    references: [AttendanceProcessTable.id],
  }),

  student: one(StudentTable, {
    fields: [StudentAttendanceTable.student_id],
    references: [StudentTable.id],
  }),
}));


export const insertGroupSchema = createInsertSchema(GroupTable);
export const insertSubjectToGroupSchema = createInsertSchema(subjectsToGroupsTable);
export const insertDirectionSchema = createInsertSchema(DirectionTable);
export const insertFacultySchema = createInsertSchema(FacultyTable);
export const insertSubjectSchema = createInsertSchema(SubjectTable);
export const insertLessonSchema = createInsertSchema(LessonTable);
export const insertUserSchema = createInsertSchema(UserTable);
export const insertStudentSchema = createInsertSchema(StudentTable);
export const insertAttendanceProcess = createInsertSchema(AttendanceProcessTable);
export const insertTeacherSchema = createInsertSchema(TeacherTable);
export const insertStudentAttendanceSchema = createInsertSchema(StudentAttendanceTable);
