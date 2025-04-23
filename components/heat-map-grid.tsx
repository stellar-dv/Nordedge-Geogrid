"use client"

import { useRef, useEffect } from "react"

interface HeatMapGridProps {
  data: number[][]
  size: number
  onClick?: () => void
}

export function HeatMapGrid({ data, size, onClick }: HeatMapGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth * 2 // For higher resolution
    canvas.height = canvas.offsetHeight * 2

    // Scale context
    ctx.scale(2, 2)

    const width = canvas.width / 2
    const height = canvas.height / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    const rows = data.length
    const cols = data[0].length

    const cellWidth = width / cols
    const cellHeight = height / rows

    // Draw grid cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const value = data[y][x]

        // Set color based on ranking value
        let color = "#b71c1c" // Default red for 20+

        if (value <= 3) {
          color = "#1b5e20" // Dark green for top 3
        } else if (value <= 10) {
          color = "#388e3c" // Green for 4-10
        } else if (value <= 15) {
          color = "#fbc02d" // Yellow for 11-15
        } else if (value <= 20) {
          color = "#e64a19" // Orange for 16-20
        }

        // Draw cell
        ctx.fillStyle = color
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
      }
    }

    // Draw highlight for center position
    const centerX = Math.floor(cols / 2)
    const centerY = Math.floor(rows / 2)

    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(
      centerX * cellWidth + cellWidth / 2,
      centerY * cellHeight + cellHeight / 2,
      Math.min(cellWidth, cellHeight) / 3,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }, [data, size])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onClick}
    />
  )
}
