"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Search, MapPin, Loader2, Star, Globe, Phone, Clock, ExternalLink, Grid, List, ChevronLeft, ChevronRight } from "lucide-react"
import { debounce } from "lodash"

// Define types
interface Business {
  name: string
  place_id: string
  rating?: number
  user_ratings_total?: number
  vicinity?: string
  formatted_address?: string
  types?: string[]
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  photos?: {
    photo_reference: string
    height: number
    width: number
  }[]
  opening_hours?: {
    open_now?: boolean
  }
  website?: string
  formatted_phone_number?: string
}

export function GeoSeoTool() {
  // State
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Business[]>([])
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [resultsPerPage] = useState(10)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1200)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const { toast } = useToast()

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return
      
      try {
        if (!window.google || !window.google.maps) {
          // In a real app, you'd load the Google Maps API here
          // For this example, we'll assume it's already loaded
          console.error("Google Maps not loaded")
          return
        }
        
        // Create map instance
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of the USA
          zoom: 4,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: false,
        })
        
        mapInstanceRef.current = mapInstance
        setMapLoaded(true)
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }
    
    initMap()
    
    // Get viewport width for responsive design
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }
    
    window.addEventListener("resize", handleResize)
    handleResize()
    
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Handle search submission
  const handleSearch = async () => {
    if (!businessName && !businessType) {
      toast({
        title: "Please enter a search term",
        description: "Enter a business name or type to search",
        variant: "destructive"
      })
      return
    }
    
    setIsSearching(true)
    setResults([])
    
    try {
      // Build the search query
      const searchQuery = businessName && businessType 
        ? `${businessName} ${businessType}` 
        : businessName || businessType
      
      // Call the API with pagination
      let allResults: Business[] = []
      let nextPageToken: string | null = null
      
      // First page of results
      const firstPageResults = await fetchResults(searchQuery)
      allResults = [...firstPageResults.results]
      nextPageToken = firstPageResults.nextPageToken
      
      // Fetch additional pages if available (up to 3 pages total / 60 results)
      for (let i = 0; i < 2 && nextPageToken; i++) {
        // Wait 2 seconds between requests as required by Google
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const nextPageResults = await fetchResults(searchQuery, nextPageToken)
        allResults = [...allResults, ...nextPageResults.results]
        nextPageToken = nextPageResults.nextPageToken
        
        // Break early if no more pages
        if (!nextPageToken) break
      }
      
      setResults(allResults)
      setTotalPages(Math.ceil(allResults.length / resultsPerPage))
      setCurrentPage(1)
      
      // Update map with markers for the top 20 businesses
      updateMapMarkers(allResults.slice(0, 20))
      
      toast({
        title: "Search completed",
        description: `Found ${allResults.length} businesses matching your search`,
      })
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search failed",
        description: "There was an error processing your search. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }
  
  // Fetch results from the API
  const fetchResults = async (query: string, pageToken?: string | null) => {
    const response = await fetch("/api/places-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        location: { lat: 39.8283, lng: -98.5795 }, // Center of USA as default
        radius: 5000000, // Very large radius to cover nationwide
        rankBy: "prominence",
        pageToken
      }),
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  }
  
  // Update map markers
  const updateMapMarkers = (businesses: Business[]) => {
    if (!mapInstanceRef.current || !mapLoaded) return
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    
    // Add new markers
    const bounds = new google.maps.LatLngBounds()
    const markers = businesses.map((business, index) => {
      const position = {
        lat: business.geometry.location.lat,
        lng: business.geometry.location.lng
      }
      
      // Extend bounds to include this location
      bounds.extend(position)
      
      // Create marker
      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: business.name,
        label: {
          text: `${index + 1}`,
          color: 'white'
        },
        animation: google.maps.Animation.DROP
      })
      
      // Create info window content
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="width: 200px; padding: 10px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${business.name}</h3>
            <p style="margin: 0 0 5px 0; font-size: 13px;">Rank: #${index + 1}</p>
            ${business.rating ? `
              <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <span style="color: #FFD700; margin-right: 5px;">★</span>
                <span style="font-size: 13px;">${business.rating} (${business.user_ratings_total || 0} reviews)</span>
              </div>
            ` : ''}
            <p style="margin: 0; font-size: 13px;">${business.vicinity || business.formatted_address || ''}</p>
          </div>
        `
      })
      
      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })
      
      return marker
    })
    
    // Save markers reference
    markersRef.current = markers
    
    // Fit map to bounds if we have markers
    if (markers.length > 0) {
      mapInstanceRef.current.fitBounds(bounds)
      
      // Ensure we're not zoomed in too much on single locations
      const listener = mapInstanceRef.current.addListener('idle', () => {
        if (mapInstanceRef.current?.getZoom()! > 16) {
          mapInstanceRef.current?.setZoom(16)
        }
        google.maps.event.removeListener(listener)
      })
    }
  }
  
  // Get current page of results
  const getCurrentPageResults = () => {
    const startIndex = (currentPage - 1) * resultsPerPage
    const endIndex = startIndex + resultsPerPage
    return results.slice(startIndex, endIndex)
  }
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null
    
    return (
      <div className="flex items-center justify-center mt-6 space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-sm">
          Page {currentPage} of {totalPages}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Geo SEO Analysis Tool</h1>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              placeholder="e.g. Starbucks"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="business-type">Business Type</Label>
            <Input
              id="business-type"
              placeholder="e.g. coffee shop"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleSearch}
              disabled={isSearching || (!businessName && !businessType)}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {results.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {results.length} Results for "{businessName || businessType || 'All Businesses'}"
            </h2>
            
            <div className="flex space-x-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4 mr-1" />
                Grid
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className={`${viewMode === "list" ? "lg:col-span-2" : "lg:col-span-3"}`}>
              {viewMode === "list" ? (
                <div className="space-y-4">
                  {getCurrentPageResults().map((business, index) => {
                    const rankNumber = (currentPage - 1) * resultsPerPage + index + 1
                    
                    return (
                      <Card key={business.place_id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex">
                          <div className="w-16 h-16 flex-shrink-0 bg-blue-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-blue-600">#{rankNumber}</span>
                          </div>
                          
                          <div className="flex-1 p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{business.name}</h3>
                                {business.rating && (
                                  <div className="flex items-center mt-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                    <span className="text-sm">
                                      {business.rating} ({business.user_ratings_total || 0} reviews)
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {business.website && (
                                <a 
                                  href={business.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            
                            <div className="flex items-center mt-2 text-gray-600 text-sm">
                              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span>{business.vicinity || business.formatted_address || 'Address not available'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center text-sm">
                                {business.opening_hours?.open_now !== undefined && (
                                  <div className="flex items-center mr-4">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span className={business.opening_hours.open_now ? "text-green-600" : "text-red-600"}>
                                      {business.opening_hours.open_now ? "Open" : "Closed"}
                                    </span>
                                  </div>
                                )}
                                
                                {business.formatted_phone_number && (
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-1" />
                                    <span>{business.formatted_phone_number}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center text-xs text-gray-500">
                                <Globe className="h-3.5 w-3.5 mr-1" />
                                <span>
                                  {business.types?.map(type => type.replace(/_/g, ' ')).slice(0, 2).join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`}>
                  {getCurrentPageResults().map((business, index) => {
                    const rankNumber = (currentPage - 1) * resultsPerPage + index + 1
                    
                    return (
                      <Card key={business.place_id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative">
                          <div className="absolute top-0 left-0 w-10 h-10 bg-blue-600 text-white flex items-center justify-center z-10">
                            <span className="font-bold">#{rankNumber}</span>
                          </div>
                          
                          <div className="h-32 bg-gray-100 flex items-center justify-center">
                            {business.photos?.length ? (
                              <div className="w-full h-full bg-gray-200">
                                {/* In a real app, you'd fetch and display the photo here */}
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400">Photo available</span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                No photo
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-base line-clamp-1">{business.name}</h3>
                          
                          {business.rating && (
                            <div className="flex items-center mt-1">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
                              <span className="text-xs">
                                {business.rating} ({business.user_ratings_total || 0})
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center mt-2 text-gray-600 text-xs">
                            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                            <span className="line-clamp-1">
                              {business.vicinity || business.formatted_address || 'Address not available'}
                            </span>
                          </div>
                          
                          {business.opening_hours?.open_now !== undefined && (
                            <div className="flex items-center mt-2 text-xs">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              <span className={business.opening_hours.open_now ? "text-green-600" : "text-red-600"}>
                                {business.opening_hours.open_now ? "Open" : "Closed"}
                              </span>
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="p-4 pt-0 flex justify-between">
                          <div className="text-xs text-gray-500">
                            {business.types?.slice(0, 1).map(type => 
                              type.replace(/_/g, ' ')
                            )}
                          </div>
                          
                          {business.website && (
                            <a 
                              href={business.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
              
              {renderPagination()}
            </div>
            
            {viewMode === "list" && (
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 sticky top-4">
                  <h3 className="font-semibold mb-4">Top 20 Results Map</h3>
                  <div className="w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden">
                    <div ref={mapRef} className="w-full h-full" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Shows top 20 search results. Click markers for more details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {results.length === 0 && !isSearching && (
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No search results yet</h3>
          <p className="text-gray-500 mb-4">
            Enter a business name and/or type above to see how it ranks in Google search results.
          </p>
        </div>
      )}
    </div>
  )
}

export default GeoSeoTool 