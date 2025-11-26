export interface ChessMove {
  san: string;
  fen: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  moveNumber: number;
}

export interface EngineLine {
  depth: number;
  score: number; // centipawns
  mate: number | null; // moves to mate, null if not mate
  pv: string; // principal variation string
  multipv: number;
}

export interface EngineState {
  isReady: boolean;
  isAnalyzing: boolean;
  evaluation: number; // Current evaluation in centipawns (positive for white)
  mate: number | null; // Mate in X moves
  bestLine: string[]; // Array of moves in the best line
  lines: EngineLine[];
}

export interface GameMetadata {
  white: string;
  black: string;
  date: string;
  result: string;
  event: string;
}

export enum PieceType {
  PAWN = 'p',
  KNIGHT = 'n',
  BISHOP = 'b',
  ROOK = 'r',
  QUEEN = 'q',
  KING = 'k'
}

export enum PieceColor {
  WHITE = 'w',
  BLACK = 'b'
}