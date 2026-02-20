/**
 * Mock agent data for Agent Detail view
 * Refs #1205
 */

export interface AgentDetail {
  id: string;
  name: string;
  description: string;
  department: string;
  status: 'online' | 'idle' | 'offline';
  avatar: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  channels: string[];
  createdAt: Date;
  lastActive: Date;
}

export const mockAgents: AgentDetail[] = [
  {
    id: '1',
    name: 'Atlas SEO Agent',
    description: 'Generates SEO-optimized blog posts and meta descriptions for marketing campaigns',
    department: 'Marketing',
    status: 'online',
    avatar: '/avatars/atlas.png',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: 'You are Atlas, an SEO optimization expert. Your role is to create compelling, search-engine-optimized content that drives organic traffic. Focus on keyword integration, readability, and user intent.',
    channels: ['slack', 'discord'],
    createdAt: new Date('2025-02-01T09:00:00'),
    lastActive: new Date('2025-02-17T10:30:00'),
  },
  {
    id: '2',
    name: 'Lyra Data Analyst',
    description: 'Analyzes complex datasets and generates comprehensive reports with actionable insights',
    department: 'Analytics',
    status: 'online',
    avatar: '/avatars/lyra.png',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 3000,
    systemPrompt: 'You are Lyra, a data analysis expert. You excel at identifying patterns, trends, and anomalies in data. Provide clear, data-driven insights with statistical rigor.',
    channels: ['slack', 'email'],
    createdAt: new Date('2025-01-15T14:20:00'),
    lastActive: new Date('2025-02-17T09:45:00'),
  },
  {
    id: '3',
    name: 'Sage Customer Support',
    description: 'Provides empathetic and efficient customer support across multiple channels',
    department: 'Support',
    status: 'idle',
    avatar: '/avatars/sage.png',
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    maxTokens: 1500,
    systemPrompt: 'You are Sage, a customer support specialist. Prioritize empathy, clarity, and problem resolution. Always maintain a helpful and professional tone.',
    channels: ['slack', 'discord', 'email'],
    createdAt: new Date('2025-01-20T11:15:00'),
    lastActive: new Date('2025-02-17T08:20:00'),
  },
  {
    id: '4',
    name: 'Vega Code Reviewer',
    description: 'Reviews code for best practices, security vulnerabilities, and performance optimization',
    department: 'Engineering',
    status: 'online',
    avatar: '/avatars/vega.png',
    model: 'claude-3-opus',
    temperature: 0.4,
    maxTokens: 4000,
    systemPrompt: 'You are Vega, a senior software engineer specializing in code review. Focus on code quality, security, performance, and maintainability. Provide constructive feedback with examples.',
    channels: ['github', 'slack'],
    createdAt: new Date('2025-01-10T08:30:00'),
    lastActive: new Date('2025-02-17T11:00:00'),
  },
  {
    id: '5',
    name: 'Nova Content Writer',
    description: 'Creates engaging blog posts, documentation, and creative content for various audiences',
    department: 'Content',
    status: 'offline',
    avatar: '/avatars/nova.png',
    model: 'gpt-4',
    temperature: 0.9,
    maxTokens: 2500,
    systemPrompt: 'You are Nova, a creative content writer. Craft engaging, well-researched content that resonates with the target audience. Balance creativity with clarity.',
    channels: ['slack'],
    createdAt: new Date('2025-02-05T13:45:00'),
    lastActive: new Date('2025-02-16T17:30:00'),
  },
];

/**
 * Get agent by ID
 * @param id Agent ID
 * @returns Agent or undefined if not found
 */
export function getAgentById(id: string): AgentDetail | undefined {
  return mockAgents.find((agent) => agent.id === id);
}

/**
 * Get all agents
 * @returns Array of all agents
 */
export function getAllAgents(): AgentDetail[] {
  return mockAgents;
}
