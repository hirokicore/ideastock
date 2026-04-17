'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import { LayoutDashboard, Plus, List, Map, RefreshCw } from 'lucide-react';

const NAV = [
  { href: '/lite',         label: 'ハブ',       Icon: LayoutDashboard },
  { href: '/lite/new',     label: '新規入力',    Icon: Plus },
  { href: '/lite/stocks',  label: '一覧',        Icon: List },
  { href: '/lite/map',     label: '処理マップ',  Icon: Map },
  { href: '/lite/rebuild', label: '再構築',      Icon: RefreshCw },
];

export default function LiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Lite sub-nav */}
      <div className="border-b sticky top-14 z-40" style={{ backgroundColor: '#1f1d38', borderColor: '#3a3660' }}>
        <div className="max-w-5xl mx-auto px-4 h-10 flex items-center gap-1">
          <span className="text-xs font-bold mr-3" style={{ color: '#8c82d4' }}>LITE</span>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  active
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-brand-50'
                }`}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
