import type { ComponentType } from 'react';
import type { Language } from '@/i18n';

type ToolComponentType = ComponentType<{ lang?: Language }>;
import QRCodeGenerator from '@/components/tools/QRCodeGenerator';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import UuidGenerator from '@/components/tools/UuidGenerator';
import LoremIpsumGenerator from '@/components/tools/LoremIpsumGenerator';
import ColorPalette from '@/components/tools/ColorPalette';
import HashGenerator from '@/components/tools/HashGenerator';
import ColorConverter from '@/components/tools/ColorConverter';
import UnitConverter from '@/components/tools/UnitConverter';
import Base64Tool from '@/components/tools/Base64Tool';
import ImageConverter from '@/components/tools/ImageConverter';
import TextCounter from '@/components/tools/TextCounter';
import MarkdownPreview from '@/components/tools/MarkdownPreview';
import DiffTool from '@/components/tools/DiffTool';
import JsonFormatter from '@/components/tools/JsonFormatter';
import RegexTester from '@/components/tools/RegexTester';
import UrlEncoder from '@/components/tools/UrlEncoder';
import JwtDecoder from '@/components/tools/JwtDecoder';
import BcryptTool from '@/components/tools/BcryptTool';
import CronGenerator from '@/components/tools/CronGenerator';
import TimestampConverter from '@/components/tools/TimestampConverter';
import LlmCostCalculator from '@/components/tools/LlmCostCalculator';
import GradientGenerator from '@/components/tools/GradientGenerator';
import BoxShadowGenerator from '@/components/tools/BoxShadowGenerator';
import ImageResizer from '@/components/tools/ImageResizer';
import ExifViewer from '@/components/tools/ExifViewer';
import BackgroundRemover from '@/components/tools/BackgroundRemover';
import ImageMetadataViewer from '@/components/tools/ImageMetadataViewer';
import AppStoreScreenshotResizer from '@/components/tools/AppStoreScreenshotResizer';
import UtmBuilder from '@/components/tools/UtmBuilder';
import TimerStopwatch from '@/components/tools/TimerStopwatch';
import PomodoroTimer from '@/components/tools/PomodoroTimer';
import WorldClock from '@/components/tools/WorldClock';
import PercentCalculator from '@/components/tools/PercentCalculator';
import DiscountCalculator from '@/components/tools/DiscountCalculator';
import BmiCalculator from '@/components/tools/BmiCalculator';
import AgeCalculator from '@/components/tools/AgeCalculator';
import DdayCalculator from '@/components/tools/DdayCalculator';
import DutchPayCalculator from '@/components/tools/DutchPayCalculator';
import CoinFlip from '@/components/tools/CoinFlip';
import DiceRoller from '@/components/tools/DiceRoller';
import { toolsConfig } from '@/data/tools';

const toolComponents: Record<string, ToolComponentType> = {
  QRCodeGenerator,
  PasswordGenerator,
  UuidGenerator,
  LoremIpsumGenerator,
  ColorPalette,
  HashGenerator,
  ColorConverter,
  UnitConverter,
  Base64Tool,
  ImageConverter,
  TextCounter,
  MarkdownPreview,
  DiffTool,
  JsonFormatter,
  RegexTester,
  UrlEncoder,
  JwtDecoder,
  BcryptTool,
  CronGenerator,
  TimestampConverter,
  LlmCostCalculator,
  GradientGenerator,
  BoxShadowGenerator,
  ImageResizer,
  ExifViewer,
  BackgroundRemover,
  ImageMetadataViewer,
  AppStoreScreenshotResizer,
  UtmBuilder,
  TimerStopwatch,
  PomodoroTimer,
  WorldClock,
  PercentCalculator,
  DiscountCalculator,
  BmiCalculator,
  AgeCalculator,
  DdayCalculator,
  DutchPayCalculator,
  CoinFlip,
  DiceRoller,
};

const slugToComponent = new Map(
  toolsConfig.map((tool) => [tool.slug, tool.component]),
);

export function getToolComponent(slug: string): ToolComponentType | undefined {
  const componentName = slugToComponent.get(slug);
  if (!componentName) return undefined;
  return toolComponents[componentName];
}
