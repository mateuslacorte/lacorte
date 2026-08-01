// Centralized tools configuration with SEO-optimized content
import type { Language } from '../i18n';

export interface ToolSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface ToolConfig {
  slug: string;
  icon: string;
  category: string;
  component: string;
  seo: Record<Language, ToolSEO>;
}

// SEO keywords templates
const seoKeywords = {
  en: ['free', 'online', 'simple', 'fast', 'no installation', 'web'],
  pt: ['grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
};

export const toolsConfig: ToolConfig[] = [
  // Generators
  {
    slug: 'qr-code',
    icon: '📱',
    category: 'generators',
    component: 'QRCodeGenerator',
    seo: {
      en: {
        title: 'QR Code Generator - Free Online QR Code Maker',
        description: 'Free online QR code generator. Easily convert URL and text to QR code. No installation, no signup required.',
        keywords: ['qr code', 'qr code generator', 'qr code maker', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de QR Code - Criar QR Code online grátis',
        description: 'Gerador de QR Code online grátis. Converta URL e texto em QR Code com facilidade. Sem instalação e sem cadastro.',
        keywords: ['qr code', 'gerador de qr code', 'criar qr code', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'password',
    icon: '🔐',
    category: 'generators',
    component: 'PasswordGenerator',
    seo: {
      en: {
        title: 'Password Generator - Free Secure Password Maker',
        description: 'Free online password generator. Create strong and secure passwords easily. No installation, no data stored.',
        keywords: ['password', 'password generator', 'secure password', 'security', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de senhas - Criar senha segura online',
        description: 'Gerador de senhas online grátis. Crie senhas fortes e seguras com facilidade. Sem instalação e sem armazenamento de dados.',
        keywords: ['senha', 'gerador de senha', 'senha segura', 'segurança', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'uuid',
    icon: '🔑',
    category: 'generators',
    component: 'UuidGenerator',
    seo: {
      en: {
        title: 'UUID Generator - Free Online UUID v4 Generator',
        description: 'Free online UUID generator. Easily generate and copy UUID v4. Free tool for developers.',
        keywords: ['uuid', 'uuid generator', 'uuid v4', 'developer tool', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de UUID - UUID v4 online grátis',
        description: 'Gerador de UUID online grátis. Gere e copie UUID v4 com facilidade. Ferramenta gratuita para desenvolvedores.',
        keywords: ['uuid', 'gerador de uuid', 'uuid v4', 'ferramenta para desenvolvedores', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'lorem-ipsum',
    icon: '📝',
    category: 'generators',
    component: 'LoremIpsumGenerator',
    seo: {
      en: {
        title: 'Lorem Ipsum Generator - Free Dummy Text Generator',
        description: 'Free online Lorem Ipsum generator. Easily generate dummy text. Free tool for designers and developers.',
        keywords: ['lorem ipsum', 'dummy text', 'placeholder text', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de Lorem Ipsum - Texto placeholder online',
        description: 'Gerador de Lorem Ipsum online grátis. Crie texto placeholder por parágrafos, palavras ou bytes.',
        keywords: ['lorem ipsum', 'gerador de lorem ipsum', 'texto placeholder', 'dummy text', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'color-palette',
    icon: '🎨',
    category: 'generators',
    component: 'ColorPalette',
    seo: {
      en: {
        title: 'Color Palette Generator - Free Color Scheme Maker',
        description: 'Free online color palette generator. Easily create harmonious color schemes. Free tool for designers.',
        keywords: ['color palette', 'color scheme', 'color generator', ...seoKeywords.en],
      },
      pt: {
        title: 'Paleta de cores - Gerador de paleta online grátis',
        description: 'Gerador de paleta de cores online grátis. Crie combinações harmônicas e copie códigos hex/rgb.',
        keywords: ['paleta de cores', 'gerador de cores', 'esquema de cores', 'hex', 'rgb', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'hash',
    icon: '#️⃣',
    category: 'generators',
    component: 'HashGenerator',
    seo: {
      en: {
        title: 'Hash Generator - Free MD5, SHA-256 Hash Tool',
        description: 'Free online hash generator. Easily generate MD5, SHA-1, SHA-256 hashes. Free tool for developers.',
        keywords: ['hash', 'md5', 'sha256', 'sha-1', 'hash generator', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de Hash - MD5, SHA-1, SHA-256 online',
        description: 'Gerador de hash online grátis. Calcule MD5, SHA-1 e SHA-256 no navegador. Sem envio de dados.',
        keywords: ['hash', 'gerador de hash', 'md5', 'sha256', 'sha1', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Converters
  {
    slug: 'color',
    icon: '🌈',
    category: 'converters',
    component: 'ColorConverter',
    seo: {
      en: {
        title: 'Color Converter - Free HEX, RGB, HSL Converter',
        description: 'Free online color converter. Easily convert HEX, RGB, HSL color codes. Free tool for designers.',
        keywords: ['color converter', 'hex', 'rgb', 'hsl', 'color code', ...seoKeywords.en],
      },
      pt: {
        title: 'Conversor de cores - HEX, RGB, HSL online',
        description: 'Conversor de cores online grátis. Converta entre HEX, RGB e HSL com pré-visualização ao vivo.',
        keywords: ['conversor de cores', 'hex para rgb', 'rgb para hsl', 'seletor de cores', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'unit',
    icon: '📏',
    category: 'converters',
    component: 'UnitConverter',
    seo: {
      en: {
        title: 'Unit Converter - Free Length, Weight, Temperature Converter',
        description: 'Free online unit converter. Easily convert length, weight, temperature and more. No installation, free.',
        keywords: ['unit converter', 'length converter', 'weight converter', 'temperature converter', ...seoKeywords.en],
      },
      pt: {
        title: 'Conversor de unidades - Comprimento, peso, temperatura',
        description: 'Conversor de unidades online grátis. Converta comprimento, peso, temperatura e mais rapidamente.',
        keywords: ['conversor de unidades', 'conversão', 'comprimento', 'peso', 'temperatura', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'base64',
    icon: '🔄',
    category: 'converters',
    component: 'Base64Tool',
    seo: {
      en: {
        title: 'Base64 Encoder/Decoder - Free Base64 Converter',
        description: 'Free online Base64 encoder/decoder. Easily encode and decode Base64. Free tool for developers.',
        keywords: ['base64', 'base64 encoder', 'base64 decoder', 'encoder', 'decoder', ...seoKeywords.en],
      },
      pt: {
        title: 'Codificador/Decodificador Base64 online grátis',
        description: 'Ferramenta Base64 online grátis. Codifique e decodifique texto em Base64 no navegador.',
        keywords: ['base64', 'codificador base64', 'decodificador base64', 'encode', 'decode', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'image-converter',
    icon: '🖼️',
    category: 'image',
    component: 'ImageConverter',
    seo: {
      en: {
        title: 'Image Format Converter - Free JPEG, PNG, WebP Converter',
        description: 'Free online image format converter. Easily convert between JPEG, PNG, WebP. No installation, free.',
        keywords: ['image converter', 'jpeg', 'png', 'webp', 'image format', ...seoKeywords.en],
      },
      pt: {
        title: 'Conversor de imagens - PNG, JPG, WebP online',
        description: 'Conversor de imagens online grátis. Converta entre PNG, JPG e WebP no navegador.',
        keywords: ['conversor de imagens', 'png para jpg', 'jpg para webp', 'converter imagem', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Text
  {
    slug: 'text-counter',
    icon: '🔢',
    category: 'text',
    component: 'TextCounter',
    seo: {
      en: {
        title: 'Character Counter - Free Text Counter Tool',
        description: 'Free online character counter. Easily count characters, words, and lines. No installation, free.',
        keywords: ['character counter', 'word counter', 'text counter', 'line counter', ...seoKeywords.en],
      },
      pt: {
        title: 'Contador de texto - Caracteres, palavras, linhas',
        description: 'Contador de texto online grátis. Conte caracteres, palavras, linhas e bytes em tempo real.',
        keywords: ['contador de texto', 'contador de palavras', 'contador de caracteres', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'markdown',
    icon: '📄',
    category: 'text',
    component: 'MarkdownPreview',
    seo: {
      en: {
        title: 'Markdown Preview - Free Markdown Editor',
        description: 'Free online markdown preview. Preview markdown documents in real-time. Free tool for developers.',
        keywords: ['markdown', 'markdown preview', 'markdown editor', 'md editor', ...seoKeywords.en],
      },
      pt: {
        title: 'Pré-visualizador Markdown - Editor Markdown online',
        description: 'Editor e pré-visualizador Markdown online grátis. Veja o resultado em tempo real enquanto digita.',
        keywords: ['markdown', 'pré-visualizador markdown', 'editor markdown', 'md', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'diff',
    icon: '📊',
    category: 'developer',
    component: 'DiffTool',
    seo: {
      en: {
        title: 'Text Diff Tool - Free Text Comparison',
        description: 'Free online text diff tool. Easily compare differences between two texts. Free tool for developers.',
        keywords: ['text diff', 'diff tool', 'text comparison', 'compare text', ...seoKeywords.en],
      },
      pt: {
        title: 'Comparador de texto Diff - Diff online grátis',
        description: 'Ferramenta de diff online grátis. Compare dois textos e veja as diferenças lado a lado.',
        keywords: ['diff', 'comparador de texto', 'diferença de texto', 'compare', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Developer
  {
    slug: 'json',
    icon: '{ }',
    category: 'developer',
    component: 'JsonFormatter',
    seo: {
      en: {
        title: 'JSON Formatter - Free JSON Viewer & Validator',
        description: 'Free online JSON formatter. Easily format and validate JSON. Supports indentation, minification, and syntax checking.',
        keywords: ['json', 'json formatter', 'json viewer', 'json validator', ...seoKeywords.en],
      },
      pt: {
        title: 'Formatador JSON - Validar e formatar JSON online',
        description: 'Formatador e validador JSON online grátis. Organize, valide e minify JSON com facilidade.',
        keywords: ['json', 'formatador json', 'validador json', 'prettier json', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'regex',
    icon: '🔍',
    category: 'developer',
    component: 'RegexTester',
    seo: {
      en: {
        title: 'Regex Tester - Free Regular Expression Tester',
        description: 'Free online regex tester. Easily test regular expressions and check matches. Free tool for developers.',
        keywords: ['regex', 'regular expression', 'regex tester', 'pattern matching', ...seoKeywords.en],
      },
      pt: {
        title: 'Testador de Regex - Expressões regulares online',
        description: 'Testador de regex online grátis. Teste expressões regulares com destaque de matches em tempo real.',
        keywords: ['regex', 'testador de regex', 'expressão regular', 'regexp', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'url-encoder',
    icon: '🔗',
    category: 'developer',
    component: 'UrlEncoder',
    seo: {
      en: {
        title: 'URL Encoder/Decoder - Free URL Encoding Tool',
        description: 'Free online URL encoder/decoder. Easily encode and decode URL strings. Free tool for developers.',
        keywords: ['url encoder', 'url decoder', 'url encoding', 'url decoding', ...seoKeywords.en],
      },
      pt: {
        title: 'Codificador/Decodificador de URL online grátis',
        description: 'Codifique e decodifique URLs online grátis. Encode e decode percent-encoding no navegador.',
        keywords: ['url encoder', 'url decoder', 'codificador de url', 'percent encoding', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'jwt-decoder',
    icon: '🎫',
    category: 'developer',
    component: 'JwtDecoder',
    seo: {
      en: {
        title: 'JWT Decoder - Free JWT Token Analyzer',
        description: 'Free online JWT decoder. Easily decode and analyze JWT tokens. Free tool for developers.',
        keywords: ['jwt', 'jwt decoder', 'jwt token', 'jwt analyzer', ...seoKeywords.en],
      },
      pt: {
        title: 'Decodificador JWT - Decodificar token JWT online',
        description: 'Decodificador JWT online grátis. Veja header e payload de tokens JWT com segurança no navegador.',
        keywords: ['jwt', 'decodificador jwt', 'json web token', 'decode jwt', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'cron',
    icon: '⏰',
    category: 'developer',
    component: 'CronGenerator',
    seo: {
      en: {
        title: 'Cron Expression Generator - Free Cron Scheduler',
        description: 'Free online Cron expression generator. Easily generate and explain cron expressions. Free tool for developers.',
        keywords: ['cron', 'cron expression', 'cron generator', 'scheduler', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de Cron - Expressões crontab online',
        description: 'Gerador e explicador de cron online grátis. Crie e entenda expressões crontab com facilidade.',
        keywords: ['cron', 'gerador de cron', 'crontab', 'expressão cron', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'timestamp',
    icon: '⏱️',
    category: 'developer',
    component: 'TimestampConverter',
    seo: {
      en: {
        title: 'Unix Timestamp Converter - Free Timestamp Tool',
        description: 'Free online Unix timestamp converter. Easily convert between timestamp and date. Free tool for developers.',
        keywords: ['timestamp', 'unix timestamp', 'timestamp converter', 'date converter', ...seoKeywords.en],
      },
      pt: {
        title: 'Conversor de Timestamp - Epoch para data',
        description: 'Conversor de timestamp online grátis. Converta epoch Unix para data e vice-versa.',
        keywords: ['timestamp', 'epoch', 'conversor de timestamp', 'unix time', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'llm-cost',
    icon: '🤖',
    category: 'developer',
    component: 'LlmCostCalculator',
    seo: {
      en: {
        title: 'LLM Cost Calculator - Free AI API Cost Calculator',
        description: 'Free online LLM cost calculator. Easily calculate API costs for ChatGPT, Claude and other AI models.',
        keywords: ['llm', 'ai', 'chatgpt', 'claude', 'api cost', ...seoKeywords.en],
      },
      pt: {
        title: 'Calculadora de custo de LLM - Tokens e preço',
        description: 'Calcule o custo estimado de uso de LLMs. Estime tokens e preços de modelos de IA.',
        keywords: ['llm', 'custo de llm', 'calculadora de tokens', 'preço de ia', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Designer
  {
    slug: 'gradient',
    icon: '🌈',
    category: 'designer',
    component: 'GradientGenerator',
    seo: {
      en: {
        title: 'CSS Gradient Generator - Free Gradient Maker',
        description: 'Free online CSS gradient generator. Visually create CSS gradients easily. Free tool for designers.',
        keywords: ['css gradient', 'gradient generator', 'gradient maker', 'css', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de gradiente CSS - Gradientes online',
        description: 'Gerador de gradiente CSS online grátis. Crie gradientes lineares e radiais e copie o CSS.',
        keywords: ['gradiente', 'gerador de gradiente', 'css gradient', 'gradiente linear', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'box-shadow',
    icon: '🎭',
    category: 'designer',
    component: 'BoxShadowGenerator',
    seo: {
      en: {
        title: 'CSS Box Shadow Generator - Free Shadow Effect',
        description: 'Free online CSS box-shadow generator. Visually create shadow effects easily. Free tool for designers.',
        keywords: ['box shadow', 'css shadow', 'shadow generator', 'css', ...seoKeywords.en],
      },
      pt: {
        title: 'Gerador de Box Shadow - Sombra CSS online',
        description: 'Gerador de box-shadow CSS online grátis. Ajuste sombras visualmente e copie o código.',
        keywords: ['box shadow', 'gerador de sombra', 'css shadow', 'sombra', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Image
  {
    slug: 'image-resizer',
    icon: '📐',
    category: 'image',
    component: 'ImageResizer',
    seo: {
      en: {
        title: 'Image Resizer - Free Crop & Preset Resize Tool',
        description: 'Free online image resizer with live crop and preset sizes for Slack, YouTube thumbnails, iPhone App Store, and more.',
        keywords: ['image resizer', 'image crop', 'preset resize', 'slack image', 'youtube thumbnail', ...seoKeywords.en],
      },
      pt: {
        title: 'Redimensionador de imagem - Redimensionar online',
        description: 'Redimensione imagens online grátis. Ajuste largura e altura e baixe o resultado.',
        keywords: ['redimensionar imagem', 'image resizer', 'redimensionador', 'tamanho de imagem', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'exif',
    icon: '📷',
    category: 'image',
    component: 'ExifViewer',
    seo: {
      en: {
        title: 'EXIF Viewer - Free Photo Metadata Viewer',
        description: 'Free online EXIF viewer. Easily view photo shooting info, GPS location, and camera settings.',
        keywords: ['exif', 'photo info', 'metadata', 'camera info', ...seoKeywords.en],
      },
      pt: {
        title: 'Visualizador EXIF - Metadados de foto online',
        description: 'Visualizador EXIF online grátis. Veja metadados de fotos como câmera, GPS e exposição.',
        keywords: ['exif', 'visualizador exif', 'metadados de foto', 'exif viewer', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'background-remover',
    icon: '✂️',
    category: 'image',
    component: 'BackgroundRemover',
    seo: {
      en: {
        title: 'Background Remover - Free Image Background Removal',
        description: 'Free online background remover. Automatically remove image background with AI. No installation, free.',
        keywords: ['background remover', 'remove background', 'image background', 'ai background removal', ...seoKeywords.en],
      },
      pt: {
        title: 'Removedor de fundo - Remover fundo de imagem',
        description: 'Remova o fundo de imagens online. Processe no navegador para recortes rápidos.',
        keywords: ['remover fundo', 'background remover', 'fundo transparente', 'recortar imagem', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'image-metadata',
    icon: '🔍',
    category: 'image',
    component: 'ImageMetadataViewer',
    seo: {
      en: {
        title: 'Image Metadata Viewer - Free Photo Info Analyzer',
        description: 'Free online image metadata viewer. Easily view photo device, GPS location, and camera settings.',
        keywords: ['image metadata', 'photo info', 'gps location', 'camera settings', ...seoKeywords.en],
      },
      pt: {
        title: 'Visualizador de metadados de imagem online',
        description: 'Veja metadados de imagens online grátis. Inspecione propriedades e informações técnicas.',
        keywords: ['metadados de imagem', 'image metadata', 'propriedades da imagem', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'appstore-screenshot',
    icon: '📱',
    category: 'image',
    component: 'AppStoreScreenshotResizer',
    seo: {
      en: {
        title: 'App Store Screenshot Resizer - Free iOS Screenshot Tool',
        description: 'Free online App Store screenshot resizer. Simple & fast way to crop and resize images for iPhone and iPad App Store requirements. No installation, browser-based.',
        keywords: ['app store screenshot', 'iOS screenshot resizer', 'iPhone screenshot size', 'iPad screenshot', 'free', 'simple', ...seoKeywords.en],
      },
      pt: {
        title: 'Redimensionador de screenshots da App Store',
        description: 'Redimensione screenshots para App Store e Google Play. Gere tamanhos oficiais rapidamente.',
        keywords: ['app store screenshot', 'screenshot ios', 'google play screenshot', 'redimensionar', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Marketer
  {
    slug: 'utm',
    icon: '📊',
    category: 'marketer',
    component: 'UtmBuilder',
    seo: {
      en: {
        title: 'UTM Link Builder - Free UTM Parameter Generator',
        description: 'Free online UTM link builder. Easily create UTM links for campaign tracking. Free tool for marketers.',
        keywords: ['utm', 'utm link', 'utm parameter', 'campaign tracking', ...seoKeywords.en],
      },
      pt: {
        title: 'Construtor de UTM - Gerador de parâmetros UTM',
        description: 'Construtor de UTM online grátis. Monte URLs de campanha com utm_source, medium e campaign.',
        keywords: ['utm', 'construtor de utm', 'utm builder', 'parâmetros utm', 'campanha', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Productivity
  {
    slug: 'timer',
    icon: '⏱️',
    category: 'productivity',
    component: 'TimerStopwatch',
    seo: {
      en: {
        title: 'Timer / Stopwatch - Free Online Timer',
        description: 'Free online timer and stopwatch. Easily measure time. No installation, free.',
        keywords: ['timer', 'stopwatch', 'time measurement', 'alarm', ...seoKeywords.en],
      },
      pt: {
        title: 'Timer e cronômetro online grátis',
        description: 'Timer e cronômetro online grátis. Cronometre tarefas ou use contagem regressiva no navegador.',
        keywords: ['timer', 'cronômetro', 'contagem regressiva', 'stopwatch', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'pomodoro',
    icon: '🍅',
    category: 'productivity',
    component: 'PomodoroTimer',
    seo: {
      en: {
        title: 'Pomodoro Timer - Free Focus Enhancement Tool',
        description: 'Free online Pomodoro timer. Boost productivity with Pomodoro technique. No installation, free.',
        keywords: ['pomodoro', 'focus', 'productivity', 'time management', ...seoKeywords.en],
      },
      pt: {
        title: 'Timer Pomodoro - Técnica Pomodoro online',
        description: 'Timer Pomodoro online grátis. Foque com ciclos de trabalho e pausa no navegador.',
        keywords: ['pomodoro', 'timer pomodoro', 'técnica pomodoro', 'produtividade', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'world-clock',
    icon: '🌍',
    category: 'productivity',
    component: 'WorldClock',
    seo: {
      en: {
        title: 'World Clock - Free World Time Viewer',
        description: 'Free online world clock. Easily check and convert world time zones. No installation, free.',
        keywords: ['world clock', 'world time', 'time zone', 'timezone', ...seoKeywords.en],
      },
      pt: {
        title: 'Relógio mundial - Fusos horários online',
        description: 'Relógio mundial online grátis. Compare fusos horários de várias cidades ao mesmo tempo.',
        keywords: ['relógio mundial', 'fuso horário', 'world clock', 'timezone', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Calculator
  {
    slug: 'percent',
    icon: '%',
    category: 'calculator',
    component: 'PercentCalculator',
    seo: {
      en: {
        title: 'Percent Calculator - Free % Calculator',
        description: 'Free online percent calculator. Easily calculate percentages, rates, and discounts. No installation, free.',
        keywords: ['percent', '% calculator', 'percentage', 'rate calculator', ...seoKeywords.en],
      },
      pt: {
        title: 'Calculadora de porcentagem online grátis',
        description: 'Calculadora de porcentagem online grátis. Calcule percentuais, aumentos e descontos.',
        keywords: ['porcentagem', 'calculadora de porcentagem', 'percentual', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'discount',
    icon: '🏷️',
    category: 'calculator',
    component: 'DiscountCalculator',
    seo: {
      en: {
        title: 'Discount Calculator - Free Sale Price Calculator',
        description: 'Free online discount calculator. Easily calculate discount price and rate. No installation, free.',
        keywords: ['discount', 'discount calculator', 'sale price', 'discount rate', ...seoKeywords.en],
      },
      pt: {
        title: 'Calculadora de desconto - Preço com desconto',
        description: 'Calculadora de desconto online grátis. Calcule preço final, economia e percentual de desconto.',
        keywords: ['desconto', 'calculadora de desconto', 'preço com desconto', 'economia', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'bmi',
    icon: '⚖️',
    category: 'calculator',
    component: 'BmiCalculator',
    seo: {
      en: {
        title: 'BMI Calculator - Free Body Mass Index Calculator',
        description: 'Free online BMI calculator. Easily calculate BMI and ideal weight. No installation, free.',
        keywords: ['bmi', 'body mass index', 'ideal weight', 'bmi calculator', ...seoKeywords.en],
      },
      pt: {
        title: 'Calculadora de IMC - Índice de Massa Corporal',
        description: 'Calculadora de IMC online grátis. Calcule o índice de massa corporal a partir de altura e peso.',
        keywords: ['imc', 'calculadora de imc', 'índice de massa corporal', 'bmi', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'age',
    icon: '🎂',
    category: 'calculator',
    component: 'AgeCalculator',
    seo: {
      en: {
        title: 'Age Calculator - Free Age & Zodiac Calculator',
        description: 'Free online age calculator. Easily calculate age, zodiac signs. No installation, free.',
        keywords: ['age calculator', 'age', 'zodiac', 'birthday', ...seoKeywords.en],
      },
      pt: {
        title: 'Calculadora de idade - Idade exata online',
        description: 'Calculadora de idade online grátis. Calcule anos, meses e dias a partir da data de nascimento.',
        keywords: ['idade', 'calculadora de idade', 'data de nascimento', 'anos', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'dday',
    icon: '📅',
    category: 'calculator',
    component: 'DdayCalculator',
    seo: {
      en: {
        title: 'D-Day Calculator - Free Date Counter',
        description: 'Free online D-Day calculator. Easily calculate days until a date. No installation, free.',
        keywords: ['d-day', 'date calculator', 'days until', 'countdown', ...seoKeywords.en],
      },
      pt: {
        title: 'Calculadora de D-Day - Contagem de dias',
        description: 'Calculadora de D-Day online grátis. Conte dias até ou desde uma data importante.',
        keywords: ['d-day', 'contagem de dias', 'dias restantes', 'calculadora de data', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'dutch-pay',
    icon: '💸',
    category: 'calculator',
    component: 'DutchPayCalculator',
    seo: {
      en: {
        title: 'Split Bill Calculator - Free Bill Splitter',
        description: 'Free online split bill calculator. Easily split bills and calculate payments. No installation, free.',
        keywords: ['split bill', 'bill splitter', 'dutch pay', 'payment calculator', ...seoKeywords.en],
      },
      pt: {
        title: 'Calculadora de rachar conta - Divisão de conta',
        description: 'Calcule a divisão de conta online grátis. Divida o valor entre pessoas com ou sem gorjeta.',
        keywords: ['rachar conta', 'divisão de conta', 'dutch pay', 'dividir conta', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  // Random
  {
    slug: 'coin-flip',
    icon: '🪙',
    category: 'random',
    component: 'CoinFlip',
    seo: {
      en: {
        title: 'Coin Flip - Free Online Coin Toss',
        description: 'Free online coin flip. Make decisions with a fair coin toss. No installation, free.',
        keywords: ['coin flip', 'coin toss', 'heads tails', 'decision maker', ...seoKeywords.en],
      },
      pt: {
        title: 'Cara ou coroa - Jogar moeda online',
        description: 'Cara ou coroa online grátis. Tome decisões com um lançamento justo de moeda.',
        keywords: ['cara ou coroa', 'jogar moeda', 'coin flip', 'decisão', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
  {
    slug: 'dice',
    icon: '🎲',
    category: 'random',
    component: 'DiceRoller',
    seo: {
      en: {
        title: 'Dice Roller - Free Online Dice',
        description: 'Free online dice roller. Roll various dice from D4 to D100. No installation, free.',
        keywords: ['dice', 'dice roller', 'd6', 'd20', 'roll dice', ...seoKeywords.en],
      },
      pt: {
        title: 'Rolador de dados - Dados online grátis',
        description: 'Rolador de dados online grátis. Role dados de D4 a D100 no navegador.',
        keywords: ['dados', 'rolar dados', 'd6', 'd20', 'dice roller', 'grátis', 'online', 'simples', 'rápido', 'sem instalação', 'web'],
      },
    },
  },
];

// Categories configuration
export const categories = [
  { id: 'all', label: { en: 'All', pt: 'Todas' } },
  { id: 'calculator', label: { en: 'Calculator', pt: 'Calculadora' } },
  { id: 'generators', label: { en: 'Generators', pt: 'Geradores' } },
  { id: 'converters', label: { en: 'Converters', pt: 'Conversores' } },
  { id: 'text', label: { en: 'Text', pt: 'Texto' } },
  { id: 'developer', label: { en: 'Developer', pt: 'Desenvolvedor' } },
  { id: 'designer', label: { en: 'Designer', pt: 'Design' } },
  { id: 'image', label: { en: 'Image/Photo', pt: 'Imagem/Foto' } },
  { id: 'random', label: { en: 'Random/Pick', pt: 'Aleatório/Sorteio' } },
  { id: 'marketer', label: { en: 'Marketer', pt: 'Marketing' } },
  { id: 'productivity', label: { en: 'Productivity', pt: 'Produtividade' } },
];

// Anonymous chat SEO config (special case - not in /tools/)
export const anonymousChatSeo: Record<Language, ToolSEO> = {
  en: {
    title: 'Anonymous Chat - Free Online 1:1 Real-time Chat',
    description: 'Free anonymous 1:1 real-time chat. Secure P2P connection, nothing stored on servers. No signup required.',
    keywords: ['anonymous chat', '1:1 chat', 'real-time chat', 'p2p chat', ...seoKeywords.en],
  },
  pt: {
    title: 'Chat anônimo - Conversa 1:1 em tempo real grátis',
    description: 'Chat anônimo 1:1 em tempo real, grátis. Conexão P2P segura, nada fica no servidor. Sem cadastro.',
    keywords: ['chat anônimo', 'chat 1:1', 'chat em tempo real', 'chat p2p', ...seoKeywords.pt],
  },
};

// Helper function to get tool by slug
export function getToolBySlug(slug: string): ToolConfig | undefined {
  return toolsConfig.find(tool => tool.slug === slug);
}

// Helper function to get all slugs
export function getAllToolSlugs(): string[] {
  return toolsConfig.map(tool => tool.slug);
}
