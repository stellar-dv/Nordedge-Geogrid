"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Repeat, Download, Share2, Trash2, Users } from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { deleteGridResult, getCompetitors, type GridResult } from "@/lib/geogrid-service"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [competitorsModalOpen, setCompetitorsModalOpen] = useState(false)
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
    // Don't try to initialize if the component isn't fully mounted or if not in browser environment
    if (!mapRef.current || !isOpen || typeof window === 'undefined') return;

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
          if (!isMounted || !mapRef.current) {
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
              elementType: "geometry",
              stylers: [{ color: "#ebe3cd" }]
            },
            {
              elementType: "labels.text.fill",
              stylers: [{ color: "#523735" }]
            },
            {
              elementType: "labels.text.stroke",
              stylers: [{ color: "#f5f1e6" }]
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#c9b2a6" }]
            },
            {
              featureType: "administrative.land_parcel",
              elementType: "geometry.stroke",
              stylers: [{ color: "#dcd2be" }]
            },
            {
              featureType: "administrative.land_parcel",
              elementType: "labels.text.fill",
              stylers: [{ color: "#ae9e90" }]
            },
            {
              featureType: "landscape.natural",
              elementType: "geometry",
              stylers: [{ color: "#dfd2ae" }]
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#dfd2ae" }]
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#93817c" }]
            },
            {
              featureType: "poi.park",
              elementType: "geometry.fill",
              stylers: [{ color: "#a5b076" }]
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#447530" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#f5f1e6" }]
            },
            {
              featureType: "road.arterial",
              elementType: "geometry",
              stylers: [{ color: "#fdfcf8" }]
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#f8c967" }]
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#e9bc62" }]
            },
            {
              featureType: "road.highway.controlled_access",
              elementType: "geometry",
              stylers: [{ color: "#e98d58" }]
            },
            {
              featureType: "road.highway.controlled_access",
              elementType: "geometry.stroke",
              stylers: [{ color: "#db8555" }]
            },
            {
              featureType: "road.local",
              elementType: "labels.text.fill",
              stylers: [{ color: "#806b63" }]
            },
            {
              featureType: "transit.line",
              elementType: "geometry",
              stylers: [{ color: "#dfd2ae" }]
            },
            {
              featureType: "transit.line",
              elementType: "labels.text.fill",
              stylers: [{ color: "#8f7d77" }]
            },
            {
              featureType: "transit.line",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#ebe3cd" }]
            },
            {
              featureType: "transit.station",
              elementType: "geometry",
              stylers: [{ color: "#dfd2ae" }]
            },
            {
              featureType: "water",
              elementType: "geometry.fill",
              stylers: [{ color: "#b9d3c2" }]
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#92998d" }]
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
    router.push(`/new-search?business=${encodeURIComponent(gridResult.businessInfo.name)}&searchTerm=${encodeURIComponent(
      gridResult.searchTerm,
    )}`)
  }

  // Handle PNG download
  const handleOpenPNG = () => {
    try {
      // Create a canvas element to draw the grid
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const gridSize = gridResult.gridSize || 13
      const cellSize = 40
      const padding = 20

      // Set canvas dimensions
      canvas.width = gridSize * cellSize + padding * 2
      canvas.height = gridSize * cellSize + padding * 2 + 60 // Extra space for title

      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }

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

      // Convert canvas to PNG and download
      const dataUrl = canvas.toDataURL("image/png")
      
      // Create download link
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `geogrid-${gridResult.businessInfo.name.replace(/\s+/g, "-")}-${Date.now()}.png`
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error generating PNG:", error);
      alert("Failed to generate PNG. Please try again.");
    }
  }

  // Handle CSV download
  const handleCSVDownload = () => {
    try {
      // Generate CSV content
      let csvContent = ""

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

      // Create a Blob object containing the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a download link
      const link = document.createElement("a")
      
      // Create the download URL from the blob
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url)
      link.setAttribute("download", `geogrid-${gridResult.businessInfo.name.replace(/\s+/g, "-")}-${Date.now()}.csv`)
      link.style.visibility = 'hidden';
      document.body.appendChild(link)
      
      // Trigger download
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("Failed to generate CSV file. Please try again.");
    }
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
    setCompetitorsModalOpen(true);
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

            
            bounds.extend({lat: cellNorthLat, lng: cellWestLng});
            bounds.extend({lat: cellSouthLat, lng: cellEastLng});
          }
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

            // Create marker with rank icon image
            const marker = new window.google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              icon: {
                url: ranking <= 20 
                  ? `/images/rank-icons/${ranking}.png` 
                  : `/images/rank-icons/X.png`,
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16)
              },
              zIndex: ranking <= 20 ? (21 - ranking) : 0, // Higher rankings appear above lower ones
              optimized: true,
            });
            
            // Add click listener to show nearby competitors
            marker.addListener('click', () => {
              // Build temporary data for this grid point
              const gridPointData = {
                lat: lat,
                lng: lng,
                ranking: ranking,
                pointIndex: i * gridSize + j
              };
              
              // Show the competitors view for this point
              showCompetitorsForGridPoint(gridPointData);
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

  // Function to show competitors for a specific grid point
  const showCompetitorsForGridPoint = async (gridPoint: { lat: number; lng: number; ranking: number; pointIndex: number }) => {
    try {
      // Show a loading indicator
      const loadingModal = document.createElement("div");
      loadingModal.style.position = "fixed";
      loadingModal.style.top = "0";
      loadingModal.style.left = "0";
      loadingModal.style.width = "100%";
      loadingModal.style.height = "100%";
      loadingModal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      loadingModal.style.display = "flex";
      loadingModal.style.alignItems = "center";
      loadingModal.style.justifyContent = "center";
      loadingModal.style.zIndex = "9999";
      
      const loadingContent = document.createElement("div");
      loadingContent.innerHTML = `
        <div style="background-color: white; padding: 24px; border-radius: 8px; text-align: center;">
          <div style="margin-bottom: 16px;">Loading competitors at this location...</div>
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}</style>
        </div>
      `;
      loadingModal.appendChild(loadingContent);
      document.body.appendChild(loadingModal);
      
      // Fetch competitors using the places-search API
      let results = [];
      try {
        // Call the places-search API directly
        const response = await fetch('/api/places-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: gridResult.searchTerm,
            location: { lat: gridPoint.lat, lng: gridPoint.lng },
            radius: 1500,  // 1.5km radius
            rankBy: 'prominence',
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const competitorResults = data.results || [];

        // Process the results
        results = competitorResults.map((place: any, index: number) => {
          // Calculate distance
          const R = 6371; // Radius of the earth in km
          const compLat = place.geometry?.location?.lat || 0;
          const compLng = place.geometry?.location?.lng || 0;
          
          const dLat = ((compLat - gridPoint.lat) * Math.PI) / 180;
          const dLon = ((compLng - gridPoint.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((gridPoint.lat * Math.PI) / 180) *
              Math.cos((compLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c; // Distance in km
          
          return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity || 'Address unavailable',
            rating: place.rating || null,
            userRatingsTotal: place.user_ratings_total || 0,
            distance: distance,
            location: {
              lat: compLat,
              lng: compLng
            },
            // Add a simulated ranking based on the order of results
            ranking: index + 1
          };
        });
        
        // Sort by distance for relevance
        results.sort((a: any, b: any) => a.distance - b.distance);
        
        // Take top 20
        results = results.slice(0, 20);
      } catch (error) {
        console.error("Error fetching competitors:", error);
      }
      
      // Remove loading state
      document.body.removeChild(loadingModal);
      
      // Create a styled modal window that looks like the example image
      const modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.style.zIndex = "9999";
      modal.style.fontFamily = "Arial, sans-serif";
      
      // Create modal content
      const content = document.createElement("div");
      content.style.backgroundColor = "white";
      content.style.width = "90%";
      content.style.maxWidth = "800px";
      content.style.maxHeight = "90vh";
      content.style.overflowY = "auto";
      content.style.borderRadius = "8px";
      content.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      
      // Create header section
      const header = document.createElement("div");
      header.style.borderBottom = "1px solid #eaeaea";
      header.style.padding = "16px 24px";
      header.style.display = "flex";
      header.style.alignItems = "center";
      
      // Back button
      const backButton = document.createElement("button");
      backButton.innerHTML = "← Back to list";
      backButton.style.background = "none";
      backButton.style.border = "none";
      backButton.style.color = "#3b82f6";
      backButton.style.fontSize = "14px";
      backButton.style.cursor = "pointer";
      backButton.style.marginRight = "auto";
      backButton.onclick = () => document.body.removeChild(modal);
      
      header.appendChild(backButton);
      
      // Main content area
      const mainArea = document.createElement("div");
      mainArea.style.padding = "20px 24px";
      
      // Top section with business info
      const businessSection = document.createElement("div");
      
      // Business name
      const businessName = document.createElement("h2");
      businessName.textContent = gridResult.businessInfo.name;
      businessName.style.fontSize = "22px";
      businessName.style.fontWeight = "bold";
      businessName.style.color = "#3b82f6";
      businessName.style.margin = "0 0 4px 0";
      
      // Business address
      const businessAddress = document.createElement("p");
      businessAddress.textContent = gridResult.businessInfo.address || "Address not available";
      businessAddress.style.fontSize = "14px";
      businessAddress.style.color = "#666";
      businessAddress.style.margin = "0 0 16px 0";
      
      // Search term info
      const searchTermInfo = document.createElement("div");
      searchTermInfo.style.marginBottom = "20px";
      
      const searchTermLabel = document.createElement("span");
      searchTermLabel.textContent = "Search term:";
      searchTermLabel.style.fontSize = "14px";
      searchTermLabel.style.color = "#666";
      searchTermLabel.style.marginRight = "8px";
      
      const searchTermValue = document.createElement("span");
      searchTermValue.textContent = gridResult.searchTerm;
      searchTermValue.style.fontSize = "16px";
      searchTermValue.style.fontWeight = "500";
      
      searchTermInfo.appendChild(searchTermLabel);
      searchTermInfo.appendChild(searchTermValue);
      
      // Add components to business section
      businessSection.appendChild(businessName);
      businessSection.appendChild(businessAddress);
      businessSection.appendChild(searchTermInfo);
      
      // Location section
      const locationSection = document.createElement("div");
      locationSection.style.padding = "16px";
      locationSection.style.backgroundColor = "#f8fafc";
      locationSection.style.borderRadius = "8px";
      locationSection.style.marginBottom = "24px";
      
      const locationLabel = document.createElement("h3");
      locationLabel.textContent = `Grid Location (Rank ${gridPoint.ranking})`;
      locationLabel.style.fontSize = "16px";
      locationLabel.style.fontWeight = "600";
      locationLabel.style.margin = "0 0 8px 0";
      
      const coords = document.createElement("p");
      coords.textContent = `Coordinates: ${gridPoint.lat.toFixed(5)}, ${gridPoint.lng.toFixed(5)}`;
      coords.style.fontSize = "14px";
      coords.style.color = "#666";
      coords.style.margin = "0";
      
      locationSection.appendChild(locationLabel);
      locationSection.appendChild(coords);
      
      // Grid view of results
      const gridContainer = document.createElement("div");
      
      // Create grid header
      const gridHeader = document.createElement("div");
      gridHeader.style.marginBottom = "16px";
      
      const gridTitle = document.createElement("h3");
      gridTitle.textContent = "Nearby Businesses";
      gridTitle.style.fontSize = "18px";
      gridTitle.style.fontWeight = "bold";
      gridTitle.style.margin = "0 0 8px 0";
      
      const gridDescription = document.createElement("p");
      gridDescription.textContent = `Showing search results for "${gridResult.searchTerm}" at this location:`;
      gridDescription.style.fontSize = "14px";
      gridDescription.style.color = "#666";
      gridDescription.style.margin = "0";
      
      gridHeader.appendChild(gridTitle);
      gridHeader.appendChild(gridDescription);
      
      // Create grid of search results
      const resultsGrid = document.createElement("div");
      resultsGrid.style.display = "grid";
      resultsGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
      resultsGrid.style.gap = "16px";
      resultsGrid.style.marginTop = "20px";
      
      // If no results found
      if (results.length === 0) {
        const noResults = document.createElement("div");
        noResults.style.gridColumn = "1 / -1";
        noResults.style.padding = "24px";
        noResults.style.textAlign = "center";
        noResults.style.backgroundColor = "#f9fafb";
        noResults.style.borderRadius = "8px";
        
        const noResultsIcon = document.createElement("div");
        noResultsIcon.innerHTML = "&#9432;"; // Info icon
        noResultsIcon.style.fontSize = "24px";
        noResultsIcon.style.color = "#9ca3af";
        noResultsIcon.style.marginBottom = "12px";
        
        const noResultsText = document.createElement("p");
        noResultsText.textContent = `No businesses found for "${gridResult.searchTerm}" at this location.`;
        noResultsText.style.margin = "0";
        noResultsText.style.fontSize = "15px";
        noResultsText.style.color = "#4b5563";
        
        noResults.appendChild(noResultsIcon);
        noResults.appendChild(noResultsText);
        resultsGrid.appendChild(noResults);
      } else {
        // Add business cards
        results.forEach((business: any, index: number) => {
          const card = document.createElement("div");
          card.style.border = "1px solid #e5e7eb";
          card.style.borderRadius = "8px";
          card.style.overflow = "hidden";
          card.style.backgroundColor = business.name.toLowerCase().includes(gridResult.businessInfo.name.toLowerCase()) 
            ? "#ebf5ff" // Highlight the target business
            : "#ffffff";
          
          // Card header with rank
          const cardHeader = document.createElement("div");
          cardHeader.style.padding = "10px 16px";
          cardHeader.style.borderBottom = "1px solid #e5e7eb";
          cardHeader.style.backgroundColor = business.name.toLowerCase().includes(gridResult.businessInfo.name.toLowerCase())
            ? "#dbeafe"
            : "#f9fafb";
          cardHeader.style.display = "flex";
          cardHeader.style.alignItems = "center";
          cardHeader.style.justifyContent = "space-between";
          
          const rankLabel = document.createElement("div");
          rankLabel.textContent = `Rank: ${index + 1}`;
          rankLabel.style.fontSize = "14px";
          rankLabel.style.fontWeight = "600";
          rankLabel.style.color = business.name.toLowerCase().includes(gridResult.businessInfo.name.toLowerCase())
            ? "#1e40af"
            : "#4b5563";
          
          if (business.rating) {
            const ratingSpan = document.createElement("div");
            ratingSpan.innerHTML = `${business.rating} <span style="color: #f59e0b;">★</span>`;
            ratingSpan.style.fontSize = "14px";
            ratingSpan.style.fontWeight = "500";
            
            cardHeader.appendChild(rankLabel);
            cardHeader.appendChild(ratingSpan);
          } else {
            cardHeader.appendChild(rankLabel);
          }
          
          // Card body
          const cardBody = document.createElement("div");
          cardBody.style.padding = "16px";
          
          const businessTitle = document.createElement("h4");
          businessTitle.textContent = business.name;
          businessTitle.style.fontSize = "15px";
          businessTitle.style.fontWeight = "600";
          businessTitle.style.margin = "0 0 8px 0";
          businessTitle.style.color = business.name.toLowerCase().includes(gridResult.businessInfo.name.toLowerCase())
            ? "#2563eb"
            : "#111827";
          
          const addressText = document.createElement("p");
          addressText.textContent = business.address;
          addressText.style.fontSize = "13px";
          addressText.style.color = "#6b7280";
          addressText.style.margin = "0 0 8px 0";
          addressText.style.lineHeight = "1.4";
          
          const distanceText = document.createElement("p");
          distanceText.textContent = `${business.distance.toFixed(1)} km away`;
          distanceText.style.fontSize = "13px";
          distanceText.style.color = "#9ca3af";
          distanceText.style.margin = "0";
          
          if (business.name.toLowerCase().includes(gridResult.businessInfo.name.toLowerCase())) {
            const yourBusinessLabel = document.createElement("div");
            yourBusinessLabel.textContent = "Your Business";
            yourBusinessLabel.style.display = "inline-block";
            yourBusinessLabel.style.backgroundColor = "#3b82f6";
            yourBusinessLabel.style.color = "white";
            yourBusinessLabel.style.fontSize = "12px";
            yourBusinessLabel.style.fontWeight = "500";
            yourBusinessLabel.style.padding = "2px 8px";
            yourBusinessLabel.style.borderRadius = "9999px";
            yourBusinessLabel.style.marginTop = "8px";
            
            cardBody.appendChild(businessTitle);
            cardBody.appendChild(addressText);
            cardBody.appendChild(distanceText);
            cardBody.appendChild(yourBusinessLabel);
          } else {
            cardBody.appendChild(businessTitle);
            cardBody.appendChild(addressText);
            cardBody.appendChild(distanceText);
          }
          
          card.appendChild(cardHeader);
          card.appendChild(cardBody);
          resultsGrid.appendChild(card);
        });
      }
      
      gridContainer.appendChild(gridHeader);
      gridContainer.appendChild(resultsGrid);
      
      // Bottom action buttons
      const actionsContainer = document.createElement("div");
      actionsContainer.style.marginTop = "24px";
      actionsContainer.style.display = "flex";
      actionsContainer.style.justifyContent = "flex-end";
      actionsContainer.style.gap = "12px";
      
      const closeButton = document.createElement("button");
      closeButton.textContent = "Close";
      closeButton.style.padding = "8px 16px";
      closeButton.style.border = "1px solid #e5e7eb";
      closeButton.style.borderRadius = "6px";
      closeButton.style.backgroundColor = "#f3f4f6";
      closeButton.style.color = "#374151";
      closeButton.style.fontSize = "14px";
      closeButton.style.fontWeight = "500";
      closeButton.style.cursor = "pointer";
      closeButton.onclick = () => document.body.removeChild(modal);
      
      actionsContainer.appendChild(closeButton);
      
      // Add components to main area
      mainArea.appendChild(businessSection);
      mainArea.appendChild(locationSection);
      mainArea.appendChild(gridContainer);
      mainArea.appendChild(actionsContainer);
      
      // Add components to content
      content.appendChild(header);
      content.appendChild(mainArea);
      
      // Add content to modal
      modal.appendChild(content);
      
      // Add to document
      document.body.appendChild(modal);
      
      // Add event listener to close on background click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
      
    } catch (error) {
      console.error("Error showing competitors for grid point:", error);
      alert("Failed to load competitors for this location.");
    }
  };

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

      {/* Competitors Dialog */}
      <Dialog open={competitorsModalOpen} onOpenChange={setCompetitorsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Competitors for {gridResult.businessInfo.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-blue-50">
              <h3 className="font-medium mb-1">Search Term</h3>
              <p>"{gridResult.searchTerm}"</p>
            </div>
            
            {competitors.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-md">
                <p className="text-gray-500">No competitor data available. Click a grid point on the map to view competitors for that location.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitors.map((competitor) => (
                  <div 
                    key={competitor.id} 
                    className="border rounded-md p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium">{competitor.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">Ranking: {competitor.ranking}</div>
                    <div className="text-sm text-gray-500">Distance: {competitor.distance.toFixed(2)} km</div>
                    {competitor.rating && (
                      <div className="flex items-center mt-2">
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Rating: {competitor.rating}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

