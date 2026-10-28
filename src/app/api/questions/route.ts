import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const courseId = searchParams.get('course_id') || '';
    const chapterId = searchParams.get('chapter_id') || '';
    const questionTypeId = searchParams.get('question_type_id') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const keyword = searchParams.get('keyword') || '';

    const client = getSupabaseClient();
    let query = client
      .from('questions')
      .select('*, courses(name), chapters(name), question_types(name, code)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (courseId) query = query.eq('course_id', courseId);
    if (chapterId) query = query.eq('chapter_id', chapterId);
    if (questionTypeId) query = query.eq('question_type_id', questionTypeId);
    if (difficulty) query = query.eq('difficulty', parseInt(difficulty));
    if (keyword) query = query.ilike('content', `%${keyword}%`);

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
    const { course_id, chapter_id, question_type_id, content, options, answer, analysis, difficulty, score, tags } = body;

    if (!course_id || !chapter_id || !question_type_id || !content || !answer) {
      return NextResponse.json({ error: '课程、章节、题型、题目内容和答案不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('questions')
      .insert({
        course_id,
        chapter_id,
        question_type_id,
        content,
        options: options || null,
        answer,
        analysis,
        difficulty: difficulty || 3,
        score: score || 5,
        tags: tags || null,
      })
      .select()
      .single();

    if (error) throw new Error(`创建失败: ${error.message}`);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
