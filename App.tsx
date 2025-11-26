import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Chess } from 'chess.js';
import StockfishService from './services/stockfishService';
import ChessBoard from './components/ChessBoard';
import EvaluationBar from './components/EvaluationBar';
import MoveList from './components/MoveList';
import AnalysisPanel from './components/AnalysisPanel';
import { ChessMove, EngineState, PieceColor, GameMetadata } from './types';
import { START_FEN } from './constants';

// --- State Management ---
// Using reducer for complex move navigation state
type State = {
  pgnInput: string;
  game: Chess;
  moves: ChessMove[];
  currentMoveIndex: number; // -1 means start position
  currentFen: string;
  flipped: boolean;
};

type Action = 
  | { type: 'LOAD_PGN', pgn: string }
  | { type: 'GO_TO_MOVE', index: number }
  | { type: 'FLIP_BOARD' }
  | { type: 'SET_PGN_INPUT', input: string };

const initialState: State = {
  pgnInput: '',
  game: new Chess(),
  moves: [],
  currentMoveIndex: -1,
  currentFen: START_FEN,
  flipped: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_PGN': {
      try {
        const newGame = new Chess();
        newGame.loadPgn(action.pgn);
        
        // Extract move history from the game object
        // chess.js history({ verbose: true }) returns all moves
        const history = newGame.history({ verbose: true });
        
        // Map to our ChessMove type
        const moves: ChessMove[] = history.map((m, i) => ({
            san: m.san,
            fen: m.after,
            from: m.from,
            to: m.to,
            color: m.color,
            moveNumber: i
        }));

        return {
          ...state,
          game: newGame,
          moves: moves,
          currentMoveIndex: -1, // Reset to start
          currentFen: START_FEN,
          pgnInput: action.pgn
        };
      } catch (e) {
        alert("Invalid PGN");
        return state;
      }
    }
    case 'GO_TO_MOVE': {
        const index = action.index;
        if (index < -1 || index >= state.moves.length) return state;

        const newFen = index === -1 ? START_FEN : state.moves[index].fen;
        
        return {
            ...state,
            currentMoveIndex: index,
            currentFen: newFen
        };
    }
    case 'FLIP_BOARD':
        return { ...state, flipped: !state.flipped };
    case 'SET_PGN_INPUT':
        return { ...state, pgnInput: action.input };
    default:
        return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [engineState, setEngineState] = useState<EngineState>({
    isReady: false,
    isAnalyzing: false,
    evaluation: 0,
    mate: null,
    bestLine: [],
    lines: []
  });
  const [engineService] = useState(() => new StockfishService((update) => {
    setEngineState(prev => ({ ...prev, ...update }));
  }));
  const [showPgnInput, setShowPgnInput] = useState(false);

  // Initialize Engine
  useEffect(() => {
    engineService.init();
    return () => engineService.terminate();
  }, [engineService]);

  // Trigger Analysis on FEN change
  useEffect(() => {
    if (engineState.isReady) {
        // Debounce slightly to prevent spamming if scrolling fast
        const timer = setTimeout(() => {
             engineService.analyzePosition(state.currentFen);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [state.currentFen, engineState.isReady, engineService]);

  // Handlers
  const handleLoadPgn = () => {
    dispatch({ type: 'LOAD_PGN', pgn: state.pgnInput });
    setShowPgnInput(false);
  };

  const handleFormatPgn = () => {
    // Heuristic formatting to clean up pasted PGNs
    let formatted = state.pgnInput
        .replace(/\r\n/g, '\n')        // Normalize line endings
        .trim();                       // Trim whitespace
    
    // Ensure headers are on their own lines (e.g. [A "B"][C "D"] -> [A "B"]\n[C "D"])
    formatted = formatted.replace(/\]\s*\[/g, ']\n[');
    
    // Ensure gap between headers and moves if they are smashed together
    // Look for closing bracket followed by "1."
    formatted = formatted.replace(/\]\s*(1\.)/, ']\n\n1.');

    dispatch({ type: 'SET_PGN_INPUT', input: formatted });
  };

  const handleNext = () => dispatch({ type: 'GO_TO_MOVE', index: state.currentMoveIndex + 1 });
  const handlePrev = () => dispatch({ type: 'GO_TO_MOVE', index: state.currentMoveIndex - 1 });
  const handleStart = () => dispatch({ type: 'GO_TO_MOVE', index: -1 });
  const handleEnd = () => dispatch({ type: 'GO_TO_MOVE', index: state.moves.length - 1 });

  // Get metadata if available (basic parsing)
  const getMetadata = () => {
      const header = state.game.header();
      return `${header['White'] || 'White'} vs ${header['Black'] || 'Black'} (${header['Result'] || '*'})`;
  };

  // Determine last move for highlighting
  const lastMove = state.currentMoveIndex >= 0 ? {
    from: state.moves[state.currentMoveIndex].from,
    to: state.moves[state.currentMoveIndex].to
  } : null;

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-2 md:p-6 lg:flex-row gap-4">
      
      {/* --- Left Column: Board & Eval --- */}
      <div className="flex flex-col gap-2 md:gap-4 lg:w-2/3 items-center">
        
        {/* Header (Mobile Only) */}
        <div className="lg:hidden w-full flex justify-between items-center bg-uiDark p-2 rounded">
             <h1 className="font-bold text-gray-300 truncate text-sm">{getMetadata()}</h1>
             <button onClick={() => setShowPgnInput(!showPgnInput)} className="text-xs bg-gray-700 px-2 py-1 rounded">PGN</button>
        </div>

        {/* PGN Input Modal/Area (Conditional) */}
        {showPgnInput && (
            <div className="w-full bg-uiDark p-4 rounded border border-gray-600 mb-2 animate-fade-in z-50 absolute lg:relative top-12 lg:top-auto shadow-2xl">
                <textarea 
                    className="w-full bg-uiDarker border border-gray-600 rounded p-2 text-sm text-mono h-32 focus:border-accent outline-none"
                    placeholder="Paste PGN here..."
                    value={state.pgnInput}
                    onChange={(e) => dispatch({ type: 'SET_PGN_INPUT', input: e.target.value })}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button 
                        onClick={handleFormatPgn} 
                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded mr-auto"
                        title="Trim and format PGN"
                    >
                        Format
                    </button>
                    <button onClick={() => setShowPgnInput(false)} className="px-3 py-1 text-sm text-gray-400">Cancel</button>
                    <button onClick={handleLoadPgn} className="px-3 py-1 text-sm bg-accent text-white rounded font-bold">Analyze</button>
                </div>
            </div>
        )}

        <div className="flex flex-row w-full gap-2 items-stretch justify-center">
            {/* Eval Bar */}
            <div className="shrink-0">
                <EvaluationBar score={engineState.evaluation} mate={engineState.mate} />
            </div>

            {/* Board */}
            <div className="flex-1 max-w-[600px]">
                <ChessBoard 
                    fen={state.currentFen} 
                    lastMove={lastMove} 
                    flipped={state.flipped}
                />
            </div>
        </div>

        {/* Controls */}
        <div className="flex w-full max-w-[600px] justify-between items-center bg-uiDark p-2 rounded border border-gray-700">
            <button onClick={() => dispatch({type: 'FLIP_BOARD'})} className="p-2 text-gray-400 hover:text-white" title="Flip Board">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 12v5h16a2 2 0 0 1 0 4H5v-4"/></svg>
            </button>
            <div className="flex gap-1">
                <button onClick={handleStart} disabled={state.currentMoveIndex === -1} className="p-3 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                </button>
                <button onClick={handlePrev} disabled={state.currentMoveIndex === -1} className="p-3 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="15 18 9 12 15 6 15 18"></polygon></svg>
                </button>
                <button onClick={handleNext} disabled={state.currentMoveIndex >= state.moves.length - 1} className="p-3 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="9 18 15 12 9 6 9 18"></polygon></svg>
                </button>
                <button onClick={handleEnd} disabled={state.currentMoveIndex >= state.moves.length - 1} className="p-3 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                </button>
            </div>
            <div className="w-8"></div> {/* Spacer balance */}
        </div>
      </div>

      {/* --- Right Column: Analysis & Moves --- */}
      <div className="flex flex-col gap-4 lg:w-1/3 h-full min-h-[400px]">
         {/* Header (Desktop) */}
         <div className="hidden lg:flex justify-between items-center bg-uiDark p-3 rounded border border-gray-700">
             <div>
                <h1 className="font-bold text-gray-200">Analysis Board</h1>
                <p className="text-xs text-gray-500">{getMetadata()}</p>
             </div>
             <button onClick={() => setShowPgnInput(!showPgnInput)} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition">Input PGN</button>
        </div>

        <AnalysisPanel engineState={engineState} />

        <MoveList 
            moves={state.moves} 
            currentMoveIndex={state.currentMoveIndex}
            onMoveClick={(idx) => dispatch({ type: 'GO_TO_MOVE', index: idx })} 
        />
      </div>

    </div>
  );
};

export default App;