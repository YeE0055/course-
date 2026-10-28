import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const courseId = searchParams.get('course_id') || '';

    const client = getSupabaseClient();
    let query = client
      .from('exam_papers')
      .select('*, courses(name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (courseId) query = query.eq('course_id', courseId);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`查询失败: ${error.message}`);

    return NextResponse.json({ data, total: count || 0, page, pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, course_id, description, total_score, duration_minutes, question_ids } = body;

    if (!title || !course_id) {
      return NextResponse.json({ error: '试卷标题和课程不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data: paper, error: paperError } = await client
      .from('exam_papers')
      .insert({
        title,
        course_id,
        description,
        total_score: total_score || 100,
        duration_minutes: duration_minutes || 120,
        status: 'draft',
      })
      .select()
      .single();

    if (paperError) throw new Error(`创建试卷失败: ${paperError.message}`);

    if (question_ids && question_ids.length > 0) {
      const paperQuestions = question_ids.map((qid: string, idx: number) => ({
        paper_id: paper.id,
        question_id: qid,
        sort_order: idx + 1,
      }));
      const { error: pqError } = await client.from('exam_paper_questions').insert(paperQuestions);
      if (pqError) throw new Error(`添加题目失败: ${pqError.message}`);
    }

    return NextResponse.json({ data: paper }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
