import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 航向标 | 周霖',
  description: '每日 AI 要闻速递，追踪科技巨头 CEO 动态',
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
