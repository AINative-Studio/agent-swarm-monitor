'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTemplateList } from '@/hooks/useTemplates';
import { useCreateAgent } from '@/hooks/useOpenClawAgents';
import TemplateCard from '@/components/openclaw/TemplateCard';
import CreateAgentDialog from '@/components/openclaw/CreateAgentDialog';
import type { OpenClawTemplate, CreateAgentRequest } from '@/types/openclaw';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'sales-outreach', label: 'Sales & Outreach' },
  { id: 'devops-infrastructure', label: 'DevOps & Infrastructure' },
  { id: 'productivity', label: 'Productivity' },
] as const;

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
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<OpenClawTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: templateData, isLoading } = useTemplateList();
  const createAgent = useCreateAgent();

  const templates = useMemo(() => templateData?.templates ?? [], [templateData]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return templates;
    return templates.filter((t) => t.category === activeCategory);
  }, [activeCategory, templates]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, OpenClawTemplate[]> = {};
    filteredTemplates.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);

  // Handle ?selected= query param from home page
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId && templates.length > 0) {
      const found = templates.find((t) => t.id === selectedId);
      if (found) {
        setSelectedTemplate(found);
        setDialogOpen(true);
      }
    }
  }, [searchParams, templates]);

  const handleSelectTemplate = (template: OpenClawTemplate) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleCreate = (formData: CreateAgentRequest) => {
    createAgent.mutate(formData, {
      onSuccess: (agent) => {
        router.push(`/agents/${agent.id}`);
      },
    });
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedTemplate(null);
    }
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

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Grouped templates */}
      {!isLoading && (
        <div className="space-y-10">
          {Object.entries(groupedTemplates).map(([category, temps], groupIdx) => {
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
                  {temps.map((template) => (
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
      )}

      {/* Create agent dialog */}
      <CreateAgentDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onSubmit={handleCreate}
        template={selectedTemplate}
      />
    </div>
  );
}
