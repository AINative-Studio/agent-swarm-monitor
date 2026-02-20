"use client"

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { TeamMembersTable } from '@/app/components/team/TeamMembersTable'
import { InviteMemberModal } from '@/app/components/team/InviteMemberModal'
import { MemberRoleEditor } from '@/app/components/team/MemberRoleEditor'
import { WorkspaceSettings } from '@/app/components/team/WorkspaceSettings'
import { DeleteWorkspaceModal } from '@/app/components/team/DeleteWorkspaceModal'
import { mockTeamMembers, mockWorkspace } from '@/app/lib/mockTeam'
import { canManageTeam } from '@/app/lib/permissions'
import type { TeamMember, TeamMemberRole, WorkspaceSettings as WorkspaceSettingsType } from '@/app/lib/mockTeam'

export default function TeamPage() {
  // Mock current user - in real app, this would come from auth context
  const currentUserRole: TeamMemberRole = 'Owner'
  const currentUserId = '1'

  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [workspace, setWorkspace] = useState<WorkspaceSettingsType>(mockWorkspace)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [roleEditorOpen, setRoleEditorOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  const canManage = canManageTeam(currentUserRole)

  const handleInviteMember = async (data: {
    email: string
    role: TeamMemberRole
    department: any
    message?: string
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Add new member to list (with invited status)
    const newMember: TeamMember = {
      id: String(members.length + 1),
      name: data.email.split('@')[0],
      email: data.email,
      role: data.role,
      department: data.department,
      joinedAt: new Date(),
      lastActive: new Date(),
      status: 'invited',
    }

    setMembers([...members, newMember])
  }

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member)
    setRoleEditorOpen(true)
  }

  const handleSaveRole = async (memberId: string, newRole: TeamMemberRole) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    setMembers(
      members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      )
    )
  }

  const handleRemoveMember = async (member: TeamMember) => {
    // In real app, show confirmation dialog first
    if (!confirm(`Remove ${member.name} from the team?`)) return

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    setMembers(members.filter(m => m.id !== member.id))
  }

  const handleSaveWorkspace = async (settings: WorkspaceSettingsType) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setWorkspace(settings)
  }

  const handleDeleteWorkspace = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // In real app, redirect to workspace selection or sign out
    alert('Workspace deleted successfully')
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team & Workspace</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and workspace settings
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Team Members Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Team Members</h2>
        <Card className="p-6">
          <TeamMembersTable
            members={members}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onEditRole={handleEditRole}
            onRemoveMember={handleRemoveMember}
          />
        </Card>
      </div>

      {/* Workspace Settings Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Workspace Settings</h2>
        <WorkspaceSettings
          workspace={workspace}
          currentUserRole={currentUserRole}
          onSave={handleSaveWorkspace}
          onDeleteWorkspace={() => setDeleteModalOpen(true)}
        />
      </div>

      {/* Modals */}
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />

      <MemberRoleEditor
        member={selectedMember}
        open={roleEditorOpen}
        onCancel={() => {
          setRoleEditorOpen(false)
          setSelectedMember(null)
        }}
        onSave={handleSaveRole}
      />

      <DeleteWorkspaceModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteWorkspace}
        workspaceName={workspace.name}
      />
    </main>
  )
}
