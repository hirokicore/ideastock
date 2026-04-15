import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Stack — ひろきのAI配線図',
  description: '自分用AIスタック配線図・ワークフロー管理ダッシュボード',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
