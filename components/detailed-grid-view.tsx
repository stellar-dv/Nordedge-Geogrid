"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Repeat, Download, Share2, Trash2, Users } from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { deleteGridResult, getCompetitors, type GridResult } from "@/lib/geogrid-service"
import { useRouter } from "next/navigation"

interface GridResultType {
  id: string;
  gridSize: number;
  distanceKm: number;
  gridData: number[][];
  businessInfo: {
    name: string;
    location: {
      lat: number;
      lng: number;
    };
    address?: string;
  };
  searchTerm: string;
  createdAt: string;
  googleRegion?: string;
  metrics: {
    agr: number; // average grid ranking
    atgr: number; // average top grid ranking
    solv: number; // search overlay visibility
  };
}

interface CompetitorBase {
  name: string;
  ranking: number;
  distance: number;
  rating?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

interface Competitor extends CompetitorBase {
  id: string;
}

type CompetitorDisplay = CompetitorBase;

interface DetailedGridViewProps {
  gridResult: GridResultType;
  isOpen?: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function DetailedGridView({ gridResult, isOpen = true, onClose, onDelete }: DetailedGridViewProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const router = useRouter()

  // Parse grid size and distance as numbers with fallbacks
  const gridSize = Number(gridResult.gridSize) || 13  // Default to 13 if NaN
  const distance = Number(gridResult.distanceKm) || 2.5  // Default to 2.5 if NaN

  // Ensure gridData is properly typed and has fallback
  const gridData = Array.isArray(gridResult.gridData) ? gridResult.gridData : []

  // Parse location coordinates with fallbacks
  const location = {
    lat: Number(gridResult.businessInfo?.location?.lat) || 0,
    lng: Number(gridResult.businessInfo?.location?.lng) || 0
  }

  // Initialize map
  useEffect(() => {
    // Don't try to initialize if the component isn't fully mounted
    if (!mapRef.current || !isOpen) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Start map initialization
    initMap();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
    
    async function initMap() {
      if (!window.google || !window.google.maps) {
        try {
          // Load Google Maps API
          console.log("Loading Google Maps API...");
          await loadGoogleMaps();
          
          // Safety check after async operation
          if (!isMounted) {
            console.log("Component unmounted during API load");
            return;
          }
        } catch (error) {
          console.error("Failed to load Google Maps API:", error);
          if (isMounted) {
            setMapError(`Failed to load Google Maps API: ${error instanceof Error ? error.message : "Unknown error"}`);
            setMapLoaded(true); // End loading state even on error
          }
          return;
        }
      }

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (isMounted && !mapLoaded) {
          console.warn("Map loading timed out after 10 seconds");
          setMapError("Map loading timed out. Please try again.");
          setMapLoaded(true);
        }
      }, 10000);

      try {
        // Safety check to make sure window.google exists
        if (!window.google || !window.google.maps) {
          throw new Error("Google Maps not available after loading");
        }

        console.log("Creating map instance");
        if (!mapRef.current) {
          throw new Error("Map container element not found");
        }

        // Create the map instance
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.fill",
              stylers: [{ color: "#ffffff" }, { lightness: 17 }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
            },
            {
              featureType: "road.arterial",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }, { lightness: 18 }],
            },
            {
              featureType: "road.local",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }, { lightness: 16 }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#dedede" }, { lightness: 21 }],
            },
            {
              elementType: "labels.text.stroke",
              stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
            },
            {
              elementType: "labels.text.fill",
              stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }],
            },
            {
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.fill",
              stylers: [{ color: "#fefefe" }, { lightness: 20 }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
            },
          ],
        });

        mapInstanceRef.current = mapInstance;
        
        // Create places service only if the map instance is available
        if (window.google.maps.places) {
          placesServiceRef.current = new window.google.maps.places.PlacesService(mapInstance);
        }

        // No need to draw grid here since we have a separate useEffect for it

        if (isMounted) {
          console.log("Map initialized successfully");
          setMapLoaded(true);
        }
      } catch (error) {
        console.error("Error initializing map:", error);
        if (isMounted) {
          setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : "Unknown error"}`);
          setMapLoaded(true); // Force loading to end even on error
        }
      } finally {
        // Clear the timeout
        if (timeoutId) clearTimeout(timeoutId);
      }
    }
  }, [isOpen, location]);

  // Load competitors
  useEffect(() => {
    const loadCompetitors = async () => {
      try {
        const data = await getCompetitors(gridResult.id)
        const typedCompetitors: Competitor[] = data.map((comp: any) => ({
          id: comp.id || '',
          name: comp.name || '',
          ranking: comp.ranking || 0,
          distance: comp.distance || 0,
          location: comp.location ? {
            lat: Number(comp.location.lat),
            lng: Number(comp.location.lng)
          } : undefined,
          rating: comp.rating ? Number(comp.rating) : undefined
        }))
        setCompetitors(typedCompetitors)
      } catch (error) {
        console.error("Error loading competitors:", error)
      }
    }

    loadCompetitors()
  }, [gridResult.id])

  // Helper function to get color based on ranking
  function getRankingColor(ranking: number): string {
    if (ranking <= 3) return "#059669" // emerald-600 for top 3
    if (ranking <= 7) return "#10b981" // green-500 for 4-7
    if (ranking <= 10) return "#f59e0b" // amber-500 for 8-10 
    if (ranking <= 15) return "#f97316" // orange-500 for 11-15
    if (ranking >= 16) return "#ef4444" // red-500 for 16 and above (including 20+)
    return "#ef4444" // fallback to red-500
  }

  // Helper function to format ranking label
  function formatRankingLabel(ranking: number): string {
    if (ranking >= 20) {
      return "20+";
    }
    return ranking.toString();
  }

  // Handle repeat search
  const handleRepeatSearch = () => {
    window.location.href = `/new-search?business=${encodeURIComponent(gridResult.businessInfo.name)}&searchTerm=${encodeURIComponent(
      gridResult.searchTerm,
    )}`
  }

  // Handle open PNG
  const handleOpenPNG = () => {
    // Create a canvas element to draw the grid
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const gridSize = gridResult.gridSize || 13
    const cellSize = 40
    const padding = 20

    // Set canvas dimensions
    canvas.width = gridSize * cellSize + padding * 2
    canvas.height = gridSize * cellSize + padding * 2 + 60 // Extra space for title

    if (!ctx) return

    // Fill background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = "#000000"
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${gridResult.businessInfo.name} - "${gridResult.searchTerm}"`, canvas.width / 2, 30)

    // Draw grid
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = j * cellSize + padding
        const y = i * cellSize + padding + 60
        const ranking = gridData[i][j]

        // Draw cell background
        ctx.fillStyle = ranking === 0 ? "#F3F4F6" : getRankingColor(ranking)
        ctx.fillRect(x, y, cellSize, cellSize)

        // Draw cell border
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, cellSize, cellSize)

        // Draw ranking text
        if (ranking > 0) {
          ctx.fillStyle = "#FFFFFF"
          ctx.font = "bold 14px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(formatRankingLabel(ranking), x + cellSize / 2, y + cellSize / 2)
        }
      }
    }

    // Draw business location marker
    const centerX = Math.floor(gridSize / 2)
    const centerY = Math.floor(gridSize / 2)
    const markerX = centerX * cellSize + padding + cellSize / 2
    const markerY = centerY * cellSize + padding + 60 + cellSize / 2

    ctx.beginPath()
    ctx.arc(markerX, markerY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = "#3B82F6"
    ctx.fill()
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 2
    ctx.stroke()

    // Convert canvas to PNG and open in new tab
    const dataUrl = canvas.toDataURL("image/png")
    const newTab = window.open()
    if (newTab) {
      newTab.document.write(`<img src="${dataUrl}" alt="GeoGrid Result" style="max-width: 100%;">`)
      newTab.document.title = `GeoGrid - ${gridResult.businessInfo.name}`
    }
  }

  // Handle CSV download
  const handleCSVDownload = () => {
    // Generate CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add header row with business info
    csvContent += `"GeoGrid Results for ${gridResult.businessInfo.name}"\n`
    csvContent += `"Search Term: ${gridResult.searchTerm}"\n`
    csvContent += `"Date: ${new Date(gridResult.createdAt).toLocaleString()}"\n\n`

    // Add grid data header
    csvContent += "Row,Column,Latitude,Longitude,Ranking\n"

    // Calculate grid coordinates
    const gridSize = gridResult.gridSize || 13
    const distance = gridResult.distanceKm || 2.5 // km
    const latKmRatio = 1 / 110.574 // approx km per degree of latitude
    const lngKmRatio = 1 / (111.32 * Math.cos((location.lat * Math.PI) / 180)) // approx km per degree of longitude

    const startLat = location.lat - (distance * latKmRatio * (gridSize - 1)) / 2
    const startLng = location.lng - (distance * lngKmRatio * (gridSize - 1)) / 2

    // Add grid data rows
    gridData.forEach((row: number[], rowIndex: number) => {
      row.forEach((ranking: number, colIndex: number) => {
        const lat = startLat + rowIndex * distance * latKmRatio
        const lng = startLng + colIndex * distance * lngKmRatio
        csvContent += `${rowIndex + 1},${colIndex + 1},${lat.toFixed(6)},${lng.toFixed(6)},${ranking}\n`
      })
    })

    // Add metrics
    csvContent += `\n"Metrics:"\n`
    csvContent += `"AGR (Average Grid Ranking)",${gridResult.metrics.agr.toFixed(1)}\n`
    csvContent += `"ATGR (Average Top Grid Ranking)",${gridResult.metrics.atgr.toFixed(2)}\n`
    csvContent += `"SoLV (Share of Local Voice)",${gridResult.metrics.solv}\n`

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `geogrid-${gridResult.businessInfo.name.replace(/\s+/g, "-")}-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle share
  const handleShare = () => {
    // Create a shareable link
    const shareUrl = `${window.location.origin}/grid/${gridResult.id}`

    // Check if Web Share API is available
    if (navigator.share) {
      navigator
        .share({
          title: `GeoGrid Results for ${gridResult.businessInfo.name}`,
          text: `Check out the GeoGrid results for "${gridResult.businessInfo.name}" searching for "${gridResult.searchTerm}"`,
          url: shareUrl,
        })
        .catch((error) => {
          console.log("Error sharing:", error)
          fallbackShare(shareUrl)
        })
    } else {
      fallbackShare(shareUrl)
    }
  }

  // Add this helper function for sharing
  const fallbackShare = (url: string) => {
    // Create a temporary input to copy the URL
    const input = document.createElement("input")
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand("copy")
    document.body.removeChild(input)

    // Show toast notification
    alert("Link copied to clipboard!")
  }

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this grid result for "${gridResult.businessInfo.name}"?`)) {
      try {
        setIsDeleting(true)
        const success = await deleteGridResult(gridResult.id)

        if (success) {
          onDelete()
          onClose()
        } else {
          alert("Failed to delete the grid result. Please try again.")
        }
      } catch (error) {
        console.error("Error deleting grid result:", error)
        alert("An error occurred while deleting the grid result.")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  // Handle competitors view
  const handleCompetitorsView = () => {
    // Create modal container
    const modal = document.createElement("div")
    modal.style.position = "fixed"
    modal.style.top = "0"
    modal.style.left = "0"
    modal.style.width = "100%"
    modal.style.height = "100%"
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
    modal.style.display = "flex"
    modal.style.alignItems = "center"
    modal.style.justifyContent = "center"
    modal.style.zIndex = "9999"

    // Create modal content
    const content = document.createElement("div")
    content.style.backgroundColor = "white"
    content.style.padding = "24px"
    content.style.borderRadius = "8px"
    content.style.maxWidth = "600px"
    content.style.width = "90%"
    content.style.maxHeight = "80vh"
    content.style.overflowY = "auto"

    // Add title
    const title = document.createElement("h2")
    title.textContent = "Competitors"
    title.style.marginBottom = "16px"
    title.style.fontSize = "1.5rem"
    title.style.fontWeight = "bold"

    // Add close button
    const closeButton = document.createElement("button")
    closeButton.textContent = "Close"
    closeButton.style.padding = "8px 16px"
    closeButton.style.backgroundColor = "#f3f4f6"
    closeButton.style.border = "none"
    closeButton.style.borderRadius = "4px"
    closeButton.style.cursor = "pointer"
    closeButton.style.marginTop = "16px"
    closeButton.onclick = () => document.body.removeChild(modal)

    // Add competitors list
    const list = document.createElement("div")

    const competitorsToShow = competitors.map(comp => ({
      ...comp,
      distance: comp.distance || 0,
      ranking: comp.ranking || 0
    }))

    competitorsToShow.forEach((comp: CompetitorDisplay) => {
      const item = document.createElement("div")
      item.style.padding = "12px"
      item.style.borderBottom = "1px solid #e5e7eb"
      item.style.display = "flex"
      item.style.justifyContent = "space-between"
      item.style.alignItems = "center"

      const nameEl = document.createElement("div")
      nameEl.textContent = comp.name
      nameEl.style.fontWeight = "bold"

      const infoEl = document.createElement("div")
      infoEl.style.display = "flex"
      infoEl.style.gap = "12px"

      // If we have rating from the database
      if (comp.rating) {
        const ratingEl = document.createElement("div")
        ratingEl.textContent = `Rating: ${comp.rating}`
        ratingEl.style.backgroundColor = "#10b981"
        ratingEl.style.color = "white"
        ratingEl.style.padding = "4px 8px"
        ratingEl.style.borderRadius = "4px"
        infoEl.appendChild(ratingEl)
      } else if (comp.ranking) {
        // For simulated data
        const rankEl = document.createElement("div")
        rankEl.textContent = `Rank: ${comp.ranking}`
        rankEl.style.backgroundColor = getRankingColor(comp.ranking)
        rankEl.style.color = "white"
        rankEl.style.padding = "4px 8px"
        rankEl.style.borderRadius = "4px"
        infoEl.appendChild(rankEl)
      }

      // Distance calculation
      let distance = comp.distance
      if (!distance && comp.location) {
        // Calculate distance if we have location data
        const businessLat = location.lat
        const businessLng = location.lng
        const compLat = comp.location.lat
        const compLng = comp.location.lng

        // Simple distance calculation (Haversine formula would be more accurate)
        const R = 6371 // Radius of the earth in km
        const dLat = ((compLat - businessLat) * Math.PI) / 180
        const dLon = ((compLng - businessLng) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((businessLat * Math.PI) / 180) *
            Math.cos((compLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = R * c // Distance in km
      }

      if (distance) {
        const distEl = document.createElement("div")
        distEl.textContent = `${distance.toFixed(1)} km`
        distEl.style.color = "#6b7280"
        infoEl.appendChild(distEl)
      }

      item.appendChild(nameEl)
      item.appendChild(infoEl)

      list.appendChild(item)
    })

    // Assemble modal
    content.appendChild(title)
    content.appendChild(list)
    content.appendChild(closeButton)
    modal.appendChild(content)

    // Add to document
    document.body.appendChild(modal)

    // Add event listener to close on background click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  // Add grid markers
  useEffect(() => {
    if (!mapLoaded || mapError || !mapInstanceRef.current || !mapRef.current) return;
    
    try {
      const mapInstance = mapInstanceRef.current;
      
      // Clear any existing overlays
      if (window.google && window.google.maps) {
        // Add grid markers
        const latKmRatio = 1 / 110.574; // approx km per degree of latitude
        const lngKmRatio = 1 / (111.32 * Math.cos((location.lat * Math.PI) / 180)); // approx km per degree of longitude

        const startLat = location.lat - (distance * latKmRatio * (gridSize - 1)) / 2;
        const startLng = location.lng - (distance * lngKmRatio * (gridSize - 1)) / 2;

        // Create bounds to fit all markers
        const bounds = new window.google.maps.LatLngBounds();
        
        // Draw grid lines for visualization
        const gridLines: any[] = [];
        const gridCells: any[] = [];
        
        console.log(`Drawing grid: ${gridSize}x${gridSize}, ${distance}km spacing`);
        
        // Create grid cells (rectangles)
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const cellNorthLat = startLat + i * distance * latKmRatio;
            const cellWestLng = startLng + j * distance * lngKmRatio;
            const cellSouthLat = cellNorthLat + distance * latKmRatio;
            const cellEastLng = cellWestLng + distance * lngKmRatio;
            
            // Create rectangle for this cell
            const cellBounds = {
              north: cellNorthLat,
              south: cellSouthLat,
              east: cellEastLng,
              west: cellWestLng
            };
            
            // Check for ranking to determine fill color
            const ranking = gridData && gridData[i] && gridData[i][j] ? gridData[i][j] : 0;
            
            // Create rectangle with very light fill
            const rectangle = new window.google.maps.Rectangle({
              bounds: cellBounds,
              strokeWeight: 0,
              fillColor: ranking > 0 ? getRankingColor(ranking) : '#FFFFFF',
              fillOpacity: ranking > 0 ? 0.08 : 0,
              map: mapInstance,
              zIndex: 1 // Below markers
            });
            
            gridCells.push(rectangle);
            bounds.extend({lat: cellNorthLat, lng: cellWestLng});
            bounds.extend({lat: cellSouthLat, lng: cellEastLng});
          }
        }
        
        // Draw horizontal grid lines
        for (let i = 0; i <= gridSize; i++) {
          const rowLat = startLat + i * distance * latKmRatio;
          const startPoint = { lat: rowLat, lng: startLng };
          const endPoint = { lat: rowLat, lng: startLng + distance * lngKmRatio * (gridSize - 1) };
          
          const gridLine = new window.google.maps.Polyline({
            path: [startPoint, endPoint],
            geodesic: true,
            strokeColor: '#AAAAAA',
            strokeOpacity: 0.6,
            strokeWeight: 1,
            map: mapInstance
          });
          
          gridLines.push(gridLine);
        }
        
        // Draw vertical grid lines
        for (let j = 0; j <= gridSize; j++) {
          const colLng = startLng + j * distance * lngKmRatio;
          const startPoint = { lat: startLat, lng: colLng };
          const endPoint = { lat: startLat + distance * latKmRatio * (gridSize - 1), lng: colLng };
          
          const gridLine = new window.google.maps.Polyline({
            path: [startPoint, endPoint],
            geodesic: true,
            strokeColor: '#AAAAAA',
            strokeOpacity: 0.6,
            strokeWeight: 1,
            map: mapInstance
          });
          
          gridLines.push(gridLine);
        }
        
        // Add ranking markers
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const lat = startLat + i * distance * latKmRatio;
            const lng = startLng + j * distance * lngKmRatio;

            // Get ranking from grid data - make sure grid data exists
            if (!gridData || !gridData[i] || typeof gridData[i][j] === 'undefined') continue;
            const ranking = gridData[i][j];

            // Skip if ranking is 0 (no data)
            if (ranking === 0) continue;

            // Create marker with color based on ranking
            new window.google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              label: {
                text: formatRankingLabel(ranking),
                color: "#FFFFFF",
                fontWeight: "bold",
                fontSize: "12px",
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: getRankingColor(ranking),
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: "#FFFFFF",
                scale: 15,
              },
              zIndex: 100 - ranking, // Higher rankings appear above lower ones
              optimized: true,
            });
          }
        }
        
        // Fit map to include all markers with some padding
        mapInstance.fitBounds(bounds, 40); // 40 pixels padding

        // Limit max zoom level to keep context
        const listener = window.google.maps.event.addListener(mapInstance, 'idle', function() {
          if (mapInstance.getZoom() > 14) {
            mapInstance.setZoom(14);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    } catch (error) {
      console.error("Error drawing grid:", error);
    }
  }, [mapLoaded, mapError, gridSize, distance, location, gridData, gridResult.businessInfo.name]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-blue-600">{gridResult.businessInfo.name}</h1>
              <p className="text-gray-600">{gridResult.businessInfo.address}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500">Search term:</h2>
              <p className="font-medium">{gridResult.searchTerm}</p>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full justify-start" onClick={handleRepeatSearch}>
                <Repeat className="mr-2 h-4 w-4" />
                Repeat
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenPNG}>
                <Download className="mr-2 h-4 w-4" />
                Open PNG
              </Button>
              <Button variant="outline" size="sm" onClick={handleCSVDownload}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCompetitorsView}>
                <Users className="mr-2 h-4 w-4" />
                Competitors
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:w-3/4">
          <div className="border rounded-md overflow-hidden h-[600px] bg-gray-100">
            {mapError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-500 mb-2">{mapError}</div>
                  <Button 
                    onClick={() => {
                      setMapError(null);
                      setMapLoaded(false);
                      // Re-mount the component to force re-initialization
                      if (mapRef.current) {
                        // Clear the map container
                        mapRef.current.innerHTML = '';
                      }
                    }}
                  >
                    Retry Loading Map
                  </Button>
                </div>
              </div>
            ) : !mapLoaded ? (
              <div className="flex items-center justify-center h-full">
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
            ) : null}
            <div 
              ref={mapRef} 
              className="w-full h-full"
              style={{ display: mapError || !mapLoaded ? 'none' : 'block' }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border">
              <div className="text-xs text-gray-500">Created:</div>
              <div>{new Date(gridResult.createdAt).toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-md border">
              <div className="text-xs text-gray-500">Google region:</div>
              <div className="capitalize">{gridResult.googleRegion}</div>
            </div>
            <div className="bg-white p-4 rounded-md border">
              <div className="text-xs text-gray-500">Grid:</div>
              <div>
                {isNaN(gridResult.gridSize) ? "13" : gridResult.gridSize}, {isNaN(gridResult.distanceKm) ? "2.5" : gridResult.distanceKm}km
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-md border">
              <div className="text-xs text-gray-500">AGR:</div>
              <div className="text-xl font-bold">{Number(gridResult.metrics?.agr || 0).toFixed(1)}</div>
            </div>
            <div className="bg-white p-4 rounded-md border">
              <div className="text-xs text-gray-500">ATGR:</div>
              <div className="text-xl font-bold">{Number(gridResult.metrics?.atgr || 0).toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-md border">
              <div className="text-xs text-gray-500">SoLV:</div>
              <div className="text-xl font-bold">{Number(gridResult.metrics?.solv || 0)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

