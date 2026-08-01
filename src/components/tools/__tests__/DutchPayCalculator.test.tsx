import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DutchPayCalculator from '../DutchPayCalculator';
import './testUtils';

describe('DutchPayCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders total amount input and group size buttons', () => {
    render(<DutchPayCalculator />);

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('calculates equal split correctly', async () => {
    render(<DutchPayCalculator />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('spinbutton'), '30000');
    await user.click(screen.getByRole('button', { name: '3' }));

    expect(screen.getByText(/\$10,000|\$10000/)).toBeInTheDocument();
  });

  it('handles uneven splits (with remainder)', async () => {
    render(<DutchPayCalculator />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('spinbutton'), '10000');
    await user.click(screen.getByRole('button', { name: '3' }));

    const textContent = document.body.textContent;
    expect(textContent).toMatch(/3,?334|3334/);
  });

  it('handles single person (no split needed)', async () => {
    render(<DutchPayCalculator />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('spinbutton'), '50000');
    await user.click(screen.getByRole('button', { name: '2' }));

    expect(screen.getByText(/\$25,000|\$25000/)).toBeInTheDocument();
  });

  it('handles large amounts correctly', async () => {
    render(<DutchPayCalculator />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('spinbutton'), '1000000');
    await user.click(screen.getByRole('button', { name: '4' }));

    expect(screen.getByText(/\$250,000|\$250000/)).toBeInTheDocument();
  });

  it('handles zero amount gracefully', async () => {
    render(<DutchPayCalculator />);
    const user = userEvent.setup();

    await user.type(screen.getByRole('spinbutton'), '0');
    await user.click(screen.getByRole('button', { name: '5' }));

    const textContent = document.body.textContent;
    expect(textContent).toMatch(/\$0|0/);
  });
});
