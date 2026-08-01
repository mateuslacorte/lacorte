import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DdayCalculator from '../DdayCalculator';
import './testUtils';

describe('DdayCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders date input', () => {
    render(<DdayCalculator />);

    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it('calculates days until future date', () => {
    vi.useRealTimers();
    render(<DdayCalculator />);

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    fireEvent.change(dateInput, { target: { value: futureDate.toISOString().split('T')[0] } });

    expect(screen.getByText('30 days remaining')).toBeInTheDocument();
  });

  it('shows D-Day for today', () => {
    vi.useRealTimers();
    render(<DdayCalculator />);

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: new Date().toISOString().split('T')[0] } });

    expect(screen.getByText('0 days ago')).toBeInTheDocument();
  });

  it('calculates days since past date', () => {
    vi.useRealTimers();
    render(<DdayCalculator />);

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);

    fireEvent.change(dateInput, { target: { value: pastDate.toISOString().split('T')[0] } });

    expect(screen.getByText('30 days ago')).toBeInTheDocument();
  });

  it('allows adding event name', () => {
    vi.useRealTimers();
    render(<DdayCalculator />);

    const nameInput = screen.getByPlaceholderText('e.g. vacation, exam, birthday...');
    fireEvent.change(nameInput, { target: { value: 'Birthday' } });

    expect(nameInput).toHaveValue('Birthday');
  });
});
