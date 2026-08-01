import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BmiCalculator from '../BmiCalculator';
import './testUtils';

async function calculateBmi(
  user: ReturnType<typeof userEvent.setup>,
  height: string,
  weight: string,
) {
  const inputs = screen.getAllByRole('spinbutton');
  await user.clear(inputs[0]);
  await user.type(inputs[0], height);
  await user.clear(inputs[1]);
  await user.type(inputs[1], weight);
  await user.click(screen.getByRole('button', { name: 'Calculate BMI' }));
}

function getResultSection() {
  return screen.getByText('My BMI').closest('.space-y-4') as HTMLElement;
}

describe('BmiCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders height and weight inputs', () => {
    render(<BmiCalculator />);

    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
  });

  it('calculates BMI correctly', async () => {
    render(<BmiCalculator />);
    const user = userEvent.setup();

    await calculateBmi(user, '170', '70');

    expect(getResultSection()).toHaveTextContent(/24\.[0-9]/);
  });

  it('shows BMI category for normal range', async () => {
    render(<BmiCalculator />);
    const user = userEvent.setup();

    await calculateBmi(user, '170', '65');

    expect(getResultSection()).toHaveTextContent('Normal');
  });

  it('handles underweight BMI', async () => {
    render(<BmiCalculator />);
    const user = userEvent.setup();

    await calculateBmi(user, '180', '50');

    expect(getResultSection()).toHaveTextContent(/15\.[0-9]/);
    expect(getResultSection()).toHaveTextContent('Underweight');
  });

  it('handles obese BMI', async () => {
    render(<BmiCalculator />);
    const user = userEvent.setup();

    await calculateBmi(user, '170', '80');

    expect(getResultSection()).toHaveTextContent(/27\.[0-9]/);
    expect(getResultSection()).toHaveTextContent('Obese Class I');
  });

  it('handles empty inputs gracefully', () => {
    render(<BmiCalculator />);

    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0);
  });
});
