import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordGenerator from '../PasswordGenerator';
import './testUtils';

describe('PasswordGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders generate button and options', () => {
    render(<PasswordGenerator />);

    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Uppercase (A-Z)')).toBeInTheDocument();
    expect(screen.getByText('Lowercase (a-z)')).toBeInTheDocument();
    expect(screen.getByText('Numbers (0-9)')).toBeInTheDocument();
    expect(screen.getByText('Symbols (!@#$...)')).toBeInTheDocument();
  });

  it('generates password when clicking generate button', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Generate'));

    const input = screen.getByPlaceholderText('Generated password');
    expect(input.getAttribute('value')).not.toBe('');
  });

  it('generates password with correct length', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    // Default length is 16
    await user.click(screen.getByText('Generate'));

    const input = screen.getByPlaceholderText('Generated password');
    expect(input.getAttribute('value')?.length).toBe(16);
  });

  it('respects length slider changes', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '32' } });

    await user.click(screen.getByText('Generate'));

    const input = screen.getByPlaceholderText('Generated password');
    expect(input.getAttribute('value')?.length).toBe(32);
  });

  it('includes uppercase letters when option is checked', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    // All options are checked by default, uncheck some
    const lowercaseCheckbox = screen.getByRole('checkbox', { name: 'Lowercase (a-z)' });
    const numbersCheckbox = screen.getByRole('checkbox', { name: 'Numbers (0-9)' });
    const symbolsCheckbox = screen.getByRole('checkbox', { name: 'Symbols (!@#$...)' });

    await user.click(lowercaseCheckbox);
    await user.click(numbersCheckbox);
    await user.click(symbolsCheckbox);

    await user.click(screen.getByText('Generate'));

    const input = screen.getByPlaceholderText('Generated password');
    const password = input.getAttribute('value') || '';
    expect(password).toMatch(/^[A-Z]+$/);
  });

  it('includes lowercase letters when option is checked', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    const uppercaseCheckbox = screen.getByRole('checkbox', { name: 'Uppercase (A-Z)' });
    const numbersCheckbox = screen.getByRole('checkbox', { name: 'Numbers (0-9)' });
    const symbolsCheckbox = screen.getByRole('checkbox', { name: 'Symbols (!@#$...)' });

    await user.click(uppercaseCheckbox);
    await user.click(numbersCheckbox);
    await user.click(symbolsCheckbox);

    await user.click(screen.getByText('Generate'));

    const input = screen.getByPlaceholderText('Generated password');
    const password = input.getAttribute('value') || '';
    expect(password).toMatch(/^[a-z]+$/);
  });

  it('includes numbers when option is checked', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    const uppercaseCheckbox = screen.getByRole('checkbox', { name: 'Uppercase (A-Z)' });
    const lowercaseCheckbox = screen.getByRole('checkbox', { name: 'Lowercase (a-z)' });
    const symbolsCheckbox = screen.getByRole('checkbox', { name: 'Symbols (!@#$...)' });

    await user.click(uppercaseCheckbox);
    await user.click(lowercaseCheckbox);
    await user.click(symbolsCheckbox);

    await user.click(screen.getByText('Generate'));

    const input = screen.getByPlaceholderText('Generated password');
    const password = input.getAttribute('value') || '';
    expect(password).toMatch(/^[0-9]+$/);
  });

  it('shows strength indicator after generating password', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Generate'));

    expect(screen.getByText('Strength')).toBeInTheDocument();
  });

  it('copies password to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<PasswordGenerator />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Generate'));
    await user.click(screen.getByText('Copy'));

    expect(mockWriteText).toHaveBeenCalled();
  });

  it('falls back to lowercase when no options selected', async () => {
    render(<PasswordGenerator />);
    const user = userEvent.setup();

    // Uncheck all options
    const uppercaseCheckbox = screen.getByRole('checkbox', { name: 'Uppercase (A-Z)' });
    const lowercaseCheckbox = screen.getByRole('checkbox', { name: 'Lowercase (a-z)' });
    const numbersCheckbox = screen.getByRole('checkbox', { name: 'Numbers (0-9)' });
    const symbolsCheckbox = screen.getByRole('checkbox', { name: 'Symbols (!@#$...)' });

    await user.click(uppercaseCheckbox);
    await user.click(lowercaseCheckbox);
    await user.click(numbersCheckbox);
    await user.click(symbolsCheckbox);

    await user.click(screen.getByText('Generate'));

    const input = screen.getByPlaceholderText('Generated password');
    const password = input.getAttribute('value') || '';
    // Falls back to lowercase
    expect(password).toMatch(/^[a-z]+$/);
  });
});
