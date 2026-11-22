import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StopGenerationButton } from '@/components/openclaw/StopGenerationButton';

describe('StopGenerationButton', () => {
  it('renders nothing when not streaming', () => {
    render(<StopGenerationButton isStreaming={false} onStop={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a visible stop control while streaming', () => {
    render(<StopGenerationButton isStreaming={true} onStop={vi.fn()} />);
    expect(screen.getByRole('button', { name: /stop generating/i })).toBeInTheDocument();
  });

  it('calls onStop when clicked', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(<StopGenerationButton isStreaming={true} onStop={onStop} />);

    await user.click(screen.getByRole('button', { name: /stop generating/i }));

    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
