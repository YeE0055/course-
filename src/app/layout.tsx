import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '考试题库管理系统',
  description: '课程管理、题型管理、章节管理、题库管理、组卷与数据可视化',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
