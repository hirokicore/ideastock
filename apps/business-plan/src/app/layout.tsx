import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Business Plan',
  description: 'IdeaStock から事業計画を構築する',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
