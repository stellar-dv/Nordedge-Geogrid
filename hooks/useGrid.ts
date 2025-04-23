import { useState, useCallback, useEffect } from 'react';
import { GridService, GridPoint, GridConfig, GridMetrics } from '@/lib/grid-service';

export function useGrid(initialConfig: GridConfig) {
  const [config, setConfig] = useState<GridConfig>(initialConfig);
  const [points, setPoints] = useState<GridPoint[]>([]);
  const [metrics, setMetrics] = useState<GridMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update grid points when config changes
  useEffect(() => {
    const updateGrid = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const newPoints = GridService.getGridPoints(config);
        setPoints(newPoints);
        setMetrics(GridService.calculateMetrics(newPoints));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update grid');
      } finally {
        setIsLoading(false);
      }
    };

    updateGrid();
  }, [config]);

  // Update grid configuration
  const updateConfig = useCallback((newConfig: Partial<GridConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Update point rank
  const updatePointRank = useCallback((index: number, rank: number) => {
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = { ...newPoints[index], rank };
      return newPoints;
    });
  }, []);

  // Reset grid
  const resetGrid = useCallback(() => {
    setConfig(initialConfig);
    setPoints([]);
    setMetrics(null);
    setError(null);
  }, [initialConfig]);

  // Get coverage area
  const getCoverageArea = useCallback(() => {
    return GridService.getCoverageArea(config);
  }, [config]);

  return {
    config,
    points,
    metrics,
    error,
    isLoading,
    updateConfig,
    updatePointRank,
    resetGrid,
    getCoverageArea
  };
} 