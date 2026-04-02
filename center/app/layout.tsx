import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SuperDreams 超梦 - Control Center',
  description: 'AI Agent Memory Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
