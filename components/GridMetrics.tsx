import React from 'react';
import { useGridContext } from '@/contexts/GridContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export function GridMetrics() {
  const { metrics, getCoverageArea } = useGridContext();
  const coverage = getCoverageArea();

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Grid Metrics</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Key metrics for your grid search</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Average Rank</p>
          <p className="text-2xl font-semibold">{metrics.averageRank.toFixed(1)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Top 20 Average</p>
          <p className="text-2xl font-semibold">{metrics.top20AverageRank.toFixed(1)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Visibility %</p>
          <p className="text-2xl font-semibold">{metrics.visibilityPercentage.toFixed(1)}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Coverage Area</p>
          <p className="text-2xl font-semibold">
            {coverage.width.toFixed(1)}km × {coverage.height.toFixed(1)}km
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 