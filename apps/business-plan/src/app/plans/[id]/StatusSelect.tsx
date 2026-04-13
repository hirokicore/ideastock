'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PlanStatus } from '@/types';

const OPTIONS: { value: PlanStatus; label: string }[] = [
  { value: 'draft',    label: '下書き' },
  { value: 'active',   label: '進行中' },
  { value: 'archived', label: 'アーカイブ' },
];

export default function StatusSelect({
  planId,
  initialStatus,
}: {
  planId: string;
  initialStatus: PlanStatus;
}) {
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const supabase = createClient();

  const handleChange = async (next: PlanStatus) => {
    setStatus(next);
    await supabase.from('business_plans').update({ status: next }).eq('id', planId);
  };

  const styles: Record<PlanStatus, string> = {
    active:   'bg-green-100 text-green-700',
    draft:    'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as PlanStatus)}
      className={`badge cursor-pointer border-0 outline-none font-medium ${styles[status]}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
