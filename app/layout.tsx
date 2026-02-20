import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import OpenClawLayoutShell from './OpenClawLayoutShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgentClaw',
  description: 'AI Agent Management Platform by AINative Studio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <OpenClawLayoutShell>{children}</OpenClawLayoutShell>
        </QueryProvider>
      </body>
    </html>
  );
}
