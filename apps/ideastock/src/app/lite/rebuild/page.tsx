import { createClient } from '@/lib/supabase/server';
import type { IdeaStock } from '@/types';
import RebuildClient from './RebuildClient';

export default async function RebuildPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('idea_stocks')
    .select('*')
    .order('created_at', { ascending: false });

  return <RebuildClient stocks={(data as IdeaStock[]) ?? []} />;
}
