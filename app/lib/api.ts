import type { AgentFormData, CreatedAgent } from './types/wizard'

export async function createAgent(data: AgentFormData): Promise<CreatedAgent> {
  // TODO: Replace with real API call to /api/v1/agents
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mock successful agent creation
  return {
    id: crypto.randomUUID(),
    ...data.basicInfo,
    ...data.configuration,
    channels: data.channels,
    createdAt: new Date()
  }
}

export async function validateAgentName(name: string): Promise<boolean> {
  // TODO: Replace with real API call to check name availability
  await new Promise(resolve => setTimeout(resolve, 300))

  // Mock validation - names starting with "test" are taken
  return !name.toLowerCase().startsWith('test')
}
