import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IdeaStock — 思考ストックツール',
  description: 'AIとの会話・自分のメモを放り込むだけで、自動で整理・評価・商品候補化してくれる自分専用ツール。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
