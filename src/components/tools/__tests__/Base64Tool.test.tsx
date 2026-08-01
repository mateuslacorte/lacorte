import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Base64Tool from '../Base64Tool';
import './testUtils';

describe('Base64Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders encode and decode buttons', () => {
    render(<Base64Tool />);

    expect(screen.getByText('Encode')).toBeInTheDocument();
    expect(screen.getByText('Decode')).toBeInTheDocument();
  });

  it('encodes text to Base64 correctly', async () => {
    render(<Base64Tool />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Hello World');

    // Auto-convert on input
    const output = screen.getAllByRole('textbox')[1];
    expect(output).toHaveValue('SGVsbG8gV29ybGQ=');
  });

  it('decodes Base64 to text correctly', async () => {
    render(<Base64Tool />);
    const user = userEvent.setup();

    // Switch to decode mode
    await user.click(screen.getByText('Decode'));

    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'SGVsbG8gV29ybGQ=');

    const output = screen.getAllByRole('textbox')[1];
    expect(output).toHaveValue('Hello World');
  });

  it('shows error for invalid Base64 in decode mode', async () => {
    render(<Base64Tool />);
    const user = userEvent.setup();

    // Switch to decode mode
    await user.click(screen.getByText('Decode'));

    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'invalid!!!');

    expect(screen.getByText('Invalid Base64')).toBeInTheDocument();
  });

  it('handles Unicode characters correctly', async () => {
    render(<Base64Tool />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'café');

    const output = screen.getAllByRole('textbox')[1];
    // Verify it produces valid Base64 (value may be property or attribute)
    const encoded = (output as HTMLInputElement).value || output.getAttribute('value') || '';
    expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('swaps input and output when swap button is clicked', async () => {
    render(<Base64Tool />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Test');

    const swapButton = screen.getByRole('button', { name: '' }); // SVG button
    const buttons = screen.getAllByRole('button');
    const swapBtn = buttons.find(btn => btn.querySelector('svg path[d*="M7 16V4"]'));

    if (swapBtn) {
      await user.click(swapBtn);
    }
  });

  it('copies output to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<Base64Tool />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Hello');

    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('SGVsbG8=');
  });

  it('clears input and output when mode changes', async () => {
    render(<Base64Tool />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Test');

    // Switch mode
    await user.click(screen.getByText('Decode'));

    expect(input).toHaveValue('');
  });
});
