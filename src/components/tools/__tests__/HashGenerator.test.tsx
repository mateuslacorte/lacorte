import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HashGenerator from '../HashGenerator';
import './testUtils';

const mockDigest = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  global.TextEncoder = class TextEncoder {
    encode(text: string) {
      return new Uint8Array(Buffer.from(text));
    }
  } as typeof TextEncoder;

  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: {
        digest: mockDigest.mockImplementation(async (algorithm: string) => {
          const hashLength = algorithm.includes('256') ? 32 : algorithm.includes('512') ? 64 : 20;
          return new ArrayBuffer(hashLength);
        }),
      },
      getRandomValues: (arr: Uint32Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 4294967296);
        }
        return arr;
      },
    },
    writable: true,
  });
});

describe('HashGenerator', () => {
  it('renders algorithm selector and input', () => {
    render(<HashGenerator />);

    expect(screen.getByPlaceholderText('Enter text to hash')).toBeInTheDocument();
  });

  it('has algorithm options (MD5, SHA-1, SHA-256)', () => {
    render(<HashGenerator />);

    expect(screen.getByText('MD5')).toBeInTheDocument();
    expect(screen.getByText('SHA-1')).toBeInTheDocument();
    expect(screen.getByText('SHA-256')).toBeInTheDocument();
  });

  it('generates hash on input', async () => {
    render(<HashGenerator />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter text to hash'), 'Hello');

    await waitFor(() => {
      const hashValues = screen.getAllByRole('code').map((element) => element.textContent ?? '');
      expect(hashValues.some((value) => /^[0-9a-f]+$/i.test(value))).toBe(true);
    });
  });

  it('populates all algorithm hashes after input', async () => {
    render(<HashGenerator />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter text to hash'), 'Test');

    await waitFor(() => {
      const hashValues = screen.getAllByRole('code').map((element) => element.textContent ?? '');
      expect(hashValues.filter((value) => /^[0-9a-f]+$/i.test(value)).length).toBeGreaterThanOrEqual(4);
    });
  });

  it('copies hash to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<HashGenerator />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Enter text to hash'), 'Test');
    await user.click(screen.getAllByRole('button', { name: 'Copy' })[0]);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  it('handles empty input', () => {
    render(<HashGenerator />);

    expect(screen.getByPlaceholderText('Enter text to hash')).toHaveValue('');
  });
});
