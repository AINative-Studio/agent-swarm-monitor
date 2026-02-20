import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import templateService from '@/lib/template-service';
import type { CreateTemplateRequest, UpdateTemplateRequest } from '@/types/openclaw';

export function useTemplateList(category?: string) {
    return useQuery({
        queryKey: ['templates', category],
        queryFn: () => templateService.listTemplates(category),
        refetchInterval: 60000,
    });
}

export function useTemplate(templateId: string | undefined) {
    return useQuery({
        queryKey: ['template', templateId],
        queryFn: () => templateService.getTemplate(templateId!),
        enabled: !!templateId,
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemplateRequest) =>
            templateService.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}

export function useUpdateTemplate(templateId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateTemplateRequest) =>
            templateService.updateTemplate(templateId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            queryClient.invalidateQueries({ queryKey: ['template', templateId] });
        },
    });
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (templateId: string) =>
            templateService.deleteTemplate(templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
        },
    });
}
