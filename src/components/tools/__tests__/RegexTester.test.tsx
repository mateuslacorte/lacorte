import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegexTester from '../RegexTester';
import './testUtils';

describe('RegexTester', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pattern input and test string area', () => {
    render(<RegexTester />);

    expect(screen.getByPlaceholderText('[a-z]+')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter test string...')).toBeInTheDocument();
  });

  it('finds matches with simple pattern', async () => {
    render(<RegexTester />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('[a-z]+'), 'hello');
    await user.type(screen.getByPlaceholderText('Enter test string...'), 'hello world hello');

    expect(screen.getByText(/Matches \(2\)/)).toBeInTheDocument();
  });

  it('shows no match message when pattern does not match', async () => {
    render(<RegexTester />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('[a-z]+'), 'xyz');
    await user.type(screen.getByPlaceholderText('Enter test string...'), 'hello world');

    expect(screen.getByText('No match')).toBeInTheDocument();
  });

  it('supports regex flags', async () => {
    render(<RegexTester />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('[a-z]+'), 'HELLO');
    await user.type(screen.getByPlaceholderText('Enter test string...'), 'hello world');
    await user.click(screen.getByRole('button', { name: 'Ignore case (i)' }));

    expect(screen.getByText(/Matches \(1\)/)).toBeInTheDocument();
  });

  it('handles invalid regex gracefully', async () => {
    render(<RegexTester />);
    const user = userEvent.setup();

    const patternInput = screen.getByPlaceholderText('[a-z]+');
    fireEvent.change(patternInput, { target: { value: '[invalid(' } });

    expect(patternInput).toBeInTheDocument();
  });

  it('highlights matching groups', async () => {
    render(<RegexTester />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('[a-z]+'), '(\\w+)@(\\w+)');
    await user.type(screen.getByPlaceholderText('Enter test string...'), 'test@example');

    expect(screen.getByText('Groups:')).toBeInTheDocument();
  });
});
