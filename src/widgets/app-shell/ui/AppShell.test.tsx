import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

function renderShell() {
  render(
    <MemoryRouter>
      <AppShell>
        <div>content</div>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders the "Vacatures" nav item as active and others as inactive', () => {
    renderShell();

    expect(screen.getByRole('link', { name: 'Vacatures' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Kandidaten' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Statistieken' })).not.toHaveAttribute('aria-current');
  });

  it('renders an avatar chip with initials', () => {
    renderShell();

    expect(screen.getByText('MJ')).toBeInTheDocument();
  });

  it('renders the account menu items (Account, Instellingen, Support)', () => {
    renderShell();

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Instellingen')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('renders the passed children content', () => {
    renderShell();

    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
