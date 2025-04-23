"use client"

import { useState, useEffect, useCallback } from "react"
import type { BusinessInfo } from "@/types/business-info"
import { GoogleMap } from "./google-map"
import { HeatmapVisualization } from "./heatmap-visualization"
import { geocodeAddress as geocodeAddressAction } from "@/app/actions/geocode"
import { fetchRankingData } from "@/services/ranking-service"

interface RankingVisualizationProps {
  businessInfo: BusinessInfo
}

export function RankingVisualization({ businessInfo }: RankingVisualizationProps) {
  const [selectedKeyword, setSelectedKeyword] = useState(businessInfo.keywords[0])
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 }) // Default to NYC
  const [gridSize, setGridSize] = useState(7)
  const [pointDistance, setPointDistance] = useState(1)
  const [locationInput, setLocationInput] = useState("")
  const [gridPoints, setGridPoints] = useState<{ lat: number; lng: number }[]>([])
  const [visualizationType, setVisualizationType] = useState<"grid" | "heatmap">("grid")
  const [rankingData, setRankingData] = useState<Record<string, number[][]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keywordMetrics, setKeywordMetrics] = useState<Record<string, any>>({})
  const [shouldFetchData, setShouldFetchData] = useState(false)
  const [mapKey, setMapKey] = useState(Date.now()) // Used to force re-render the map

  // Function to geocode an address and update map center
  const geocodeAddress = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await geocodeAddressAction(typeof businessInfo.location === 'string' ? businessInfo.location : locationInput)

      if (result.success && result.data) {
        setMapCenter({ lat: result.data.lat, lng: result.data.lng })
        // Force map to re-render with new center
        setMapKey(Date.now())
      } else {
        setError("Failed to geocode address. Please try a different location.")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      setError("An error occurred while geocoding the address.")
    } finally {
      setIsLoading(false)
    }
  }, [locationInput, businessInfo.location])

  // Handle grid points generation
  const handleGridPointsGenerated = useCallback((points: { lat: number; lng: number }[]) => {
    setGridPoints(points)
    setShouldFetchData(true)
  }, [])

  // Calculate keyword performance metrics
  const calculateKeywordPerformance = useCallback((data: number[][]) => {
    if (!data || data.length === 0) return null

    const flatData = data.flat().filter((val) => val > 0)
    if (flatData.length === 0) return null

    const avgRanking = flatData.reduce((sum, val) => sum + val, 0) / flatData.length
    const top3Count = flatData.filter((val) => val <= 3).length
    const top3Percentage = (top3Count / flatData.length) * 100
    const otherCount = flatData.filter((val) => val > 10).length
    const otherPercentage = (otherCount / flatData.length) * 100

    return {
      avgRanking,
      top3Count,
      top3Percentage,
      otherCount,
      otherPercentage,
    }
  }, [])

  // Fetch ranking data for all keywords
  const fetchAllRankingData = useCallback(
    async (points: { lat: number; lng: number }[]) => {
      if (points.length === 0 || isLoading) return

      setIsLoading(true)
      setError(null)

      try {
        const newRankingData: Record<string, number[][]> = {}
        const newKeywordMetrics: Record<string, any> = {}

        // Fetch data for each keyword
        for (const keyword of businessInfo.keywords) {
          const locationParam = typeof businessInfo.location === 'string' 
            ? businessInfo.location 
            : businessInfo.location ? `${businessInfo.location.lat},${businessInfo.location.lng}` : '';
          const data = await fetchRankingData(keyword, locationParam, points)
          newRankingData[keyword] = data

          // Calculate performance metrics
          const metrics = calculateKeywordPerformance(data)
          if (metrics) {
            newKeywordMetrics[keyword] = metrics
          }
        }

        setRankingData(newRankingData)
        setKeywordMetrics(newKeywordMetrics)
      } catch (error) {
        console.error("Error fetching ranking data:", error)
        setError("Failed to fetch ranking data. Please try again later.")
      } finally {
        setIsLoading(false)
        setShouldFetchData(false)
      }
    },
    [businessInfo.keywords, businessInfo.location, isLoading, calculateKeywordPerformance],
  )

  // Initialize with business location
  useEffect(() => {
    if (businessInfo.location) {
      geocodeAddress()
    }
  }, [businessInfo.location, geocodeAddress])

  // Fetch data when grid points change
  useEffect(() => {
    if (shouldFetchData && gridPoints.length > 0) {
      fetchAllRankingData(gridPoints)
    }
  }, [shouldFetchData, gridPoints, fetchAllRankingData])

  // Force map reload
  const handleForceReload = () => {
    setMapKey(Date.now())
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Ranking Visualization</h2>
              <p className="text-blue-100 mt-1">Visualize your local search rankings across your service area</p>
            </div>
            <div className="w-full md:w-64">
              <select
                value={selectedKeyword}
                onChange={(e) => setSelectedKeyword(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {businessInfo.keywords.map((keyword: string) => (
                  <option key={keyword} value={keyword}>
                    {keyword}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
            <svg
              className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="ml-3 text-blue-800">
              The numbers on the map represent your Google ranking position for "<strong>{selectedKeyword}</strong>" at
              each location.
              <strong> Lower numbers are better</strong> - position 1 means you're at the top of search results, while
              higher numbers (like 20+) indicate poor visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Grid Center Location
              </label>
              <div className="flex space-x-2">
                <input
                  id="location"
                  placeholder={typeof businessInfo.location === 'string' ? businessInfo.location : 'Enter location'}
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={geocodeAddress}
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700">Grid Size</label>
                <span className="text-sm font-medium text-blue-600">
                  {gridSize}x{gridSize}
                </span>
              </div>
              <select
                value={gridSize.toString()}
                onChange={(e) => setGridSize(Number.parseInt(e.target.value))}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                <option value="3">3x3 (Small Area)</option>
                <option value="5">5x5 (Neighborhood)</option>
                <option value="7">7x7 (City Area)</option>
                <option value="9">9x9 (Large City)</option>
                <option value="11">11x11 (Metro Area)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700">Distance Between Points (miles)</label>
                <span className="text-sm font-medium text-blue-600">{pointDistance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={pointDistance}
                onChange={(e) => setPointDistance(Number.parseFloat(e.target.value))}
                disabled={isLoading}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <button
              onClick={handleForceReload}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reload Map
            </button>

            <div className="inline-flex rounded-lg shadow-sm">
              <button
                onClick={() => setVisualizationType("grid")}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center ${
                  visualizationType === "grid"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grid View
              </button>
              <button
                onClick={() => setVisualizationType("heatmap")}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center ${
                  visualizationType === "heatmap"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Heatmap
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
              <svg
                className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="ml-3 text-red-800">{error}</p>
            </div>
          )}

          {visualizationType === "grid" && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-center flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-1">
                    <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      1
                    </div>
                    <span className="text-sm">
                      Positions 1-3 <span className="text-green-700 font-medium">(Excellent)</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      5
                    </div>
                    <span className="text-sm">
                      Positions 4-7 <span className="text-green-600 font-medium">(Good)</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-bold shadow-sm">
                      9
                    </div>
                    <span className="text-sm">
                      Positions 8-10 <span className="text-yellow-600 font-medium">(Average)</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      13
                    </div>
                    <span className="text-sm">
                      Positions 11-15 <span className="text-orange-600 font-medium">(Below Average)</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      18
                    </div>
                    <span className="text-sm">
                      Positions 16-20 <span className="text-red-600 font-medium">(Poor)</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      20+
                    </div>
                    <span className="text-sm">
                      Not in Top 20 <span className="text-gray-600 font-medium">(Not Found)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[500px] mb-6 rounded-xl overflow-hidden shadow-lg relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50 backdrop-blur-sm">
                    <div className="text-center bg-white p-6 rounded-xl shadow-lg">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                        <div className="absolute top-1 left-1 w-14 h-14 rounded-full border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
                        <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-500 border-l-transparent animate-spin animation-delay-300"></div>
                      </div>
                      <p className="text-lg font-medium text-gray-700">Loading ranking data...</p>
                      <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
                    </div>
                  </div>
                )}
                <GoogleMap
                  key={mapKey}
                  center={mapCenter}
                  zoom={12}
                  gridSize={gridSize}
                  pointDistance={pointDistance}
                  gridData={rankingData[selectedKeyword] || []}
                  searchKeyword={selectedKeyword}
                  onGridPointsGenerated={handleGridPointsGenerated}
                />
              </div>
            </>
          )}

          {visualizationType === "heatmap" && (
            <div className="h-[500px] mb-6 rounded-xl overflow-hidden shadow-lg relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50 backdrop-blur-sm">
                  <div className="text-center bg-white p-6 rounded-xl shadow-lg">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                      <div className="absolute top-1 left-1 w-14 h-14 rounded-full border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
                      <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-transparent border-b-blue-500 border-l-transparent animate-spin animation-delay-300"></div>
                    </div>
                    <p className="text-lg font-medium text-gray-700">Loading ranking data...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
                  </div>
                </div>
              )}
              <HeatmapVisualization
                businessInfo={businessInfo}
                gridData={rankingData[selectedKeyword] || []}
                gridPoints={gridPoints}
                mapCenter={mapCenter}
              />
            </div>
          )}

          {keywordMetrics[selectedKeyword] && (
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-md">
              <h4 className="text-xl font-semibold mb-6 text-blue-800 border-b border-blue-100 pb-2">
                Key Insights for "{selectedKeyword}"
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <strong className="text-blue-800 block mb-1">Average Ranking:</strong>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[200px]">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full"
                              style={{ width: `${Math.max(0, 100 - keywordMetrics[selectedKeyword].avgRanking * 5)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {keywordMetrics[selectedKeyword].avgRanking.toFixed(1)} across all grid points
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <strong className="text-blue-800 block mb-1">Top Positions:</strong>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[200px]">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full"
                              style={{ width: `${keywordMetrics[selectedKeyword].top3Percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {keywordMetrics[selectedKeyword].top3Percentage.toFixed(0)}% in top 3 results
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <strong className="text-blue-800 block mb-1">Ranking Pattern:</strong>
                        <p className="text-sm">
                          {keywordMetrics[selectedKeyword].top3Percentage > 50
                            ? "Strong performance across most of your service area"
                            : keywordMetrics[selectedKeyword].top3Percentage > 25
                              ? "Good performance in the central area, with room for improvement in outlying areas"
                              : "Rankings are strongest near your business location, with significant drop-off in outlying areas"}
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <strong className="text-blue-800 block mb-1">Opportunity Areas:</strong>
                        <p className="text-sm">
                          {keywordMetrics[selectedKeyword].otherPercentage > 50
                            ? `Focus on improving rankings in the majority of your service area where you rank below position 10`
                            : keywordMetrics[selectedKeyword].otherPercentage > 25
                              ? `Target improvements in the approximately ${keywordMetrics[selectedKeyword].otherPercentage.toFixed(0)}% of locations where you rank below position 10`
                              : "Maintain your strong rankings and focus on the few areas where rankings could be improved"}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 mt-0.5">
                        5
                      </div>
                      <div>
                        <strong className="text-blue-800 block mb-1">Competitive Edge:</strong>
                        <p className="text-sm">
                          {keywordMetrics[selectedKeyword].avgRanking < 5
                            ? "You have a significant competitive advantage for this keyword"
                            : keywordMetrics[selectedKeyword].avgRanking < 10
                              ? "You're competitive but there's room for improvement"
                              : "You need significant optimization to compete effectively for this keyword"}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 mt-0.5">
                        6
                      </div>
                      <div>
                        <strong className="text-blue-800 block mb-1">Recommended Focus:</strong>
                        <p className="text-sm">
                          {keywordMetrics[selectedKeyword].top3Percentage < 30
                            ? "Create location-specific content targeting areas with poor rankings"
                            : "Build more citations and reviews from customers in your service area"}
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyword Performance Comparison Card */}
      {Object.keys(keywordMetrics).length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <h2 className="text-2xl font-bold text-white">Keyword Performance Summary</h2>
            <p className="text-indigo-100 mt-1">Average rankings across your service area</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessInfo.keywords.map((keyword: string) => {
                const metrics = keywordMetrics[keyword]
                if (!metrics) return null

                return (
                  <div
                    key={keyword}
                    className="space-y-2 p-5 border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-indigo-700">{keyword}</span>
                      <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                        Avg. Position: {metrics.avgRanking.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full"
                        style={{ width: `${100 - metrics.avgRanking * 5}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        {metrics.top3Percentage.toFixed(0)}% in top 3
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">
                        {metrics.otherCount} positions outside top 10
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
