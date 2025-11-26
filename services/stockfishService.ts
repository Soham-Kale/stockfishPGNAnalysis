import { EngineLine, EngineState } from '../types';
import { STOCKFISH_SCRIPT_URL } from '../constants';

type EngineUpdateCallback = (state: Partial<EngineState>) => void;

class StockfishService {
  private worker: Worker | null = null;
  private onUpdate: EngineUpdateCallback | null = null;
  private isReady: boolean = false;

  constructor(onUpdate: EngineUpdateCallback) {
    this.onUpdate = onUpdate;
  }

  public async init() {
    if (this.worker) return;

    try {
      // Create a blob from the script URL to bypass some CORS/MIME issues in certain environments
      // For this implementation, we will try to fetch the script and create a local blob
      const response = await fetch(STOCKFISH_SCRIPT_URL);
      const scriptContent = await response.text();
      const blob = new Blob([scriptContent], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => this.handleMessage(e.data);
      
      // Initialize UCI mode
      this.worker.postMessage('uci');
    } catch (err) {
      console.error("Failed to load Stockfish:", err);
      // Fallback or error handling
    }
  }

  private handleMessage(data: string) {
    // console.log("Engine:", data);

    if (data === 'uciok') {
      this.isReady = true;
      if (this.onUpdate) this.onUpdate({ isReady: true });
    }

    if (data.startsWith('info depth')) {
        this.parseInfoLine(data);
    }
  }

  private parseInfoLine(line: string) {
    const parts = line.split(' ');
    
    // Extract Depth
    const depthIdx = parts.indexOf('depth');
    const depth = depthIdx !== -1 ? parseInt(parts[depthIdx + 1]) : 0;

    // Extract Score
    let score = 0;
    let mate: number | null = null;
    const scoreIdx = parts.indexOf('score');
    if (scoreIdx !== -1) {
      const type = parts[scoreIdx + 1]; // cp or mate
      const val = parseInt(parts[scoreIdx + 2]);
      
      if (type === 'mate') {
        mate = val;
      } else {
        score = val;
      }
    }

    // Extract Multipv
    const multipvIdx = parts.indexOf('multipv');
    const multipv = multipvIdx !== -1 ? parseInt(parts[multipvIdx + 1]) : 1;

    // Extract PV (Best Line)
    const pvIdx = parts.indexOf('pv');
    let pv = '';
    if (pvIdx !== -1) {
      pv = parts.slice(pvIdx + 1).join(' ');
    }

    // Update State
    if (this.onUpdate) {
        // If it's the primary line (multipv 1), update main stats
        const engineLine: EngineLine = { depth, score, mate, pv, multipv };
        
        if (multipv === 1) {
             this.onUpdate({ 
                evaluation: score, 
                mate: mate, 
                bestLine: pv.split(' '),
                isAnalyzing: true 
            });
        }
        
        // We could store multiple lines here if we implemented multi-pv logic fully
        // For now, just passing the main line update
    }
  }

  public analyzePosition(fen: string, depth: number = 20) {
    if (!this.worker || !this.isReady) return;

    this.stop();
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${depth}`);
    
    if (this.onUpdate) this.onUpdate({ isAnalyzing: true });
  }

  public stop() {
    if (this.worker) {
      this.worker.postMessage('stop');
      if (this.onUpdate) this.onUpdate({ isAnalyzing: false });
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export default StockfishService;