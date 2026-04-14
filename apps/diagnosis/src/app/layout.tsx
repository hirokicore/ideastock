import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '生きづらさタイプ診断',
  description: '名前と誕生日だけで、あなたの「生きにくさのパターン」がわかる。8タイプのうちあなたはどれ？',
  openGraph: {
    title: '生きづらさタイプ診断',
    description: '名前と誕生日だけで、あなたの「生きにくさのパターン」がわかる。',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #eff6ff 100%)' }}>
        {children}
      </body>
    </html>
  );
}
