import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThreeQuestionsModal } from './ThreeQuestionsModal';

describe('ThreeQuestionsModal', () => {
  it('renders the three labelled textareas when open', () => {
    render(<ThreeQuestionsModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Wat doet deze collega op een gemiddelde dag?')).toBeInTheDocument();
    expect(screen.getByLabelText('Wat moet iemand zeker kunnen?')).toBeInTheDocument();
    expect(screen.getByLabelText('Waarom zou iemand voor jullie kiezen?')).toBeInTheDocument();
  });

  it('calls onClose when Annuleren is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ThreeQuestionsModal open={true} onClose={onClose} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits the mapped inputs and closes on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<ThreeQuestionsModal open={true} onClose={onClose} onSubmit={onSubmit} />);

    await user.type(
      screen.getByLabelText('Wat doet deze collega op een gemiddelde dag?'),
      'API bouwen',
    );
    await user.type(screen.getByLabelText('Wat moet iemand zeker kunnen?'), '5+ jaar Node');
    await user.type(
      screen.getByLabelText('Waarom zou iemand voor jullie kiezen?'),
      'Klein team, veel autonomie',
    );
    await user.click(screen.getByRole('button', { name: 'Genereer mijn concept vacature' }));

    expect(onSubmit).toHaveBeenCalledWith({
      mostImportantTasks: 'API bouwen\n5+ jaar Node',
      team: '',
      whyNiceJob: 'Klein team, veel autonomie',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    render(<ThreeQuestionsModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
