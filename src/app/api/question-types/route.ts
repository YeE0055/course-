import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('question_types')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(`查询失败: ${error.message}`);
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, default_score, has_options } = body;

    if (!name || !code) {
      return NextResponse.json({ error: '题型名称和编码不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('question_types')
      .insert({
        name,
        code,
        description,
        default_score: default_score || 5,
        has_options: has_options || 'false',
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
