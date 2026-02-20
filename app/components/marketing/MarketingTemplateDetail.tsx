'use client';
import React, { useState } from 'react';
import { MarketingTemplate } from '../../lib/templateSchema';

interface Props {
  template: MarketingTemplate;
  onClose: () => void;
  onUseTemplate: (t: MarketingTemplate) => void;
}

export default function MarketingTemplateDetail({ template, onClose, onUseTemplate }: Props) {
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);
  
  const copyPrompt = async (prompt: string, index: number) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(index);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold">
              {template.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{template.name}</h2>
              <p className="text-gray-600">{template.subcategory}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-2xl" aria-label="close">×</button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-6 mb-6 pb-6 border-b">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-xl">★</span>
              <span className="text-2xl font-bold">{template.rating}</span>
              <span className="text-gray-600">rating</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{template.usageCount}</span>
              <span className="text-gray-600"> uses</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {template.tags.map(tag => (
              <span key={tag} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">{tag}</span>
            ))}
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">About</h3>
            <p className="text-gray-700">{template.longDescription}</p>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {template.config.capabilities.map((cap, i) => (
                <div key={i} className="flex items-start gap-2 bg-green-50 p-3 rounded">
                  <span className="text-green-600 text-lg">✓</span>
                  <span className="text-gray-700">{cap}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Example Prompts</h3>
            <div className="space-y-3">
              {template.config.examplePrompts.map((prompt, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-gray-700 flex-1">{prompt}</p>
                    <button onClick={() => copyPrompt(prompt, i)} className="text-blue-600 text-sm font-medium" aria-label="copy">
                      {copiedPrompt === i ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div><p className="text-gray-600 text-sm mb-1">Model</p><p className="font-semibold">{template.config.model}</p></div>
              <div><p className="text-gray-600 text-sm mb-1">Temperature</p><p className="font-semibold">{template.config.temperature}</p></div>
              <div><p className="text-gray-600 text-sm mb-1">Max Tokens</p><p className="font-semibold">{template.config.maxTokens}</p></div>
              <div><p className="text-gray-600 text-sm mb-1">Channels</p><p className="font-semibold">{template.config.channels.length}</p></div>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Supported Channels</h3>
            <div className="flex flex-wrap gap-2">
              {template.config.channels.map(ch => (
                <span key={ch} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium capitalize">{ch}</span>
              ))}
            </div>
          </div>
          <div className="sticky bottom-0 bg-white pt-4 border-t">
            <button onClick={() => onUseTemplate(template)} className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg text-lg">
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
