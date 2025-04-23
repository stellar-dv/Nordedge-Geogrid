"use client"

import { useState } from "react"
import type { BusinessInfo, RankingData } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { calculateKeywordMetrics } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
// @ts-ignore
import { ResponsiveBar } from "@nivo/bar"
import { KeywordMetricsCalculator, KeywordMetrics } from "@/lib/keyword-metrics"

// Type for chart data
interface ChartData {
  color: string;
  position: string;
  value: number;
  percentage: string;
}

interface KeywordComparisonProps {
  businessInfo: BusinessInfo
  rankingData: RankingData
}

export function KeywordComparison({ businessInfo, rankingData }: KeywordComparisonProps) {
  const [activeView, setActiveView] = useState("overview")

  // Calculate metrics for each keyword
  const keywordMetrics = businessInfo.keywords
    .map((keyword) => {
      const rankings = rankingData[keyword];
      // Use KeywordMetricsCalculator instead of calculateKeywordMetrics
      const metrics = rankings ? KeywordMetricsCalculator.calculate(rankings) : null;

      return {
        keyword,
        metrics,
      }
    })
    .filter((item) => item.metrics !== null)

  // Sort keywords by average ranking (best to worst)
  const sortedKeywords = [...keywordMetrics].sort((a, b) => {
    if (!a.metrics) return 1
    if (!b.metrics) return -1
    return a.metrics.averageRanking - b.metrics.averageRanking
  })

  // Prepare data for bar chart
  const barChartData = sortedKeywords
    .filter((k) => k.metrics)
    .map((k) => {
      return {
      name: k.keyword,
        averageRanking: k.metrics!.averageRanking,
      top3: k.metrics!.top3Percentage,
      top10: k.metrics!.top10Percentage,
      other: k.metrics!.otherPercentage,
      }
    })

  // Prepare data for distribution chart
  const distributionData = sortedKeywords
    .filter((k) => k.metrics)
    .map((k) => ({
      name: k.keyword,
      "Top 3": k.metrics!.topThreeCount,
      "Positions 4-10": k.metrics!.topTenCount - k.metrics!.topThreeCount,
      "Below Top 10": k.metrics!.notRankedCount,
    }))

  // Get color for ranking
  const getRankingColor = (ranking: number) => {
    if (ranking <= 3) return "#0891b2" // cyan-600
    if (ranking <= 7) return "#0ea5e9" // sky-500
    if (ranking <= 10) return "#f59e0b" // amber-500
    if (ranking <= 15) return "#f97316" // orange-500
    return "#ef4444" // red-500
  }

  // Use the first keyword's metrics for the chart
  const metrics = sortedKeywords.length > 0 ? sortedKeywords[0].metrics! : null;

  const data: ChartData[] = metrics ? [
    {
      position: "1-3",
      value: metrics.topThreeCount,
      percentage: metrics.top3Percentage.toFixed(1),
      color: "hsl(var(--primary))",
    },
    {
      position: "4-10",
      value: metrics.topTenCount - metrics.topThreeCount,
      percentage: metrics.top10Percentage.toFixed(1),
      color: "hsl(var(--secondary))",
    },
    {
      position: "Not Ranked",
      value: metrics.notRankedCount,
      percentage: metrics.otherPercentage.toFixed(1),
      color: "hsl(var(--destructive))",
    },
  ] : [];

  return (
    <Card className="shadow-md overflow-hidden border-0">
      <CardHeader className="bg-primary text-white py-6 px-6">
        <CardTitle>Keyword Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeView} onValueChange={setActiveView} className="mt-2">
          <TabsList className="mb-6 bg-blue-50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">Ranking Overview</TabsTrigger>
            <TabsTrigger value="distribution" className="data-[state=active]:bg-primary data-[state=active]:text-white">Position Distribution</TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-primary data-[state=active]:text-white">Side-by-Side Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 20]}
                    reversed
                    label={{ value: "Average Ranking Position", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip
                    formatter={(value) => [`Position ${value}`, "Average Ranking"]}
                    labelFormatter={(value) => `Keyword: ${value}`}
                  />
                  <Legend />
                  <Bar dataKey="averageRanking" name="Average Ranking" fill="#8884d8">
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getRankingColor(entry.averageRanking)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-6 mt-8">
              <h3 className="text-lg font-medium text-blue-900">Keyword Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedKeywords.map((k, i) => {
                  if (!k.metrics) return null

                  return (
                    <div
                      key={k.keyword}
                      className="flex items-center space-x-3 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                          i === 0
                            ? "bg-primary"
                            : i === 1
                              ? "bg-secondary"
                              : i === 2
                                ? "bg-blue-500"
                                : "bg-slate-400"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">{k.keyword}</div>
                        <div className="text-sm text-slate-600">Avg. Position: {k.metrics.averageRanking.toFixed(1)}</div>
                      </div>
                      <div
                        className={`text-sm font-medium px-3 py-1 rounded-full ${
                          k.metrics.averageRanking <= 3
                            ? "bg-blue-100 text-blue-800"
                            : k.metrics.averageRanking <= 7
                              ? "bg-cyan-100 text-cyan-800"
                              : k.metrics.averageRanking <= 10
                                ? "bg-amber-100 text-amber-800"
                                : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {k.metrics.averageRanking <= 3
                          ? "Excellent"
                          : k.metrics.averageRanking <= 7
                            ? "Good"
                            : k.metrics.averageRanking <= 10
                              ? "Average"
                              : "Poor"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: "Number of Grid Points", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Top 3" stackId="a" fill="#0891b2" />
                  <Bar dataKey="Positions 4-10" stackId="a" fill="#0ea5e9" />
                  <Bar dataKey="Below Top 10" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-6 mt-8">
              <h3 className="text-lg font-medium text-blue-900">Position Distribution Analysis</h3>
              <p className="text-slate-600 mb-4">
                This chart shows how your rankings are distributed across different positions for each keyword. Keywords
                with more blue (Top 3) and cyan (Positions 4-10) have better visibility in search results.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sortedKeywords.slice(0, 3).map((k) => {
                  if (!k.metrics) return null;
                  
                  // Calculate percentages
                  const top3Percentage = k.metrics.totalRankings > 0 
                    ? (k.metrics.topThreeCount / k.metrics.totalRankings) * 100 
                    : 0;
                  
                  const top10Percentage = k.metrics.totalRankings > 0 
                    ? ((k.metrics.topTenCount - k.metrics.topThreeCount) / k.metrics.totalRankings) * 100 
                    : 0;
                  
                  const otherPercentage = k.metrics.totalRankings > 0 
                    ? (k.metrics.notRankedCount / k.metrics.totalRankings) * 100 
                    : 0;

                  return (
                    <div
                      key={k.keyword}
                      className="p-4 border rounded-lg bg-blue-50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="font-medium mb-2 text-blue-900">{k.keyword}</div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Top 3 positions:</span>
                          <span className="font-medium text-blue-800">
                            {top3Percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 mb-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${top3Percentage}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between">
                          <span>Positions 4-10:</span>
                          <span className="font-medium text-cyan-800">
                            {top10Percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 mb-1">
                          <div
                            className="bg-cyan-500 h-1.5 rounded-full"
                            style={{ width: `${top10Percentage}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between">
                          <span>Below top 10:</span>
                          <span className="font-medium text-red-700">
                            {otherPercentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 mb-1">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${otherPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-blue-100 p-2 text-left text-blue-900">Keyword</th>
                    <th className="border border-blue-100 p-2 text-center text-blue-900">Avg. Position</th>
                    <th className="border border-blue-100 p-2 text-center text-blue-900">Top 3 %</th>
                    <th className="border border-blue-100 p-2 text-center text-blue-900">Positions 4-10 %</th>
                    <th className="border border-blue-100 p-2 text-center text-blue-900">Below Top 10 %</th>
                    <th className="border border-blue-100 p-2 text-center text-blue-900">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedKeywords.map((k) => {
                    if (!k.metrics) return null

                    // Calculate percentages
                    const top3Percentage = k.metrics.totalRankings > 0 
                      ? (k.metrics.topThreeCount / k.metrics.totalRankings) * 100 
                      : 0;
                    
                    const top10Percentage = k.metrics.totalRankings > 0 
                      ? ((k.metrics.topTenCount - k.metrics.topThreeCount) / k.metrics.totalRankings) * 100 
                      : 0;
                    
                    const otherPercentage = k.metrics.totalRankings > 0 
                      ? (k.metrics.notRankedCount / k.metrics.totalRankings) * 100 
                      : 0;

                    // Determine rating
                    let rating = "Poor"
                    let ratingClass = "text-orange-600"

                    if (k.metrics.averageRanking <= 3) {
                      rating = "Excellent"
                      ratingClass = "text-blue-600"
                    } else if (k.metrics.averageRanking <= 7) {
                      rating = "Good"
                      ratingClass = "text-cyan-600"
                    } else if (k.metrics.averageRanking <= 10) {
                      rating = "Average"
                      ratingClass = "text-amber-600"
                    }

                    return (
                      <tr key={k.keyword} className="hover:bg-blue-50/50">
                        <td className="border border-slate-200 p-2 font-medium">{k.keyword}</td>
                        <td className="border border-slate-200 p-2 text-center">{k.metrics.averageRanking.toFixed(1)}</td>
                        <td className="border border-slate-200 p-2 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-2 bg-slate-200 rounded-full mr-2">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${top3Percentage}%` }}
                              />
                            </div>
                            {top3Percentage.toFixed(0)}%
                          </div>
                        </td>
                        <td className="border border-slate-200 p-2 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-2 bg-slate-200 rounded-full mr-2">
                              <div
                                className="h-full bg-cyan-500 rounded-full"
                                style={{ width: `${top10Percentage}%` }}
                              />
                            </div>
                            {top10Percentage.toFixed(0)}%
                          </div>
                        </td>
                        <td className="border border-slate-200 p-2 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-2 bg-slate-200 rounded-full mr-2">
                              <div
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${otherPercentage}%` }}
                              />
                            </div>
                            {otherPercentage.toFixed(0)}%
                          </div>
                        </td>
                        <td className={`border border-slate-200 p-2 text-center font-medium ${ratingClass}`}>{rating}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Keyword Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">Strongest Keywords</h4>
                  <p className="text-slate-600">
                    {sortedKeywords.length > 0 && sortedKeywords[0].metrics
                      ? `"${sortedKeywords[0].keyword}" is your strongest keyword with an average position of ${sortedKeywords[0].metrics.averageRanking.toFixed(1)}.`
                      : "No keyword data available."}
                  </p>
                  {sortedKeywords.length > 1 && sortedKeywords[1].metrics && (
                    <p className="text-slate-600">
                      This is followed by "${sortedKeywords[1].keyword}" with an average position of $
                      {sortedKeywords[1].metrics.averageRanking.toFixed(1)}.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">Areas for Improvement</h4>
                  <p className="text-slate-600">
                    {sortedKeywords.length > 0 &&
                    sortedKeywords[sortedKeywords.length - 1].metrics &&
                    sortedKeywords[sortedKeywords.length - 1].metrics!.averageRanking > 7
                      ? `"${sortedKeywords[sortedKeywords.length - 1].keyword}" has the most room for improvement with an average position of ${sortedKeywords[sortedKeywords.length - 1].metrics!.averageRanking.toFixed(1)}.`
                      : "All your keywords are performing well!"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="h-[200px] mt-8">
          <ResponsiveBar
            data={data}
            keys={["value"]}
            indexBy="position"
            margin={{ top: 0, right: 0, bottom: 40, left: 40 }}
            padding={0.3}
            colors={({ data }: { data: ChartData }) => data.color}
            axisBottom={{
              tickSize: 0,
              tickPadding: 16,
            }}
            axisLeft={{
              tickSize: 0,
              tickValues: 4,
              tickPadding: 16,
            }}
            labelSkipWidth={32}
            labelSkipHeight={32}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 1.4]],
            }}
            role="application"
            ariaLabel="Keyword comparison chart"
            barAriaLabel={(e: { id: string, formattedValue: string, indexValue: string }) =>
              e.id + ": " + e.formattedValue + " in position: " + e.indexValue
            }
            tooltip={({ data }: { data: ChartData }) => (
              <div className="flex items-center justify-center gap-2 rounded-md border border-blue-100 bg-white px-3 py-1.5 text-sm font-medium shadow-sm">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: data.color }}
                />
                <span>{data.position}: </span>
                <span>{data.value} ({data.percentage}%)</span>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
