import { pgTable, serial, timestamp, varchar, text, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 课程表
export const courses = pgTable(
  "courses",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    credit: integer("credit").default(0),
    teacher: varchar("teacher", { length: 100 }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("courses_code_idx").on(table.code),
    index("courses_status_idx").on(table.status),
    index("courses_created_at_idx").on(table.created_at),
  ]
);

// 章节表
export const chapters = pgTable(
  "chapters",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    course_id: varchar("course_id", { length: 36 }).notNull().references(() => courses.id, { onDelete: "cascade" }),
    parent_id: varchar("parent_id", { length: 36 }),
    name: varchar("name", { length: 200 }).notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chapters_course_id_idx").on(table.course_id),
    index("chapters_parent_id_idx").on(table.parent_id),
    index("chapters_sort_order_idx").on(table.sort_order),
  ]
);

// 题型表
export const question_types = pgTable(
  "question_types",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull().unique(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    default_score: integer("default_score").notNull().default(5),
    has_options: varchar("has_options", { length: 10 }).notNull().default("false"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("question_types_code_idx").on(table.code),
  ]
);

// 题目表（题库）
export const questions = pgTable(
  "questions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    course_id: varchar("course_id", { length: 36 }).notNull().references(() => courses.id, { onDelete: "cascade" }),
    chapter_id: varchar("chapter_id", { length: 36 }).notNull().references(() => chapters.id, { onDelete: "cascade" }),
    question_type_id: varchar("question_type_id", { length: 36 }).notNull().references(() => question_types.id),
    content: text("content").notNull(),
    options: jsonb("options"),
    answer: text("answer").notNull(),
    analysis: text("analysis"),
    difficulty: integer("difficulty").notNull().default(3),
    score: integer("score").notNull().default(5),
    tags: jsonb("tags"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("questions_course_id_idx").on(table.course_id),
    index("questions_chapter_id_idx").on(table.chapter_id),
    index("questions_question_type_id_idx").on(table.question_type_id),
    index("questions_difficulty_idx").on(table.difficulty),
    index("questions_status_idx").on(table.status),
    index("questions_created_at_idx").on(table.created_at),
  ]
);

// 试卷表
export const exam_papers = pgTable(
  "exam_papers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 300 }).notNull(),
    course_id: varchar("course_id", { length: 36 }).notNull().references(() => courses.id),
    description: text("description"),
    total_score: integer("total_score").notNull().default(100),
    duration_minutes: integer("duration_minutes").notNull().default(120),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    config: jsonb("config"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("exam_papers_course_id_idx").on(table.course_id),
    index("exam_papers_status_idx").on(table.status),
    index("exam_papers_created_at_idx").on(table.created_at),
  ]
);

// 试卷-题目关联表
export const exam_paper_questions = pgTable(
  "exam_paper_questions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    paper_id: varchar("paper_id", { length: 36 }).notNull().references(() => exam_papers.id, { onDelete: "cascade" }),
    question_id: varchar("question_id", { length: 36 }).notNull().references(() => questions.id, { onDelete: "cascade" }),
    sort_order: integer("sort_order").notNull().default(0),
    score: integer("score").notNull().default(5),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("exam_paper_questions_paper_id_idx").on(table.paper_id),
    index("exam_paper_questions_question_id_idx").on(table.question_id),
    index("exam_paper_questions_sort_order_idx").on(table.sort_order),
  ]
);
