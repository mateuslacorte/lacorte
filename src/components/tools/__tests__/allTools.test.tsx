/**
 * Smoke tests to verify all tools render without crashing
 * These tests ensure basic rendering works for each tool component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import './testUtils';

// Import all tool components
import Base64Tool from '../Base64Tool';
import JsonFormatter from '../JsonFormatter';
import PasswordGenerator from '../PasswordGenerator';
import UnitConverter from '../UnitConverter';
import TextCounter from '../TextCounter';
import UuidGenerator from '../UuidGenerator';
import ColorConverter from '../ColorConverter';
import UrlEncoder from '../UrlEncoder';
import BmiCalculator from '../BmiCalculator';
import DiscountCalculator from '../DiscountCalculator';
import PercentCalculator from '../PercentCalculator';
import DdayCalculator from '../DdayCalculator';
import DutchPayCalculator from '../DutchPayCalculator';
import AgeCalculator from '../AgeCalculator';
import HashGenerator from '../HashGenerator';
import RegexTester from '../RegexTester';
import LoremIpsumGenerator from '../LoremIpsumGenerator';
import MarkdownPreview from '../MarkdownPreview';
import ColorPalette from '../ColorPalette';
import GradientGenerator from '../GradientGenerator';
import BoxShadowGenerator from '../BoxShadowGenerator';
import TimestampConverter from '../TimestampConverter';
import CronGenerator from '../CronGenerator';
import JwtDecoder from '../JwtDecoder';
import TimerStopwatch from '../TimerStopwatch';
import PomodoroTimer from '../PomodoroTimer';
import WorldClock from '../WorldClock';
import CoinFlip from '../CoinFlip';
import DiceRoller from '../DiceRoller';
import QRCodeGenerator from '../QRCodeGenerator';
import UtmBuilder from '../UtmBuilder';
import DiffTool from '../DiffTool';

// Mock for image-related tools
vi.mock('@imgly/background-removal', () => ({
  removeBackground: vi.fn().mockResolvedValue(new Blob()),
}));

const toolComponents = [
  { name: 'Base64Tool', Component: Base64Tool },
  { name: 'JsonFormatter', Component: JsonFormatter },
  { name: 'PasswordGenerator', Component: PasswordGenerator },
  { name: 'UnitConverter', Component: UnitConverter },
  { name: 'TextCounter', Component: TextCounter },
  { name: 'UuidGenerator', Component: UuidGenerator },
  { name: 'ColorConverter', Component: ColorConverter },
  { name: 'UrlEncoder', Component: UrlEncoder },
  { name: 'BmiCalculator', Component: BmiCalculator },
  { name: 'DiscountCalculator', Component: DiscountCalculator },
  { name: 'PercentCalculator', Component: PercentCalculator },
  { name: 'DdayCalculator', Component: DdayCalculator },
  { name: 'DutchPayCalculator', Component: DutchPayCalculator },
  { name: 'AgeCalculator', Component: AgeCalculator },
  { name: 'HashGenerator', Component: HashGenerator },
  { name: 'RegexTester', Component: RegexTester },
  { name: 'LoremIpsumGenerator', Component: LoremIpsumGenerator },
  { name: 'MarkdownPreview', Component: MarkdownPreview },
  { name: 'ColorPalette', Component: ColorPalette },
  { name: 'GradientGenerator', Component: GradientGenerator },
  { name: 'BoxShadowGenerator', Component: BoxShadowGenerator },
  { name: 'TimestampConverter', Component: TimestampConverter },
  { name: 'CronGenerator', Component: CronGenerator },
  { name: 'JwtDecoder', Component: JwtDecoder },
  { name: 'TimerStopwatch', Component: TimerStopwatch },
  { name: 'PomodoroTimer', Component: PomodoroTimer },
  { name: 'WorldClock', Component: WorldClock },
  { name: 'CoinFlip', Component: CoinFlip },
  { name: 'DiceRoller', Component: DiceRoller },
  { name: 'QRCodeGenerator', Component: QRCodeGenerator },
  { name: 'UtmBuilder', Component: UtmBuilder },
  { name: 'DiffTool', Component: DiffTool },
];

describe('All Tools Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  toolComponents.forEach(({ name, Component }) => {
    it(`${name} renders without crashing`, () => {
      expect(() => render(<Component />)).not.toThrow();
    });
  });
});

describe('Tool Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Base64Tool has accessible form elements', () => {
    render(<Base64Tool />);
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('UnitConverter has accessible inputs', () => {
    render(<UnitConverter />);
    expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
  });

  it('PasswordGenerator has accessible controls', () => {
    render(<PasswordGenerator />);
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});

describe('Tool Functionality Patterns', () => {
  it('Tools with copy functionality have copy button', () => {
    render(<Base64Tool />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('Generator tools have generate button', () => {
    render(<PasswordGenerator />);
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  it('Converter tools have input and output areas', () => {
    render(<Base64Tool />);
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBeGreaterThanOrEqual(2);
  });
});
