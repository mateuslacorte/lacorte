import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextCounter from '../TextCounter';
import './testUtils';

function getStatValue(label: string): string {
  const labelElement = screen.getByText(label);
  const card = labelElement.closest('div');
  return card?.querySelector('.text-3xl')?.textContent ?? '';
}

describe('TextCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text input area', () => {
    render(<TextCounter />);

    expect(screen.getByPlaceholderText('Enter your text...')).toBeInTheDocument();
  });

  it('counts characters correctly', async () => {
    render(<TextCounter />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter your text...'), 'Hello');

    expect(getStatValue('Characters')).toBe('5');
  });

  it('counts characters without spaces', async () => {
    render(<TextCounter />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter your text...'), 'Hello World');

    expect(getStatValue('Characters')).toBe('11');
    expect(getStatValue('Characters (no spaces)')).toBe('10');
  });

  it('counts words correctly', async () => {
    render(<TextCounter />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter your text...'), 'Hello beautiful World');

    expect(getStatValue('Words')).toBe('3');
  });

  it('counts lines correctly', async () => {
    render(<TextCounter />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter your text...'), 'Line 1{enter}Line 2{enter}Line 3');

    expect(getStatValue('Lines')).toBe('3');
  });

  it('counts accented characters correctly', async () => {
    render(<TextCounter />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter your text...'), 'café');

    expect(getStatValue('Characters')).toBe('4');
  });

  it('handles empty text', () => {
    render(<TextCounter />);

    expect(getStatValue('Characters')).toBe('0');
    expect(getStatValue('Words')).toBe('0');
  });

  it('handles mixed content (accented + English)', async () => {
    render(<TextCounter />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter your text...'), 'Hello café');

    expect(getStatValue('Characters')).toBe('10');
  });
});
