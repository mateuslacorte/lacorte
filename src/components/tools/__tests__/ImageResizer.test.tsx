import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import './testUtils';

vi.mock('react-image-crop', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="react-crop">{children}</div>,
  centerCrop: vi.fn((crop: unknown) => crop),
  makeAspectCrop: vi.fn((crop: unknown) => ({ ...(crop as Record<string, number>), height: 90 })),
}));

const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const mockDrawImage = vi.fn();
const mockClearRect = vi.fn();
const mockGetContext = vi.fn(() => ({
  drawImage: mockDrawImage,
  clearRect: mockClearRect,
}));
const mockToDataURL = vi.fn(() => 'data:image/jpeg;base64,mock');
const mockToBlob = vi.fn((callback: BlobCallback) => {
  callback(new Blob(['preview'], { type: 'image/jpeg' }));
});

const OriginalImage = global.Image;

class MockImage {
  public width = 1600;
  public height = 1200;
  public naturalWidth = 1600;
  public naturalHeight = 1200;
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;

  set src(_: string) {
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }
}

import ImageResizer from '../ImageResizer';

const uploadImage = async () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['image-data'], 'sample.png', { type: 'image/png' });

  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  const image = screen.getByAltText('Original') as HTMLImageElement;
  Object.defineProperty(image, 'width', { configurable: true, value: 800 });
  Object.defineProperty(image, 'height', { configurable: true, value: 600 });
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1600 });
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 1200 });
  fireEvent.load(image);

  await waitFor(() => {
    expect(mockToDataURL).toHaveBeenCalled();
  });
};

describe('ImageResizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global, 'Image', { configurable: true, writable: true, value: MockImage });
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      writable: true,
      value: mockGetContext,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true,
      writable: true,
      value: mockToDataURL,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      writable: true,
      value: mockToBlob,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'Image', { configurable: true, writable: true, value: OriginalImage });
  });

  it('renders drop zone initially', () => {
    render(<ImageResizer />);
    expect(screen.getByText('Drag or click to upload image')).toBeInTheDocument();
  });

  it('has hidden file input that accepts image files', () => {
    render(<ImageResizer />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveClass('hidden');
  });

  it('shows crop UI after upload and removes manual resize button', async () => {
    render(<ImageResizer />);
    await uploadImage();

    expect(screen.getByTestId('react-crop')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resize' })).not.toBeInTheDocument();
  });

  it('switches crop mode between free and output ratio', async () => {
    render(<ImageResizer />);
    await uploadImage();

    const lockButton = screen.getByRole('button', { name: 'Lock to Output Ratio' });
    fireEvent.click(lockButton);

    expect(lockButton.className).toContain('bg-primary-500');
  });

  it('switches to preset mode and applies preset output size', async () => {
    render(<ImageResizer />);
    await uploadImage();

    fireEvent.click(screen.getByRole('button', { name: 'Preset' }));

    await waitFor(() => {
      expect(screen.getByText('Selected preset: Slack Profile (512×512)')).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('Output Size: 512 x 512'))).toBeInTheDocument();
    });
  });

  it('re-renders preview automatically when dimensions change', async () => {
    render(<ImageResizer />);
    await uploadImage();

    const initialCalls = mockToDataURL.mock.calls.length;
    const widthInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(widthInput, { target: { value: '1000' } });

    await waitFor(() => {
      expect(mockToDataURL.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it('re-renders preview when preset selection changes', async () => {
    render(<ImageResizer />);
    await uploadImage();

    fireEvent.click(screen.getByRole('button', { name: 'Preset' }));
    const initialCalls = mockToDataURL.mock.calls.length;
    const presetSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(presetSelect, { target: { value: 'youtube-thumbnail' } });

    await waitFor(() => {
      expect(mockToDataURL.mock.calls.length).toBeGreaterThan(initialCalls);
      expect(screen.getByText((content) => content.includes('Output Size: 1280 x 720'))).toBeInTheDocument();
    });
  });

  it('shows download button when preview is ready', async () => {
    render(<ImageResizer />);
    await uploadImage();

    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });
});
