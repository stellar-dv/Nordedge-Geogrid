"use client"

import { useState } from "react"
import type { BusinessInfo, MapCenter, GridPoint } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, MapPin, ExternalLink } from "lucide-react"

interface FallbackHeatmapProps {
  businessInfo: BusinessInfo
  gridData: number[][]
  gridPoints?: GridPoint[]
  mapCenter: MapCenter
}

export function FallbackHeatmap({ businessInfo, gridData, gridPoints, mapCenter }: FallbackHeatmapProps) {
  const [showInstructions, setShowInstructions] = useState(false)

  // Helper function to get color based on ranking
  function getRankingColor(ranking: number): string {
    if (ranking <= 3) return "#059669" // emerald-600
    if (ranking <= 7) return "#10b981" // green-500
    if (ranking <= 10) return "#f59e0b" // amber-500
    if (ranking <= 15) return "#f97316" // orange-500
    return "#ef4444" // red-500
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Ranking Visualization (Map Unavailable)</span>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 text-white border-white/40 hover:bg-white/30 hover:text-white"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? "Hide Instructions" : "Show API Setup Instructions"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Google Maps API Error</h3>
              <p className="text-amber-700 text-sm mt-1">
                The Google Maps API could not be loaded due to a project configuration error. Showing a fallback
                visualization instead.
              </p>
            </div>
          </div>
        </div>

        {showInstructions && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-4">
            <h3 className="font-medium text-slate-900 mb-2">How to Fix the Google Maps API Error</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
              <li>
                Go to the{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>Select your project or create a new one</li>
              <li>Enable the "Maps JavaScript API" for your project</li>
              <li>Enable the "Places API" if you're using place search features</li>
              <li>Set up billing for your Google Cloud project</li>
              <li>Create an API key with appropriate restrictions</li>
              <li>Update the API key in your application</li>
            </ol>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-md p-4 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-slate-900">{businessInfo.name}</h3>
              <p className="text-sm text-slate-600">{businessInfo.address}</p>
              <p className="text-xs text-slate-500 mt-1">
                Coordinates: {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative bg-slate-50 border border-slate-200 rounded-md p-4 overflow-hidden">
          <h3 className="font-medium text-slate-900 mb-3">Ranking Grid Visualization</h3>

          <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto">
            {gridData.map((row, rowIndex) =>
              row.map((ranking, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-md flex items-center justify-center relative"
                  style={{
                    backgroundColor: ranking > 0 ? getRankingColor(ranking) : "#e5e7eb",
                    opacity: ranking > 0 ? 1 : 0.3,
                  }}
                >
                  {ranking > 0 ? (
                    <span className="text-white font-bold text-sm">{ranking}</span>
                  ) : (
                    <span className="text-slate-500 text-xs">N/A</span>
                  )}
                </div>
              )),
            )}
          </div>

          <div className="mt-4 flex items-center justify-center flex-wrap gap-4 p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                1
              </div>
              <span className="text-sm">
                Positions 1-3 <span className="text-emerald-700 font-medium">(Excellent)</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                5
              </div>
              <span className="text-sm">
                Positions 4-7 <span className="text-green-700 font-medium">(Good)</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                9
              </div>
              <span className="text-sm">
                Positions 8-10 <span className="text-amber-700 font-medium">(Average)</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                12
              </div>
              <span className="text-sm">
                Positions 11-15 <span className="text-orange-700 font-medium">(Poor)</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                18
              </div>
              <span className="text-sm">
                Positions 16+ <span className="text-red-700 font-medium">(Bad)</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
