export interface AgentTemplate {
  id: string
  name: string
  description: string
  category: 'Marketing' | 'Engineering' | 'Sales' | 'Operations'
  icon: string
  tags: string[]
  usageCount: number
  rating: number
  config: {
    model: string
    systemPrompt: string
    channels: string[]
  }
}

export const mockTemplates: AgentTemplate[] = [
  {
    id: 'atlas-seo',
    name: 'Atlas SEO Agent',
    description: 'Generates SEO-optimized blog posts, meta descriptions, and keyword research for content marketing',
    category: 'Marketing',
    icon: '🔍',
    tags: ['SEO', 'Content', 'Blogging', 'Keywords'],
    usageCount: 247,
    rating: 4.8,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Atlas, an SEO optimization expert. You specialize in creating SEO-friendly content, conducting keyword research, and optimizing meta descriptions. Your goal is to help content rank higher in search engines while maintaining quality and readability.',
      channels: ['slack', 'discord']
    }
  },
  {
    id: 'lyra-content',
    name: 'Lyra Content Agent',
    description: 'Creates engaging social media content and marketing copy across multiple platforms',
    category: 'Marketing',
    icon: '✍️',
    tags: ['Social Media', 'Copywriting', 'Content Creation'],
    usageCount: 189,
    rating: 4.6,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Lyra, a content creation specialist. You excel at crafting compelling social media posts, marketing copy, and brand messaging that resonates with audiences across different platforms.',
      channels: ['slack', 'teams', 'discord']
    }
  },
  {
    id: 'sage-analytics',
    name: 'Sage Analytics Agent',
    description: 'Analyzes marketing data, generates insights, and creates comprehensive performance reports',
    category: 'Marketing',
    icon: '📊',
    tags: ['Analytics', 'Reporting', 'Data Analysis', 'Insights'],
    usageCount: 312,
    rating: 4.9,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Sage, a marketing analytics expert. You analyze campaign data, identify trends, and provide actionable insights to improve marketing performance. You excel at creating clear, data-driven reports.',
      channels: ['slack', 'email']
    }
  },
  {
    id: 'vega-sales',
    name: 'Vega Sales Agent',
    description: 'Handles lead qualification, follow-ups, and personalized outreach for sales teams',
    category: 'Sales',
    icon: '💼',
    tags: ['Lead Generation', 'Outreach', 'Sales Automation'],
    usageCount: 156,
    rating: 4.5,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Vega, a sales automation specialist. You help qualify leads, craft personalized outreach messages, and manage follow-up sequences to improve sales conversion rates.',
      channels: ['slack', 'email', 'teams']
    }
  },
  {
    id: 'nova-growth',
    name: 'Nova Growth Agent',
    description: 'Develops growth strategies, A/B test recommendations, and conversion optimization tactics',
    category: 'Marketing',
    icon: '🚀',
    tags: ['Growth Hacking', 'Conversion', 'A/B Testing', 'Strategy'],
    usageCount: 203,
    rating: 4.7,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Nova, a growth hacking expert. You specialize in developing data-driven growth strategies, recommending A/B tests, and optimizing conversion funnels to accelerate business growth.',
      channels: ['slack', 'discord']
    }
  },
  {
    id: 'cipher-code-review',
    name: 'Cipher Code Review Agent',
    description: 'Performs automated code reviews, identifies bugs, and suggests improvements',
    category: 'Engineering',
    icon: '🔐',
    tags: ['Code Review', 'Quality Assurance', 'Best Practices'],
    usageCount: 421,
    rating: 4.8,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Cipher, a code review specialist. You analyze code for bugs, security vulnerabilities, performance issues, and adherence to best practices. You provide constructive feedback to improve code quality.',
      channels: ['github', 'slack', 'teams']
    }
  },
  {
    id: 'nexus-bug-triage',
    name: 'Nexus Bug Triage Agent',
    description: 'Automatically triages bug reports, assigns priority levels, and suggests fixes',
    category: 'Engineering',
    icon: '🐛',
    tags: ['Bug Tracking', 'Triage', 'Issue Management'],
    usageCount: 278,
    rating: 4.6,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Nexus, a bug triage specialist. You analyze bug reports, categorize issues, assign priority levels, and suggest potential fixes or workarounds to help engineering teams work more efficiently.',
      channels: ['github', 'jira', 'slack']
    }
  },
  {
    id: 'aurora-support',
    name: 'Aurora Support Agent',
    description: 'Provides 24/7 customer support, answers FAQs, and escalates complex issues',
    category: 'Operations',
    icon: '🌟',
    tags: ['Customer Support', 'Help Desk', 'FAQ', 'Escalation'],
    usageCount: 534,
    rating: 4.9,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Aurora, a customer support specialist. You provide helpful, empathetic support to customers, answer frequently asked questions, and know when to escalate complex issues to human agents.',
      channels: ['slack', 'teams', 'zendesk', 'intercom']
    }
  },
  {
    id: 'atlas-docs',
    name: 'Atlas Documentation Agent',
    description: 'Creates and maintains technical documentation, API references, and user guides',
    category: 'Operations',
    icon: '📚',
    tags: ['Documentation', 'Technical Writing', 'API Docs', 'Guides'],
    usageCount: 167,
    rating: 4.7,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Atlas, a technical documentation expert. You create clear, comprehensive documentation including API references, user guides, and tutorials that help users understand and use products effectively.',
      channels: ['slack', 'github', 'confluence']
    }
  },
  {
    id: 'orion-recruiter',
    name: 'Orion Recruiter Agent',
    description: 'Screens resumes, schedules interviews, and provides candidate assessments',
    category: 'Operations',
    icon: '👥',
    tags: ['Recruiting', 'HR', 'Candidate Screening', 'Scheduling'],
    usageCount: 142,
    rating: 4.5,
    config: {
      model: 'gpt-4',
      systemPrompt: 'You are Orion, a recruitment specialist. You help screen candidate resumes, schedule interviews, conduct initial assessments, and provide hiring recommendations based on job requirements.',
      channels: ['slack', 'email', 'teams']
    }
  }
]

export function filterTemplates(
  templates: AgentTemplate[],
  searchQuery: string,
  category: string
): AgentTemplate[] {
  return templates.filter(template => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      category === 'All' || template.category === category

    return matchesSearch && matchesCategory
  })
}

export function getTemplateById(id: string): AgentTemplate | undefined {
  return mockTemplates.find(template => template.id === id)
}

export function getTemplatesByCategory(category: string): AgentTemplate[] {
  if (category === 'All') return mockTemplates
  return mockTemplates.filter(template => template.category === category)
}

export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {
    All: mockTemplates.length,
    Marketing: 0,
    Engineering: 0,
    Sales: 0,
    Operations: 0
  }

  mockTemplates.forEach(template => {
    counts[template.category] = (counts[template.category] || 0) + 1
  })

  return counts
}
