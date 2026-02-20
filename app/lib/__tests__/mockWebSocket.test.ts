import { MockAgentWebSocket, Message } from '../mockWebSocket'

describe('MockAgentWebSocket', () => {
  let ws: MockAgentWebSocket

  beforeEach(() => {
    ws = new MockAgentWebSocket()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('connect', () => {
    it('should connect to agent without errors', () => {
      expect(() => ws.connect('agent-123')).not.toThrow()
    })

    it('should log connection info', () => {
      const consoleSpy = jest.spyOn(console, 'log')
      ws.connect('agent-456')
      expect(consoleSpy).toHaveBeenCalledWith('Mock WS connected to agent agent-456')
      consoleSpy.mockRestore()
    })
  })

  describe('sendMessage', () => {
    it('should trigger onMessage callback with agent response', () => {
      const messageHandler = jest.fn()
      ws.onMessage(messageHandler)

      ws.sendMessage('Hello agent')

      jest.advanceTimersByTime(1000)

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: 'agent',
          content: expect.stringContaining('Hello agent')
        })
      )
    })

    it('should generate response with unique id', () => {
      const messages: Message[] = []
      ws.onMessage((msg) => messages.push(msg))

      ws.sendMessage('First message')
      ws.sendMessage('Second message')

      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(1000)

      expect(messages).toHaveLength(2)
      expect(messages[0].id).not.toBe(messages[1].id)
    })

    it('should include timestamp in response', () => {
      const messageHandler = jest.fn()
      ws.onMessage(messageHandler)

      const now = new Date('2025-01-15T10:00:00Z')
      jest.setSystemTime(now)

      ws.sendMessage('Test message')
      jest.advanceTimersByTime(1000)

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date)
        })
      )
    })

    it('should simulate delay before response', () => {
      const messageHandler = jest.fn()
      ws.onMessage(messageHandler)

      ws.sendMessage('Test')

      // Should not respond immediately
      expect(messageHandler).not.toHaveBeenCalled()

      // Should respond after 1 second
      jest.advanceTimersByTime(1000)
      expect(messageHandler).toHaveBeenCalledTimes(1)
    })

    it('should echo user message in response content', () => {
      const messageHandler = jest.fn()
      ws.onMessage(messageHandler)

      ws.sendMessage('What is your name?')
      jest.advanceTimersByTime(1000)

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('What is your name?')
        })
      )
    })
  })

  describe('onMessage', () => {
    it('should register message handler', () => {
      const handler = jest.fn()
      ws.onMessage(handler)

      ws.sendMessage('Test')
      jest.advanceTimersByTime(1000)

      expect(handler).toHaveBeenCalled()
    })

    it('should replace previous handler when called multiple times', () => {
      const firstHandler = jest.fn()
      const secondHandler = jest.fn()

      ws.onMessage(firstHandler)
      ws.onMessage(secondHandler)

      ws.sendMessage('Test')
      jest.advanceTimersByTime(1000)

      expect(firstHandler).not.toHaveBeenCalled()
      expect(secondHandler).toHaveBeenCalled()
    })
  })

  describe('disconnect', () => {
    it('should disconnect without errors', () => {
      ws.connect('agent-123')
      expect(() => ws.disconnect()).not.toThrow()
    })

    it('should clear message handlers on disconnect', () => {
      const handler = jest.fn()
      ws.onMessage(handler)
      ws.disconnect()

      ws.sendMessage('Test')
      jest.advanceTimersByTime(1000)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('message format', () => {
    it('should return messages with correct structure', () => {
      const messageHandler = jest.fn()
      ws.onMessage(messageHandler)

      ws.sendMessage('Test')
      jest.advanceTimersByTime(1000)

      const message = messageHandler.mock.calls[0][0]
      expect(message).toHaveProperty('id')
      expect(message).toHaveProperty('sender', 'agent')
      expect(message).toHaveProperty('content')
      expect(message).toHaveProperty('timestamp')
      expect(message.id).toBeTruthy()
      expect(typeof message.content).toBe('string')
      expect(message.timestamp instanceof Date).toBe(true)
    })
  })
})
