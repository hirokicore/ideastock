import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeStock } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  let body: {
    title: string;
    source_platform: string;
    raw_text: string;
    human_note?: string;
    intent: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストデータが不正です' }, { status: 400 });
  }

  const { title, source_platform, raw_text, intent } = body;
  if (!title || !source_platform || !raw_text || !intent) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
  }

  try {
    const result = await analyzeStock(body);
    return NextResponse.json(result);
  } catch (err) {
    const detail = {
      name:    err instanceof Error ? err.name    : 'UnknownError',
      message: err instanceof Error ? err.message : String(err),
      status:  (err as Record<string, unknown>)['status']  ?? null,
      error:   (err as Record<string, unknown>)['error']   ?? null,
      cause:   (err as Record<string, unknown>)['cause']   ?? null,
      stack:   err instanceof Error ? (err.stack ?? null)  : null,
    };
    console.error('[/api/analyze] error:', detail);
    return NextResponse.json({ error: detail.message, detail }, { status: 500 });
  }
}
