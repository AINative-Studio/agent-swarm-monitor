import type { TeamMemberRole } from './mockTeam'

/**
 * Check if a user can manage team members (invite, remove)
 */
export function canManageTeam(userRole: TeamMemberRole): boolean {
  return ['Owner', 'Admin'].includes(userRole)
}

/**
 * Check if a user can edit another member's role
 * - Owner can edit anyone's role
 * - Admin can edit roles except Owner
 * - Member and Viewer cannot edit roles
 */
export function canEditRole(
  currentUserRole: TeamMemberRole,
  targetMemberRole: TeamMemberRole
): boolean {
  if (currentUserRole === 'Owner') return true
  if (currentUserRole === 'Admin' && targetMemberRole !== 'Owner') return true
  return false
}

/**
 * Check if a user can delete the workspace
 * Only Owner can delete workspace
 */
export function canDeleteWorkspace(userRole: TeamMemberRole): boolean {
  return userRole === 'Owner'
}

/**
 * Check if a user can edit workspace settings
 * Owner and Admin can edit workspace settings
 */
export function canEditWorkspace(userRole: TeamMemberRole): boolean {
  return ['Owner', 'Admin'].includes(userRole)
}

/**
 * Check if a user can remove another team member
 * - Owner can remove anyone except themselves
 * - Admin can remove Member and Viewer
 */
export function canRemoveMember(
  currentUserRole: TeamMemberRole,
  targetMemberRole: TeamMemberRole,
  isSelf: boolean
): boolean {
  if (isSelf) return false
  if (currentUserRole === 'Owner' && targetMemberRole !== 'Owner') return true
  if (currentUserRole === 'Admin' && ['Member', 'Viewer'].includes(targetMemberRole)) return true
  return false
}
