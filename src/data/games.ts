// Game SEO data and configuration
import type { Language } from '../i18n';

export interface GameSeoData {
  title: string;
  description: string;
  keywords: string[];
}

export interface GameConfig {
  slug: string;
  icon: string;
  category: 'arcade' | 'puzzle' | 'event' | 'classic';
  featured?: boolean;
  seo: Record<Language, GameSeoData>;
}

// Common SEO keywords
const seoKeywords = {
  en: ['free', 'online', 'no install', 'simple', 'browser game'],
  pt: ['grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
};

export const gamesConfig: GameConfig[] = [
  // Classic/Arcade Games
  {
    slug: 'snake',
    icon: '🐍',
    category: 'arcade',
    featured: true,
    seo: {
      en: {
        title: 'Snake Game - Free Online Classic Snake',
        description: 'Free online snake game. Play the classic snake game directly in your browser. No installation required.',
        keywords: ['snake', 'snake game', 'classic game', ...seoKeywords.en],
      },
      pt: {
        title: 'Jogo da Cobrinha - Snake clássico online grátis',
        description: 'Jogue Snake online grátis. O clássico jogo da cobrinha direto no navegador. Sem instalação.',
        keywords: ['snake', 'jogo da cobrinha', 'jogo clássico', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: '2048',
    icon: '🔢',
    category: 'puzzle',
    featured: true,
    seo: {
      en: {
        title: '2048 Game - Free Online Number Puzzle',
        description: 'Free 2048 puzzle game. Merge numbers to reach 2048. Addictive brain game.',
        keywords: ['2048', 'number puzzle', 'brain game', 'puzzle game', ...seoKeywords.en],
      },
      pt: {
        title: '2048 - Puzzle numérico online grátis',
        description: 'Jogue 2048 grátis. Una números até chegar a 2048. Puzzle viciante para o cérebro.',
        keywords: ['2048', 'puzzle numérico', 'jogo mental', 'puzzle', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'hangman',
    icon: '🪢',
    category: 'puzzle',
    featured: true,
    seo: {
      en: {
        title: 'Hangman Game - Free Online Word Guess',
        description: 'Free online hangman game. Guess letters and solve the hidden word. Simple but addictive word puzzle.',
        keywords: ['hangman', 'word guess', 'spelling game', 'word puzzle', ...seoKeywords.en],
      },
      pt: {
        title: 'Jogo da Forca - Adivinhe a palavra online',
        description: 'Jogue forca online grátis. Adivinhe letras e descubra a palavra escondida. Puzzle simples e viciante.',
        keywords: ['forca', 'adivinhe a palavra', 'jogo de soletrar', 'puzzle de palavras', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'typing',
    icon: '⌨️',
    category: 'arcade',
    featured: true,
    seo: {
      en: {
        title: 'Typing Game - Free Online Typing Practice',
        description: 'Free online typing game. Measure WPM, improve typing speed. Practice typing in a fun way.',
        keywords: ['typing', 'typing practice', 'WPM', 'typing game', ...seoKeywords.en],
      },
      pt: {
        title: 'Jogo de digitação - Pratique WPM online',
        description: 'Jogo de digitação online grátis. Meça WPM e melhore a velocidade de digitação de forma divertida.',
        keywords: ['digitação', 'prática de digitação', 'WPM', 'jogo de digitação', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'dino-runner',
    icon: '🦖',
    category: 'arcade',
    seo: {
      en: {
        title: 'Dino Runner - Free Online Jump Game',
        description: 'Free dino runner game. Chrome dinosaur style simple runner game. Jump over obstacles!',
        keywords: ['dino game', 'jump game', 'runner game', 'chrome dinosaur', ...seoKeywords.en],
      },
      pt: {
        title: 'Dino Runner - Jogo de corrida e pulo online',
        description: 'Jogue Dino Runner grátis. Runner no estilo do dinossauro do Chrome. Pule obstáculos!',
        keywords: ['jogo do dino', 'jogo de pulo', 'runner', 'dinossauro chrome', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'flappy',
    icon: '🐦',
    category: 'arcade',
    seo: {
      en: {
        title: 'Flappy Bird - Free Online Pipe Dodging Game',
        description: 'Free Flappy Bird style game. Fly through pipes. Simple but addictive game.',
        keywords: ['flappy bird', 'pipe game', 'flying game', ...seoKeywords.en],
      },
      pt: {
        title: 'Flappy Bird - Voe entre os canos online',
        description: 'Jogue Flappy Bird online grátis. Toque para voar e desvie dos canos. Clássico viciante.',
        keywords: ['flappy bird', 'jogo de voo', 'flappy', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'breakout',
    icon: '🧱',
    category: 'arcade',
    seo: {
      en: {
        title: 'Breakout Game - Free Online Brick Breaker',
        description: 'Free online breakout game. Play classic brick breaker in your browser.',
        keywords: ['breakout', 'brick breaker', 'arcade game', ...seoKeywords.en],
      },
      pt: {
        title: 'Breakout - Quebre os blocos online',
        description: 'Jogue Breakout online grátis. Quebre todos os blocos com a bolinha e a raquete.',
        keywords: ['breakout', 'quebra-blocos', 'jogo de arkanoid', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'minesweeper',
    icon: '💣',
    category: 'puzzle',
    seo: {
      en: {
        title: 'Minesweeper - Free Online Mine Sweeper',
        description: 'Free online Minesweeper game. Play classic mine sweeper in your browser.',
        keywords: ['minesweeper', 'mine sweeper', 'puzzle game', ...seoKeywords.en],
      },
      pt: {
        title: 'Campo Minado - Minesweeper online grátis',
        description: 'Jogue Campo Minado online grátis. Encontre as minas sem explodir. Clássico de lógica.',
        keywords: ['campo minado', 'minesweeper', 'jogo de lógica', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  // Puzzle/Brain Games
  {
    slug: 'tic-tac-toe',
    icon: '⭕',
    category: 'classic',
    seo: {
      en: {
        title: 'Tic Tac Toe - Free Online Game',
        description: 'Free online Tic Tac Toe game. Play against AI.',
        keywords: ['tic tac toe', 'noughts and crosses', 'x and o', ...seoKeywords.en],
      },
      pt: {
        title: 'Jogo da Velha - Tic Tac Toe online',
        description: 'Jogue da velha online grátis. Desafie a IA ou um amigo em partidas rápidas.',
        keywords: ['jogo da velha', 'tic tac toe', 'jogo clássico', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'color-match',
    icon: '🎨',
    category: 'puzzle',
    seo: {
      en: {
        title: 'Color Match - Free Color Matching Game',
        description: 'Free color matching game. Quick brain game to distinguish colors.',
        keywords: ['color match', 'color game', 'matching game', ...seoKeywords.en],
      },
      pt: {
        title: 'Color Match - Jogo de combinar cores',
        description: 'Jogue Color Match online grátis. Combine cores iguais o mais rápido possível.',
        keywords: ['color match', 'combinar cores', 'jogo de cores', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'math-quiz',
    icon: '🧮',
    category: 'puzzle',
    seo: {
      en: {
        title: 'Math Quiz - Free Online Mental Math Game',
        description: 'Free math quiz game. Solve problems within time limit. Brain training.',
        keywords: ['math quiz', 'mental math', 'math game', 'brain training', ...seoKeywords.en],
      },
      pt: {
        title: 'Quiz de matemática - Treino mental online',
        description: 'Quiz de matemática online grátis. Resolva contas rápidas e treine o raciocínio.',
        keywords: ['quiz de matemática', 'jogo de contas', 'treino mental', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'whack-a-mole',
    icon: '🔨',
    category: 'arcade',
    featured: true,
    seo: {
      en: {
        title: 'Whack-a-Mole - Free Online Reflex Game',
        description: 'Free online whack-a-mole game. Catch as many moles as possible in 30 seconds.',
        keywords: ['whack a mole', 'reflex game', 'click game', ...seoKeywords.en],
      },
      pt: {
        title: 'Whack-a-Mole - Acerte as toupeiras online',
        description: 'Jogue Whack-a-Mole online grátis. Acerte as toupeiras o mais rápido que puder.',
        keywords: ['whack a mole', 'acerte a toupeira', 'jogo de reflexo', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  // Event/Raffle Games
  {
    slug: 'roulette',
    icon: '🎡',
    category: 'event',
    featured: true,
    seo: {
      en: {
        title: 'Spin the Wheel - Free Online Random Picker Roulette',
        description: 'Free online spin the wheel. Use for lunch menu, event raffles, decision making. Bulk input supported.',
        keywords: ['roulette', 'spin the wheel', 'random picker', 'raffle', 'lunch menu', 'company', 'school', 'event', ...seoKeywords.en],
      },
      pt: {
        title: 'Roleta - Sorteio aleatório online',
        description: 'Roleta online grátis. Adicione itens e gire para sortear um resultado aleatório.',
        keywords: ['roleta', 'sorteio', 'roulette', 'aleatório', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'ladder',
    icon: '🪜',
    category: 'event',
    featured: true,
    seo: {
      en: {
        title: 'Ladder Game - Free Online Ghost Leg',
        description: 'Free online ladder game. Perfect fair random selection tool for company, school raffles.',
        keywords: ['ladder game', 'ghost leg', 'raffle', 'random selection', 'company', 'school', 'event', ...seoKeywords.en],
      },
      pt: {
        title: 'Jogo da Escada - Ladder game online',
        description: 'Jogo da escada online grátis. Monte a escada e sorteie resultados para eventos.',
        keywords: ['jogo da escada', 'ladder game', 'sorteio', 'evento', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'team-randomizer',
    icon: '👥',
    category: 'event',
    seo: {
      en: {
        title: 'Team Randomizer - Free Online Team Splitter',
        description: 'Free team randomizer. Use for company team building, school group assignments. Fair team distribution.',
        keywords: ['team randomizer', 'team splitter', 'group maker', 'team building', 'random team', 'company', 'school', ...seoKeywords.en],
      },
      pt: {
        title: 'Sorteador de times - Dividir equipes online',
        description: 'Sorteie times online grátis. Divida nomes em equipes de forma aleatória e justa.',
        keywords: ['sorteador de times', 'dividir equipes', 'team randomizer', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'bingo',
    icon: '🎱',
    category: 'event',
    seo: {
      en: {
        title: 'Bingo Game - Free Online Bingo Caller',
        description: 'Free online bingo game. Perfect bingo calling tool for large events, parties.',
        keywords: ['bingo', 'bingo game', 'bingo caller', 'event', 'party game', ...seoKeywords.en],
      },
      pt: {
        title: 'Bingo - Cartelas de bingo online grátis',
        description: 'Jogue bingo online grátis. Gere cartelas e sorteie números para sua festa.',
        keywords: ['bingo', 'cartela de bingo', 'sorteio de números', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'spinner',
    icon: '🌀',
    category: 'event',
    seo: {
      en: {
        title: 'Spinner Wheel - Free Online Spinning Wheel',
        description: 'Free online spinner wheel. Multi-purpose spinning wheel for raffles, penalties, etc.',
        keywords: ['spinner', 'spinning wheel', 'wheel spin', 'raffle', 'penalty', ...seoKeywords.en],
      },
      pt: {
        title: 'Spinner - Roleta de decisão online',
        description: 'Spinner online grátis. Gire a roleta para tomar decisões aleatórias.',
        keywords: ['spinner', 'roleta de decisão', 'girar a roleta', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  // Existing games (keep for compatibility)
  {
    slug: 'memory-game',
    icon: '🧠',
    category: 'puzzle',
    seo: {
      en: {
        title: 'Memory Game - Free Online Card Matching',
        description: 'Free memory game. Match card pairs to test your memory.',
        keywords: ['memory game', 'card matching', 'brain game', ...seoKeywords.en],
      },
      pt: {
        title: 'Jogo da Memória - Combine as cartas online',
        description: 'Jogo da memória online grátis. Vire cartas e encontre os pares. Treine a memória.',
        keywords: ['jogo da memória', 'memory game', 'combinar cartas', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'reaction-test',
    icon: '⚡',
    category: 'arcade',
    seo: {
      en: {
        title: 'Reaction Test - Free Online Reaction Speed',
        description: 'Free reaction test. Measure your reaction speed.',
        keywords: ['reaction test', 'reaction speed', 'reflex test', ...seoKeywords.en],
      },
      pt: {
        title: 'Teste de reação - Meça seus reflexos online',
        description: 'Teste de reação online grátis. Meça a velocidade dos seus reflexos em milissegundos.',
        keywords: ['teste de reação', 'reflexos', 'reaction test', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'rock-paper-scissors',
    icon: '✊',
    category: 'classic',
    seo: {
      en: {
        title: 'Rock Paper Scissors - Free Online AI Battle',
        description: 'Free rock paper scissors game. Battle against AI.',
        keywords: ['rock paper scissors', 'AI game', 'battle game', ...seoKeywords.en],
      },
      pt: {
        title: 'Pedra, papel e tesoura - Batalha contra a IA',
        description: 'Jogue pedra, papel e tesoura online grátis. Dispute contra a IA.',
        keywords: ['pedra papel tesoura', 'jogo contra ia', 'batalha', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'number-guess',
    icon: '🔮',
    category: 'puzzle',
    seo: {
      en: {
        title: 'Number Guess - Free Online Up Down Game',
        description: 'Free number guessing game. Guess the number with Up & Down hints.',
        keywords: ['number guess', 'up down', 'number game', ...seoKeywords.en],
      },
      pt: {
        title: 'Adivinhe o número - Maior ou menor online',
        description: 'Jogo de adivinhar o número online grátis. Use dicas de maior ou menor para acertar.',
        keywords: ['adivinhe o número', 'maior ou menor', 'jogo de números', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
  {
    slug: 'slot-machine',
    icon: '🎰',
    category: 'arcade',
    seo: {
      en: {
        title: 'Slot Machine - Free Online Slots Game',
        description: 'Free slot machine game. Try your luck for 777 jackpot!',
        keywords: ['slot machine', 'slots game', '777', 'jackpot', ...seoKeywords.en],
      },
      pt: {
        title: 'Caça-níquel - Slot machine online grátis',
        description: 'Jogue caça-níquel online grátis. Tente a sorte no jackpot 777!',
        keywords: ['caça-níquel', 'slot machine', '777', 'jackpot', 'grátis', 'online', 'sem instalação', 'simples', 'jogo no navegador'],
      },
    },
  },
];

// Helper to get game by slug
export function getGameConfig(slug: string): GameConfig | undefined {
  return gamesConfig.find(game => game.slug === slug);
}

// Helper to get games by category
export function getGamesByCategory(category: GameConfig['category']): GameConfig[] {
  return gamesConfig.filter(game => game.category === category);
}

// Helper to get featured games
export function getFeaturedGames(): GameConfig[] {
  return gamesConfig.filter(game => game.featured);
}
