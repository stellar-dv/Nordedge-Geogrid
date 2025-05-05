"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { BusinessInfo, MapCenter, GridPoint } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { generateGridPoints } from "@/lib/utils"
import { FallbackMap } from "@/components/fallback-map"

// Helper function to get color based on ranking
function getRankingColor(ranking: number): string {
  if (ranking <= 3) return "#059669" // emerald-600
  if (ranking <= 7) return "#10b981" // green-500
  if (ranking <= 10) return "#f59e0b" // amber-500
  if (ranking <= 15) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

interface MapViewProps {
  businessInfo: BusinessInfo
  selectedKeyword: string
  mapCenter: MapCenter
  gridSize: number
  pointDistance: number
  rankingData: number[][]
  onGridPointsUpdate: (points: GridPoint[]) => void
  isLoading: boolean
  error: string | null
}

export function MapView({
  businessInfo,
  selectedKeyword,
  mapCenter,
  gridSize,
  pointDistance,
  rankingData,
  onGridPointsUpdate,
  isLoading,
  error,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [apiLoadFailed, setApiLoadFailed] = useState(false)
  const [loadAttempts, setLoadAttempts] = useState(0)
  const [gridPoints, setGridPoints] = useState<GridPoint[]>([])

  // Store markers in a ref to avoid dependency issues
  const markersRef = useRef<any[]>([])

  // Clean up markers function
  const cleanupMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      markersRef.current = []
    }
  }, [])

  // Add markers for grid points
  const addGridMarkers = useCallback(
    (map: any) => {
      if (!map || !rankingData || rankingData.length === 0 || !window.google || !window.google.maps) return

      gridPoints.forEach((point, index) => {
        const row = Math.floor(index / gridSize)
        const col = index % gridSize

        if (rankingData[row] && typeof rankingData[row][col] !== "undefined") {
          const ranking = rankingData[row][col]

          // Skip if ranking is 0 (no data)
          if (ranking === 0) return

          // Create standard marker with color based on ranking
          const marker = new window.google.maps.Marker({
            position: point,
            map: map,
            title: `Ranking: ${ranking}`,
            label: {
              text: ranking.toString(),
              color: "#FFFFFF",
              fontWeight: "bold",
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: getRankingColor(ranking),
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#FFFFFF",
              scale: 12,
            },
          })

          markersRef.current.push(marker)
        }
      })
    },
    [rankingData, gridPoints, gridSize],
  )

  // Generate grid points
  useEffect(() => {
    const points = generateGridPoints(mapCenter, gridSize, pointDistance)
    setGridPoints(points)
    onGridPointsUpdate(points)
  }, [mapCenter, gridSize, pointDistance, onGridPointsUpdate])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    let isMounted = true
    setIsMapLoading(true)
    setMapError(null)

    const initializeMap = async () => {
      try {
        await loadGoogleMaps()

        if (!isMounted || !mapRef.current || !window.google || !window.google.maps) {
          return
        }

        // Create map instance
        const map = new window.google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 12,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            [
              {
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#f5f5f5"
                  }
                ]
              },
              {
                "elementType": "labels.icon",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#616161"
                  }
                ]
              },
              {
                "elementType": "labels.text.stroke",
                "stylers": [
                  {
                    "color": "#f5f5f5"
                  }
                ]
              },
              {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "administrative.land_parcel",
                "elementType": "labels",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#bdbdbd"
                  }
                ]
              },
              {
                "featureType": "administrative.neighborhood",
                "stylers": [
                  {
                    "visibility": "simplified"
                  }
                ]
              },
              {
                "featureType": "administrative.neighborhood",
                "elementType": "labels.text",
                "stylers": [
                  {
                    "color": "#8c8c8c"
                  },
                  {
                    "weight": 0.5
                  }
                ]
              },
              {
                "featureType": "poi",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#eeeeee"
                  }
                ]
              },
              {
                "featureType": "poi",
                "elementType": "labels.text",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#757575"
                  }
                ]
              },
              {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#e5f0db"
                  },
                  {
                    "visibility": "on"
                  }
                ]
              },
              {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#9e9e9e"
                  }
                ]
              },
              {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#ffffff"
                  }
                ]
              },
              {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#ffffff"
                  }
                ]
              },
              {
                "featureType": "road.arterial",
                "elementType": "labels",
                "stylers": [
                  {
                    "visibility": "simplified"
                  }
                ]
              },
              {
                "featureType": "road.arterial",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#a8a8a8"
                  }
                ]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#ffefd5"
                  }
                ]
              },
              {
                "featureType": "road.highway",
                "elementType": "labels",
                "stylers": [
                  {
                    "visibility": "simplified"
                  }
                ]
              },
              {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#616161"
                  }
                ]
              },
              {
                "featureType": "road.local",
                "elementType": "labels",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#9e9e9e"
                  }
                ]
              },
              {
                "featureType": "transit",
                "stylers": [
                  {
                    "visibility": "off"
                  }
                ]
              },
              {
                "featureType": "transit.line",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#e5e5e5"
                  }
                ]
              },
              {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#eeeeee"
                  }
                ]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#d1e8ff"
                  }
                ]
              },
              {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#9e9e9e"
                  }
                ]
              }
            ],
          ],
        })

        setMapInstance(map)
        setIsMapLoading(false)
        setApiLoadFailed(false)

        // Add a marker at the center
        const centerMarker = new window.google.maps.Marker({
          position: mapCenter,
          map,
          title: businessInfo.name,
          animation: window.google.maps.Animation.DROP,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#0ea5e9",
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 10,
          },
        })

        markersRef.current.push(centerMarker)

        // Add markers for grid points
        addGridMarkers(map)
      } catch (err) {
        console.error("Error initializing map:", err)
        if (isMounted) {
          setMapError("Failed to load Google Maps API. The API may not be enabled for your project.")
          setIsMapLoading(false)
          setApiLoadFailed(true)
        }
      }
    }

    // Clean up previous markers before initializing
    cleanupMarkers()

    initializeMap()

    return () => {
      isMounted = false
      cleanupMarkers()
    }
  }, [mapCenter, loadAttempts, businessInfo.name, cleanupMarkers, addGridMarkers])

  // Update markers when ranking data changes
  useEffect(() => {
    if (!mapInstance || apiLoadFailed) return

    // Clean up previous markers
    cleanupMarkers()

    // Add new markers
    addGridMarkers(mapInstance)
  }, [mapInstance, rankingData, apiLoadFailed, cleanupMarkers, addGridMarkers])

  // Handle map reload
  const handleRetry = useCallback(() => {
    setIsMapLoading(true)
    setMapError(null)
    setApiLoadFailed(false)
    setLoadAttempts((prev) => prev + 1)
    cleanupMarkers()
  }, [cleanupMarkers])

  // If API failed to load, show fallback component
  if (apiLoadFailed) {
    return (
      <FallbackMap
        businessInfo={businessInfo}
        selectedKeyword={selectedKeyword}
        mapCenter={mapCenter}
        gridSize={gridSize}
        pointDistance={pointDistance}
        rankingData={rankingData}
        onRetry={handleRetry}
      />
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Ranking Map for "{selectedKeyword}"</span>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 text-white border-white/40 hover:bg-white/30 hover:text-white"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reload Map
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {(error || mapError) && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || mapError}</AlertDescription>
          </Alert>
        )}

        <div className="p-4">
          <div className="flex items-center justify-center flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
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

        <div className="relative h-[600px]">
          {(isLoading || isMapLoading) && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-t-teal-500 border-b-teal-700 border-l-teal-600 border-r-teal-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-white"></div>
                  </div>
                </div>
                <p className="mt-4 text-lg font-medium text-slate-700">Loading map data...</p>
                <p className="text-sm text-slate-500">This may take a moment</p>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}
