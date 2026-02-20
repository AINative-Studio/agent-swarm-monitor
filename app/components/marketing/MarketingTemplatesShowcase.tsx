'use client';
import React, { useState } from 'react';
import { loadMarketingTemplates, MarketingTemplate } from '../../lib/templateSchema';
import MarketingTemplateCard from './MarketingTemplateCard';
import MarketingTemplateDetail from './MarketingTemplateDetail';

export default function MarketingTemplatesShowcase() {
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null);
  const templates = loadMarketingTemplates();

  return (
    <div className="marketing-templates-showcase py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Marketing Agent Templates</h2>
          <p className="text-xl text-gray-600">Pre-configured AI agents for marketing</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map(t => (
            <MarketingTemplateCard
              key={t.id}
              template={t}
              onLearnMore={setSelectedTemplate}
              onUseTemplate={console.log}
              showPopularBadge={t.id === 'atlas-seo'}
            />
          ))}
        </div>
        <div className="text-center">
          <button className="bg-blue-600 text-white py-3 px-8 rounded-lg">
            View All Marketing Templates
          </button>
        </div>
      </div>
      {selectedTemplate && (
        <MarketingTemplateDetail
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUseTemplate={console.log}
        />
      )}
    </div>
  );
}
