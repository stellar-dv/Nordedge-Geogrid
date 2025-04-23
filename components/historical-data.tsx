"use client"

import { useState, useEffect } from "react"
import type { BusinessInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface HistoricalDataProps {
  businessInfo: BusinessInfo
  selectedKeyword: string
}

interface RankingHistoryItem {
  date: string
  ranking: number
  keyword: string
}

export function HistoricalData({ businessInfo, selectedKeyword }: HistoricalDataProps) {
  const [timeframe, setTimeframe] = useState("2months")
  const [rankingHistory, setRankingHistory] = useState<RankingHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch historical ranking data
  useEffect(() => {
    async function fetchRankingHistory() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/search-rankings?keyword=${encodeURIComponent(selectedKeyword)}&location=${encodeURIComponent(businessInfo.location)}`,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setRankingHistory(data.data || [])
      } catch (err) {
        console.error("Error fetching ranking history:", err)
        setError("Failed to load historical ranking data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankingHistory()
  }, [selectedKeyword, businessInfo.location])

  // Generate mock distribution data
  const mockDistributionData = [
    { week: "8 weeks ago", top3: 28, top10: 37, rest: 35 },
    { week: "7 weeks ago", top3: 30, top10: 38, rest: 32 },
    { week: "6 weeks ago", top3: 32, top10: 38, rest: 30 },
    { week: "5 weeks ago", top3: 35, top10: 37, rest: 28 },
    { week: "4 weeks ago", top3: 38, top10: 37, rest: 25 },
    { week: "3 weeks ago", top3: 40, top10: 38, rest: 22 },
    { week: "2 weeks ago", top3: 42, top10: 38, rest: 20 },
    { week: "1 week ago", top3: 45, top10: 37, rest: 18 },
    { week: "Current", top3: 48, top10: 37, rest: 15 },
  ]

  // Calculate improvement metrics
  const calculateImprovement = () => {
    if (rankingHistory.length < 2) return null

    const oldestRanking = rankingHistory[0].ranking
    const newestRanking = rankingHistory[rankingHistory.length - 1].ranking
    const improvement = oldestRanking - newestRanking
    const percentImprovement = (improvement / oldestRanking) * 100

    return {
      oldestRanking,
      newestRanking,
      improvement,
      percentImprovement,
    }
  }

  const improvement = calculateImprovement()

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Historical Ranking Trends</CardTitle>
          <div className="w-full md:w-48">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full h-9 rounded-md bg-white/20 border border-white/30 text-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="2weeks">Last 2 Weeks</option>
              <option value="1month">Last Month</option>
              <option value="2months">Last 2 Months</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-slate-600">Loading historical data...</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : rankingHistory.length === 0 ? (
            <div className="flex items-center justify-center h-80">
              <p className="text-slate-600">No historical data available for this keyword</p>
            </div>
          ) : (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rankingHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 30]} reversed />
                    <Tooltip
                      formatter={(value) => [`Position ${value}`, "Ranking"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ranking"
                      name="Average Ranking"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 space-y-4">
                <h4 className="font-medium text-slate-900">Key Trends</h4>
                <ul className="space-y-3">
                  {improvement && (
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-1.5 mr-2"></span>
                      <div>
                        <strong className="text-slate-900">Overall Improvement:</strong>{" "}
                        <span className="text-slate-700">
                          Your average ranking has improved from {improvement.oldestRanking.toFixed(1)} to{" "}
                          {improvement.newestRanking.toFixed(1)} over the past month, a{" "}
                          {Math.abs(improvement.percentImprovement).toFixed(0)}%{" "}
                          {improvement.percentImprovement >= 0 ? "improvement" : "decline"}.
                        </span>
                      </div>
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-1.5 mr-2"></span>
                    <div>
                      <strong className="text-slate-900">Consistent Progress:</strong>{" "}
                      <span className="text-slate-700">
                        Rankings have improved steadily each week, indicating effective ongoing optimization.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-1.5 mr-2"></span>
                    <div>
                      <strong className="text-slate-900">Acceleration:</strong>{" "}
                      <span className="text-slate-700">
                        The rate of improvement has increased in the past month, suggesting recent optimization efforts
                        are having a compounding effect.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-1.5 mr-2"></span>
                    <div>
                      <strong className="text-slate-900">Correlation:</strong>{" "}
                      <span className="text-slate-700">
                        Ranking improvements align with your recent content updates and citation building efforts.
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardTitle>Ranking Distribution Over Time</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDistributionData} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value) => [`${(value * 100).toFixed(0)}%`, ""]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="top3"
                  name="Top 3 Positions"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                />
                <Area
                  type="monotone"
                  dataKey="top10"
                  name="Positions 4-10"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                />
                <Area type="monotone" dataKey="rest" name="Below Top 10" stackId="1" stroke="#ef4444" fill="#ef4444" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 space-y-4">
            <h4 className="font-medium text-slate-900">Distribution Analysis</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mt-1.5 mr-2"></span>
                <div>
                  <strong className="text-slate-900">Top 3 Growth:</strong>{" "}
                  <span className="text-slate-700">
                    The percentage of grid points where you rank in the top 3 positions has increased from 28% to 48%
                    over the past 2 months.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mt-1.5 mr-2"></span>
                <div>
                  <strong className="text-slate-900">Visibility Improvement:</strong>{" "}
                  <span className="text-slate-700">
                    Your overall visibility in the top 10 has increased from 65% to 85% of grid points.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mt-1.5 mr-2"></span>
                <div>
                  <strong className="text-slate-900">Reduced Poor Rankings:</strong>{" "}
                  <span className="text-slate-700">
                    The percentage of grid points where you rank below the top 10 has decreased from 35% to 15%.
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mt-1.5 mr-2"></span>
                <div>
                  <strong className="text-slate-900">Impact:</strong>{" "}
                  <span className="text-slate-700">
                    This improved distribution means potential customers are significantly more likely to see your
                    business in search results throughout your service area.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
