import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import templateService from '@/lib/template-service';

vi.mock('@/lib/template-service', () => ({
    default: {
        listTemplates: vi.fn(),
        getTemplate: vi.fn(),
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        seedTemplates: vi.fn(),
    },
}));

import {
    useTemplateList,
    useTemplate,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
} from '@/hooks/useTemplates';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

const MOCK_TEMPLATE = {
    id: 'template-linear',
    name: 'Linear Ticket Solver',
    description: 'Automatically picks up assigned Linear issues',
    category: 'engineering' as const,
    icons: ['github', 'linear', 'git'],
    defaultModel: 'anthropic/claude-opus-4-5',
    defaultPersona: 'You are a software engineer',
    defaultHeartbeatInterval: '5m' as const,
    defaultChecklist: ['Check Linear for issues'],
    userId: 'user-1',
    createdAt: '2026-02-20T12:00:00Z',
    updatedAt: null,
};

describe('Template Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useTemplateList', () => {
        it('should fetch template list', async () => {
            const mockResponse = {
                templates: [MOCK_TEMPLATE],
                total: 1,
                limit: 50,
                offset: 0,
            };
            vi.mocked(templateService.listTemplates).mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useTemplateList(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.templates).toHaveLength(1);
            expect(result.current.data?.templates[0].name).toBe('Linear Ticket Solver');
            expect(templateService.listTemplates).toHaveBeenCalledWith(undefined);
        });

        it('should pass category filter', async () => {
            vi.mocked(templateService.listTemplates).mockResolvedValue({
                templates: [],
                total: 0,
                limit: 50,
                offset: 0,
            });

            const { result } = renderHook(() => useTemplateList('engineering'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(templateService.listTemplates).toHaveBeenCalledWith('engineering');
        });
    });

    describe('useTemplate', () => {
        it('should fetch single template', async () => {
            vi.mocked(templateService.getTemplate).mockResolvedValue(MOCK_TEMPLATE);

            const { result } = renderHook(() => useTemplate('template-linear'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.name).toBe('Linear Ticket Solver');
            expect(templateService.getTemplate).toHaveBeenCalledWith('template-linear');
        });

        it('should not fetch when templateId is undefined', () => {
            const { result } = renderHook(() => useTemplate(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
            expect(templateService.getTemplate).not.toHaveBeenCalled();
        });
    });

    describe('useCreateTemplate', () => {
        it('should call createTemplate service method', async () => {
            vi.mocked(templateService.createTemplate).mockResolvedValue(MOCK_TEMPLATE);

            const { result } = renderHook(() => useCreateTemplate(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                name: 'Linear Ticket Solver',
                category: 'engineering',
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(templateService.createTemplate).toHaveBeenCalledWith({
                name: 'Linear Ticket Solver',
                category: 'engineering',
            });
        });
    });

    describe('useUpdateTemplate', () => {
        it('should call updateTemplate service method', async () => {
            vi.mocked(templateService.updateTemplate).mockResolvedValue({
                ...MOCK_TEMPLATE,
                name: 'Updated Template',
            });

            const { result } = renderHook(
                () => useUpdateTemplate('template-linear'),
                { wrapper: createWrapper() },
            );

            result.current.mutate({ name: 'Updated Template' });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(templateService.updateTemplate).toHaveBeenCalledWith(
                'template-linear',
                { name: 'Updated Template' },
            );
        });
    });

    describe('useDeleteTemplate', () => {
        it('should call deleteTemplate service method', async () => {
            vi.mocked(templateService.deleteTemplate).mockResolvedValue(undefined);

            const { result } = renderHook(() => useDeleteTemplate(), {
                wrapper: createWrapper(),
            });

            result.current.mutate('template-linear');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(templateService.deleteTemplate).toHaveBeenCalledWith('template-linear');
        });
    });
});
