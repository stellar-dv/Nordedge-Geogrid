export interface KeywordMetrics {
  totalRankings: number;
  topThreeCount: number;
  topTenCount: number;
  notRankedCount: number;
  top3Percentage: number;
  top10Percentage: number;
  otherPercentage: number;
  averageRanking: number;
  visibilityScore: number;
}

export class KeywordMetricsCalculator {
  /**
   * Calculates metrics for keyword rankings
   * @param rankings Array of rankings (can be 1D or 2D array)
   * @returns KeywordMetrics object with counts and percentages
   */
  static calculate(rankings: number[] | number[][]): KeywordMetrics {
    // Flatten the array if it's 2D
    const flatRankings = Array.isArray(rankings[0]) 
      ? (rankings as number[][]).flat() 
      : (rankings as number[]);
    
    const totalRankings = flatRankings.length;
    const topThreeCount = flatRankings.filter(r => r > 0 && r <= 3).length;
    const topTenCount = flatRankings.filter(r => r > 0 && r <= 10).length;
    const notRankedCount = flatRankings.filter(r => r === 0 || r > 10).length;
    
    // Calculate percentages
    const top3Percentage = totalRankings > 0 
      ? (topThreeCount / totalRankings) * 100 
      : 0;
    
    const top10Percentage = totalRankings > 0 
      ? ((topTenCount - topThreeCount) / totalRankings) * 100 
      : 0;
    
    const otherPercentage = totalRankings > 0 
      ? (notRankedCount / totalRankings) * 100 
      : 0;
    
    // Calculate average ranking and visibility score
    let rankingSum = 0;
    const rankedPoints = flatRankings.filter(r => r > 0).length;
    
    flatRankings.forEach(ranking => {
      if (ranking > 0) {
        rankingSum += ranking;
      }
    });
    
    const averageRanking = rankedPoints > 0 ? rankingSum / rankedPoints : 0;
    const visibilityScore = totalRankings > 0 ? (topTenCount / totalRankings) * 100 : 0;
    
    return {
      totalRankings,
      topThreeCount,
      topTenCount,
      notRankedCount,
      top3Percentage,
      top10Percentage,
      otherPercentage,
      averageRanking: Number.parseFloat(averageRanking.toFixed(2)),
      visibilityScore: Number.parseFloat(visibilityScore.toFixed(2))
    };
  }
} 