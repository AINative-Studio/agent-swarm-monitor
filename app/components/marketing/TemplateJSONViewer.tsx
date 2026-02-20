'use client';
import React, { useState } from 'react';
import { MarketingTemplate } from '../../lib/templateSchema';

interface Props {
  template: MarketingTemplate;
  showImportHint?: boolean;
}

export default function TemplateJSONViewer({ template, showImportHint = false }: Props) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(template, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="template-json-viewer">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Template Configuration (JSON)</h3>
        <button onClick={handleCopy} className="px-4 py-2 bg-blue-600 text-white rounded">
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
      <div data-testid="json-viewer" className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
        <pre>{jsonString}</pre>
      </div>
      {showImportHint && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900">Import Custom Template</h4>
          <p className="text-sm text-blue-700 mt-1">
            Copy this JSON structure to create your own custom templates.
          </p>
        </div>
      )}
    </div>
  );
}
