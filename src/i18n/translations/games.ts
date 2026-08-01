// Game translations
import type { Language } from '../index';

export const gameTranslations = {
  // Common game terms
  common: {
    score: { en: 'Score', pt: 'Pontuação' },
    highScore: { en: 'High Score', pt: 'Recorde' },
    level: { en: 'Level', pt: 'Nível' },
    time: { en: 'Time', pt: 'Tempo' },
    start: { en: 'Start', pt: 'Iniciar' },
    restart: { en: 'Restart', pt: 'Reiniciar' },
    gameOver: { en: 'Game Over', pt: 'Fim de jogo' },
    win: { en: 'You Win!', pt: 'Você venceu!' },
    lose: { en: 'You Lose', pt: 'Você perdeu' },
    draw: { en: 'Draw', pt: 'Empate' },
    easy: { en: 'Easy', pt: 'Fácil' },
    medium: { en: 'Medium', pt: 'Médio' },
    hard: { en: 'Hard', pt: 'Difícil' },
    difficulty: { en: 'Difficulty', pt: 'Dificuldade' },
    wins: { en: 'Wins', pt: 'Vitórias' },
    losses: { en: 'Losses', pt: 'Derrotas' },
    draws: { en: 'Draws', pt: 'Empates' },
    tries: { en: 'Tries', pt: 'Tentativas' },
    attempts: { en: 'Attempts', pt: 'Tentativas' },
    correct: { en: 'Correct!', pt: 'Correto!' },
    wrong: { en: 'Wrong!', pt: 'Errado!' },
    hint: { en: 'Hint', pt: 'Dica' },
    play: { en: 'Play', pt: 'Jogar' },
    pause: { en: 'Pause', pt: 'Pausar' },
    resume: { en: 'Resume', pt: 'Continuar' },
  },

  // Number Guess Game
  numberGuess: {
    title: { en: 'Number Guess', pt: 'Adivinhe o número' },
    description: { en: 'Up-down number guessing game', pt: 'Jogo de adivinhar o número (maior ou menor)' },
    guess: { en: 'Guess', pt: 'Chutar' },
    higher: { en: 'UP! Go higher', pt: 'PARA CIMA! Tente um número maior' },
    lower: { en: 'DOWN! Go lower', pt: 'PARA BAIXO! Tente um número menor' },
    enterNumber: { en: 'Enter a number', pt: 'Digite um número' },
    range: { en: 'Range', pt: 'Intervalo' },
    between: { en: 'to', pt: 'a' },
  },

  // Reaction Test
  reactionTest: {
    title: { en: 'Reaction Test', pt: 'Teste de reação' },
    description: { en: 'Test your reaction speed', pt: 'Teste a velocidade da sua reação' },
    wait: { en: 'Wait...', pt: 'Aguarde...' },
    click: { en: 'Click!', pt: 'Clique!' },
    tooEarly: { en: 'Too early!', pt: 'Cedo demais!' },
    yourTime: { en: 'Your time', pt: 'Seu tempo' },
    average: { en: 'Average', pt: 'Média' },
    best: { en: 'Best', pt: 'Melhor' },
    clickToStart: { en: 'Click to start', pt: 'Clique para começar' },
    ms: { en: 'ms', pt: 'ms' },
  },

  // Rock Paper Scissors
  rockPaperScissors: {
    title: { en: 'Rock Paper Scissors', pt: 'Pedra, papel e tesoura' },
    description: { en: 'Play against AI', pt: 'Jogue contra a IA' },
    rock: { en: 'Rock', pt: 'Pedra' },
    paper: { en: 'Paper', pt: 'Papel' },
    scissors: { en: 'Scissors', pt: 'Tesoura' },
    you: { en: 'You', pt: 'Você' },
    computer: { en: 'Computer', pt: 'Computador' },
    choose: { en: 'Make your choice', pt: 'Faça sua escolha' },
    streak: { en: 'Streak', pt: 'Sequência' },
  },

  // Memory Game
  memoryGame: {
    title: { en: 'Memory Game', pt: 'Jogo da memória' },
    description: { en: 'Match card pairs', pt: 'Combine os pares de cartas' },
    moves: { en: 'Moves', pt: 'Jogadas' },
    pairs: { en: 'Pairs', pt: 'Pares' },
    matched: { en: 'Matched', pt: 'Combinados' },
    complete: { en: 'Complete!', pt: 'Concluído!' },
  },

  // Roulette
  roulette: {
    title: { en: 'Roulette', pt: 'Roleta' },
    description: { en: 'Spin custom roulette', pt: 'Gire a roleta personalizada' },
    spin: { en: 'Spin', pt: 'Girar' },
    addItem: { en: 'Add Item', pt: 'Adicionar item' },
    removeItem: { en: 'Remove Item', pt: 'Remover item' },
    result: { en: 'Result', pt: 'Resultado' },
    spinning: { en: 'Spinning...', pt: 'Girando...' },
    itemPlaceholder: { en: 'Enter item...', pt: 'Digite o item...' },
  },

  // Slot Machine
  slotMachine: {
    title: { en: 'Slot Machine', pt: 'Caça-níquel' },
    description: { en: 'Slot machine game', pt: 'Jogo de caça-níquel' },
    spin: { en: 'Spin', pt: 'Girar' },
    jackpot: { en: 'Jackpot!', pt: 'Jackpot!' },
    credits: { en: 'Credits', pt: 'Créditos' },
    bet: { en: 'Bet', pt: 'Aposta' },
    autoSpin: { en: 'Auto Spin', pt: 'Giro automático' },
  },

  // Games page
  gamesPage: {
    title: { en: 'Game Center', pt: 'Central de jogos' },
    description: { en: 'Fun mini game collection', pt: 'Coleção de minijogos divertidos' },
    allGames: { en: 'All Games', pt: 'Todos os jogos' },
    featured: { en: 'Featured', pt: 'Em destaque' },
    playNow: { en: 'Play Now', pt: 'Jogar agora' },
  },
} as const;

export type GameTranslationKey = keyof typeof gameTranslations;
