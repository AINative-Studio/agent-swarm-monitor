'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Crown, Pencil, Eye, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_TEAM_MEMBERS } from '@/lib/openclaw-mock-data';
import type { TeamMember } from '@/types/openclaw';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
};

const roleConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    badgeClass: string;
  }
> = {
  owner: {
    icon: Crown,
    label: 'Owner',
    description: 'Full access \u2014 can manage members, billing, and all agents',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  editor: {
    icon: Pencil,
    label: 'Editor',
    description: 'Can create, edit, and deploy agents',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    description: 'Read-only access to agents and dashboard',
    badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
  },
};

interface MemberRowProps {
  member: TeamMember;
}

function MemberRow({ member }: MemberRowProps) {
  const config = roleConfig[member.role];
  const RoleIcon = config.icon;

  return (
    <div className="flex items-center gap-4 py-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8E6E1] text-sm font-medium text-[#6B6B6B] shrink-0"
        aria-hidden="true"
      >
        {member.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{member.name}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}
          >
            <RoleIcon className="h-3 w-3" />
            {config.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{member.email}</p>
      </div>
    </div>
  );
}

export default function OpenClawTeamClient() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [members] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);

  const handleAddMember = () => {
    if (!email.trim()) return;
    // In production, this would call an API to add the member
    setEmail('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage who has access to this workspace
        </p>
      </motion.div>

      {/* Add Member card */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Add Member</h2>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddMember();
            }}
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-[120px] bg-white border-gray-200 text-gray-900 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="viewer" className="text-gray-900 text-sm">
                Viewer
              </SelectItem>
              <SelectItem value="editor" className="text-gray-900 text-sm">
                Editor
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddMember}
            disabled={!email.trim()}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5"
          >
            Add
          </Button>
        </div>
      </motion.div>

      {/* Members card */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Members ({members.length})
          </h2>
        </div>
        <div className="px-5 divide-y divide-gray-100">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </motion.div>

      {/* Roles card */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Roles</h2>
          </div>
        </div>
        <div className="px-5 divide-y divide-gray-100">
          {(['owner', 'editor', 'viewer'] as const).map((roleKey) => {
            const config = roleConfig[roleKey];
            const RoleIcon = config.icon;
            return (
              <div key={roleKey} className="flex items-center gap-3 py-4">
                <RoleIcon className="h-4 w-4 text-gray-500 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    {config.label}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {config.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
