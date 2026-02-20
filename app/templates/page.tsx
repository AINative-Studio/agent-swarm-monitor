'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TemplateSearchBar } from '@/app/components/templates/TemplateSearchBar'
import { TemplateCategoryTabs } from '@/app/components/templates/TemplateCategoryTabs'
import { TemplateGrid } from '@/app/components/templates/TemplateGrid'
import { TemplatePreviewModal } from '@/app/components/templates/TemplatePreviewModal'
import { mockTemplates, filterTemplates, getCategoryCounts } from '@/app/lib/mockTemplates'
import type { AgentTemplate } from '@/app/lib/mockTemplates'

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [previewTemplate, setPreviewTemplate] = useState<AgentTemplate | null>(null)

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return filterTemplates(mockTemplates, searchQuery, selectedCategory)
  }, [searchQuery, selectedCategory])

  // Get category counts
  const categoryCounts = useMemo(() => {
    return getCategoryCounts()
  }, [])

  const handleUseTemplate = (templateId: string) => {
    router.push(`/agents/new?template=${templateId}`)
  }

  const handlePreview = (template: AgentTemplate) => {
    setPreviewTemplate(template)
  }

  const handleClosePreview = () => {
    setPreviewTemplate(null)
  }

  const handleUseFromPreview = (templateId: string) => {
    handleClosePreview()
    handleUseTemplate(templateId)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">Agent Templates</h1>
          <Button onClick={() => router.push('/templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Template
          </Button>
        </div>
        <p className="text-muted-foreground">
          Browse and use pre-built agent templates to quickly deploy specialized AI agents for your workflows
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <TemplateSearchBar searchQuery={searchQuery} onSearch={setSearchQuery} />
      </div>

      {/* Category Tabs */}
      <div className="mb-8">
        <TemplateCategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Templates Grid */}
      <TemplateGrid
        templates={filteredTemplates}
        onUseTemplate={handleUseTemplate}
        onPreview={handlePreview}
      />

      {/* Preview Modal */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={handleClosePreview}
        onUseTemplate={handleUseFromPreview}
      />
    </div>
  )
}
