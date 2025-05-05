import React, { createContext, useContext, useMemo } from 'react';
import { useGrid } from '@/hooks/useGrid';
import { GridConfig } from '@/lib/grid-service';

interface GridContextType {
  config: GridConfig;
  points: any[];
  metrics: any;
  error: string | null;
  isLoading: boolean;
  updateConfig: (config: Partial<GridConfig>) => void;
  updatePointRank: (index: number, rank: number) => void;
  resetGrid: () => void;
  getCoverageArea: () => { width: number; height: number };
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export function GridProvider({ children, initialConfig }: { children: React.ReactNode; initialConfig: GridConfig }) {
  const grid = useGrid(initialConfig);

  const value = useMemo(() => grid, [grid]);

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  );
}

export function useGridContext() {
  const context = useContext(GridContext);
  if (context === undefined) {
    throw new Error('useGridContext must be used within a GridProvider');
  }
  return context;
} 