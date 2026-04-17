'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Plus, List, LogOut, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const navLink = (href: string, label: string, Icon: React.ElementType) => (
    <Link
      href={href}
      className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors ${
        pathname === href
          ? 'bg-brand-50 text-brand-700 font-medium'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/stocks" className="flex items-center gap-2 font-bold text-lg text-brand-700">
          <Brain size={22} />
          IdeaStock
        </Link>

        <nav className="flex items-center gap-1">
          {navLink('/stocks', '一覧', List)}
          {navLink('/new', '新規登録', Plus)}
          <Link
            href="/lite"
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors ml-1 ${
              pathname.startsWith('/lite')
                ? 'bg-brand-50 text-brand-700 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Zap size={16} />
            Lite
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ml-1"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  );
}
