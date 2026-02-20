export type TeamMemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer'
export type TeamMemberDepartment = 'Engineering' | 'Marketing' | 'Sales' | 'Operations'
export type TeamMemberStatus = 'active' | 'invited' | 'inactive'

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: TeamMemberRole
  department: TeamMemberDepartment
  joinedAt: Date
  lastActive: Date
  status: TeamMemberStatus
}

export type WorkspacePlan = 'Free' | 'Pro' | 'Enterprise'

export interface WorkspaceSettings {
  name: string
  slug: string
  plan: WorkspacePlan
  billingEmail: string
  agentLimit: number
  currentAgentCount: number
  allowedDomains: string[]
}

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@ainative.studio',
    avatar: '/avatars/john.png',
    role: 'Owner',
    department: 'Engineering',
    joinedAt: new Date('2025-01-01'),
    lastActive: new Date('2025-02-17T11:00:00'),
    status: 'active'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@ainative.studio',
    avatar: '/avatars/jane.png',
    role: 'Admin',
    department: 'Marketing',
    joinedAt: new Date('2025-01-15'),
    lastActive: new Date('2025-02-17T10:30:00'),
    status: 'active'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@ainative.studio',
    avatar: '/avatars/bob.png',
    role: 'Member',
    department: 'Sales',
    joinedAt: new Date('2025-02-01'),
    lastActive: new Date('2025-02-16T16:00:00'),
    status: 'active'
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@ainative.studio',
    avatar: '/avatars/alice.png',
    role: 'Member',
    department: 'Engineering',
    joinedAt: new Date('2025-02-05'),
    lastActive: new Date('2025-02-17T09:15:00'),
    status: 'active'
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@ainative.studio',
    role: 'Viewer',
    department: 'Operations',
    joinedAt: new Date('2025-02-10'),
    lastActive: new Date('2025-02-15T14:00:00'),
    status: 'active'
  },
  {
    id: '6',
    name: 'Diana Martinez',
    email: 'diana@ainative.studio',
    role: 'Admin',
    department: 'Operations',
    joinedAt: new Date('2025-02-12'),
    lastActive: new Date(),
    status: 'invited'
  }
]

export const mockWorkspace: WorkspaceSettings = {
  name: 'AINative Studio',
  slug: 'ainative-studio',
  plan: 'Pro',
  billingEmail: 'billing@ainative.studio',
  agentLimit: 20,
  currentAgentCount: 8,
  allowedDomains: ['ainative.studio']
}
