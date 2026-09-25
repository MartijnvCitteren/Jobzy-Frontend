import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardHeader } from './CardHeader';

describe('CardHeader', () => {
  it('renders the title as an h2 by default', () => {
    render(<CardHeader title="Basisgegevens" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Basisgegevens' })).toBeInTheDocument();
  });

  it('renders the title at the requested heading level', () => {
    render(<CardHeader title="Vacaturetekst" level={3} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Vacaturetekst' })).toBeInTheDocument();
  });

  it('renders the description when passed', () => {
    render(
      <CardHeader
        title="Basisgegevens"
        description="Deze velden bepalen waar je vacature terechtkomt."
      />,
    );

    expect(screen.getByText('Deze velden bepalen waar je vacature terechtkomt.')).toBeInTheDocument();
  });

  it('omits the description paragraph when none is passed', () => {
    const { container } = render(<CardHeader title="Basisgegevens" />);

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });
});
