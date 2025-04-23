"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./dashboard-sidebar"
import { GoogleMap } from "./google-map"
import { HeatmapVisualization } from "./heatmap-visualization"
import { KeywordComparison } from "./keyword-comparison"
import { CompetitiveAnalysis } from "./competitive-analysis"
import { HistoricalComparison } from "./historical-comparison"
import { StrategicRecommendations } from "./strategic-recommendations"
import { ExportReport } from "./export-report"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import type { BusinessInfo } from "@/types/business-info"
import { geocodeAddress as geocodeAddressAction } from "@/app/actions/geocode"
import { fetchRankingData } from "@/services/ranking-service"
import { loadGoogleMapsApi } from "@/utils/google-maps-loader"

interface ModernDashboardProps {
  businessInfo: BusinessInfo
}

export function ModernDashboard({ businessInfo }: ModernDashboardProps) {
  const [selectedKeyword, setSelectedKeyword] = useState(businessInfo.keywords[0])
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 }) // Default to NYC
  const [gridSize, setGridSize] = useState(7)
  const [pointDistance, setPointDistance] = useState(1)
  const [locationInput, setLocationInput] = useState("")
  const [gridPoints, setGridPoints] = useState<{ lat: number; lng: number }[]>([])
  const [visualizationType, setVisualizationType] = useState<"grid" | "heatmap">("grid")
  const [invertHeatmap, setInvertHeatmap] = useState(true)
  const [activeTab, setActiveTab] = useState("ranking")
  const [rankingData, setRankingData] = useState<Record<string, number[][]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldFetchData, setShouldFetchData] = useState(false)
  const [visualizationSupported, setVisualizationSupported] = useState(true)
  const [mapKey, setMapKey] = useState(Date.now()) // Used to force re-render the map

  // Check if visualization library is supported
  useEffect(() => {
    const checkVisualizationSupport = async () => {
      try {
        await loadGoogleMapsApi()

        if (!window.google.maps.visualization) {
          console.warn("Google Maps visualization library is not available")
          setVisualizationSupported(false)
        }
      } catch (error) {
        console.error("Error checking visualization support:", error)
        setVisualizationSupported(false)
      }
    }

    checkVisualizationSupport()
  }, [])

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

  // Initialize with business location
  useEffect(() => {
    if (businessInfo.location) {
      geocodeAddress()
    }
  }, [businessInfo.location, geocodeAddress])

  // Fetch data when grid points change
  useEffect(() => {
    if (shouldFetchData && gridPoints.length > 0 && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true)
        setError(null)

        try {
          const data: Record<string, number[][]> = {}

          // Fetch data for each keyword
          for (const keyword of businessInfo.keywords) {
            const locationParam = typeof businessInfo.location === 'string' 
              ? businessInfo.location 
              : businessInfo.location ? `${businessInfo.location.lat},${businessInfo.location.lng}` : '';
            const keywordData = await fetchRankingData(keyword, locationParam, gridPoints)
            data[keyword] = keywordData
          }

          setRankingData(data)
        } catch (error) {
          console.error("Error fetching ranking data:", error)
          setError("Failed to fetch ranking data. Please try again later.")
        } finally {
          setIsLoading(false)
          setShouldFetchData(false)
        }
      }

      fetchData()
    }
  }, [shouldFetchData, gridPoints, businessInfo.keywords, businessInfo.location, isLoading])

  // Disable heatmap if visualization is not supported
  useEffect(() => {
    if (!visualizationSupported && visualizationType === "heatmap") {
      setVisualizationType("grid")
      setError("Heatmap visualization is not available. Using grid view instead.")
    }
  }, [visualizationSupported, visualizationType])

  // Create a wrapper function to handle the type conversion
  const handleVisualizationTypeChange = (type: string) => {
    if (type === "grid" || type === "heatmap") {
      setVisualizationType(type);
    }
  }

  // Render the appropriate content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "ranking":
        return (
          <div className="h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50 backdrop-blur-sm">
                <div className="text-center bg-white p-6 rounded-lg shadow-lg">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute top-1 left-1 w-14 h-14 rounded-full border-4 border-t-transparent border-r-primary border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
                    <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-transparent border-b-primary border-l-transparent animate-spin animation-delay-300"></div>
                  </div>
                  <p className="text-lg font-medium text-foreground">Loading ranking data...</p>
                  <p className="text-sm text-muted-foreground mt-1">Please wait a moment</p>
                </div>
              </div>
            )}

            {error && (
              <Alert className="mb-4 bg-destructive/10">
                <InfoIcon className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {visualizationType === "grid" && (
              <>
                <div className="absolute top-4 right-4 z-10 bg-white/95 p-3 rounded-lg shadow-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1">
                      <img src="/images/rank-icons/1.png" alt="Rank 1" className="w-6 h-6" />
                      <span className="text-xs font-medium">Top 3</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <img src="/images/rank-icons/5.png" alt="Rank 5" className="w-6 h-6" />
                      <span className="text-xs font-medium">4-7</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <img src="/images/rank-icons/9.png" alt="Rank 9" className="w-6 h-6" />
                      <span className="text-xs font-medium">8-10</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <img src="/images/rank-icons/14.png" alt="Rank 14" className="w-6 h-6" />
                      <span className="text-xs font-medium">11-15</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <img src="/images/rank-icons/19.png" alt="Rank 19" className="w-6 h-6" />
                      <span className="text-xs font-medium">16-20</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <img src="/images/rank-icons/X.png" alt="Rank 20+" className="w-6 h-6" />
                      <span className="text-xs font-medium">Above 20</span>
                    </div>
                  </div>
                </div>
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
              </>
            )}
            {visualizationType === "heatmap" && visualizationSupported && (
              <HeatmapVisualization
                businessInfo={businessInfo}
                gridData={rankingData[selectedKeyword] || []}
                gridPoints={gridPoints}
                mapCenter={mapCenter}
              />
            )}
          </div>
        )
      case "keyword-comparison":
        return <KeywordComparison businessInfo={businessInfo} rankingData={rankingData} />
      case "competitive":
        return <CompetitiveAnalysis businessInfo={businessInfo} gridCenter={mapCenter} />
      case "historical":
        return <HistoricalComparison businessInfo={businessInfo} />
      case "recommendations":
        return <StrategicRecommendations businessInfo={businessInfo} />
      case "export":
        return <ExportReport businessInfo={businessInfo} />
      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar
          businessInfo={businessInfo}
          selectedKeyword={selectedKeyword}
          setSelectedKeyword={setSelectedKeyword}
          gridSize={gridSize}
          setGridSize={setGridSize}
          pointDistance={pointDistance}
          setPointDistance={setPointDistance}
          visualizationType={visualizationType}
          setVisualizationType={handleVisualizationTypeChange}
          invertHeatmap={invertHeatmap}
          setInvertHeatmap={setInvertHeatmap}
          locationInput={locationInput}
          setLocationInput={setLocationInput}
          onLocationUpdate={geocodeAddress}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          visualizationSupported={visualizationSupported}
        />
        <SidebarInset className="bg-slate-50">
          {activeTab === "ranking" && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Alert className="bg-white/95 border shadow-md max-w-md">
                <InfoIcon className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Showing rankings for <strong className="text-blue-700">"{selectedKeyword}"</strong>. Lower numbers
                  indicate better rankings.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="h-full p-4">{renderContent()}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
