import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

function Harness({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <button type="button">trigger</button>
      <Modal open={open} onClose={onClose} title="Test modal">
        <button type="button">inside</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Harness open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its content when open', () => {
    render(<Harness open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Test modal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'inside' })).toBeInTheDocument();
  });

  it('calls onClose on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness open={true} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on scrim click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness open={true} onClose={onClose} />);

    await user.click(screen.getByTestId('modal-scrim'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the panel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness open={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'inside' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('moves focus into the modal and returns it to the trigger on close', async () => {
    const user = userEvent.setup();
    function ControlledHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            trigger
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Test modal">
            <button type="button">inside</button>
          </Modal>
        </>
      );
    }

    render(<ControlledHarness />);
    const trigger = screen.getByRole('button', { name: 'trigger' });
    trigger.focus();
    await user.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
