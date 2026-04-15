import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function recommendBadgeStyle(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 60) return 'bg-brand-100 text-brand-700';
  if (score >= 40) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-500';
}

export function rankFromScore(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

export function rankBadgeStyle(rank: string): string {
  if (rank === 'S')  return 'bg-yellow-400 text-yellow-900';
  if (rank === 'A+') return 'bg-purple-500 text-white';
  if (rank === 'A')  return 'bg-blue-500 text-white';
  if (rank === 'B')  return 'bg-emerald-500 text-white';
  return 'bg-gray-500 text-white';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
