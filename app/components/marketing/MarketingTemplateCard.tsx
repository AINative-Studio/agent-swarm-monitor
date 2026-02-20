'use client';
import React from 'react';
import { MarketingTemplate } from '../../lib/templateSchema';

interface MarketingTemplateCardProps {
  template: MarketingTemplate;
  onLearnMore: (template: MarketingTemplate) => void;
  onUseTemplate: (template: MarketingTemplate) => void;
  showPopularBadge?: boolean;
}

export default function MarketingTemplateCard({ template, onLearnMore, onUseTemplate, showPopularBadge = false }: MarketingTemplateCardProps) {
  return (
    <div data-testid="template-card" className="bg-white rounded-lg shadow-md p-6 border">
      {showPopularBadge && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block">
          Most Popular
        </div>
      )}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
          {template.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{template.name}</h3>
          <p className="text-sm text-gray-600">{template.subcategory}</p>
        </div>
      </div>
      <p className="text-gray-700 mb-4 text-sm">{template.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {template.tags.map(tag => (
          <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Capabilities:</h4>
        <ul className="space-y-1">
          {template.config.capabilities.slice(0, 3).map((cap, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>{cap}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          <span className="font-semibold">{template.rating}</span>
        </div>
        <div><span className="font-semibold">{template.usageCount}</span> uses</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onUseTemplate(template)} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded">
          Use Template
        </button>
        <button onClick={() => onLearnMore(template)} className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded">
          Learn More
        </button>
      </div>
    </div>
  );
}
