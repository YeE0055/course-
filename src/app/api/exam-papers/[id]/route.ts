import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { data: paper, error: paperError } = await client
      .from('exam_papers')
      .select('*, courses(name)')
      .eq('id', id)
      .maybeSingle();

    if (paperError) throw new Error(`查询试卷失败: ${paperError.message}`);
    if (!paper) return NextResponse.json({ error: '试卷不存在' }, { status: 404 });

    const { data: questions, error: qError } = await client
      .from('exam_paper_questions')
      .select('*, questions(*, question_types(name, code), chapters(name))')
      .eq('paper_id', id)
      .order('sort_order');

    if (qError) throw new Error(`查询题目失败: ${qError.message}`);

    return NextResponse.json({ data: { ...paper, questions } });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, question_ids, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少试卷ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('exam_papers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新失败: ${error.message}`);

    if (question_ids) {
      await client.from('exam_paper_questions').delete().eq('paper_id', id);
      if (question_ids.length > 0) {
        const paperQuestions = question_ids.map((qid: string, idx: number) => ({
          paper_id: id,
          question_id: qid,
          sort_order: idx + 1,
        }));
        const { error: pqError } = await client.from('exam_paper_questions').insert(paperQuestions);
        if (pqError) throw new Error(`更新题目失败: ${pqError.message}`);
      }
    }

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { error } = await client.from('exam_papers').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
