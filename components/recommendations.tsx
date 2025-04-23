"use client"

import React from "react"
import { useState } from "react"
import type { BusinessInfo, RankingData } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { calculateKeywordMetrics } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Calendar, FileText, Star, Search, MapPin, TrendingUp, BarChart3 } from "lucide-react"
import { KeywordMetricsCalculator, KeywordMetrics } from "@/lib/keyword-metrics"
import { ChartContainer, ChartTooltip, ChartLegend, ChartSummary, ChartTitle } from "@/components/ui/chart"
import { ArrowRight } from "lucide-react"

interface RecommendationsProps {
  businessInfo: BusinessInfo
  rankingData: RankingData
}

export default function Recommendations({ businessInfo, rankingData }: RecommendationsProps) {
  const [activeTab, setActiveTab] = useState("content")

  // Calculate overall metrics across all keywords
  const calculateOverallMetrics = () => {
    const allKeywordsMetrics = businessInfo.keywords
      .map((keyword) => (rankingData[keyword] ? calculateKeywordMetrics(rankingData[keyword]) : null))
      .filter((metrics) => metrics !== null) as Array<NonNullable<ReturnType<typeof calculateKeywordMetrics>>>

    if (allKeywordsMetrics.length === 0) return null

    // Calculate average metrics across all keywords
    const avgRanking = allKeywordsMetrics.reduce((sum, m) => sum + m.averageRanking, 0) / allKeywordsMetrics.length
    
    // Sum up count metrics
    const topThreeCount = allKeywordsMetrics.reduce((sum, m) => sum + m.topThreeCount, 0);
    const topTenCount = allKeywordsMetrics.reduce((sum, m) => sum + m.topTenCount, 0);
    const notRankedCount = allKeywordsMetrics.reduce((sum, m) => sum + m.notRankedCount, 0);
    
    // Calculate percentages
    const top3Percentage = allKeywordsMetrics.reduce((sum, m) => {
      return sum + ((m.topThreeCount / m.totalRankings) * 100);
    }, 0) / allKeywordsMetrics.length;
    
    const otherPercentage = allKeywordsMetrics.reduce((sum, m) => {
      return sum + ((m.notRankedCount / m.totalRankings) * 100);
    }, 0) / allKeywordsMetrics.length;

    return {
      avgRanking,
      topThreeCount,
      topTenCount,
      notRankedCount,
      top3Percentage,
      otherPercentage,
    }
  }

  const overallMetrics = calculateOverallMetrics()

  // Determine weakest areas based on metrics
  const determineWeakAreas = () => {
    if (!overallMetrics) return []

    const weakAreas = []

    if (overallMetrics.top3Percentage < 30) {
      weakAreas.push("Low visibility in top 3 positions")
    }

    if (overallMetrics.otherPercentage > 40) {
      weakAreas.push("High percentage of rankings outside top 10")
    }

    if (overallMetrics.avgRanking > 7) {
      weakAreas.push("Overall average ranking needs improvement")
    }

    return weakAreas
  }

  const weakAreas = determineWeakAreas()

  // Create a properly typed KeywordMetrics object using calculator
  const allKeywordsRankings = businessInfo.keywords
    .flatMap(keyword => rankingData[keyword] || [])
    .flat()
    .filter(ranking => ranking > 0);
    
  const metrics: KeywordMetrics = KeywordMetricsCalculator.calculate(allKeywordsRankings);

  if (!metrics) {
    return (
      <div className="lv-card p-6 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">No Data Available</h3>
        <p className="text-slate-600">We don&apos;t have enough ranking data for &quot;{businessInfo.keywords[0]}&quot; yet.</p>
      </div>
    )
  }

  const top3Percentage = metrics.totalRankings > 0 
    ? (metrics.topThreeCount / metrics.totalRankings) * 100 
    : 0

  const top10Percentage = metrics.totalRankings > 0 
    ? ((metrics.topTenCount - metrics.topThreeCount) / metrics.totalRankings) * 100 
    : 0

  const otherPercentage = metrics.totalRankings > 0 
    ? (metrics.notRankedCount / metrics.totalRankings) * 100 
    : 0

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-primary text-white py-6 px-6">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <CardTitle>Search Visibility for &quot;{businessInfo.keywords[0]}&quot;</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="summary" className="w-full">
            <div className="border-b border-slate-200">
              <TabsList className="bg-slate-50 p-0 h-12">
                <TabsTrigger 
                  value="summary"
                  className="lv-tab h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="lv-tab h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Details
                </TabsTrigger>
            </TabsList>
            </div>

            <TabsContent value="summary" className="p-6 mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <ChartContainer className="aspect-square">
                    <ChartTitle>Ranking Distribution</ChartTitle>
                    <div className="relative flex items-center justify-center h-full">
                      <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{metrics.visibilityScore.toFixed(1)}%</span>
                          <span className="text-xs text-slate-500">Visibility</span>
                </div>
              </div>

                      <div className="absolute inset-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                          {/* Top 3 segment */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="20"
                            strokeDasharray={`${top3Percentage * 2.51} ${100 * 2.51 - top3Percentage * 2.51}`}
                            className="drop-shadow-lg"
                          />
                          
                          {/* Top 4-10 segment */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#06B6D4"
                            strokeWidth="20"
                            strokeDasharray={`${top10Percentage * 2.51} ${100 * 2.51 - top10Percentage * 2.51}`}
                            strokeDashoffset={`${-(top3Percentage * 2.51)}`}
                            className="drop-shadow-sm"
                          />
                          
                          {/* Not ranked in top 10 */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#F43F5E"
                            strokeWidth="20"
                            strokeDasharray={`${otherPercentage * 2.51} ${100 * 2.51 - otherPercentage * 2.51}`}
                            strokeDashoffset={`${-((top3Percentage + top10Percentage) * 2.51)}`}
                          />
                        </svg>
                  </div>
                </div>

                    <ChartLegend className="mt-4 grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Top 3 <span className="text-slate-500">({top3Percentage.toFixed(0)}%)</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        <span className="text-sm">4-10 <span className="text-slate-500">({top10Percentage.toFixed(0)}%)</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-pink-600"></div>
                        <span className="text-sm">10+ <span className="text-slate-500">({otherPercentage.toFixed(0)}%)</span></span>
                  </div>
                    </ChartLegend>
                  </ChartContainer>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-3 flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="lv-stat-card">
                        <p className="text-xs text-slate-500 mb-1">Average Position</p>
                        <p className="text-2xl font-bold text-primary">
                          {metrics.averageRanking.toFixed(1)}
                        </p>
                  </div>
                      <div className="lv-stat-card">
                        <p className="text-xs text-slate-500 mb-1">Visibility Score</p>
                        <p className="text-2xl font-bold text-secondary">
                          {metrics.visibilityScore.toFixed(1)}%
                  </p>
                </div>
                  </div>
                </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-3 flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" />
                      What&apos;s Working Well
                    </h3>
                    <div className="lv-card p-4 bg-emerald-50 border-emerald-100">
                      <ul className="space-y-2">
                        {metrics.topThreeCount > 0 && (
                          <li className="flex items-start space-x-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">
                              Your business appears in the top 3 for this keyword in {metrics.topThreeCount} locations ({top3Percentage.toFixed(0)}% of searched areas)
                            </span>
                          </li>
                        )}
                        {metrics.visibilityScore > 50 && (
                          <li className="flex items-start space-x-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">
                              Good visibility score of {metrics.visibilityScore.toFixed(1)}% indicates strong overall presence
                            </span>
                          </li>
                        )}
                        {metrics.averageRanking <= 7 && (
                          <li className="flex items-start space-x-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">
                              Average ranking position of {metrics.averageRanking.toFixed(1)} is competitive
                            </span>
                          </li>
                        )}
                    </ul>
                  </div>
                </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-3 flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                      Areas for Improvement
                    </h3>
                    <div className="lv-card p-4 bg-amber-50 border-amber-100">
                      <ul className="space-y-2">
                        {metrics.notRankedCount > metrics.topThreeCount && (
                          <li className="flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">
                              Your business doesn&apos;t appear in top results for {metrics.notRankedCount} locations ({otherPercentage.toFixed(0)}% of searched areas)
                            </span>
                          </li>
                        )}
                        {metrics.visibilityScore < 50 && (
                          <li className="flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">
                              Visibility score of {metrics.visibilityScore.toFixed(1)}% indicates room for improvement
                            </span>
                          </li>
                        )}
                        {metrics.averageRanking > 7 && (
                          <li className="flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">
                              Average ranking position of {metrics.averageRanking.toFixed(1)} could be improved
                            </span>
                          </li>
                        )}
                    </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="p-6 mt-0">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-primary" />
                  Geographic Distribution
                </h3>
                
                <div className="lv-card p-5">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="lv-stat-card bg-blue-50 border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-blue-700">Positions #1-3</p>
                        <span className="lv-badge lv-badge-primary">{metrics.topThreeCount}</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{top3Percentage.toFixed(1)}%</p>
                      <div className="mt-2">
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${top3Percentage}%` }} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="lv-stat-card bg-cyan-50 border-cyan-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-cyan-700">Positions #4-10</p>
                        <span className="lv-badge lv-badge-secondary">{metrics.topTenCount - metrics.topThreeCount}</span>
                      </div>
                      <p className="text-2xl font-bold text-cyan-700">{top10Percentage.toFixed(1)}%</p>
                      <div className="mt-2">
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${top10Percentage}%` }} />
                        </div>
                </div>
              </div>

                    <div className="lv-stat-card bg-pink-50 border-pink-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-pink-700">Not in Top 10</p>
                        <span className="lv-badge lv-badge-danger">{metrics.notRankedCount}</span>
                      </div>
                      <p className="text-2xl font-bold text-pink-700">{otherPercentage.toFixed(1)}%</p>
                      <div className="mt-2">
                        <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-pink-600" style={{ width: `${otherPercentage}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="lv-card p-5">
                    <h4 className="text-base font-medium text-slate-800 mb-4 flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                      Ranking Summary
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Total Grid Points</p>
                          <p className="text-2xl font-bold text-slate-900">{metrics.totalRankings}</p>
                        </div>
                  <div>
                          <p className="text-xs text-slate-500 mb-1">Detected Rankings</p>
                          <p className="text-2xl font-bold text-slate-900">{metrics.totalRankings - metrics.notRankedCount}</p>
                  </div>
                </div>

                  <div>
                        <p className="text-xs text-slate-500 mb-1">Ranking Distribution</p>
                        <div className="mt-2">
                          <div className="lv-progress-bar">
                            <div className="flex h-full">
                              <div className="lv-progress-bar-fill bg-blue-500" style={{ width: `${top3Percentage}%` }} />
                              <div className="lv-progress-bar-fill bg-cyan-500" style={{ width: `${top10Percentage}%` }} />
                              <div className="lv-progress-bar-fill bg-pink-600" style={{ width: `${otherPercentage}%` }} />
                  </div>
                </div>
              </div>
                </div>
              </div>
                  </div>
                  
                  <div className="lv-card p-5">
                    <h4 className="text-base font-medium text-slate-800 mb-4 flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                      Next Steps
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm flex-shrink-0">
                          1
                </div>
                  <div>
                          <p className="text-sm font-medium text-slate-800">Review your Google Business Profile</p>
                          <p className="text-xs text-slate-600 mt-1">Ensure all information is accurate and up-to-date</p>
                  </div>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm flex-shrink-0">
                          2
                </div>
                  <div>
                          <p className="text-sm font-medium text-slate-800">Generate more reviews</p>
                          <p className="text-xs text-slate-600 mt-1">Actively request and respond to customer reviews</p>
                  </div>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm flex-shrink-0">
                          3
                </div>
                  <div>
                          <p className="text-sm font-medium text-slate-800">Optimize content for this keyword</p>
                          <p className="text-xs text-slate-600 mt-1">Add relevant content to your website and listings</p>
                        </div>
                      </li>
                    </ul>
                    <button className="lv-button-secondary w-full mt-4 flex items-center justify-center">
                      <span>Get Custom Recommendations</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
