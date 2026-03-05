'use client';

import { useState, useEffect } from 'react';
import { Wand2, Check, AlertCircle, ExternalLink, Loader2, Settings, Download } from 'lucide-react';
import openClawService from '@/lib/openclaw-service';
import SkillConfigureModal from './SkillConfigureModal';
import SkillInstallModal from './SkillInstallModal';

interface Skill {
  name: string;
  description: string;
  emoji?: string;
  eligible: boolean;
  disabled: boolean;
  source: string;
  type?: 'cli' | 'project';
  homepage?: string;
  missing?: {
    bins?: string[];
    anyBins?: string[];
    env?: string[];
    config?: string[];
    os?: string[];
  };
}

interface SkillsData {
  total: number;
  ready: number;
  skills: Skill[];
}

export default function AgentSkillsTab({ agentId }: { agentId: string }) {
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ready' | 'missing'>('all');
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    async function loadSkills() {
      try {
        setIsLoading(true);
        const data = await openClawService.getSkills();
        setSkillsData(data);
      } catch (err) {
        console.error('Failed to load skills:', err);
        setError(err instanceof Error ? err.message : 'Failed to load skills');
      } finally {
        setIsLoading(false);
      }
    }

    loadSkills();
  }, []);

  const getFilteredSkills = () => {
    if (!skillsData) return [];

    switch (filter) {
      case 'ready':
        return skillsData.skills.filter((s) => s.eligible);
      case 'missing':
        return skillsData.skills.filter((s) => !s.eligible);
      default:
        return skillsData.skills;
    }
  };

  const needsApiKey = (skill: Skill): boolean => {
    // Skills that have missing env variables likely need API keys
    return !!(skill.missing?.env && skill.missing.env.length > 0);
  };

  const needsInstallation = (skill: Skill): boolean => {
    // Skills that have missing binaries need installation
    return !!(
      (skill.missing?.bins && skill.missing.bins.length > 0) ||
      (skill.missing?.anyBins && skill.missing.anyBins.length > 0)
    );
  };

  const handleConfigure = (skillName: string) => {
    setSelectedSkill(skillName);
    setIsConfigureModalOpen(true);
  };

  const handleInstall = (skillName: string) => {
    setSelectedSkill(skillName);
    setIsInstallModalOpen(true);
  };

  const handleConfigureSuccess = async () => {
    // Reload skills after successful configuration
    try {
      const data = await openClawService.getSkills();
      setSkillsData(data);
    } catch (err) {
      console.error('Failed to reload skills:', err);
    }
  };

  const handleInstallSuccess = async () => {
    // Reload skills after successful installation
    try {
      const data = await openClawService.getSkills();
      setSkillsData(data);
    } catch (err) {
      console.error('Failed to reload skills:', err);
    }
  };

  const filteredSkills = getFilteredSkills();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading skills...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-5">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load skills
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">{error}</p>
      </div>
    );
  }

  if (!skillsData || skillsData.skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-5">
          <Wand2 className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No skills available
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          No OpenClaw skills found on this system.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header with stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">OpenClaw Skills</h2>
            <p className="text-sm text-gray-500 mt-1">
              {skillsData.ready} of {skillsData.total} skills ready
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({skillsData.total})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'ready'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ready ({skillsData.ready})
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'missing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Missing ({skillsData.total - skillsData.ready})
            </button>
          </div>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map((skill) => (
          <div
            key={skill.name}
            className={`border rounded-lg p-4 transition-colors ${
              skill.eligible
                ? 'border-gray-200 bg-white hover:border-gray-300'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Emoji or status icon */}
              <div className="flex-shrink-0">
                {skill.emoji ? (
                  <span className="text-2xl">{skill.emoji}</span>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Wand2 className="h-4 w-4 text-gray-500" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Skill name and status */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {skill.name}
                  </h3>
                  {skill.eligible ? (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
                  {skill.description}
                </p>

                {/* Missing dependencies */}
                {!skill.eligible && skill.missing && (
                  <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
                    <span className="font-medium">Missing:</span>{' '}
                    {[
                      ...(skill.missing.bins || []),
                      ...(skill.missing.env || []).map((e) => `${e} env`),
                      ...(skill.missing.config || []).map((c) => `${c} config`),
                    ]
                      .slice(0, 3)
                      .join(', ')}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Homepage link */}
                  {skill.homepage && (
                    <a
                      href={skill.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Learn more
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {/* Install button for skills needing binaries */}
                  {needsInstallation(skill) && (
                    <button
                      onClick={() => handleInstall(skill.name)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Install
                    </button>
                  )}

                  {/* Configure button for skills needing API keys */}
                  {needsApiKey(skill) && (
                    <button
                      onClick={() => handleConfigure(skill.name)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      <Settings className="h-3 w-3" />
                      Configure
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">
            No skills match the current filter.
          </p>
        </div>
      )}

      {/* Configure Modal */}
      {selectedSkill && (
        <SkillConfigureModal
          isOpen={isConfigureModalOpen}
          onClose={() => {
            setIsConfigureModalOpen(false);
            setSelectedSkill(null);
          }}
          skillName={selectedSkill}
          agentId={agentId}
          onSuccess={handleConfigureSuccess}
        />
      )}

      {/* Install Modal */}
      {selectedSkill && (
        <SkillInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => {
            setIsInstallModalOpen(false);
            setSelectedSkill(null);
          }}
          skillName={selectedSkill}
          onSuccess={handleInstallSuccess}
        />
      )}
    </div>
  );
}
