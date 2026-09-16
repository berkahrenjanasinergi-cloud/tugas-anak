import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Papan Tugas — Miqa & Irgi',
  description: 'Aplikasi papan tugas dan reward untuk anak-anak',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}