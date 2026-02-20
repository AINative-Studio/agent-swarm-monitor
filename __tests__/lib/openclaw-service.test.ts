import { describe, it, expect, vi, beforeEach } from 'vitest';
import openClawService from '@/lib/openclaw-service';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
    ApiError: class extends Error {
        statusCode: number;
        detail: string;
        constructor(statusCode: number, detail: string) {
            super(detail);
            this.statusCode = statusCode;
            this.detail = detail;
        }
    },
    snakeToCamelKeys: vi.fn((x: unknown) => x),
    camelToSnakeKeys: vi.fn((x: unknown) => x),
}));

describe('OpenClawService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listAgents', () => {
        it('should call GET /agents with default params', async () => {
            const mockResponse = { agents: [], total: 0, limit: 50, offset: 0 };
            vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

            const result = await openClawService.listAgents();

            expect(apiClient.get).toHaveBeenCalledWith('/agents', {
                limit: '50',
                offset: '0',
            });
            expect(result).toEqual(mockResponse);
        });

        it('should pass status filter when provided', async () => {
            vi.mocked(apiClient.get).mockResolvedValue({ agents: [], total: 0, limit: 50, offset: 0 });

            await openClawService.listAgents('running');

            expect(apiClient.get).toHaveBeenCalledWith('/agents', {
                limit: '50',
                offset: '0',
                status: 'running',
            });
        });

        it('should pass custom limit and offset', async () => {
            vi.mocked(apiClient.get).mockResolvedValue({ agents: [], total: 0, limit: 10, offset: 5 });

            await openClawService.listAgents(undefined, 10, 5);

            expect(apiClient.get).toHaveBeenCalledWith('/agents', {
                limit: '10',
                offset: '5',
            });
        });
    });

    describe('getAgent', () => {
        it('should call GET /agents/{id}', async () => {
            const mockAgent = { id: 'agent-001', name: 'Test' };
            vi.mocked(apiClient.get).mockResolvedValue(mockAgent);

            const result = await openClawService.getAgent('agent-001');

            expect(apiClient.get).toHaveBeenCalledWith('/agents/agent-001');
            expect(result).toEqual(mockAgent);
        });
    });

    describe('createAgent', () => {
        it('should call POST /agents with request body', async () => {
            const mockAgent = { id: 'new-agent', name: 'New Agent', status: 'provisioning' };
            vi.mocked(apiClient.post).mockResolvedValue(mockAgent);

            const result = await openClawService.createAgent({
                name: 'New Agent',
                model: 'anthropic/claude-opus-4-5',
            });

            expect(apiClient.post).toHaveBeenCalledWith('/agents', {
                name: 'New Agent',
                model: 'anthropic/claude-opus-4-5',
            });
            expect(result).toEqual(mockAgent);
        });
    });

    describe('provisionAgent', () => {
        it('should call POST /agents/{id}/provision', async () => {
            const mockAgent = { id: 'agent-001', status: 'running' };
            vi.mocked(apiClient.post).mockResolvedValue(mockAgent);

            const result = await openClawService.provisionAgent('agent-001');

            expect(apiClient.post).toHaveBeenCalledWith('/agents/agent-001/provision');
            expect(result).toEqual(mockAgent);
        });
    });

    describe('pauseAgent', () => {
        it('should call POST /agents/{id}/pause', async () => {
            const mockAgent = { id: 'agent-001', status: 'paused' };
            vi.mocked(apiClient.post).mockResolvedValue(mockAgent);

            const result = await openClawService.pauseAgent('agent-001');

            expect(apiClient.post).toHaveBeenCalledWith('/agents/agent-001/pause');
            expect(result).toEqual(mockAgent);
        });
    });

    describe('resumeAgent', () => {
        it('should call POST /agents/{id}/resume', async () => {
            const mockAgent = { id: 'agent-001', status: 'running' };
            vi.mocked(apiClient.post).mockResolvedValue(mockAgent);

            const result = await openClawService.resumeAgent('agent-001');

            expect(apiClient.post).toHaveBeenCalledWith('/agents/agent-001/resume');
            expect(result).toEqual(mockAgent);
        });
    });

    describe('updateSettings', () => {
        it('should call PATCH /agents/{id}/settings with data', async () => {
            const mockAgent = { id: 'agent-001', persona: 'Updated' };
            vi.mocked(apiClient.patch).mockResolvedValue(mockAgent);

            const result = await openClawService.updateSettings('agent-001', {
                persona: 'Updated',
            });

            expect(apiClient.patch).toHaveBeenCalledWith('/agents/agent-001/settings', {
                persona: 'Updated',
            });
            expect(result).toEqual(mockAgent);
        });
    });

    describe('deleteAgent', () => {
        it('should call DELETE /agents/{id}', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue(undefined);

            await openClawService.deleteAgent('agent-001');

            expect(apiClient.delete).toHaveBeenCalledWith('/agents/agent-001');
        });
    });

    describe('executeHeartbeat', () => {
        it('should call POST /agents/{id}/heartbeat', async () => {
            const mockResult = { status: 'completed', message: 'OK' };
            vi.mocked(apiClient.post).mockResolvedValue(mockResult);

            const result = await openClawService.executeHeartbeat('agent-001');

            expect(apiClient.post).toHaveBeenCalledWith('/agents/agent-001/heartbeat');
            expect(result).toEqual(mockResult);
        });
    });
});
