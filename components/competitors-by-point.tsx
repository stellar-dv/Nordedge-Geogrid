"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { SpotInfo } from "./spot-info"
import { LoadingSpinner } from "./loading-spinner"
import { XCircle, ClipboardCopy, MapPin, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// Define the interface for place details
interface Place {
  placeId: string
  name: string
  address: string
  rating: number
  reviewCount: number
  lat: number
  lng: number
  selected?: boolean
  website?: string
  photos?: string[]
  distance?: number
}

// Props for the component
interface CompetitorsByPointProps {
  active: boolean
  onClose: () => void
  businessName: string
  businessAddress: string
  searchTerm: string
  latitude: number
  longitude: number
  pointRanking: number
  onShowCompetitorGeogrid?: (placeId: string) => void
}

export function CompetitorsByPoint({
  active,
  onClose,
  businessName,
  businessAddress,
  searchTerm,
  latitude,
  longitude,
  pointRanking,
  onShowCompetitorGeogrid
}: CompetitorsByPointProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Format coordinates for display
  const formattedCoords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

  // Copy coordinates to clipboard
  const copyCoordinates = () => {
    navigator.clipboard.writeText(formattedCoords)
      .then(() => {
        // Could show a toast notification here
        console.log("Coordinates copied to clipboard")
      })
      .catch(err => {
        console.error("Failed to copy coordinates", err)
      })
  }

  // Initialize map and fetch data
  useEffect(() => {
    if (!active || !mapRef.current) return

    const fetchNearbyCompetitors = async () => {
      setLoading(true)
      setError(null)

      try {
        // Initialize Google Map
        if (!mapRef.current) return;
        const googleMap = new google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 14,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        
        setMapInstance(googleMap)

        // Add marker for the grid point
        const iconColor = pointRanking <= 3 ? "#4CAF50" : 
                         pointRanking <= 7 ? "#8BC34A" : 
                         pointRanking <= 10 ? "#FFC107" :
                         pointRanking <= 15 ? "#FF9800" :
                         pointRanking <= 20 ? "#F44336" : "#9E9E9E";
        
        const iconText = pointRanking <= 20 ? pointRanking.toString() : "20+";
        
        // Create SVG marker icon
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
            <circle cx="15" cy="15" r="12" fill="${iconColor}" stroke="white" stroke-width="2" />
            <text x="15" y="20" font-family="Arial" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${iconText}</text>
          </svg>
        `;
        
        // Convert SVG to data URL
        const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        
        new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: googleMap,
          icon: {
            url: svgUrl,
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 15),
          },
          title: `Your Ranking: ${pointRanking <= 20 ? pointRanking : '20+'}`,
          zIndex: 100
        })

        // Fetch competitors from API
        const response = await fetch('/api/places-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchTerm,
            location: { lat: latitude, lng: longitude },
            rankBy: 'prominence',
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        const competitorResults = data.results || []

        // Process the competitors
        const competitors = competitorResults.map((place: any, index: number) => ({
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity || 'Address unavailable',
          rating: place.rating || 0,
          reviewCount: place.user_ratings_total || 0,
          lat: place.geometry?.location?.lat || 0,
          lng: place.geometry?.location?.lng || 0,
          distance: place.distance || calculateDistance(
            latitude, 
            longitude, 
            place.geometry?.location?.lat, 
            place.geometry?.location?.lng
          ),
          photos: place.photos?.map((photo: any) => photo.photo_reference) || [],
          selected: false
        }))

        setPlaces(competitors)

        // Add markers for competitors
        competitors.forEach((place: Place, index: number) => {
          // Create an SVG marker icon for competitor
          const competitorSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26">
              <circle cx="13" cy="13" r="11" fill="#4285F4" stroke="white" stroke-width="2" />
              <text x="13" y="17" font-family="Arial" font-size="10" font-weight="bold" fill="white" text-anchor="middle">${index + 1}</text>
            </svg>
          `;
          
          // Convert SVG to data URL
          const competitorSvgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(competitorSvg);
          
          const marker = new google.maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map: googleMap,
            title: place.name,
            icon: {
              url: competitorSvgUrl,
              scaledSize: new google.maps.Size(26, 26),
              anchor: new google.maps.Point(13, 13),
            },
            zIndex: 50 - index // Ensure competitors are below the grid point marker
          })

          marker.addListener('click', () => {
            setSelectedPlaceId(place.placeId === selectedPlaceId ? null : place.placeId)
            
            // Create info window for the competitor
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 12px; max-width: 240px; font-family: Arial, sans-serif;">
                  <h3 style="font-weight: bold; margin: 0 0 8px 0; font-size: 14px; color: #4285F4;">${place.name}</h3>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${place.address}</p>
                  ${place.rating ? `
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                      <span style="color: #FFC107; font-weight: bold; font-size: 14px;">${place.rating.toFixed(1)}</span>
                      <span style="color: #666; font-size: 12px; margin-left: 4px;">(${place.reviewCount} reviews)</span>
                    </div>
                  ` : '<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">No ratings</p>'}
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    <span style="font-weight: bold; color: #444;">Distance:</span> 
                    ${(calculateDistance(latitude, longitude, place.lat, place.lng) / 1000).toFixed(2)} km
                  </p>
                </div>
              `
            });
            
            // Open the info window
            infoWindow.open(googleMap, marker);
          })

          markersRef.current.push(marker)
        })

        setLoading(false)
      } catch (err) {
        console.error('Error fetching competitors:', err)
        setError(err instanceof Error ? err.message : 'Failed to load competitors')
        setLoading(false)
      }
    }

    fetchNearbyCompetitors()

    return () => {
      // Clean up markers when component unmounts
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, [active, latitude, longitude, pointRanking, searchTerm, selectedPlaceId])

  // Handle place selection
  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId === selectedPlaceId ? null : placeId)
    
    // Update places to reflect selection state
    setPlaces(prevPlaces => 
      prevPlaces.map(place => ({
        ...place,
        selected: place.placeId === placeId && place.placeId !== selectedPlaceId
      }))
    )

    // Update marker styles if needed
    if (mapInstance) {
      markersRef.current.forEach((marker, index) => {
        if (places[index]?.placeId === placeId) {
          // Could update marker style here if needed
        }
      })
    }
  }

  // Helper function to calculate distance between two coordinates
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0
    
    const R = 6371e3 // Earth radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // in meters
    
    return distance
  }

  if (!active) return null

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 bg-background z-50 flex flex-col md:flex-row transition-all duration-300 ease-in-out",
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Header - Mobile and Desktop */}
      <div className="flex items-center justify-between p-4 border-b w-full md:hidden">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">{searchTerm} Competitors</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-2/5 lg:w-1/3 overflow-y-auto border-r">
        <div className="hidden md:flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Local Search Results</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        {/* Business info */}
        <div className="p-4 border-b bg-muted/40">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-700">{businessName}</h3>
            <span className={`text-sm px-2 py-1 rounded-full font-medium ${
              pointRanking <= 3 ? 'bg-green-100 text-green-800' : 
              pointRanking <= 10 ? 'bg-yellow-100 text-yellow-800' : 
              pointRanking <= 20 ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              Rank #{pointRanking <= 20 ? pointRanking : '20+'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{businessAddress}</p>
          <div className="flex items-center text-sm">
            <MapPin className="h-3.5 w-3.5 mr-1 text-blue-500" />
            <span className="text-muted-foreground mr-2">{formattedCoords}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyCoordinates}>
              <ClipboardCopy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-2">
            <p className="text-sm"><span className="font-medium">Search Term:</span> {searchTerm}</p>
          </div>
        </div>

        {/* List of competitors */}
        <div className="p-2">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-destructive">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setLoading(true)
                  // Refresh logic here
                }}
              >
                Try Again
              </Button>
            </div>
          ) : places.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground">No competitors found for "{searchTerm}" in this area.</p>
            </div>
          ) : (
            <div>
              <div className="p-2 mb-2">
                <h3 className="font-medium text-sm text-blue-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                  Found {places.length} competitors within 1.5km
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Click on a competitor to view more details and see their location on the map
                </p>
              </div>
              <div className="space-y-2 px-2">
                {places.map((place, index) => (
                  <SpotInfo
                    key={place.placeId}
                    place={{
                      ...place,
                      order: index + 1,
                      selected: place.placeId === selectedPlaceId
                    }}
                    onSelect={() => handleSelectPlace(place.placeId)}
                    onShowGeogrid={onShowCompetitorGeogrid ? () => onShowCompetitorGeogrid(place.placeId) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="w-full md:w-3/5 lg:w-2/3 h-[300px] md:h-full">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  )
} 