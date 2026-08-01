import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorConverter from '../ColorConverter';
import './testUtils';

describe('ColorConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HEX, RGB, HSL labels', () => {
    render(<ColorConverter />);

    expect(screen.getByText('HEX')).toBeInTheDocument();
    expect(screen.getByText('RGB')).toBeInTheDocument();
    expect(screen.getByText('HSL')).toBeInTheDocument();
  });

  it('converts HEX to RGB correctly', async () => {
    render(<ColorConverter />);
    const user = userEvent.setup();

    const hexInput = screen.getAllByRole('textbox')[0];
    await user.clear(hexInput);
    await user.type(hexInput, '#ff0000');

    const rInput = screen.getAllByRole('spinbutton').find((input) => (input as HTMLInputElement).value === '255');
    expect(rInput).toBeTruthy();
  });

  it('converts RGB to HEX correctly', async () => {
    render(<ColorConverter />);
    const user = userEvent.setup();

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '0');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '255');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '0');

    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value.toLowerCase()).toContain('00ff00');
  });

  it('shows color preview', () => {
    render(<ColorConverter />);

    expect(document.querySelector('input[type="color"]')).toBeInTheDocument();
  });

  it('handles invalid HEX input', async () => {
    render(<ColorConverter />);
    const user = userEvent.setup();

    const hexInput = screen.getAllByRole('textbox')[0];
    await user.clear(hexInput);
    await user.type(hexInput, 'invalid');

    expect(hexInput).toBeInTheDocument();
  });

  it('copies color value to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<ColorConverter />);
    const user = userEvent.setup();

    await user.click(screen.getAllByRole('button', { name: 'Copy' })[0]);

    expect(mockWriteText).toHaveBeenCalled();
  });

  it('syncs all color formats when one changes', async () => {
    render(<ColorConverter />);
    const user = userEvent.setup();

    const hexInput = screen.getAllByRole('textbox')[0];
    await user.clear(hexInput);
    await user.type(hexInput, '#0000ff');

    const bInput = screen.getAllByRole('spinbutton').find((input) => (input as HTMLInputElement).value === '255');
    expect(bInput).toBeTruthy();
  });

  it('handles color picker input', () => {
    render(<ColorConverter />);

    const colorPicker = document.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(colorPicker, { target: { value: '#ff00ff' } });

    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value.toLowerCase()).toContain('ff00ff');
  });
});
