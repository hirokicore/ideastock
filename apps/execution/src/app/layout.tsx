import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Execution',
  description: '事業計画を実行タスクに落とし込む',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
