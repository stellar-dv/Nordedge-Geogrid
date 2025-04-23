"use client"

import { useRef, useEffect } from "react"
import type { GridResult } from "@/lib/geogrid-service"

interface GridImageGeneratorProps {
  gridResult: GridResult
  width?: number
  height?: number
  interactive?: boolean
  onClick?: () => void
}

export function GridImageGenerator({
  gridResult,
  width = 300,
  height = 300,
  interactive = true,
  onClick,
}: GridImageGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Draw map background (light green/blue for water/land)
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#e8f4f8")
    gradient.addColorStop(1, "#e8f8e8")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    const gridData = gridResult.gridData
    const rows = gridData.length
    const cols = gridData[0].length

    const cellWidth = width / cols
    const cellHeight = height / rows

    // Draw grid cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const value = gridData[y][x]

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

    // Draw business location marker in the center
    const centerX = width / 2
    const centerY = height / 2

    // Draw marker
    ctx.fillStyle = "#1976d2"
    ctx.beginPath()
    ctx.arc(centerX, centerY, Math.min(cellWidth, cellHeight) * 0.3, 0, Math.PI * 2)
    ctx.fill()

    // Draw metrics at the bottom if large enough
    if (width >= 200) {
      const metrics = gridResult.metrics
      const fontSize = Math.max(10, Math.min(width, height) * 0.04)

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.fillRect(0, height - fontSize * 2.5, width, fontSize * 2.5)

      ctx.fillStyle = "#000000"
      ctx.font = `${fontSize}px Arial`
      ctx.textAlign = "center"
      ctx.fillText(
        `AGR: ${metrics.agr.toFixed(1)} | ATGR: ${metrics.atgr.toFixed(2)} | SoLV: ${metrics.solv}`,
        width / 2,
        height - fontSize,
      )
    }
  }, [gridResult, width, height])

  return (
    <canvas
      ref={canvasRef}
      className={interactive ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}
      onClick={onClick}
      title="Click to view detailed grid"
    />
  )
}
