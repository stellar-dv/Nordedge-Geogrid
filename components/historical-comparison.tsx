"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BusinessInfo } from "@/types/business-info"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data for historical comparison
const mockHistoricalData = [
  { date: "Jan 1", avgRank: 5.2, top3: 28, top10: 65 },
  { date: "Jan 8", avgRank: 4.8, top3: 30, top10: 68 },
  { date: "Jan 15", avgRank: 4.5, top3: 32, top10: 70 },
  { date: "Jan 22", avgRank: 4.3, top3: 35, top10: 72 },
  { date: "Jan 29", avgRank: 4.0, top3: 38, top10: 75 },
  { date: "Feb 5", avgRank: 3.8, top3: 40, top10: 78 },
  { date: "Feb 12", avgRank: 3.5, top3: 42, top10: 80 },
  { date: "Feb 19", avgRank: 3.3, top3: 45, top10: 82 },
  { date: "Feb 26", avgRank: 3.0, top3: 48, top10: 85 },
]

// Mock data for ranking distribution
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

interface HistoricalComparisonProps {
  businessInfo: BusinessInfo
}

export function HistoricalComparison({ businessInfo }: HistoricalComparisonProps) {
  const [timeframe, setTimeframe] = useState("2months")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Historical Ranking Trends</CardTitle>
              <CardDescription>Track your ranking improvements over time</CardDescription>
            </div>
            <div className="w-full md:w-48">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="2months">Last 2 Months</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer
              config={{
                avgRank: {
                  label: "Average Ranking",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} reversed />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="avgRank"
                    stroke="var(--color-avgRank)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Key Trends</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Overall Improvement:</strong> Your average ranking has improved from 5.2 to 3.0 over the past 2
                months, a 42% improvement.
              </li>
              <li>
                <strong>Consistent Progress:</strong> Rankings have improved steadily each week, indicating effective
                ongoing optimization.
              </li>
              <li>
                <strong>Acceleration:</strong> The rate of improvement has increased in the past month, suggesting
                recent optimization efforts are having a compounding effect.
              </li>
              <li>
                <strong>Correlation:</strong> Ranking improvements align with your recent content updates and citation
                building efforts.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranking Distribution Over Time</CardTitle>
          <CardDescription>Percentage of grid points in top ranking positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer
              config={{
                top3: {
                  label: "Top 3 Positions",
                  color: "hsl(var(--chart-1))",
                },
                top10: {
                  label: "Positions 4-10",
                  color: "hsl(var(--chart-2))",
                },
                rest: {
                  label: "Below Top 10",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockDistributionData} stackOffset="expand">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="top3"
                    stackId="1"
                    stroke="var(--color-top3)"
                    fill="var(--color-top3)"
                  />
                  <Area
                    type="monotone"
                    dataKey="top10"
                    stackId="1"
                    stroke="var(--color-top10)"
                    fill="var(--color-top10)"
                  />
                  <Area
                    type="monotone"
                    dataKey="rest"
                    stackId="1"
                    stroke="var(--color-rest)"
                    fill="var(--color-rest)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Distribution Analysis</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Top 3 Growth:</strong> The percentage of grid points where you rank in the top 3 positions has
                increased from 28% to 48% over the past 2 months.
              </li>
              <li>
                <strong>Visibility Improvement:</strong> Your overall visibility in the top 10 has increased from 65% to
                85% of grid points.
              </li>
              <li>
                <strong>Reduced Poor Rankings:</strong> The percentage of grid points where you rank below the top 10
                has decreased from 35% to 15%.
              </li>
              <li>
                <strong>Impact:</strong> This improved distribution means potential customers are significantly more
                likely to see your business in search results throughout your service area.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
