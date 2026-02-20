/**
 * Mock data for AgentClaw Dashboard development
 * Refs #1203
 */

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalMessages: number;
  avgResponseTime: string;
}

export interface Agent {
  id: string;
  name: string;
  department: string;
  status: 'online' | 'idle' | 'offline';
  lastActive: Date;
  avatar?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'agent_created' | 'message_sent' | 'integration_added';
  title: string;
  description: string;
  timestamp: Date;
  agent?: string;
}

export const mockDashboardStats: DashboardStats = {
  totalAgents: 12,
  activeAgents: 8,
  totalMessages: 1847,
  avgResponseTime: '1.2s'
};

export const mockActiveAgents: Agent[] = [
  {
    id: '1',
    name: 'Atlas SEO Agent',
    department: 'Marketing',
    status: 'online',
    lastActive: new Date('2025-02-17T10:30:00')
  },
  {
    id: '2',
    name: 'Customer Support Bot',
    department: 'Support',
    status: 'online',
    lastActive: new Date('2025-02-17T10:28:00')
  },
  {
    id: '3',
    name: 'Sales Assistant',
    department: 'Sales',
    status: 'idle',
    lastActive: new Date('2025-02-17T09:15:00')
  },
  {
    id: '4',
    name: 'Content Writer Agent',
    department: 'Marketing',
    status: 'online',
    lastActive: new Date('2025-02-17T10:25:00')
  },
  {
    id: '5',
    name: 'Data Analyst Bot',
    department: 'Analytics',
    status: 'online',
    lastActive: new Date('2025-02-17T10:20:00')
  },
  {
    id: '6',
    name: 'HR Onboarding Agent',
    department: 'HR',
    status: 'idle',
    lastActive: new Date('2025-02-17T08:45:00')
  },
  {
    id: '7',
    name: 'Code Review Assistant',
    department: 'Engineering',
    status: 'online',
    lastActive: new Date('2025-02-17T10:29:00')
  },
  {
    id: '8',
    name: 'Invoice Processor',
    department: 'Finance',
    status: 'online',
    lastActive: new Date('2025-02-17T10:10:00')
  }
];

export const mockActivityEvents: ActivityEvent[] = [
  {
    id: '1',
    type: 'agent_created',
    title: 'New Agent Created',
    description: 'Atlas SEO Agent was created',
    timestamp: new Date('2025-02-17T10:30:00'),
    agent: 'Atlas SEO Agent'
  },
  {
    id: '2',
    type: 'message_sent',
    title: 'Message Sent',
    description: 'Customer Support Bot responded to inquiry #1234',
    timestamp: new Date('2025-02-17T10:28:00'),
    agent: 'Customer Support Bot'
  },
  {
    id: '3',
    type: 'integration_added',
    title: 'Integration Added',
    description: 'Slack integration connected to Sales Assistant',
    timestamp: new Date('2025-02-17T10:15:00'),
    agent: 'Sales Assistant'
  },
  {
    id: '4',
    type: 'message_sent',
    title: 'Message Sent',
    description: 'Content Writer Agent completed blog post draft',
    timestamp: new Date('2025-02-17T10:00:00'),
    agent: 'Content Writer Agent'
  },
  {
    id: '5',
    type: 'agent_created',
    title: 'New Agent Created',
    description: 'Data Analyst Bot was created',
    timestamp: new Date('2025-02-17T09:45:00'),
    agent: 'Data Analyst Bot'
  },
  {
    id: '6',
    type: 'message_sent',
    title: 'Message Sent',
    description: 'Code Review Assistant approved PR #456',
    timestamp: new Date('2025-02-17T09:30:00'),
    agent: 'Code Review Assistant'
  },
  {
    id: '7',
    type: 'integration_added',
    title: 'Integration Added',
    description: 'QuickBooks integration added to Invoice Processor',
    timestamp: new Date('2025-02-17T09:00:00'),
    agent: 'Invoice Processor'
  },
  {
    id: '8',
    type: 'message_sent',
    title: 'Message Sent',
    description: 'HR Onboarding Agent sent welcome email',
    timestamp: new Date('2025-02-17T08:45:00'),
    agent: 'HR Onboarding Agent'
  }
];
