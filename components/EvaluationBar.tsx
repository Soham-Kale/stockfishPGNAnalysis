import React from 'react';

interface EvaluationBarProps {
  score: number; // centipawns
  mate: number | null;
}

const EvaluationBar: React.FC<EvaluationBarProps> = ({ score, mate }) => {
  // Normalize score for display. Cap at +10/-10 equivalent (1000cp)
  // White advantage moves bar up (more white).
  
  let percentage = 50;

  if (mate !== null) {
    // If mate, bar goes full white or full black
    percentage = mate > 0 ? 100 : 0;
  } else {
    // Sigmoid-like clamping for better visualization of small advantages
    // Simple linear clamp for now: -1000 to 1000 map to 0% to 100%
    const clampedScore = Math.max(-1000, Math.min(1000, score));
    percentage = 50 + (clampedScore / 20); // 1000 / 20 = 50. 50+50=100.
  }

  // Visual label
  let label = "";
  if (mate !== null) {
    label = `M${Math.abs(mate)}`;
  } else {
    const evalNum = (score / 100).toFixed(1);
    label = score > 0 ? `+${evalNum}` : `${evalNum}`;
  }

  return (
    <div className="h-12 w-full flex flex-row md:h-full md:w-8 bg-gray-700 rounded overflow-hidden relative border border-gray-600">
      {/* Mobile: Horizontal Bar */}
      <div className="flex md:hidden w-full h-full relative">
         <div 
            className="h-full bg-white transition-all duration-500 ease-in-out" 
            style={{ width: `${percentage}%` }}
         />
         <div 
            className="h-full bg-black transition-all duration-500 ease-in-out flex-1"
         />
         <span className="absolute inset-0 flex items-center justify-center text-xs font-bold mix-blend-difference text-gray-400">
            {label}
         </span>
      </div>

      {/* Desktop: Vertical Bar */}
      <div className="hidden md:flex flex-col w-full h-full relative">
        <div 
            className="w-full bg-black transition-all duration-500 ease-in-out flex-1"
        />
        <div 
            className="w-full bg-white transition-all duration-500 ease-in-out" 
            style={{ height: `${percentage}%` }}
        />
        <span className="absolute top-2 w-full text-center text-[10px] font-bold text-gray-400 mix-blend-difference z-10">
          {mate && mate < 0 ? label : ''}
          {!mate && score < 0 ? label : ''}
        </span>
         <span className="absolute bottom-2 w-full text-center text-[10px] font-bold text-gray-500 mix-blend-difference z-10">
          {mate && mate > 0 ? label : ''}
          {!mate && score >= 0 ? label : ''}
        </span>
      </div>
    </div>
  );
};

export default EvaluationBar;