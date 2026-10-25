import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from './PasswordField';

const labels = { show: 'Wachtwoord tonen', hide: 'Wachtwoord verbergen' };

describe('PasswordField', () => {
  it('hides the password by default', () => {
    render(<PasswordField label="Wachtwoord" value="geheim" onChange={vi.fn()} toggleLabels={labels} />);

    expect(screen.getByLabelText('Wachtwoord')).toHaveAttribute('type', 'password');
  });

  it('reveals and hides the password with the toggle', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Wachtwoord" value="geheim" onChange={vi.fn()} toggleLabels={labels} />);

    await user.click(screen.getByRole('button', { name: 'Wachtwoord tonen' }));
    expect(screen.getByLabelText('Wachtwoord')).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Wachtwoord verbergen' }));
    expect(screen.getByLabelText('Wachtwoord')).toHaveAttribute('type', 'password');
  });
});
