"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BusinessInfo } from "@/types"

interface ResultsPanelProps {
  searchResults: number[][]
  metrics: {
    agr: number
    atgr: number
    solv: string
  }
  businessInfo: BusinessInfo
  searchTerm: string
}

export function ResultsPanel({ searchResults, metrics, businessInfo, searchTerm }: ResultsPanelProps) {
  // Count rankings by range
  const rankingCounts = {
    top3: 0,
    top10: 0,
    top20: 0,
    beyond20: 0,
  }

  searchResults.flat().forEach((value) => {
    if (value <= 3) {
      rankingCounts.top3++
    } else if (value <= 10) {
      rankingCounts.top10++
    } else if (value <= 20) {
      rankingCounts.top20++
    } else {
      rankingCounts.beyond20++
    }
  })

  const totalCells = searchResults.flat().length

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Business</h3>
            <p className="text-sm">{businessInfo.name}</p>
            <p className="text-xs text-gray-500">{businessInfo.address}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Search Term</h3>
            <p className="text-sm">{searchTerm}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-100 p-3 rounded-md text-center">
                <div className="text-xs text-gray-500">AGR</div>
                <div className="text-xl font-bold">{metrics.agr.toFixed(1)}</div>
              </div>
              <div className="bg-gray-100 p-3 rounded-md text-center">
                <div className="text-xs text-gray-500">ATGR</div>
                <div className="text-xl font-bold">{metrics.atgr.toFixed(2)}</div>
              </div>
              <div className="bg-gray-100 p-3 rounded-md text-center">
                <div className="text-xs text-gray-500">SoLV</div>
                <div className="text-xl font-bold">{metrics.solv}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Ranking Distribution</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-800 mr-2"></div>
                <span className="text-sm">
                  Top 3: {rankingCounts.top3} ({((rankingCounts.top3 / totalCells) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 mr-2"></div>
                <span className="text-sm">
                  4-10: {rankingCounts.top10} ({((rankingCounts.top10 / totalCells) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 mr-2"></div>
                <span className="text-sm">
                  11-20: {rankingCounts.top20} ({((rankingCounts.top20 / totalCells) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-700 mr-2"></div>
                <span className="text-sm">
                  20+: {rankingCounts.beyond20} ({((rankingCounts.beyond20 / totalCells) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
