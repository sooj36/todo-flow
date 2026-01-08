// LocalStorage key for node positions
const NODE_POSITIONS_KEY = 'flowboard-node-positions';

// Load node positions from localStorage
export function loadNodePositions(): Record<string, { x: number; y: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(NODE_POSITIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save node positions to localStorage
export function saveNodePositions(positions: Record<string, { x: number; y: number }>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NODE_POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    // Ignore localStorage errors
  }
}
