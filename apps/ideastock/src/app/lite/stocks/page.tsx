import { createClient } from '@/lib/supabase/server';
import type { IdeaStock } from '@/types';
import LiteStocksClient from './LiteStocksClient';

export default async function LiteStocksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('idea_stocks')
    .select('id, title, summary, tags, intent, priority_category, time_slot, impact_score, recommend_score, lite_status, created_at')
    .order('created_at', { ascending: false });

  return <LiteStocksClient initialStocks={(data as IdeaStock[]) ?? []} />;
}
