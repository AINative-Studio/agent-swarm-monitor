import { loadMarketingTemplates, validateMarketingTemplate, validateMarketingTemplates } from '../../lib/templateSchema';
import { z } from 'zod';

describe('Marketing Templates JSON Validation', () => {
  describe('loadMarketingTemplates', () => {
    it('should load exactly 5 marketing templates', () => {
      const templates = loadMarketingTemplates();
      expect(templates.length).toBe(5);
    });

    it('should include Atlas SEO template', () => {
      const templates = loadMarketingTemplates();
      const atlas = templates.find(t => t.id === 'atlas-seo');
      expect(atlas).toBeDefined();
      expect(atlas?.name).toContain('Atlas');
    });

    it('should include Lyra Content template', () => {
      const templates = loadMarketingTemplates();
      const lyra = templates.find(t => t.id === 'lyra-content');
      expect(lyra).toBeDefined();
      expect(lyra?.name).toContain('Lyra');
    });

    it('should include Sage Analytics template', () => {
      const templates = loadMarketingTemplates();
      const sage = templates.find(t => t.id === 'sage-analytics');
      expect(sage).toBeDefined();
      expect(sage?.name).toContain('Sage');
    });

    it('should include Vega Sales template', () => {
      const templates = loadMarketingTemplates();
      const vega = templates.find(t => t.id === 'vega-sales');
      expect(vega).toBeDefined();
      expect(vega?.name).toContain('Vega');
    });

    it('should include Nova Growth template', () => {
      const templates = loadMarketingTemplates();
      const nova = templates.find(t => t.id === 'nova-growth');
      expect(nova).toBeDefined();
      expect(nova?.name).toContain('Nova');
    });
  });

  describe('validateMarketingTemplate', () => {
    it('should validate a valid marketing template', () => {
      const validTemplate = {
        id: 'test-agent',
        name: 'Test Agent',
        category: 'Marketing',
        subcategory: 'Test',
        description: 'A test marketing agent for validation',
        longDescription: 'This is a longer description that meets the minimum length requirement for validation.',
        icon: '/icons/test.svg',
        avatar: '/avatars/test.png',
        tags: ['test', 'validation'],
        usageCount: 100,
        rating: 4.5,
        config: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: 'You are a test agent for validation purposes.',
          channels: ['slack', 'discord'],
          capabilities: ['Test capability 1', 'Test capability 2'],
          examplePrompts: ['Example prompt 1', 'Example prompt 2'],
        },
        createdBy: 'AINative Team',
        createdAt: '2025-01-15T00:00:00.000Z',
        updatedAt: '2025-02-10T00:00:00.000Z',
      };
      const result = validateMarketingTemplate(validTemplate);
      expect(result).toEqual(validTemplate);
    });

    it('should reject template with invalid category', () => {
      const invalidTemplate = {
        id: 'test-agent',
        name: 'Test Agent',
        category: 'Invalid',
        subcategory: 'Test',
        description: 'A test marketing agent',
        longDescription: 'This is a longer description that meets the minimum length requirement.',
        icon: '/icons/test.svg',
        avatar: '/avatars/test.png',
        tags: ['test'],
        usageCount: 100,
        rating: 4.5,
        config: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: 'Test prompt',
          channels: ['slack'],
          capabilities: ['Test'],
          examplePrompts: ['Example'],
        },
        createdBy: 'Test',
        createdAt: '2025-01-15T00:00:00.000Z',
        updatedAt: '2025-02-10T00:00:00.000Z',
      };
      expect(() => validateMarketingTemplate(invalidTemplate)).toThrow(z.ZodError);
    });
  });
});
