import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nextMonday(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function starsFor(points: number): string {
  const n = Math.max(0, Math.min(5, Math.floor(points / 180)));
  return '⭐'.repeat(n) + '☆'.repeat(5 - n);
}