export interface Message {
  id: string
  sender: 'user' | 'agent'
  content: string
  timestamp: Date
}

/**
 * Mock WebSocket implementation for agent chat simulation
 * TODO: Replace with real WebSocket connection to backend
 * ws://localhost:8080/ws/agents/{agentId}/chat
 */
export class MockAgentWebSocket {
  private handlers: Map<string, Function> = new Map()
  private timeoutId?: NodeJS.Timeout

  /**
   * Connect to agent WebSocket
   */
  connect(agentId: string): void {
    console.log(`Mock WS connected to agent ${agentId}`)
  }

  /**
   * Send message to agent
   */
  sendMessage(message: string): void {
    // Simulate agent response after delay
    this.timeoutId = setTimeout(() => {
      const response = this.generateMockResponse(message)
      this.handlers.get('message')?.(response)
    }, 1000)
  }

  /**
   * Register message handler
   */
  onMessage(callback: (message: Message) => void): void {
    this.handlers.set('message', callback)
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    this.handlers.clear()
  }

  /**
   * Generate mock agent response
   */
  private generateMockResponse(input: string): Message {
    return {
      id: crypto.randomUUID(),
      sender: 'agent',
      content: `Mock response to: ${input}`,
      timestamp: new Date()
    }
  }
}
