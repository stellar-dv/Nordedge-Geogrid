"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { loadGoogleMapsApi } from "@/utils/google-maps-loader"
import { CompetitorsByPoint } from "./competitors-by-point"

interface GoogleMapProps {
  center: { lat: number; lng: number }
  zoom: number
  gridSize: number
  pointDistance: number
  gridData?: number[][]
  searchKeyword?: string
  businessInfo?: {
    name: string
    address: string
  }
  onGridPointsGenerated?: (points: { lat: number; lng: number }[]) => void
}

export function GoogleMap({ 
  center, 
  zoom, 
  gridSize, 
  pointDistance, 
  gridData, 
  searchKeyword = 'business',
  businessInfo = { name: 'Your Business', address: 'Business Address' },
  onGridPointsGenerated 
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadAttempts, setLoadAttempts] = useState(0)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const [googleMapsApi, setGoogleMapsApi] = useState<{
    maps: typeof google.maps
  } | null>(null)
  
  // New state for competitors view
  const [showCompetitors, setShowCompetitors] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<{
    lat: number
    lng: number
    ranking: number
  } | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    let isMounted = true
    setIsLoading(true)
    setError(null)

    const initializeMap = async () => {
      try {
        // Load Google Maps API
        const googleMaps = await loadGoogleMapsApi()
        setGoogleMapsApi(googleMaps)

        if (!isMounted || !mapRef.current) return

        console.log("Creating map instance")

        // Create map instance
        const mapInstance = new googleMaps.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeId: googleMaps.maps.MapTypeId.ROADMAP,
        })

        mapInstanceRef.current = mapInstance
        placesServiceRef.current = new googleMaps.maps.places.PlacesService(mapInstance)

        // Add a marker at the center
        new googleMaps.maps.Marker({
          position: center,
          map: mapInstance,
          title: `${businessInfo.name} (Your Business Location)`,
          icon: {
            path: googleMaps.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4', // Google blue
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 12,
          },
          animation: googleMaps.maps.Animation.DROP,
          zIndex: 1000, // Ensure it's above all other markers
        })

        // Add a circle around the business location to show the service area
        new googleMaps.maps.Circle({
          strokeColor: '#4285F4',
          strokeOpacity: 0.3,
          strokeWeight: 2,
          fillColor: '#4285F4',
          fillOpacity: 0.05,
          map: mapInstance,
          center: center,
          radius: pointDistance * 1609.34, // Convert miles to meters
          zIndex: 1
        })

        // Generate grid points
        const points: { lat: number; lng: number }[] = []
        const offset = Math.floor(gridSize / 2)

        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            // Calculate lat/lng for this grid point
            const lat = center.lat + ((i - offset) * pointDistance) / 69 // Approximate miles to degrees latitude
            const lng = center.lng + ((j - offset) * pointDistance) / (69 * Math.cos(center.lat * (Math.PI / 180))) // Adjust for longitude

            points.push({ lat, lng })
          }
        }

        // Add markers for grid points if we have ranking data
        if (gridData && gridData.length > 0) {
          points.forEach((point, index) => {
            const row = Math.floor(index / gridSize)
            const col = index % gridSize

            if (gridData[row] && typeof gridData[row][col] !== "undefined") {
              const ranking = gridData[row][col]

              // Skip if ranking is 0 (no data)
              if (ranking === 0) return

              // Determine marker icon based on ranking
              let iconColor, iconText;

              // Map ranking to appropriate colors
              if (ranking <= 3) {
                // Top positions (1-3)
                iconColor = "#4CAF50"; // Green
                iconText = ranking.toString();
              } else if (ranking <= 7) {
                // Good positions (4-7) 
                iconColor = "#8BC34A"; // Light green
                iconText = ranking.toString();
              } else if (ranking <= 10) {
                // Average positions (8-10)
                iconColor = "#FFC107"; // Yellow/Amber
                iconText = ranking.toString();
              } else if (ranking <= 15) {
                // Below average positions (11-15)
                iconColor = "#FF9800"; // Orange
                iconText = ranking.toString();
              } else if (ranking <= 20) {
                // Poor positions (16-20)
                iconColor = "#F44336"; // Red
                iconText = ranking.toString();
              } else {
                // Not found (20+)
                iconColor = "#9E9E9E"; // Gray
                iconText = "20+";
              }

              // Create SVG marker icon with the ranking number
              const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                  <circle cx="15" cy="15" r="12" fill="${iconColor}" stroke="white" stroke-width="2" />
                  <text x="15" y="20" font-family="Arial" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${iconText}</text>
                </svg>
              `;
              
              // Convert SVG to data URL
              const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

              // Create custom marker with click handler for nearby businesses
              const marker = new googleMaps.maps.Marker({
                position: point,
                map: mapInstance,
                icon: {
                  url: svgUrl,
                  scaledSize: new googleMaps.maps.Size(30, 30),
                  anchor: new googleMaps.maps.Point(15, 15),
                },
                clickable: true, // Make sure the marker is clickable
                title: `Ranking: ${ranking <= 20 ? ranking : '20+'} for "${searchKeyword}"`, // Tooltip
                zIndex: 30 - (ranking > 20 ? 21 : ranking) // Higher rankings get higher z-index
              })

              // Add click listener to show nearby businesses
              marker.addListener('click', () => {
                // Save the selected point data
                setSelectedPoint({
                  lat: point.lat,
                  lng: point.lng,
                  ranking: ranking
                })
                // Show the competitors view
                setShowCompetitors(true)
              })
            }
          })
        }

        if (onGridPointsGenerated) {
          onGridPointsGenerated(points)
        }

        console.log("Map initialized successfully")
        setIsLoading(false)
      } catch (err) {
        console.error("Error initializing map:", err)
        if (isMounted) {
          setError(`Failed to initialize map: ${err instanceof Error ? err.message : "Unknown error"}`)
          setIsLoading(false)
        }
      }
    }

    initializeMap()

    return () => {
      isMounted = false
    }
  }, [center, zoom, gridSize, pointDistance, loadAttempts, onGridPointsGenerated, gridData, searchKeyword])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setLoadAttempts((prev) => prev + 1)
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md border p-6">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 text-destructive p-3 rounded-full inline-flex mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Map Loading Failed</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading Map
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md border">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute top-1 left-1 w-14 h-14 rounded-full border-4 border-t-transparent border-r-primary border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
            <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-t-transparent border-r-transparent border-b-primary border-l-transparent animate-spin animation-delay-300"></div>
          </div>
          <p className="text-lg font-medium">Loading map...</p>
          <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full rounded-md overflow-hidden shadow-md" />
      
      {selectedPoint && (
        <CompetitorsByPoint
          active={showCompetitors}
          onClose={() => setShowCompetitors(false)}
          businessName={businessInfo.name}
          businessAddress={businessInfo.address}
          searchTerm={searchKeyword}
          latitude={selectedPoint.lat}
          longitude={selectedPoint.lng}
          pointRanking={selectedPoint.ranking}
          onShowCompetitorGeogrid={(placeId) => {
            console.log(`Show geogrid for competitor: ${placeId}`)
            // Implement competitor geogrid functionality here if needed
          }}
        />
      )}
    </>
  )
}
