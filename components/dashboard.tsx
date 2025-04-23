"use client"

import { useState } from "react"
import { MapView } from "./map-view"
import { SearchControls } from "./search-controls"
import { ResultsPanel } from "./results-panel"
import { FallbackMap } from "./fallback-map"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import type { BusinessInfo, GridPoint, MapCenter } from "@/types"
import { saveGridResult } from "@/lib/geogrid-service"
import { useRouter } from "next/navigation"

interface DashboardProps {
  businessInfo: BusinessInfo
}

export function Dashboard({ businessInfo }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [gridSize, setGridSize] = useState(7)
  const [distance, setDistance] = useState(2.5)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<number[][]>([])
  const [metrics, setMetrics] = useState({ agr: 0, atgr: 0, solv: "0%" })
  const [gridPoints, setGridPoints] = useState<GridPoint[]>([])
  const [mapCenter, setMapCenter] = useState<MapCenter>({
    lat: typeof businessInfo.location === 'object' && businessInfo.location ? businessInfo.location.lat : 47.6062,
    lng: typeof businessInfo.location === 'object' && businessInfo.location ? businessInfo.location.lng : -122.3321,
  })
  const { isLoaded, loadError } = useGoogleMaps()
  const router = useRouter()

  const handleGridPointsUpdate = (points: GridPoint[]) => {
    setGridPoints(points)
  }

  const handleSearch = async () => {
    if (!searchTerm) return

    setIsSearching(true)

    try {
      // Simulate search delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate random grid data for demonstration
      const gridData = Array(gridSize)
        .fill(0)
        .map(() =>
          Array(gridSize)
            .fill(0)
            .map(() => {
              // Generate more realistic ranking data
              // Center positions more likely to have better rankings
              const centerDistance = Math.sqrt(
                Math.pow(Math.abs(gridSize / 2 - Math.random() * gridSize), 2) +
                  Math.pow(Math.abs(gridSize / 2 - Math.random() * gridSize), 2),
              )

              const normalizedDistance = centerDistance / (gridSize / 2)

              // Better rankings (lower numbers) near center
              if (normalizedDistance < 0.3) {
                return Math.floor(Math.random() * 10) + 1 // 1-10
              } else if (normalizedDistance < 0.6) {
                return Math.floor(Math.random() * 10) + 11 // 11-20
              } else {
                // More likely to be 20+ further from center
                return Math.random() < 0.8 ? 21 : Math.floor(Math.random() * 10) + 11
              }
            }),
        )

      setSearchResults(gridData)

      // Calculate metrics
      const flattenedValues = gridData.flat()
      const avgRanking = flattenedValues.reduce((sum, val) => sum + (val > 20 ? 21 : val), 0) / flattenedValues.length
      const topRankings = flattenedValues.filter((val) => val <= 20)
      const avgTopRanking =
        topRankings.length > 0 ? topRankings.reduce((sum, val) => sum + val, 0) / topRankings.length : 0
      const solvPercentage = Math.round(
        (flattenedValues.filter((val) => val <= 3).length / flattenedValues.length) * 100,
      )

      setMetrics({
        agr: avgRanking,
        atgr: avgTopRanking,
        solv: `${solvPercentage}%`,
      })

      // Save the result
      const result = saveGridResult({
        businessInfo: {
          ...businessInfo,
          location: typeof businessInfo.location === 'object' ? businessInfo.location : { lat: mapCenter.lat, lng: mapCenter.lng }
        },
        searchTerm,
        createdAt: new Date().toISOString(),
        gridSize: `${gridSize}x${gridSize}`,
        gridData,
        metrics: {
          agr: avgRanking,
          atgr: avgTopRanking,
          solv: `${solvPercentage}%`,
          averageRank: avgRanking,
          visibilityPercentage: solvPercentage,
          top20AverageRank: avgTopRanking
        },
        googleRegion: "global",
        distanceKm: distance,
      })

      // Wait a bit to show results before redirecting
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to dashboard
      router.push("/")
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoaded && !loadError ? (
            <MapView
              businessInfo={businessInfo}
              selectedKeyword={searchTerm}
              mapCenter={mapCenter}
              gridSize={gridSize}
              pointDistance={distance}
              rankingData={searchResults}
              onGridPointsUpdate={handleGridPointsUpdate}
              isLoading={isSearching}
              error={loadError}
            />
          ) : (
            <FallbackMap
              businessInfo={businessInfo}
              selectedKeyword={searchTerm}
              mapCenter={mapCenter}
              gridSize={gridSize}
              pointDistance={distance}
              rankingData={searchResults}
              onRetry={() => {}}
            />
          )}
        </div>
        <div>
          <SearchControls
            businessInfo={businessInfo}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            gridSize={gridSize}
            setGridSize={setGridSize}
            distance={distance}
            setDistance={setDistance}
            onSearch={handleSearch}
            isSearching={isSearching}
          />

          {searchResults.length > 0 && (
            <ResultsPanel
              searchResults={searchResults}
              metrics={metrics}
              businessInfo={businessInfo}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </div>
    </div>
  )
}
