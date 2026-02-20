import { z } from 'zod';

export const marketingTemplateConfigSchema = z.object({
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet']),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().positive(),
  systemPrompt: z.string().min(10),
  channels: z.array(z.string()).min(1),
  capabilities: z.array(z.string()).min(1),
  examplePrompts: z.array(z.string()).min(1),
});

export const marketingTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.literal('Marketing'),
  subcategory: z.string().min(1),
  description: z.string().min(10).max(200),
  longDescription: z.string().min(50),
  icon: z.string().startsWith('/'),
  avatar: z.string().startsWith('/'),
  tags: z.array(z.string()).min(1),
  usageCount: z.number().nonnegative(),
  rating: z.number().min(0).max(5),
  config: marketingTemplateConfigSchema,
  createdBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const marketingTemplatesDataSchema = z.object({
  templates: z.array(marketingTemplateSchema).min(1),
});

export type MarketingTemplate = z.infer<typeof marketingTemplateSchema>;
export type MarketingTemplateConfig = z.infer<typeof marketingTemplateConfigSchema>;
export type MarketingTemplatesData = z.infer<typeof marketingTemplatesDataSchema>;

export function validateMarketingTemplate(template: unknown): MarketingTemplate {
  return marketingTemplateSchema.parse(template);
}

export function validateMarketingTemplates(data: unknown): MarketingTemplatesData {
  return marketingTemplatesDataSchema.parse(data);
}

export function loadMarketingTemplates(): MarketingTemplate[] {
  try {
    const data = require('../data/marketingTemplates.json');
    const validated = validateMarketingTemplates(data);
    return validated.templates;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Marketing templates validation failed:', error.errors);
      throw new Error(`Invalid marketing templates data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
