"use client"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { BusinessInfo, MapCenter } from "@/types"

interface FallbackMapProps {
  businessInfo: BusinessInfo
  selectedKeyword: string
  mapCenter: MapCenter
  gridSize: number
  pointDistance: number
  rankingData: number[][]
  onRetry?: () => void
}

export function FallbackMap({
  businessInfo,
  selectedKeyword,
  mapCenter,
  gridSize,
  pointDistance,
  rankingData,
  onRetry,
}: FallbackMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Draw map background (light green/blue for water/land)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#e8f4f8")
    gradient.addColorStop(1, "#e8f8e8")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid if we have search results
    if (rankingData.length > 0) {
      const rows = rankingData.length
      const cols = rankingData[0].length

      const cellWidth = canvas.width / cols
      const cellHeight = canvas.height / rows

      // Draw grid cells
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const value = rankingData[y][x]

          // Set color based on ranking value
          let bgColor = "#b71c1c" // Default red for 20+
          const textColor = "#ffffff"

          if (value <= 3) {
            bgColor = "#1b5e20" // Dark green for top 3
          } else if (value <= 10) {
            bgColor = "#388e3c" // Green for 4-10
          } else if (value <= 15) {
            bgColor = "#fbc02d" // Yellow for 11-15
          } else if (value <= 20) {
            bgColor = "#e64a19" // Orange for 16-20
          }

          // Draw cell background
          ctx.fillStyle = bgColor
          ctx.fillRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2)

          // Draw ranking text
          ctx.fillStyle = textColor
          ctx.font = `${Math.min(cellWidth, cellHeight) * 0.5}px Arial`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"

          const displayValue = value > 20 ? "20+" : value.toString()
          ctx.fillText(displayValue, x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2)
        }
      }
    } else {
      // Draw placeholder text when no results
      ctx.fillStyle = "#666666"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(
        selectedKeyword
          ? `Search results for "${selectedKeyword}" will appear here`
          : "Search results will appear here",
        canvas.width / 2,
        canvas.height / 2,
      )

      // Draw business location marker
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      ctx.fillStyle = "#1976d2"
      ctx.beginPath()
      ctx.arc(centerX, centerY - 40, 8, 0, Math.PI * 2)
      ctx.fill()

      // Draw business name
      ctx.fillStyle = "#000000"
      ctx.font = "14px Arial"
      ctx.fillText(businessInfo.name, centerX, centerY - 60)
    }
  }, [businessInfo, rankingData, gridSize, pointDistance, selectedKeyword])

  return (
    <Card className="w-full h-[500px] overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>{selectedKeyword ? `Ranking Map for "${selectedKeyword}"` : "Enter a search term to begin"}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 text-white border-white/40 hover:bg-white/30 hover:text-white"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reload Map
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </CardContent>
    </Card>
  )
}
