import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UrlEncoder from '../UrlEncoder';
import './testUtils';

describe('UrlEncoder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders encode and decode buttons', () => {
    render(<UrlEncoder />);

    expect(screen.getByRole('button', { name: 'Encode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decode' })).toBeInTheDocument();
  });

  it('encodes URL correctly', async () => {
    render(<UrlEncoder />);
    const user = userEvent.setup();

    const [input, output] = screen.getAllByRole('textbox');
    await user.type(input, 'hello world');

    expect(output).toHaveValue('hello%20world');
  });

  it('encodes special characters correctly', async () => {
    render(<UrlEncoder />);
    const user = userEvent.setup();

    const [input, output] = screen.getAllByRole('textbox');
    await user.type(input, 'test&param=value');

    expect(output).toHaveValue('test%26param%3Dvalue');
  });

  it('decodes URL correctly', async () => {
    render(<UrlEncoder />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Decode' }));

    const [input, output] = screen.getAllByRole('textbox');
    await user.type(input, 'hello%20world');

    expect(output).toHaveValue('hello world');
  });

  it('handles accented characters', async () => {
    render(<UrlEncoder />);
    const user = userEvent.setup();

    const [input, output] = screen.getAllByRole('textbox');
    await user.type(input, 'café');

    expect((output as HTMLTextAreaElement).value).toMatch(/%[0-9A-Fa-f]{2}/);
  });

  it('copies output to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<UrlEncoder />);
    const user = userEvent.setup();

    const [input] = screen.getAllByRole('textbox');
    await user.type(input, 'test');
    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(mockWriteText).toHaveBeenCalled();
  });

  it('handles empty input gracefully', () => {
    render(<UrlEncoder />);

    const output = screen.getAllByRole('textbox')[1];
    expect(output).toHaveValue('');
  });
});
