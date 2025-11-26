import React, { useEffect, useRef } from 'react';
import { ChessMove } from '../types';

interface MoveListProps {
  moves: ChessMove[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

const MoveList: React.FC<MoveListProps> = ({ moves, currentMoveIndex, onMoveClick }) => {
  const activeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active move
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
        // Simple scroll into view logic
        activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [currentMoveIndex]);

  // Group moves into pairs (White, Black) for standard display
  const movePairs: { moveNumber: number, white?: ChessMove, black?: ChessMove, wIndex: number, bIndex?: number }[] = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      wIndex: i,
      black: moves[i + 1],
      bIndex: i + 1
    });
  }

  return (
    <div className="flex-1 bg-uiDark rounded-lg border border-gray-700 overflow-hidden flex flex-col">
      <div className="bg-uiDarker px-4 py-2 border-b border-gray-700 text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Game Score
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="grid grid-cols-[30px_1fr_1fr] gap-x-2 text-sm">
             {/* Header */}
             <div className="text-gray-500 text-xs text-center">#</div>
             <div className="text-gray-500 text-xs pl-2">White</div>
             <div className="text-gray-500 text-xs pl-2">Black</div>

             {/* Moves */}
             {movePairs.map((pair) => (
               <React.Fragment key={pair.moveNumber}>
                 <div className="text-gray-500 text-center py-1 bg-uiDarker/30 rounded mb-1 flex items-center justify-center">
                    {pair.moveNumber}.
                 </div>
                 
                 <button
                    ref={currentMoveIndex === pair.wIndex ? activeRef : null}
                    onClick={() => onMoveClick(pair.wIndex)}
                    className={`text-left px-2 py-1 rounded transition-colors mb-1 truncate ${
                      currentMoveIndex === pair.wIndex 
                        ? 'bg-accent text-white font-bold' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                 >
                    {pair.white?.san}
                 </button>

                 {pair.black ? (
                    <button
                        ref={currentMoveIndex === pair.bIndex ? activeRef : null}
                        onClick={() => pair.bIndex && onMoveClick(pair.bIndex)}
                        className={`text-left px-2 py-1 rounded transition-colors mb-1 truncate ${
                        currentMoveIndex === pair.bIndex 
                            ? 'bg-accent text-white font-bold' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {pair.black.san}
                    </button>
                 ) : (
                    <div />
                 )}
               </React.Fragment>
             ))}
        </div>
        
        {moves.length === 0 && (
            <div className="text-center text-gray-500 mt-10 italic">
                Enter a PGN to see moves
            </div>
        )}
      </div>
    </div>
  );
};

export default MoveList;