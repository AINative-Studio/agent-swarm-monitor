'use client';

import { Wand2 } from 'lucide-react';

export default function AgentSkillsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-5">
        <Wand2 className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Skills coming soon
      </h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
        Add custom skills to extend your agent&apos;s capabilities.
        This feature is under development.
      </p>
    </div>
  );
}
