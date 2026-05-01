import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '企业智能体平台',
  description: '私有企业智能体平台控制台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
