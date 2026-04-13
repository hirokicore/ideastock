import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recommendStocks } from '@/lib/claude';
import type { IdeaStock } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  let body: { goal: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストデータが不正です' }, { status: 400 });
  }

  const { goal } = body;
  if (!goal?.trim()) {
    return NextResponse.json({ error: 'やりたいことを入力してください' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('idea_stocks')
    .select('*')
    .eq('user_id', user.id)
    .order('recommend_score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const recommendations = await recommendStocks(goal, (data ?? []) as IdeaStock[]);
    return NextResponse.json({ recommendations });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '推薦に失敗しました' },
      { status: 500 }
    );
  }
}
