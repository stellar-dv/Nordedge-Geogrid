import React from 'react';
import { useGridContext } from '@/contexts/GridContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export function GridConfig() {
  const { config, updateConfig, error, isLoading } = useGridContext();

  const handleSizeChange = (value: string) => {
    const size = parseInt(value);
    updateConfig({ size });
  };

  const handleDistanceChange = (value: string) => {
    const distance = parseFloat(value);
    updateConfig({ distance });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Grid Configuration</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Configure the size and coverage area of your search grid</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grid-size">Grid Size</Label>
        <Select value={config.size.toString()} onValueChange={handleSizeChange}>
          <SelectTrigger id="grid-size">
            <SelectValue placeholder="Select grid size" />
          </SelectTrigger>
          <SelectContent>
            {[3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}x{size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grid-distance">Distance Between Points (km)</Label>
        <Select value={config.distance.toString()} onValueChange={handleDistanceChange}>
          <SelectTrigger id="grid-distance">
            <SelectValue placeholder="Select distance" />
          </SelectTrigger>
          <SelectContent>
            {[0.1, 0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20, 25].map((distance) => (
              <SelectItem key={distance} value={distance.toString()}>
                {distance} km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="p-2 text-sm text-red-500 bg-red-50 rounded">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="p-2 text-sm text-blue-500 bg-blue-50 rounded">
          Updating grid...
        </div>
      )}
    </div>
  );
} 