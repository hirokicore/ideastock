'use client';

import { useState } from 'react';

export function CopyButton({ text, accent }: { text: string; accent: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`w-full py-3 px-5 rounded-xl border text-sm font-semibold transition-all ${accent}`}
    >
      {copied ? '✅ コピーしました！' : '📋 説明文をコピーする'}
    </button>
  );
}

export function XShareButton({ text }: { text: string }) {
  const handleShare = () => {
    const shareText = encodeURIComponent(text + '\n\n#生きづらさ診断');
    window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleShare}
      className="w-full py-3 px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-white"
      style={{ background: '#000' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L2.27 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
      Xでシェアする
    </button>
  );
}
