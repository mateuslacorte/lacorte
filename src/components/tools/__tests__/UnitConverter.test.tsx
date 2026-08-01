import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnitConverter from '../UnitConverter';
import './testUtils';

function getResultValue(): number {
  const resultInput = screen.getByRole('textbox') as HTMLInputElement;
  return parseFloat(resultInput.value.replace(/,/g, '') || '0');
}

describe('UnitConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category tabs', () => {
    render(<UnitConverter />);

    expect(screen.getByText('Length')).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('converts meters to feet correctly', () => {
    render(<UnitConverter />);

    expect(getResultValue()).toBeCloseTo(3.28084, 2);
  });

  it('updates result when input changes', async () => {
    render(<UnitConverter />);
    const user = userEvent.setup();

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');

    expect(getResultValue()).toBeCloseTo(32.8084, 1);
  });

  it('switches categories correctly', async () => {
    render(<UnitConverter />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Weight'));

    expect(screen.getAllByText(/Kilogram|Gram|Pound|Ounce/).length).toBeGreaterThan(0);
  });

  it('converts temperature correctly (Celsius to Fahrenheit)', async () => {
    render(<UnitConverter />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Temperature'));

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '0');

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'celsius');
    await user.selectOptions(selects[1], 'fahrenheit');

    expect(getResultValue()).toBeCloseTo(32, 0);
  });

  it('converts pyeong to square meters', async () => {
    render(<UnitConverter />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Area'));

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'pyeong');
    await user.selectOptions(selects[1], 'sqm');

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '1');

    expect(getResultValue()).toBeCloseTo(3.306, 2);
  });

  it('swaps units when swap button is clicked', async () => {
    render(<UnitConverter />);
    const user = userEvent.setup();

    const selects = screen.getAllByRole('combobox');
    const fromUnit = (selects[0] as HTMLSelectElement).value;
    const toUnit = (selects[1] as HTMLSelectElement).value;

    const swapBtn = screen.getAllByRole('button').find((btn) => btn.querySelector('svg'));
    expect(swapBtn).toBeTruthy();

    await user.click(swapBtn!);

    const updatedSelects = screen.getAllByRole('combobox');
    expect(updatedSelects[0]).toHaveValue(toUnit);
    expect(updatedSelects[1]).toHaveValue(fromUnit);
  });

  it('handles very small numbers with exponential notation', async () => {
    render(<UnitConverter />);
    const user = userEvent.setup();

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '0.0000001');

    const value = (screen.getByRole('textbox') as HTMLInputElement).value;
    expect(value).toMatch(/e|E|-/);
  });

  it('handles empty input gracefully', async () => {
    render(<UnitConverter />);
    const user = userEvent.setup();

    const input = screen.getByRole('spinbutton');
    await user.clear(input);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
