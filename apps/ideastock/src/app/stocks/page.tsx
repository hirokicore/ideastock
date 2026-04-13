import { createClient } from '@/lib/supabase/server';
import StocksClient from './StocksClient';
import type { IdeaStock } from '@/types';

export default async function StocksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('idea_stocks')
    .select('*')
    .order('created_at', { ascending: false });

  return <StocksClient initialStocks={(data as IdeaStock[]) ?? []} />;
}
