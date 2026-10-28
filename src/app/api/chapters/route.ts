import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const courseId = searchParams.get('course_id') || '';
    const parentId = searchParams.get('parent_id');

    const client = getSupabaseClient();
    let query = client
      .from('chapters')
      .select('*, courses(name)', { count: 'exact' })
      .order('sort_order');

    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (parentId !== undefined) {
      if (parentId === 'null') {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }
    }

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
    const { course_id, parent_id, name, sort_order, description } = body;

    if (!course_id || !name) {
      return NextResponse.json({ error: '课程ID和章节名称不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('chapters')
      .insert({
        course_id,
        parent_id: parent_id || null,
        name,
        sort_order: sort_order || 0,
        description,
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
