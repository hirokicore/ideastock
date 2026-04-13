import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractVariation } from '@/lib/claude';
import type { Variation } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await request.json() as {
    title: string;
    summary: string;
    idea_list: string[];
  };

  // Fetch existing stock
  const { data: stock, error: fetchError } = await supabase
    .from('idea_stocks')
    .select('title, summary, variations')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !stock) {
    return NextResponse.json({ error: 'ストックが見つかりません' }, { status: 404 });
  }

  // Extract diff via Claude
  const { diff_points, shared_core } = await extractVariation(
    { title: stock.title, summary: stock.summary },
    { title: body.title, summary: body.summary, idea_list: body.idea_list }
  );

  const newVariation: Variation = {
    title: body.title,
    diff_points,
    shared_core,
    merged_at: new Date().toISOString(),
  };

  const currentVariations: Variation[] = stock.variations ?? [];
  const updatedVariations = [...currentVariations, newVariation];

  const { error: updateError } = await supabase
    .from('idea_stocks')
    .update({ variations: updatedVariations })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
