import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Intent, RelatedProject } from '@/types';

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

  let body: { intent?: Intent; related_project?: RelatedProject };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストデータが不正です' }, { status: 400 });
  }

  const allowedIntents: Intent[] = ['商品化', '検討中', 'メモ'];
  const allowedProjects: RelatedProject[] = ['TrainerDocs', 'IdeaStock', 'その他'];

  const update: Partial<{ intent: Intent; related_project: RelatedProject }> = {};
  if (body.intent !== undefined) {
    if (!allowedIntents.includes(body.intent)) {
      return NextResponse.json({ error: '用途の値が不正です' }, { status: 400 });
    }
    update.intent = body.intent;
  }
  if (body.related_project !== undefined) {
    if (!allowedProjects.includes(body.related_project)) {
      return NextResponse.json({ error: '関連PJの値が不正です' }, { status: 400 });
    }
    update.related_project = body.related_project;
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
