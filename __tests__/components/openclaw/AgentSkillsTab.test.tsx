import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AgentSkillsTab from '@/components/openclaw/AgentSkillsTab';

vi.mock('@/lib/openclaw-service', () => ({
  default: {
    getSkills: vi.fn(),
    getSkillInstallationStatus: vi.fn(),
  },
}));

import openClawService from '@/lib/openclaw-service';

const mockGetSkills = vi.mocked(openClawService.getSkills);
const mockGetInstallationStatus = vi.mocked(openClawService.getSkillInstallationStatus);

describe('AgentSkillsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Reproduces issue #137: openai-whisper-api is `eligible: false` /
  // `disabled: true` but its `missing` object has every array empty and its
  // installation-status endpoint returns `status: null` -- there is no
  // concrete reason text for the "Missing: " banner.
  describe('Missing skill with no concrete reason (issue #137)', () => {
    beforeEach(() => {
      mockGetSkills.mockResolvedValue({
        total: 2,
        ready: 1,
        skills: [
          {
            name: 'sag',
            description: 'Text-to-speech via ElevenLabs',
            eligible: false,
            disabled: true,
            source: 'builtin',
            type: 'cli',
            missing: { env: ['ELEVENLABS_API_KEY'] },
          },
          {
            name: 'openai-whisper-api',
            description: 'Transcribe audio via OpenAI Whisper',
            eligible: false,
            disabled: true,
            source: 'builtin',
            type: 'cli',
            missing: { bins: [], anyBins: [], env: [], config: [], os: [] },
          },
        ],
      });
      mockGetInstallationStatus.mockResolvedValue({
        skill_name: 'openai-whisper-api',
        isInstalled: false,
        binaryPath: null,
        status: null,
      });
    });

    it('never renders a bare "Missing: " label with nothing after the colon', async () => {
      render(<AgentSkillsTab agentId="agent-1" />);

      await waitFor(() => {
        expect(screen.getByText('openai-whisper-api')).toBeInTheDocument();
      });

      // The sibling skill with a real reason still shows it normally.
      expect(screen.getByText(/ELEVENLABS_API_KEY env/)).toBeInTheDocument();

      // openai-whisper-api's card must show a non-empty fallback reason,
      // not an empty string after "Missing:".
      const card = screen.getByText('openai-whisper-api').closest('div.border');
      expect(card).not.toBeNull();
      expect(card!.textContent).toMatch(/Missing:\s*\S/);
      expect(card!.textContent?.toLowerCase()).toContain('status unknown');
    });

    it('still renders an actionable Install button instead of leaving the card a dead end', async () => {
      render(<AgentSkillsTab agentId="agent-1" />);

      await waitFor(() => {
        expect(screen.getByText('openai-whisper-api')).toBeInTheDocument();
      });

      const card = screen.getByText('openai-whisper-api').closest('div.border');
      expect(card).not.toBeNull();
      const installButton = Array.from(card!.querySelectorAll('button')).find((b) =>
        /install/i.test(b.textContent || '')
      );
      expect(installButton).toBeTruthy();
    });
  });

  describe('Missing skill with a concrete reason', () => {
    it('renders the reason text and the matching action button', async () => {
      mockGetSkills.mockResolvedValue({
        total: 1,
        ready: 0,
        skills: [
          {
            name: 'nano-pdf',
            description: 'PDF generation CLI',
            eligible: false,
            disabled: true,
            source: 'builtin',
            type: 'cli',
            missing: { bins: ['nano-pdf'] },
          },
        ],
      });
      mockGetInstallationStatus.mockResolvedValue({
        skill_name: 'nano-pdf',
        isInstalled: false,
        binaryPath: null,
        status: 'missing',
      });

      render(<AgentSkillsTab agentId="agent-1" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'nano-pdf' })).toBeInTheDocument();
      });

      const card = screen.getByRole('heading', { name: 'nano-pdf' }).closest('div.border');
      expect(card).not.toBeNull();
      expect(card!.textContent).toMatch(/Missing:\s*nano-pdf/);
      expect(screen.getByRole('button', { name: /install/i })).toBeInTheDocument();
    });
  });

  describe('Loading, error, and empty states', () => {
    it('shows a loading indicator while skills are being fetched', () => {
      mockGetSkills.mockReturnValue(new Promise(() => {})); // never resolves
      render(<AgentSkillsTab agentId="agent-1" />);
      expect(screen.getByText(/loading skills/i)).toBeInTheDocument();
    });

    it('shows an error state when the skills request fails', async () => {
      mockGetSkills.mockRejectedValue(new Error('Network error'));
      render(<AgentSkillsTab agentId="agent-1" />);
      await waitFor(() => {
        expect(screen.getByText(/failed to load skills/i)).toBeInTheDocument();
      });
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows an empty state when there are no skills', async () => {
      mockGetSkills.mockResolvedValue({ total: 0, ready: 0, skills: [] });
      render(<AgentSkillsTab agentId="agent-1" />);
      await waitFor(() => {
        expect(screen.getByText(/no skills available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Ready skills', () => {
    it('renders a ready skill without a Missing banner or action buttons', async () => {
      mockGetSkills.mockResolvedValue({
        total: 1,
        ready: 1,
        skills: [
          {
            name: 'web-search',
            description: 'Search the web',
            eligible: true,
            disabled: false,
            source: 'builtin',
            type: 'project',
          },
        ],
      });

      render(<AgentSkillsTab agentId="agent-1" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'web-search' })).toBeInTheDocument();
      });

      expect(screen.queryByText(/missing:/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /install/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /configure/i })).not.toBeInTheDocument();
    });
  });

  describe('Filter pills', () => {
    beforeEach(() => {
      mockGetSkills.mockResolvedValue({
        total: 2,
        ready: 1,
        skills: [
          {
            name: 'web-search',
            description: 'Search the web',
            eligible: true,
            disabled: false,
            source: 'builtin',
            type: 'project',
          },
          {
            name: 'sag',
            description: 'Text-to-speech via ElevenLabs',
            eligible: false,
            disabled: true,
            source: 'builtin',
            type: 'cli',
            missing: { env: ['ELEVENLABS_API_KEY'] },
          },
        ],
      });
    });

    it('filters to only ready skills when the Ready pill is clicked', async () => {
      render(<AgentSkillsTab agentId="agent-1" />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'web-search' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /ready \(1\)/i }));

      expect(screen.getByRole('heading', { name: 'web-search' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'sag' })).not.toBeInTheDocument();
    });

    it('filters to only missing skills when the Missing pill is clicked', async () => {
      render(<AgentSkillsTab agentId="agent-1" />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'sag' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /missing \(1\)/i }));

      expect(screen.getByRole('heading', { name: 'sag' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'web-search' })).not.toBeInTheDocument();
    });
  });

  describe('Configure action for skills needing an API key', () => {
    it('opens the Configure modal when the Configure button is clicked', async () => {
      mockGetSkills.mockResolvedValue({
        total: 1,
        ready: 0,
        skills: [
          {
            name: 'sag',
            description: 'Text-to-speech via ElevenLabs',
            eligible: false,
            disabled: true,
            source: 'builtin',
            type: 'cli',
            missing: { env: ['ELEVENLABS_API_KEY'] },
          },
        ],
      });

      render(<AgentSkillsTab agentId="agent-1" />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /configure/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /configure/i }));

      expect(screen.getByText(/configure/i, { selector: 'h2, h3' })).toBeInTheDocument();
    });
  });
});
