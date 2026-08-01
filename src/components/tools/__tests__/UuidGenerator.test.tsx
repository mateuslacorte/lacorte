import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UuidGenerator from '../UuidGenerator';
import './testUtils';

function getGeneratedUuids(): string[] {
  return screen
    .getAllByRole('code')
    .map((element) => element.textContent ?? '')
    .filter((value) => /^[0-9a-f-]+$/i.test(value));
}

describe('UuidGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders generate button', () => {
    render(<UuidGenerator />);

    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('generates valid UUID v4', async () => {
    render(<UuidGenerator />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Generate' }));

    const [uuid] = getGeneratedUuids();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates multiple UUIDs based on count', async () => {
    render(<UuidGenerator />);
    const user = userEvent.setup();

    const countInput = screen.getByRole('spinbutton');
    fireEvent.change(countInput, { target: { value: '5' } });
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(getGeneratedUuids()).toHaveLength(5);
  });

  it('generates uppercase UUIDs when option is checked', async () => {
    render(<UuidGenerator />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('checkbox', { name: 'Uppercase' }));
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    const [uuid] = getGeneratedUuids();
    expect(uuid).toMatch(/^[0-9A-F-]+$/);
  });

  it('generates UUIDs without hyphens when option is unchecked', async () => {
    render(<UuidGenerator />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('checkbox', { name: 'Include hyphens' }));
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    const [uuid] = getGeneratedUuids();
    expect(uuid).not.toContain('-');
    expect(uuid.length).toBe(32);
  });

  it('copies UUIDs to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<UuidGenerator />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    await user.click(screen.getAllByRole('button', { name: 'Copy' })[0]);

    expect(mockWriteText).toHaveBeenCalled();
  });

  it('all generated UUIDs are unique', async () => {
    render(<UuidGenerator />);
    const user = userEvent.setup();

    const countInput = screen.getByRole('spinbutton');
    fireEvent.change(countInput, { target: { value: '10' } });
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    const uuids = getGeneratedUuids();
    expect(new Set(uuids).size).toBe(uuids.length);
  });
});
