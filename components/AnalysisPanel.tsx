import React from 'react';
import { EngineState } from '../types';

interface AnalysisPanelProps {
  engineState: EngineState;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ engineState }) => {
  const { isAnalyzing, bestLine, evaluation, mate } = engineState;

  const getEvalText = () => {
    if (mate !== null) return `Mate in ${Math.abs(mate)}`;
    const sign = evaluation > 0 ? '+' : '';
    return `${sign}${(evaluation / 100).toFixed(2)}`;
  };

  const getBackgroundColor = () => {
      if (mate !== null) return mate > 0 ? 'text-green-400' : 'text-red-400';
      if (evaluation > 50) return 'text-green-400';
      if (evaluation < -50) return 'text-red-400';
      return 'text-gray-200';
  };

  return (
    <div className="bg-uiDark p-4 rounded-lg border border-gray-700 shadow-sm mt-4 md:mt-0">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Stockfish 10 (WASM)
        </h3>
        {isAnalyzing && (
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-xs text-accent">Thinking...</span>
            </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Top Stats */}
        <div className="flex items-baseline space-x-4">
            <div className="text-xs text-gray-500">Evaluation:</div>
            <div className={`text-2xl font-mono font-bold ${getBackgroundColor()}`}>
                {getEvalText()}
            </div>
        </div>

        {/* Best Line */}
        <div>
            <div className="text-xs text-gray-500 mb-1">Best Line:</div>
            <div className="bg-uiDarker p-2 rounded text-sm text-gray-300 font-mono leading-relaxed break-words min-h-[3rem]">
                {bestLine.length > 0 ? (
                    bestLine.map((move, i) => (
                        <span key={i} className="mr-2 hover:text-white cursor-default">
                            {move}
                        </span>
                    ))
                ) : (
                    <span className="text-gray-600 italic">Waiting for engine...</span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;