import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JsonFormatter from '../JsonFormatter';
import './testUtils';

function setJsonInput(value: string) {
  const input = screen.getByPlaceholderText('Enter JSON');
  fireEvent.change(input, { target: { value } });
}

describe('JsonFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders format, minify and validate buttons', () => {
    render(<JsonFormatter />);

    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('Minify')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
  });

  it('formats valid JSON correctly', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    setJsonInput('{"name":"test","value":123}');

    await user.click(screen.getByText('Format'));

    const output = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    expect(output.value).toContain('"name": "test"');
  });

  it('minifies JSON correctly', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    setJsonInput('{  "name"  :  "test"  }');

    await user.click(screen.getByText('Minify'));

    expect(screen.getAllByRole('textbox')[1]).toHaveValue('{"name":"test"}');
  });

  it('shows valid status for valid JSON', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    setJsonInput('{"valid": true}');

    await user.click(screen.getByText('Validate'));

    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });

  it('shows invalid status for invalid JSON', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    setJsonInput('{invalid json}');

    await user.click(screen.getByText('Validate'));

    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
  });

  it('loads sample JSON when clicking sample button', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    await user.click(screen.getByText('Load Sample'));

    expect((screen.getByPlaceholderText('Enter JSON') as HTMLTextAreaElement).value).toContain('Sample Object');
  });

  it('respects indent size setting', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    const indentSelect = screen.getByRole('combobox');
    await user.selectOptions(indentSelect, '4');

    setJsonInput('{"a":"b"}');

    await user.click(screen.getByText('Format'));

    const output = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    expect(output.value).toContain('    ');
  });

  it('copies output to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<JsonFormatter />);
    const user = userEvent.setup();

    setJsonInput('{"test":1}');

    await user.click(screen.getByText('Format'));
    await user.click(screen.getByText('Copy'));

    expect(mockWriteText).toHaveBeenCalled();
  });

  it('handles nested JSON structures', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    setJsonInput('{"a":{"b":{"c":1}}}');

    await user.click(screen.getByText('Format'));

    const output = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    expect(output.value).toContain('"c": 1');
  });

  it('handles arrays correctly', async () => {
    render(<JsonFormatter />);
    const user = userEvent.setup();

    setJsonInput('[1,2,3]');

    await user.click(screen.getByText('Format'));

    expect(screen.getByText('Valid JSON')).toBeInTheDocument();
  });
});
