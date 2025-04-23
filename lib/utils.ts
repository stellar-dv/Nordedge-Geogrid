import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { MapCenter, GridPoint } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to generate grid points around a center point
export function generateGridPoints(center: MapCenter, gridSize: number, distanceKm: number): GridPoint[] {
  // Validate inputs
  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number' ||
      isNaN(center.lat) || isNaN(center.lng)) {
    console.error('Invalid center point:', center);
    throw new Error('Invalid center coordinates for grid generation');
  }
  
  if (!gridSize || isNaN(gridSize) || gridSize < 1) {
    console.error('Invalid grid size:', gridSize);
    throw new Error('Grid size must be a positive number');
  }
  
  if (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) {
    console.error('Invalid distance:', distanceKm);
    throw new Error('Distance must be a positive number');
  }

  const points: GridPoint[] = []

  // Earth's radius in kilometers
  const earthRadius = 6371

  // Convert distance to radians
  const distanceRadians = distanceKm / earthRadius

  // Calculate the step size for the grid
  const step = (2 * distanceRadians) / (gridSize - 1)

  // Convert center coordinates to radians
  const centerLatRad = (center.lat * Math.PI) / 180
  const centerLngRad = (center.lng * Math.PI) / 180

  // Generate grid points
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      try {
        // Calculate offset from center
        const latOffset = -distanceRadians + i * step
        const lngOffset = -distanceRadians + j * step

        // Calculate new coordinates
        const newLatRad = centerLatRad + latOffset
        const newLngRad = centerLngRad + lngOffset / Math.cos(centerLatRad)

        // Convert back to degrees
        const newLat = (newLatRad * 180) / Math.PI
        const newLng = (newLngRad * 180) / Math.PI
        
        // Validate coordinates are within valid bounds
        const validLat = Math.max(-90, Math.min(90, newLat));
        const validLng = ((newLng + 540) % 360) - 180; // Normalize to -180 to 180
        
        // Ensure coordinates are numbers
        if (isNaN(validLat) || isNaN(validLng)) {
          console.warn(`Generated invalid point at grid position [${i},${j}], skipping`);
          continue;
        }

        points.push({ 
          lat: Number(validLat.toFixed(7)),  // Limit precision to 7 decimal places
          lng: Number(validLng.toFixed(7))
        })
      } catch (error) {
        console.error(`Error generating grid point at [${i},${j}]:`, error);
        // Continue to next point
      }
    }
  }
  
  // Make sure we have points
  if (points.length === 0) {
    throw new Error('Failed to generate any valid grid points');
  }

  console.log(`Generated ${points.length} grid points for ${gridSize}x${gridSize} grid`);
  return points
}

// Format number with commas and optional decimal places
export function formatNumber(value: number, decimalPlaces = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })
}

// Calculate keyword metrics for grid search results
export function calculateKeywordMetrics(gridResults: number[][]): {
  totalRankings: number;
  averageRanking: number;
  visibilityScore: number;
  topThreeCount: number;
  topTenCount: number;
  notRankedCount: number;
  top3Percentage: number;
  top10Percentage: number;
  otherPercentage: number;
} {
  if (!gridResults || gridResults.length === 0) {
    return {
      totalRankings: 0,
      averageRanking: 0,
      visibilityScore: 0,
      topThreeCount: 0,
      topTenCount: 0,
      notRankedCount: 0,
      top3Percentage: 0,
      top10Percentage: 0,
      otherPercentage: 0,
    }
  }

  // Count total rankings and calculate sum for average
  let rankingSum = 0
  let topThreeCount = 0
  let topTenCount = 0
  let notRankedCount = 0
  let totalPoints = 0

  gridResults.forEach(row => {
    row.forEach(ranking => {
      totalPoints++

    // Skip points with no ranking in calculations
      if (ranking === 0) {
      notRankedCount++
      return
    }

    rankingSum += ranking

    if (ranking <= 3) {
      topThreeCount++
    }

    if (ranking <= 10) {
      topTenCount++
    }
    })
  })

  // Calculate metrics
  const rankedPoints = totalPoints - notRankedCount
  const averageRanking = rankedPoints > 0 ? rankingSum / rankedPoints : 0

  // Visibility score: percentage of points where business appears in top 10
  const visibilityScore = totalPoints > 0 ? (topTenCount / totalPoints) * 100 : 0

  // Calculate percentages
  const top3Percentage = totalPoints > 0 ? (topThreeCount / totalPoints) * 100 : 0;
  const top10Percentage = totalPoints > 0 ? ((topTenCount - topThreeCount) / totalPoints) * 100 : 0;
  const otherPercentage = totalPoints > 0 ? (notRankedCount / totalPoints) * 100 : 0;

  return {
    totalRankings: rankedPoints,
    averageRanking: Number.parseFloat(averageRanking.toFixed(2)),
    visibilityScore: Number.parseFloat(visibilityScore.toFixed(2)),
    topThreeCount,
    topTenCount,
    notRankedCount,
    top3Percentage: Number.parseFloat(top3Percentage.toFixed(2)),
    top10Percentage: Number.parseFloat(top10Percentage.toFixed(2)),
    otherPercentage: Number.parseFloat(otherPercentage.toFixed(2)),
  }
}
