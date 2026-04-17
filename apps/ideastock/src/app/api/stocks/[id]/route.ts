import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Intent, RelatedProject, PriorityCategory, TimeSlot, LiteStatus } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  let body: {
    intent?: Intent;
    related_project?: RelatedProject;
    priority_category?: PriorityCategory;
    time_slot?: TimeSlot;
    lite_status?: LiteStatus;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストデータが不正です' }, { status: 400 });
  }

  const allowed = {
    intent: ['商品化', '検討中', 'メモ'] as Intent[],
    related_project: ['TrainerDocs', 'IdeaStock', 'その他'] as RelatedProject[],
    priority_category: ['今すぐ', '仕込み', '挑戦'] as PriorityCategory[],
    time_slot: ['今月', '3ヶ月以内', '半年〜', 'いつか'] as TimeSlot[],
    lite_status: ['未整理', '軽処理済み', '外部AI処理待ち', '入力戻し待ち', '詳細化済み', '要修正'] as LiteStatus[],
  };

  const update: Record<string, string> = {};

  if (body.intent !== undefined) {
    if (!allowed.intent.includes(body.intent)) return NextResponse.json({ error: '用途の値が不正です' }, { status: 400 });
    update.intent = body.intent;
  }
  if (body.related_project !== undefined) {
    if (!allowed.related_project.includes(body.related_project)) return NextResponse.json({ error: '関連PJの値が不正です' }, { status: 400 });
    update.related_project = body.related_project;
  }
  if (body.priority_category !== undefined) {
    if (!allowed.priority_category.includes(body.priority_category)) return NextResponse.json({ error: 'カテゴリの値が不正です' }, { status: 400 });
    update.priority_category = body.priority_category;
  }
  if (body.time_slot !== undefined) {
    if (!allowed.time_slot.includes(body.time_slot)) return NextResponse.json({ error: '時期の値が不正です' }, { status: 400 });
    update.time_slot = body.time_slot;
  }
  if (body.lite_status !== undefined) {
    if (!allowed.lite_status.includes(body.lite_status)) return NextResponse.json({ error: 'Liteステータスの値が不正です' }, { status: 400 });
    update.lite_status = body.lite_status;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '更新するフィールドがありません' }, { status: 400 });
  }

  const { error } = await supabase
    .from('idea_stocks')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
