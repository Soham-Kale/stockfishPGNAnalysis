import React, { useMemo } from 'react';
import { Chess } from 'chess.js';
import { PIECE_SVGS } from '../constants';
import { PieceType, PieceColor } from '../types';

interface ChessBoardProps {
  fen: string;
  lastMove: { from: string; to: string } | null;
  flipped?: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const ChessBoard: React.FC<ChessBoardProps> = ({ fen, lastMove, flipped = false }) => {
  const board = useMemo(() => {
    const chess = new Chess(fen);
    return chess.board();
  }, [fen]);

  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = flipped ? [...FILES].reverse() : FILES;

  const getSquareColor = (rankIndex: number, fileIndex: number) => {
    const isLight = (rankIndex + fileIndex) % 2 === 0;
    return isLight ? 'bg-boardLight' : 'bg-boardDark';
  };

  return (
    <div className="w-full aspect-square max-w-[600px] select-none shadow-xl rounded-sm overflow-hidden border-4 border-uiDarker">
      <div className="grid grid-rows-8 h-full w-full">
        {displayRanks.map((rank, rankIndex) => (
          <div key={rank} className="grid grid-cols-8 w-full h-full">
            {displayFiles.map((file, fileIndex) => {
              const square = `${file}${rank}`;
              const piece = board[8 - rank][FILES.indexOf(file)]; // chess.js board is 0-7, 0-7

              const isHighlighted = lastMove && (lastMove.from === square || lastMove.to === square);
              
              // Resolve piece SVG key (e.g., 'wP', 'bK')
              const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : null;
              
              return (
                <div
                  key={square}
                  className={`relative flex items-center justify-center ${getSquareColor(rankIndex, fileIndex)}`}
                >
                  {/* Highlight */}
                  {isHighlighted && (
                    <div className="absolute inset-0 bg-highlight mix-blend-multiply z-0" />
                  )}

                  {/* Coordinate Labels */}
                  {fileIndex === 0 && (
                    <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${getSquareColor(rankIndex, fileIndex) === 'bg-boardLight' ? 'text-boardDark' : 'text-boardLight'}`}>
                      {rank}
                    </span>
                  )}
                  {rankIndex === 7 && (
                    <span className={`absolute bottom-0 right-0.5 text-[10px] font-bold ${getSquareColor(rankIndex, fileIndex) === 'bg-boardLight' ? 'text-boardDark' : 'text-boardLight'}`}>
                      {file}
                    </span>
                  )}

                  {/* Piece */}
                  {pieceKey && PIECE_SVGS[pieceKey] && (
                    <div className="w-[85%] h-[85%] z-10 pointer-events-none">
                      <svg viewBox="0 0 45 45" className="w-full h-full filter drop-shadow-md">
                        {PIECE_SVGS[pieceKey]}
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;