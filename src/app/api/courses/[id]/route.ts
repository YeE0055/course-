import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const client = getSupabaseClient();

    if (id) {
      const { data, error } = await client
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`查询失败: ${error.message}`);
      return NextResponse.json({ data });
    }

    const { data, error } = await client
      .from('courses')
      .select('id, name, code')
      .order('name');
    if (error) throw new Error(`查询失败: ${error.message}`);
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少课程ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新失败: ${error.message}`);
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少课程ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { error } = await client.from('courses').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
