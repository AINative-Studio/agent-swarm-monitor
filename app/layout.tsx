import './globals.css';
import { AppLayout } from './components/AppLayout';

export const metadata = {
  title: 'AgentClaw - AI Agent Swarm Monitor',
  description: 'Monitor and manage AI agent swarms with real-time insights and controls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
