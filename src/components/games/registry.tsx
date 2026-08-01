import type { ComponentType } from 'react';
import SnakeGame from '@/components/games/SnakeGame';
import Game2048 from '@/components/games/Game2048';
import TypingGame from '@/components/games/TypingGame';
import HangmanGame from '@/components/games/HangmanGame';
import DinoRunner from '@/components/games/DinoRunner';
import FlappyBird from '@/components/games/FlappyBird';
import Breakout from '@/components/games/Breakout';
import Minesweeper from '@/components/games/Minesweeper';
import TicTacToe from '@/components/games/TicTacToe';
import ColorMatch from '@/components/games/ColorMatch';
import MathQuiz from '@/components/games/MathQuiz';
import WhackAMole from '@/components/games/WhackAMole';
import LadderGame from '@/components/games/LadderGame';
import TeamRandomizer from '@/components/games/TeamRandomizer';
import BingoGame from '@/components/games/BingoGame';
import EventRoulette from '@/components/games/roulette/EventRoulette';
import MemoryGame from '@/components/MemoryGame';
import ReactionTest from '@/components/ReactionTest';
import RockPaperScissors from '@/components/RockPaperScissors';
import NumberGuess from '@/components/NumberGuess';
import SlotMachine from '@/components/SlotMachine';

const gameComponents: Record<string, ComponentType> = {
  snake: SnakeGame,
  '2048': Game2048,
  typing: TypingGame,
  hangman: HangmanGame,
  'dino-runner': DinoRunner,
  flappy: FlappyBird,
  breakout: Breakout,
  minesweeper: Minesweeper,
  'tic-tac-toe': TicTacToe,
  'color-match': ColorMatch,
  'math-quiz': MathQuiz,
  'whack-a-mole': WhackAMole,
  ladder: LadderGame,
  'team-randomizer': TeamRandomizer,
  bingo: BingoGame,
  roulette: EventRoulette,
  spinner: EventRoulette,
  'memory-game': MemoryGame,
  'reaction-test': ReactionTest,
  'rock-paper-scissors': RockPaperScissors,
  'number-guess': NumberGuess,
  'slot-machine': SlotMachine,
};

export function getGameComponent(slug: string): ComponentType | undefined {
  return gameComponents[slug];
}
