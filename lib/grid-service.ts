import { debounce } from 'lodash';

export interface GridPoint {
  lat: number;
  lng: number;
  rank?: number;
}

export interface GridConfig {
  size: number;
  distance: number;
  center: { lat: number; lng: number };
}

export interface GridMetrics {
  averageRank: number;
  top20AverageRank: number;
  visibilityPercentage: number;
}

export class GridService {
  private static EARTH_RADIUS = 111.32; // km per degree at equator

  // Calculate grid points with memoization
  private static calculateGridPoints = debounce((config: GridConfig): GridPoint[] => {
    const { size, distance, center } = config;
    const points: GridPoint[] = [];
    const offset = ((size - 1) / 2) * (distance / this.EARTH_RADIUS);

    // Calculate bounds
    const centerLat = center.lat;
    const centerLng = center.lng;
    const north = centerLat + offset;
    const south = centerLat - offset;
    const east = centerLng + offset / Math.cos(centerLat * Math.PI / 180);
    const west = centerLng - offset / Math.cos(centerLat * Math.PI / 180);

    // Create grid points
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === Math.floor(size / 2) && j === Math.floor(size / 2)) continue; // Skip center

        const lat = south + (i * (north - south) / (size - 1));
        const lng = west + (j * (east - west) / (size - 1));

        points.push({ lat, lng });
      }
    }

    // Insert center point
    points.splice(Math.floor(size * size / 2), 0, { ...center });

    return points;
  }, 100);

  // Calculate grid metrics
  public static calculateMetrics(points: GridPoint[]): GridMetrics {
    const ranks = points.map(p => p.rank || 0).filter(r => r > 0);
    const top20Ranks = ranks.filter(r => r <= 20);
    
    return {
      averageRank: ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0,
      top20AverageRank: top20Ranks.length > 0 ? top20Ranks.reduce((a, b) => a + b, 0) / top20Ranks.length : 0,
      visibilityPercentage: ranks.length > 0 ? (ranks.filter(r => r <= 3).length / ranks.length) * 100 : 0
    };
  }

  // Validate grid configuration
  public static validateConfig(config: GridConfig): string | null {
    if (config.size < 3 || config.size > 25 || config.size % 2 === 0) {
      return 'Grid size must be an odd number between 3 and 25';
    }
    if (config.distance < 0.1 || config.distance > 25) {
      return 'Distance must be between 0.1 and 25 kilometers';
    }
    if (!config.center || typeof config.center.lat !== 'number' || typeof config.center.lng !== 'number') {
      return 'Invalid center coordinates';
    }
    return null;
  }

  // Get grid points for a configuration
  public static getGridPoints(config: GridConfig): GridPoint[] {
    const error = this.validateConfig(config);
    if (error) {
      throw new Error(error);
    }
    const points = this.calculateGridPoints(config);
    if (!points) {
      throw new Error('Failed to generate grid points');
    }
    return points;
  }

  // Calculate total coverage area
  public static getCoverageArea(config: GridConfig): { width: number; height: number } {
    const { size, distance } = config;
    const totalDistance = (size - 1) * distance;
    return {
      width: totalDistance,
      height: totalDistance
    };
  }
} 