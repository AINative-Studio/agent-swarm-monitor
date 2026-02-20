'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/openclaw-mock-data';
import TemplateCard from '@/components/openclaw/TemplateCard';
import type { OpenClawTemplate } from '@/types/openclaw';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

const categoryDescriptions: Record<string, { title: string; description: string }> = {
  engineering: {
    title: 'Engineering Workflow',
    description: 'Automate stories, reviews, and incident response',
  },
  'sales-outreach': {
    title: 'Sales & Outreach',
    description: 'Prospecting, support, and relationship management',
  },
  'devops-infrastructure': {
    title: 'DevOps & Infrastructure',
    description: 'Monitor, alert, and respond to infrastructure events',
  },
  productivity: {
    title: 'Productivity',
    description: 'Streamline daily workflows and task management',
  },
};

export default function OpenClawTemplatesClient() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return MOCK_TEMPLATES;
    return MOCK_TEMPLATES.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, OpenClawTemplate[]> = {};
    filteredTemplates.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);

  const handleSelectTemplate = (template: OpenClawTemplate) => {
    router.push(`/agents?template=${template.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pre-configured templates for common workflows. Pick one to get started
            quickly.
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shrink-0"
          onClick={() => {
            if (filteredTemplates.length > 0) {
              handleSelectTemplate(filteredTemplates[0]);
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Start from Template
        </Button>
      </motion.div>

      {/* Category pills */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-2"
      >
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-pressed={activeCategory === cat.id}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Grouped templates */}
      <div className="space-y-10">
        {Object.entries(groupedTemplates).map(([category, templates], groupIdx) => {
          const meta = categoryDescriptions[category];
          return (
            <motion.div
              key={category}
              custom={groupIdx + 2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {meta && (
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {meta.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {meta.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelectTemplate(template)}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">
              No templates found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
