import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Enterprise Agent Platform',
  description: 'Private enterprise agent platform console',
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

