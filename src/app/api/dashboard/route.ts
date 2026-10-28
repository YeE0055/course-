import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = getSupabaseClient();

    const [
      { count: courseCount },
      { count: chapterCount },
      { count: questionCount },
      { count: paperCount },
    ] = await Promise.all([
      client.from('courses').select('*', { count: 'exact', head: true }),
      client.from('chapters').select('*', { count: 'exact', head: true }),
      client.from('questions').select('*', { count: 'exact', head: true }),
      client.from('exam_papers').select('*', { count: 'exact', head: true }),
    ]);

    // Questions by course
    const { data: questionsByCourse } = await client
      .from('questions')
      .select('course_id, courses(name)');

    const courseMap = new Map<string, { name: string; count: number }>();
    if (questionsByCourse) {
      for (const q of questionsByCourse) {
        const name = (q.courses as unknown as { name: string } | null)?.name || '未知课程';
        const existing = courseMap.get(q.course_id);
        if (existing) {
          existing.count++;
        } else {
          courseMap.set(q.course_id, { name, count: 1 });
        }
      }
    }

    // Questions by type
    const { data: questionsByType } = await client
      .from('questions')
      .select('question_type_id, question_types(name)');

    const typeMap = new Map<string, { name: string; count: number }>();
    if (questionsByType) {
      for (const q of questionsByType) {
        const name = (q.question_types as unknown as { name: string } | null)?.name || '未知题型';
        const existing = typeMap.get(q.question_type_id);
        if (existing) {
          existing.count++;
        } else {
          typeMap.set(q.question_type_id, { name, count: 1 });
        }
      }
    }

    // Difficulty distribution
    const { data: difficultyData } = await client
      .from('questions')
      .select('difficulty');

    const diffMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (difficultyData) {
      for (const q of difficultyData) {
        if (q.difficulty >= 1 && q.difficulty <= 5) {
          diffMap[q.difficulty]++;
        }
      }
    }

    // Recent questions (last 10)
    const { data: recentQuestions } = await client
      .from('questions')
      .select('id, content, difficulty, created_at, courses(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      data: {
        overview: {
          courses: courseCount || 0,
          chapters: chapterCount || 0,
          questions: questionCount || 0,
          papers: paperCount || 0,
        },
        questionsByCourse: Array.from(courseMap.values()),
        questionsByType: Array.from(typeMap.values()),
        difficultyDistribution: Object.entries(diffMap).map(([level, count]) => ({
          level: `难度${level}`,
          count,
        })),
        recentQuestions: recentQuestions || [],
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
