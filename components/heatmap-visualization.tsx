"use client"

import { useState, useEffect, useRef } from "react"
import type { BusinessInfo } from "@/types/business-info"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadGoogleMapsApi } from "@/utils/google-maps-loader"

interface HeatmapVisualizationProps {
  businessInfo: BusinessInfo
  gridData?: number[][]
  gridPoints?: { lat: number; lng: number }[]
  mapCenter: { lat: number; lng: number }
}

// Declare google variable
declare global {
  interface Window {
    google: any
  }
}

export function HeatmapVisualization({ businessInfo, gridData, gridPoints, mapCenter }: HeatmapVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadAttempts, setLoadAttempts] = useState(0)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    let isMounted = true
    setIsLoading(true)
    setError(null)

    const initializeHeatmap = async () => {
      try {
        // Load Google Maps API
        await loadGoogleMapsApi()

        if (!isMounted || !mapRef.current) return

        console.log("Creating heatmap")

        // Create map instance
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 12,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        })

        // Check if visualization library is available
        if (!window.google.maps.visualization) {
          throw new Error("Visualization library not loaded")
        }

        // Create a simple heatmap if we have grid points
        if (gridPoints && gridPoints.length > 0) {
          const heatmapData = gridPoints.map((point, index) => {
            const row = Math.floor(index / Math.sqrt(gridPoints.length))
            const col = index % Math.sqrt(gridPoints.length)

            // Get ranking value
            let rankingValue = 0
            if (gridData && gridData[row] && typeof gridData[row][col] !== "undefined") {
              rankingValue = gridData[row][col]
            }

            // Calculate weight based on ranking (better rankings = hotter)
            let weight = 0
            if (rankingValue > 0) {
              weight = (20 - rankingValue) / 20
              weight = Math.max(0, Math.min(1, weight))
            }

            return {
              location: new window.google.maps.LatLng(point.lat, point.lng),
              weight: weight,
            }
          })

          new window.google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            map: mapInstance,
            radius: 30,
            opacity: 0.7,
          })
        }

        console.log("Heatmap initialized successfully")
        setIsLoading(false)
      } catch (err) {
        console.error("Error initializing heatmap:", err)
        if (isMounted) {
          setError(`Failed to initialize heatmap: ${err instanceof Error ? err.message : "Unknown error"}`)
          setIsLoading(false)
        }
      }
    }

    initializeHeatmap()

    return () => {
      isMounted = false
    }
  }, [mapCenter, gridPoints, gridData, loadAttempts])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setLoadAttempts((prev) => prev + 1)
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border p-6">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-800 p-3 rounded-full inline-flex mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900">Heatmap Loading Failed</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button
            onClick={handleRetry}
            variant="default"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading Heatmap
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute top-1 left-1 w-14 h-14 rounded-full border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
            <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-500 border-l-transparent animate-spin animation-delay-300"></div>
          </div>
          <p className="text-lg font-medium text-slate-700">Loading heatmap...</p>
          <p className="text-sm text-slate-500 mt-1">This may take a moment</p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden shadow-md" />
}
