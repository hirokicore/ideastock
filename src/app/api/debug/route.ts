import { NextResponse } from 'next/server';

// 一時的なデバッグエンドポイント（env var の設定確認用）
// 確認後は削除する
export async function GET() {
  return NextResponse.json({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      ? `set (${process.env.ANTHROPIC_API_KEY.slice(0, 12)}...)`
      : 'NOT SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? 'set'
      : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  });
}
