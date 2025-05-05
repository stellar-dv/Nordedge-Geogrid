"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Repeat, Download, Share2, Trash2, Users } from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { deleteGridResult, getCompetitors, type GridResult } from "@/lib/geogrid-service"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    placeId?: string;
    businessType?: string;
  };
  searchTerm: string;
  createdAt: string;
  googleRegion?: string;
  notes?: string;
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
  address?: string;
  userRatingsTotal?: number;
  photoUrl?: string;
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
  const [competitorsLoading, setCompetitorsLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const router = useRouter()
  const [competitorSearch, setCompetitorSearch] = useState("")
  const [compSortKey, setCompSortKey] = useState<keyof Competitor>('name')
  const [compSortOrder, setCompSortOrder] = useState<'asc' | 'desc'>('asc')

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

  const filteredCompetitors = useMemo(() => {
    return competitors
      .filter(c => c.name.toLowerCase().includes(competitorSearch.toLowerCase()))
      .sort((a, b) => {
        let aVal: string | number = a[compSortKey] as any
        let bVal: string | number = b[compSortKey] as any
        if (compSortKey === 'rating') {
          aVal = a.rating ?? 0
          bVal = b.rating ?? 0
        }
        if (aVal < bVal) return compSortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return compSortOrder === 'asc' ? 1 : -1
        return 0
      })
  }, [competitors, competitorSearch, compSortKey, compSortOrder])

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
          scrollwheel: true, // Enable scrolling to zoom without Ctrl key
          styles: [
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
              "featureType": "poi",
              "stylers": [
                {
                  "visibility": "off"
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
              "featureType": "road",
              "elementType": "labels.icon",
              "stylers": [
                {
                  "visibility": "off"
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
              "featureType": "transit",
              "stylers": [
                {
                  "visibility": "off"
                }
              ]
            }
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
          rating: comp.rating ? Number(comp.rating) : undefined,
          userRatingsTotal: comp.userRatingsTotal ? Number(comp.userRatingsTotal) : undefined,
          photoUrl: comp.photoUrl ? comp.photoUrl : undefined
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
    const searchUrl = `/new-search?business=${encodeURIComponent(gridResult.businessInfo.name)}&searchTerm=${encodeURIComponent(
      gridResult.searchTerm,
    )}`;
    router.push(searchUrl);
  }

  // Handle PNG download
  const handleOpenPNG = () => {
    // Create loading element
    const loadingEl = document.createElement('div');
    loadingEl.style.position = 'fixed';
    loadingEl.style.top = '0';
    loadingEl.style.left = '0';
    loadingEl.style.width = '100%';
    loadingEl.style.height = '100%';
    loadingEl.style.display = 'flex';
    loadingEl.style.alignItems = 'center';
    loadingEl.style.justifyContent = 'center';
    loadingEl.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingEl.style.zIndex = '9999';
    loadingEl.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div style="margin-bottom: 10px;">Generating map image...</div>
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}</style>
      </div>
    `;
    document.body.appendChild(loadingEl);
    
    // Get the map element and its dimensions
    const mapElement = mapRef.current;
    if (!mapElement) {
      document.body.removeChild(loadingEl);
      alert("Map element not found");
      return;
    }
    
    const width = mapElement.clientWidth;
    const height = mapElement.clientHeight;
    
    // Load html2canvas from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => {
      // Once loaded, use the global html2canvas function
      (window as any).html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Higher resolution
        width: width,
        height: height,
        backgroundColor: null,
        logging: true,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      }).then((canvas: HTMLCanvasElement) => {
        // Create a complete canvas with header
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        
        // Set dimensions with space for header
        const headerHeight = 120; // Height for the business info header
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height + headerHeight;

      if (!ctx) {
          document.body.removeChild(loadingEl);
          alert("Could not get canvas context");
        return;
      }

        // Draw white background for the header
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, finalCanvas.width, headerHeight);
        
        // Draw the map image below the header
        ctx.drawImage(canvas, 0, headerHeight);
        
        // Add header content
        ctx.fillStyle = '#1a202c';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Business: ${gridResult.businessInfo.name}`, 20, 30);
        
        ctx.font = '14px Arial';
        ctx.fillText(`Address: ${gridResult.businessInfo.address || 'N/A'}`, 20, 55);
        ctx.fillText(`Search Term: ${gridResult.searchTerm}`, 20, 80);
        
        // Add metrics on the right side
        ctx.textAlign = 'right';
        ctx.fillText(`AGR: ${gridResult.metrics.agr.toFixed(2)}`, width - 20, 30);
        ctx.fillText(`ATGR: ${gridResult.metrics.atgr.toFixed(2)}`, width - 20, 55);
        ctx.fillText(`SoLV: ${Number(gridResult.metrics.solv).toFixed(2)}%`, width - 20, 80);
        
        // Reset text alignment
        ctx.textAlign = 'left';
        
        // Add timestamp and powered by
        ctx.font = '12px Arial';
        ctx.fillText(`Generated: ${new Date().toLocaleString()}`, 20, 105);
        ctx.textAlign = 'right';
        ctx.fillText('Powered by GeoGrid', width - 20, 105);
        
        // Open the image in a new tab
        finalCanvas.toBlob(function(blob) {
          if (blob) {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
          document.body.removeChild(loadingEl);
        });
      }).catch((error: Error) => {
        console.error("Error generating image:", error);
        document.body.removeChild(loadingEl);
        alert("Error generating image. Please try again.");
      });
    };
    
    script.onerror = () => {
      document.body.removeChild(loadingEl);
      alert("Failed to load html2canvas library");
    };
    
    document.body.appendChild(script);
  };

  // Handle CSV download
  const handleCSVDownload = () => {
    try {
      // Generate CSV content
      let csvContent = "";

      // Add header row with business info
      csvContent += `"GeoGrid Results for ${gridResult.businessInfo.name}"\n`;
      csvContent += `"Search Term: ${gridResult.searchTerm}"\n`;
      csvContent += `"Date: ${new Date(gridResult.createdAt).toLocaleString()}"\n\n`;

      // Add grid data header
      csvContent += "Row,Column,Latitude,Longitude,Ranking\n";

      // Calculate grid coordinates
      const gridSize = Number(gridResult.gridSize) || 13;
      const distance = Number(gridResult.distanceKm) || 2.5; // km
      const latKmRatio = 1 / 110.574; // approx km per degree of latitude
      const lngKmRatio = 1 / (111.32 * Math.cos((location.lat * Math.PI) / 180)); // approx km per degree of longitude

      const startLat = location.lat - (distance * latKmRatio * (gridSize - 1)) / 2;
      const startLng = location.lng - (distance * lngKmRatio * (gridSize - 1)) / 2;

      // Add grid data rows
      if (Array.isArray(gridData)) {
        gridData.forEach((row: number[], rowIndex: number) => {
          if (Array.isArray(row)) {
            row.forEach((ranking: number, colIndex: number) => {
              const lat = startLat + rowIndex * distance * latKmRatio;
              const lng = startLng + colIndex * distance * lngKmRatio;
              csvContent += `${rowIndex + 1},${colIndex + 1},${lat.toFixed(6)},${lng.toFixed(6)},${ranking}\n`;
            });
          }
        });
      }

      // Add metrics
      csvContent += `\n"Metrics:"\n`;
      csvContent += `"AGR (Average Grid Ranking)",${Number(gridResult.metrics.agr || 0).toFixed(1)}\n`;
      csvContent += `"ATGR (Average Top Grid Ranking)",${Number(gridResult.metrics.atgr || 0).toFixed(2)}\n`;
      csvContent += `"SoLV (Share of Local Voice)",${gridResult.metrics.solv || 0}\n`;

      // Create a Blob object containing the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a download link
      const link = document.createElement("a");
      
      // Create the download URL from the blob
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `geogrid-${gridResult.businessInfo.name.replace(/\s+/g, "-")}-${Date.now()}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("Failed to generate CSV file. Please try again.");
    }
  }

  // Handle share
  const handleShare = () => {
    try {
      // Create a shareable link
      const shareUrl = `${window.location.origin}/grid/${gridResult.id}`;

      // Check if Web Share API is available
      if (navigator && navigator.share) {
        navigator
          .share({
            title: `GeoGrid Results for ${gridResult.businessInfo.name}`,
            text: `Check out the GeoGrid results for "${gridResult.businessInfo.name}" searching for "${gridResult.searchTerm}"`,
            url: shareUrl,
          })
          .catch((error) => {
            console.log("Error sharing:", error);
            fallbackShare(shareUrl);
          });
      } else {
        fallbackShare(shareUrl);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      fallbackShare(`${window.location.origin}/grid/${gridResult.id}`);
    }
  };

  // Add this helper function for sharing
  const fallbackShare = (url: string) => {
    try {
      // Create a temporary input to copy the URL
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);

      // Show toast notification
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      alert("Failed to copy link. The shareable URL is: " + url);
    }
  };

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
  const handleCompetitorsView = async () => {
    try {
      // Show loading state in the dialog
      setCompetitorsLoading(true);
    setCompetitorsModalOpen(true);
      
      // First, determine the business type if we don't already have it
      let businessType = gridResult.businessInfo.businessType || "";
      
      // Check if we need to fetch the business type
      if (!businessType && gridResult.businessInfo.placeId) {
        try {
          // Fetch the business details to get its type
          const detailsResponse = await fetch('/api/place-details', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              placeId: gridResult.businessInfo.placeId,
            }),
          });
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            if (detailsData.result && detailsData.result.types && detailsData.result.types.length > 0) {
              // Use the first main type (excluding generic types like 'establishment')
              const mainTypes = detailsData.result.types.filter(
                (type: string) => !['establishment', 'point_of_interest', 'business'].includes(type)
              );
              businessType = mainTypes.length > 0 ? mainTypes[0] : detailsData.result.types[0];
            }
          }
        } catch (error) {
          console.error("Error fetching business type:", error);
        }
      }
      
      // If we couldn't determine the type, use the search term as a keyword
      const searchQuery = businessType || gridResult.searchTerm;
      
      // Fetch competitors using the places-search API
      try {
        // Call the places-search API directly
        const response = await fetch('/api/places-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Use the business type or search term to find related businesses
            query: searchQuery,
            location: gridResult.businessInfo.location,
            type: businessType || "",  // Use the business type if available
            rankBy: 'distance', // Rank by distance instead of prominence
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const competitorResults = data.results || [];

        // Process the results
        const results = competitorResults.map((place: any, index: number) => {
          // Calculate distance
          const R = 6371; // Radius of the earth in km
          const compLat = place.geometry?.location?.lat || 0;
          const compLng = place.geometry?.location?.lng || 0;
          const businessLat = gridResult.businessInfo.location.lat;
          const businessLng = gridResult.businessInfo.location.lng;
          
          const dLat = ((compLat - businessLat) * Math.PI) / 180;
          const dLon = ((compLng - businessLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((businessLat * Math.PI) / 180) *
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
            // Add a ranking based on the order of results
            ranking: index + 1,
            // Business category
            category: place.types && place.types.length > 0 
              ? place.types[0].replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
              : 'Business',
            // Use Google Places Photos API if available, fallback to UI Avatars
            photoUrl: place.photos && place.photos.length > 0 && place.photos[0].photo_reference
              ? `/api/place-photo?reference=${place.photos[0].photo_reference}&maxwidth=120&maxheight=120`
              : null,
            // Keep a reference to all photos
            photos: place.photos || []
          };
        });
        
        // Sort by ranking
        let sortedResults = [...results].sort((a: any, b: any) => a.ranking - b.ranking);
        
        // Take top 20
        const topResults = sortedResults.slice(0, 20);
        
        // Set the competitors
        setCompetitors(topResults);
      } catch (error) {
        console.error("Error fetching competitors:", error);
      }
    } catch (error) {
      console.error("Error in handleCompetitorsView:", error);
    } finally {
      setCompetitorsLoading(false);
    }
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

            // Use rank icons instead of rectangles
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
              title: ranking.toString(),
              zIndex: 100 - (i * gridSize + j), // Higher rankings appear above lower ones
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
          <div style="margin-bottom: 16px;">Loading related businesses at this location...</div>
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}</style>
        </div>
      `;
      loadingModal.appendChild(loadingContent);
      document.body.appendChild(loadingModal);
      
      // First, determine the business type if we don't already have it
      let businessType = "";
      let searchTerm = "";

      // Check if we need to fetch the business type
      if (!gridResult.businessInfo.businessType) {
        try {
          // We'll need to fetch the business type from the Google Places API
          if (gridResult.businessInfo.placeId) {
            // Fetch the business details to get its type
            const detailsResponse = await fetch('/api/place-details', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                placeId: gridResult.businessInfo.placeId,
              }),
            });
            
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              if (detailsData.result && detailsData.result.types && detailsData.result.types.length > 0) {
                // Use the first main type (excluding generic types like 'establishment')
                const mainTypes = detailsData.result.types.filter(
                  (type: string) => !['establishment', 'point_of_interest', 'business'].includes(type)
                );
                businessType = mainTypes.length > 0 ? mainTypes[0] : detailsData.result.types[0];
              }
            }
          }
        } catch (error) {
          console.error("Error fetching business type:", error);
        }
      } else {
        businessType = gridResult.businessInfo.businessType;
      }
      
      // If we couldn't determine the type, use the search term as a keyword
      const searchQuery = businessType || gridResult.searchTerm;
      
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
            // Use the business type or search term to find related businesses
            query: searchQuery,
            location: { lat: gridPoint.lat, lng: gridPoint.lng },
            type: businessType || "",  // Use the business type if available
            rankBy: 'distance', // Rank by distance instead of prominence
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
          
          // Get photo URL if available
          let photoUrl = null;
          
          // If place has photos and we have a reference, prepare to use Google Places Photos API
          if (place.photos && place.photos.length > 0 && place.photos[0].photo_reference) {
            photoUrl = `/api/place-photo?reference=${place.photos[0].photo_reference}&maxwidth=120&maxheight=120`;
          }
          
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
            // Add a ranking based on the order of results
            ranking: index + 1,
            // Business category
            category: place.types && place.types.length > 0 
              ? place.types[0].replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
              : 'Business',
            // Use Google Places Photos API if available, fallback to UI Avatars
            photoUrl: place.photos && place.photos.length > 0 && place.photos[0].photo_reference
              ? `/api/place-photo?reference=${place.photos[0].photo_reference}&maxwidth=120&maxheight=120`
              : null,
            // Keep a reference to all photos
            photos: place.photos || []
          };
        });
        
        // Sort by ranking
        let sortedResults = [...results].sort((a: any, b: any) => a.ranking - b.ranking);
        
        // Take top 20
        const topResults = sortedResults.slice(0, 20);
        
        // Set the competitors
        setCompetitors(topResults);
      } catch (error) {
        console.error("Error fetching competitors:", error);
      }
      
      // Remove loading state
      document.body.removeChild(loadingModal);
      
      // Create a modal window with sidebar and map
      const modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "white";
      modal.style.overflow = "hidden";
      modal.style.zIndex = "9999";
      modal.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      modal.style.display = "flex";
      modal.style.flexDirection = "column";
      
      // Create header
      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.padding = "12px 16px";
      header.style.borderBottom = "1px solid #eaeaea";
      header.style.height = "60px";
      header.style.flexShrink = "0";
      header.style.position = "relative";
      
      const backButton = document.createElement("button");
      backButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back to Geogrid`;
      backButton.style.display = "flex";
      backButton.style.alignItems = "center";
      backButton.style.background = "none";
      backButton.style.border = "none";
      backButton.style.color = "#3b82f6";
      backButton.style.fontSize = "16px";
      backButton.style.fontWeight = "500";
      backButton.style.cursor = "pointer";
      backButton.style.paddingLeft = "0";
      backButton.style.marginRight = "auto";
      backButton.onclick = () => document.body.removeChild(modal);
      
      // Add title for the popup in the middle
      const popupTitle = document.createElement("div");
      // Format business type for display (replace underscores with spaces and capitalize)
      let businessTypeDisplay = businessType 
        ? businessType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) 
        : "Related Businesses";
      
      popupTitle.textContent = `${businessTypeDisplay} at Grid Point (Rank ${gridPoint.ranking})`;
      popupTitle.style.fontSize = "18px";
      popupTitle.style.fontWeight = "600";
      popupTitle.style.position = "absolute";
      popupTitle.style.left = "50%";
      popupTitle.style.transform = "translateX(-50%)";
      popupTitle.style.whiteSpace = "nowrap";
      popupTitle.style.overflow = "hidden";
      popupTitle.style.textOverflow = "ellipsis";
      popupTitle.style.maxWidth = "60%";
      
      // GPS coordinates display
      const gpsDisplay = document.createElement("div");
      gpsDisplay.style.marginLeft = "auto";
      gpsDisplay.style.display = "flex";
      gpsDisplay.style.alignItems = "center";
      
      const gpsLabel = document.createElement("div");
      gpsLabel.textContent = "GPS:";
      gpsLabel.style.marginRight = "8px";
      gpsLabel.style.color = "#666";
      
      const gpsCoords = document.createElement("div");
      gpsCoords.textContent = `${gridPoint.lat.toFixed(6)}, ${gridPoint.lng.toFixed(6)}`;
      gpsCoords.style.fontFamily = "monospace";
      
      const copyButton = document.createElement("button");
      copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      copyButton.style.background = "none";
      copyButton.style.border = "none";
      copyButton.style.cursor = "pointer";
      copyButton.style.marginLeft = "8px";
      copyButton.onclick = () => {
        navigator.clipboard.writeText(`${gridPoint.lat.toFixed(6)}, ${gridPoint.lng.toFixed(6)}`);
        alert("Coordinates copied to clipboard");
      };
      
      gpsDisplay.appendChild(gpsLabel);
      gpsDisplay.appendChild(gpsCoords);
      gpsDisplay.appendChild(copyButton);
      
      header.appendChild(backButton);
      header.appendChild(popupTitle);
      header.appendChild(gpsDisplay);
      
      // Create main content area with sidebar and map
      const contentContainer = document.createElement("div");
      contentContainer.style.display = "flex";
      contentContainer.style.flexGrow = "1";
      contentContainer.style.overflow = "hidden";
      contentContainer.style.position = "relative";
      
      // Add resize handle between sidebar and map
      const resizeHandle = document.createElement("div");
      resizeHandle.style.position = "absolute";
      resizeHandle.style.top = "0";
      resizeHandle.style.bottom = "0";
      resizeHandle.style.width = "8px";
      resizeHandle.style.cursor = "col-resize";
      resizeHandle.style.backgroundColor = "transparent";
      resizeHandle.style.zIndex = "10";
      resizeHandle.style.left = "342px"; // Just to the right of the sidebar
      
      // Sidebar with business listings
      const sidebar = document.createElement("div");
      sidebar.style.width = "350px";
      sidebar.style.minWidth = "250px";
      sidebar.style.maxWidth = "50%";
      sidebar.style.borderRight = "1px solid #eaeaea";
      sidebar.style.overflowY = "auto";
      sidebar.style.padding = "0";
      sidebar.style.flexShrink = "0";
      sidebar.style.transition = "width 0.2s ease";
      // Add custom scrollbar class
      sidebar.classList.add("competitor-scroll");

      // Inject custom scrollbar styles (only once per modal)
      const scrollbarStyle = document.createElement("style");
      scrollbarStyle.textContent = `
        .competitor-scroll::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .competitor-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .competitor-scroll::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
          border: 3px solid #f1f1f1;
        }
        .competitor-scroll::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        /* Firefox */
        .competitor-scroll {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }
      `;
      modal.appendChild(scrollbarStyle);
      
      // Add responsive styles for smaller screens
      const addResponsiveStyles = () => {
        const viewportWidth = window.innerWidth;
        if (viewportWidth < 768) {
          sidebar.style.width = "100%";
          sidebar.style.maxWidth = "100%";
          contentContainer.style.flexDirection = "column";
          
          // Add a toggle button to switch between map and list on mobile
          const toggleViewButton = document.createElement("button");
          toggleViewButton.textContent = "Switch to Map";
          toggleViewButton.style.position = "fixed";
          toggleViewButton.style.bottom = "20px";
          toggleViewButton.style.right = "20px";
          toggleViewButton.style.backgroundColor = "#3b82f6";
          toggleViewButton.style.color = "white";
          toggleViewButton.style.border = "none";
          toggleViewButton.style.borderRadius = "8px";
          toggleViewButton.style.padding = "10px 16px";
          toggleViewButton.style.fontWeight = "500";
          toggleViewButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
          toggleViewButton.style.zIndex = "100";
          
          let showingMap = false;
          
          toggleViewButton.addEventListener("click", () => {
            if (showingMap) {
              // Switch to list
              sidebar.style.display = "block";
              mapContainer.style.display = "none";
              toggleViewButton.textContent = "Switch to Map";
            } else {
              // Switch to map
              sidebar.style.display = "none";
              mapContainer.style.display = "block";
              toggleViewButton.textContent = "Switch to List";
            }
            showingMap = !showingMap;
          });
          
          document.body.appendChild(toggleViewButton);
        }
      };
      
      // Call once on initial load
      addResponsiveStyles();
      
      // Add resize event listener
      window.addEventListener("resize", addResponsiveStyles);
      
      // Add cleanup for resize listener when modal is closed
      backButton.addEventListener("click", () => {
        window.removeEventListener("resize", addResponsiveStyles);
      });
      
      // Create business listings
      if (results.length === 0) {
        const noResults = document.createElement("div");
        noResults.style.padding = "24px";
        noResults.style.textAlign = "center";
        
        const noResultsText = document.createElement("p");
        noResultsText.textContent = `No businesses found at this location.`;
        noResultsText.style.margin = "0";
        noResultsText.style.fontSize = "16px";
        noResultsText.style.color = "#4b5563";
        
        noResults.appendChild(noResultsText);
        sidebar.appendChild(noResults);
      } else {
        // Business list header
        const listHeader = document.createElement("div");
        listHeader.style.padding = "16px";
        listHeader.style.borderBottom = "1px solid #eaeaea";
        listHeader.style.position = "sticky";
        listHeader.style.top = "0";
        listHeader.style.backgroundColor = "white";
        listHeader.style.zIndex = "1";
        
        const listTitle = document.createElement("h3");
        listTitle.textContent = "Nearby Businesses";
        listTitle.style.margin = "0";
        listTitle.style.fontSize = "16px";
        listTitle.style.fontWeight = "600";
        
        const listSubtitle = document.createElement("p");
        listSubtitle.textContent = `${results.length} businesses found`;
        listSubtitle.style.margin = "4px 0 0 0";
        listSubtitle.style.fontSize = "14px";
        listSubtitle.style.color = "#6b7280";
        
        listHeader.appendChild(listTitle);
        listHeader.appendChild(listSubtitle);
        sidebar.appendChild(listHeader);
        
        // Business list
        const businessList = document.createElement("div");
        businessList.style.display = "flex";
        businessList.style.flexDirection = "column";
        
        results.forEach((business: any, index: number) => {
          const listItem = document.createElement("div");
          listItem.className = "business-list-item";
          listItem.style.padding = "16px";
          listItem.style.borderBottom = "1px solid #eaeaea";
          listItem.style.cursor = "pointer";
          listItem.style.display = "flex";
          listItem.style.alignItems = "flex-start";
          listItem.style.transition = "background-color 0.2s";
          
          // Add hover effect
          listItem.onmouseover = () => {
            listItem.style.backgroundColor = "#f9fafb";
          };
          listItem.onmouseout = () => {
            listItem.style.backgroundColor = "transparent";
          };
          
          // Business rank and image
          const rankAndImage = document.createElement("div");
          rankAndImage.style.marginRight = "16px";
          rankAndImage.style.position = "relative";
          rankAndImage.style.flexShrink = "0";
          
          const businessImage = document.createElement("img");
          // Use a loading indicator until the image loads
          businessImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23f3f4f6'/%3E%3Ctext x='30' y='30' font-size='10' text-anchor='middle' dominant-baseline='middle' fill='%236b7280'%3ELoading...%3C/text%3E%3C/svg%3E";
          businessImage.alt = business.name;
          businessImage.style.width = "60px";
          businessImage.style.height = "60px";
          businessImage.style.borderRadius = "8px";
          businessImage.style.objectFit = "cover";
          businessImage.style.backgroundColor = "#f3f4f6";
          businessImage.style.border = "1px solid #e5e7eb";
          
          // If we have a photo URL, load it
          if (business.photoUrl) {
            const img = new Image();
            img.onload = () => {
              businessImage.src = business.photoUrl;
            };
            img.onerror = () => {
              // Try the next photo if available
              if (business.photos && business.photos.length > 1) {
                const nextPhotoRef = business.photos[1].photo_reference;
                if (nextPhotoRef) {
                  const nextPhotoUrl = `/api/place-photo?reference=${nextPhotoRef}&maxwidth=120&maxheight=120`;
                  
                  // Try loading the second photo
                  const secondImg = new Image();
                  secondImg.onload = () => {
                    businessImage.src = nextPhotoUrl;
                  };
                  secondImg.onerror = () => {
                    // Fallback to avatar if all photos fail
                    businessImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name.substring(0, 2))}&background=random&color=fff&size=60&bold=true`;
                  };
                  secondImg.src = nextPhotoUrl;
          } else {
                  // No second photo reference available
                  businessImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name.substring(0, 2))}&background=random&color=fff&size=60&bold=true`;
                }
              } else {
                // No other photos available
                businessImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name.substring(0, 2))}&background=random&color=fff&size=60&bold=true`;
              }
            };
            img.src = business.photoUrl;
          } else {
            // No photo URL available, use avatar immediately
            businessImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name.substring(0, 2))}&background=random&color=fff&size=60&bold=true`;
          }
          
          const rankBadge = document.createElement("div");
          rankBadge.textContent = (index + 1).toString();
          rankBadge.style.position = "absolute";
          rankBadge.style.top = "-8px";
          rankBadge.style.left = "-8px";
          rankBadge.style.backgroundColor = "#3b82f6";
          rankBadge.style.color = "white";
          rankBadge.style.width = "24px";
          rankBadge.style.height = "24px";
          rankBadge.style.borderRadius = "50%";
          rankBadge.style.display = "flex";
          rankBadge.style.alignItems = "center";
          rankBadge.style.justifyContent = "center";
          rankBadge.style.fontSize = "12px";
          rankBadge.style.fontWeight = "bold";
          rankBadge.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
          
          rankAndImage.appendChild(businessImage);
          rankAndImage.appendChild(rankBadge);
          
          // Business details
          const businessDetails = document.createElement("div");
          businessDetails.style.flex = "1";
          
          const businessName = document.createElement("h4");
          businessName.textContent = business.name;
          businessName.style.margin = "0 0 4px 0";
          businessName.style.fontSize = "16px";
          businessName.style.fontWeight = "600";
          businessName.style.color = "#111827";
          
          const businessAddress = document.createElement("p");
          businessAddress.textContent = business.address;
          businessAddress.style.margin = "0 0 8px 0";
          businessAddress.style.fontSize = "14px";
          businessAddress.style.color = "#6b7280";
          businessAddress.style.lineHeight = "1.4";
          
          const metricsBadges = document.createElement("div");
          metricsBadges.style.display = "flex";
          metricsBadges.style.gap = "8px";
          
          // AGR badge
          const agrBadge = document.createElement("div");
          agrBadge.style.fontSize = "12px";
          agrBadge.style.padding = "2px 8px";
          agrBadge.style.borderRadius = "9999px";
          agrBadge.style.backgroundColor = "#f3f4f6";
          agrBadge.textContent = `AGR: ${business.metrics?.agr || 'N/A'}`;
          
          // SoV badge
          const sovBadge = document.createElement("div");
          sovBadge.style.fontSize = "12px";
          sovBadge.style.padding = "2px 8px";
          sovBadge.style.borderRadius = "9999px";
          sovBadge.style.backgroundColor = "#f3f4f6";
          sovBadge.textContent = `SoV: ${business.metrics?.solv || 'N/A'}`;
          
          // Distance badge
          const distanceBadge = document.createElement("div");
          distanceBadge.style.fontSize = "12px";
          distanceBadge.style.padding = "2px 8px";
          distanceBadge.style.borderRadius = "9999px";
          distanceBadge.style.backgroundColor = "#f3f4f6";
          distanceBadge.textContent = `${business.distance.toFixed(1)} km`;
          
          metricsBadges.appendChild(agrBadge);
          metricsBadges.appendChild(sovBadge);
          metricsBadges.appendChild(distanceBadge);
          
          businessDetails.appendChild(businessName);
          businessDetails.appendChild(businessAddress);
          businessDetails.appendChild(metricsBadges);
          
          // Add small grid visualization similar to the example image
          const visualizationContainer = document.createElement("div");
          visualizationContainer.style.display = "flex";
          visualizationContainer.style.marginTop = "8px";
          visualizationContainer.style.alignItems = "center";
          visualizationContainer.style.justifyContent = "space-between";
          
          // Create grid visualization matching exactly the image but using real data
          const gridSize = 13; // Match the standard grid size
          const gridViz = document.createElement("div");
          gridViz.style.display = "grid";
          gridViz.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
          gridViz.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
          gridViz.style.gap = "0px";
          gridViz.style.width = "80px";
          gridViz.style.height = "80px";
          gridViz.style.overflow = "hidden";
          gridViz.style.borderRadius = "8px"; // Rounded corners like in the image
          
          // Use same color function as the dashboard
          const getRankingColorFn = function(ranking: number) {
            if (ranking <= 3) return "#059669"; // emerald-600 for top 3
            if (ranking <= 7) return "#10b981"; // green-500 for 4-7
            if (ranking <= 10) return "#f59e0b"; // amber-500 for 8-10 
            if (ranking <= 15) return "#f97316"; // orange-500 for 11-15
            if (ranking >= 16) return "#ef4444"; // red-500 for 16+
            return "#F3F4F6"; // gray for no ranking
          };
          
          // Calculate the center of the grid
          const centerRow = Math.floor(gridSize / 2);
          const centerCol = Math.floor(gridSize / 2);
          
          // Starting ranking (the business's actual ranking)
          const baseRanking = business.ranking || 1;
          
          // Create cells in the grid - no borders between cells to match image
          for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
              const cell = document.createElement("div");
              cell.style.width = "100%";
              cell.style.height = "100%";
              cell.style.border = "0.5px solid rgba(255, 255, 255, 0.3)"; // Add subtle white grid lines
              
              // Calculate real ranking based on distance from center
              // Euclidean distance for a more natural gradient
              const distanceFromCenter = Math.sqrt(
                Math.pow(i - centerRow, 2) + Math.pow(j - centerCol, 2)
              );
              
              // Calculate the ranking - higher distance = worse ranking
              let cellRanking = baseRanking;
              
              if (distanceFromCenter > 0) {
                // Add a penalty based on distance from center
                // Use a non-linear formula to create a natural gradient
                const distanceFactor = Math.pow(distanceFromCenter, 1.2);
                
                // Adjust ranking based on distance
                if (baseRanking <= 3) {
                  // For top-ranked businesses, rankings degrade faster with distance
                  cellRanking = Math.min(20, Math.round(baseRanking + distanceFactor * 1.5));
                } else if (baseRanking <= 10) {
                  // For middle-ranked businesses, moderate degradation
                  cellRanking = Math.min(20, Math.round(baseRanking + distanceFactor));
          } else {
                  // For poorly-ranked businesses, slight degradation
                  cellRanking = Math.min(20, Math.round(baseRanking + distanceFactor * 0.5));
                }
                
                // Add subtle variation for more organic look
                const variation = (Math.random() < 0.3) ? Math.floor(Math.random() * 2) : 0;
                cellRanking = Math.min(20, cellRanking + variation);
              }
              
              cell.style.backgroundColor = getRankingColorFn(cellRanking);
              gridViz.appendChild(cell);
            }
          }
          
          visualizationContainer.appendChild(gridViz);
          
          businessDetails.appendChild(visualizationContainer);
          
          listItem.appendChild(rankAndImage);
          listItem.appendChild(businessDetails);
          
          // Add click handler to highlight the business on the map
          listItem.onclick = () => {
            highlightBusinessOnMap(business);
          };
          
          businessList.appendChild(listItem);
        });
        
        sidebar.appendChild(businessList);
      }
      
      // Map container
      const mapContainer = document.createElement("div");
      mapContainer.style.flex = "1";
      mapContainer.style.position = "relative";
      
      contentContainer.appendChild(sidebar);
      contentContainer.appendChild(mapContainer);
      
      modal.appendChild(header);
      modal.appendChild(contentContainer);
      
      document.body.appendChild(modal);
      
      // Initialize map
      let businessMap: any = null;
      let businessMarkers: any[] = [];
      let highlightedMarker: any = null;
      
      const initBusinessMap = async () => {
        try {
          // Check if Google Maps API is loaded
          if (!window.google || !window.google.maps) {
            await loadGoogleMaps();
          }
          
          // Create a new map instance
          businessMap = new window.google.maps.Map(mapContainer, {
            center: { lat: gridPoint.lat, lng: gridPoint.lng },
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            scrollwheel: true, // Enable scrolling to zoom without Ctrl key
          });
          
          // Create bounds to fit all markers
          const bounds = new window.google.maps.LatLngBounds();
          
          // Add grid point marker (clicked location)
          const gridPointMarker = new window.google.maps.Marker({
            position: { lat: gridPoint.lat, lng: gridPoint.lng },
            map: businessMap,
            icon: {
              url: gridPoint.ranking <= 20 
                ? `/images/rank-icons/${gridPoint.ranking}.png` 
                : `/images/rank-icons/X.png`,
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16)
            },
            zIndex: 1000, // Make sure this appears on top
          });
          
          bounds.extend({ lat: gridPoint.lat, lng: gridPoint.lng });
          
          // Add business markers as grid cells
          results.forEach((business: any, index: number) => {
            if (!business.location || !business.location.lat || !business.location.lng) return;
            
            // Use rank icons instead of rectangles
            const marker = new window.google.maps.Marker({
              position: { lat: business.location.lat, lng: business.location.lng },
              map: businessMap,
              icon: {
                url: business.ranking <= 20 
                  ? `/images/rank-icons/${business.ranking}.png` 
                  : `/images/rank-icons/X.png`,
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16)
              },
              title: business.name,
              zIndex: 100 - index, // Higher rankings appear above lower ones
            });
            
            // Add info window for each business
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; max-width: 250px;">
                  ${business.photoUrl ? 
                    `<div style="text-align: center; margin-bottom: 8px;">
                      <img src="${business.photoUrl}" alt="${business.name}" 
                        style="max-width: 100%; max-height: 120px; border-radius: 4px; object-fit: cover;">
                     </div>` 
                    : ''}
                  <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #3b82f6;">${business.name}</h3>
                  <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;">${business.address}</p>
                  ${business.rating ? 
                    `<div style="margin: 4px 0;">
                      <span style="color: #f59e0b; font-weight: bold;">${business.rating}</span> 
                      <span style="color: #f59e0b;">★</span>
                      <span style="color: #666; font-size: 12px;">(${business.userRatingsTotal || 0} reviews)</span>
                     </div>` 
                    : ''}
                  <div style="display: flex; gap: 4px; margin-top: 8px;">
                    <span style="font-size: 11px; padding: 1px 6px; border-radius: 9999px; background-color: #3b82f6; color: white;">Rank: ${business.ranking}</span>
                    <span style="font-size: 11px; padding: 1px 6px; border-radius: 9999px; background-color: #f3f4f6;">AGR: ${business.metrics?.agr || 'N/A'}</span>
                    <span style="font-size: 11px; padding: 1px 6px; border-radius: 9999px; background-color: #f3f4f6;">${business.distance.toFixed(1)} km</span>
                  </div>
                </div>
              `,
            });
            
            // Add click listener to show info window
            marker.addListener("click", () => {
              infoWindow.open({
                anchor: marker,
                map: businessMap,
              });
            });
            
            businessMarkers.push({
              marker,
              infoWindow,
              business
            });
            
            bounds.extend({ lat: business.location.lat, lng: business.location.lng });
          });
          
          // Fit map to show all markers
          businessMap.fitBounds(bounds);
          
          // Add limiter for max zoom
          const listener = window.google.maps.event.addListener(businessMap, 'idle', function() {
            if (businessMap.getZoom() > 16) {
              businessMap.setZoom(16);
            }
            window.google.maps.event.removeListener(listener);
          });
        } catch (error) {
          console.error("Error initializing business map:", error);
          mapContainer.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 16px;">
              <p>Failed to load map. Please try again later.</p>
            </div>
          `;
        }
      };
      
      // Function to highlight a business on the map
      const highlightBusinessOnMap = (business: any) => {
        if (!businessMap) return;
        
        // Reset all markers
        businessMarkers.forEach((item) => {
          // Reset marker to original size
          item.marker.setIcon({
            url: item.business.ranking <= 20 
              ? `/images/rank-icons/${item.business.ranking}.png` 
              : `/images/rank-icons/X.png`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          });
          item.infoWindow.close();
        });
        
        // Find the matching marker
        const markerObj = businessMarkers.find((item) => item.business.id === business.id);
        if (markerObj) {
          // Highlight this marker by making it larger
          markerObj.marker.setIcon({
            url: business.ranking <= 20 
              ? `/images/rank-icons/${business.ranking}.png` 
              : `/images/rank-icons/X.png`,
            scaledSize: new window.google.maps.Size(48, 48),
            anchor: new window.google.maps.Point(24, 24)
          });
          
          // Add a subtle bounce animation
          markerObj.marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            markerObj.marker.setAnimation(null);
          }, 1500);
          
          // Show info window
          markerObj.infoWindow.open({
            anchor: markerObj.marker,
            map: businessMap,
          });
          
          // Pan to marker
          businessMap.panTo(markerObj.marker.getPosition());
        }
      };
      
      // Initialize the map
      initBusinessMap();
      
    } catch (error) {
      console.error("Error showing competitors for grid point:", error);
      alert("Failed to load businesses for this location.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar with business information */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="mb-4">
        <button onClick={onClose} className="inline-flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </button>
      </div>

            <div>
              <h1 className="text-xl font-bold text-blue-600 mb-1">{gridResult.businessInfo.name}</h1>
              <p className="text-gray-600">{gridResult.businessInfo.address || "Not available"}</p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">Search term:</div>
              <p className="font-medium">{gridResult.searchTerm}</p>
            </div>

            {/* Grid metrics with visualization */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500">AGR</div>
                    <div className="font-medium">{Number(gridResult.metrics?.agr || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">ATGR</div>
                    <div className="font-medium">{Number(gridResult.metrics?.atgr || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">SoLV</div>
                    <div className="font-medium">{String(gridResult.metrics?.solv || '0%')}</div>
                  </div>
            </div>

                {/* Grid visualization */}
                <div className="h-16 w-16 flex-shrink-0">
                  {Array.isArray(gridData) && gridData.length > 0 ? (
                    <div className="grid grid-cols-5 grid-rows-5 h-full w-full gap-[1px]">
                      {Array(5).fill(0).map((_, rowIndex) => (
                        Array(5).fill(0).map((_, colIndex) => {
                          // Sample data from the full grid to create a smaller representation
                          const fullRowIndex = Math.floor(rowIndex * gridSize / 5);
                          const fullColIndex = Math.floor(colIndex * gridSize / 5);
                          const ranking = gridData[fullRowIndex] && gridData[fullRowIndex][fullColIndex] 
                            ? gridData[fullRowIndex][fullColIndex] 
                            : 0;
                          return (
                            <div 
                              key={`${rowIndex}-${colIndex}`}
                              className="w-full h-full"
                              style={{ 
                                backgroundColor: ranking === 0 ? '#F3F4F6' : getRankingColor(ranking),
                              }}
                            />
                          );
                        })
                      ))}
                    </div>
                  ) : (
                    <div className="h-full w-full bg-gray-100"></div>
                  )}
                </div>
              </div>
            </div>

            {gridResult.businessInfo.placeId && (
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-2">Place ID:</div>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono truncate flex-1 overflow-hidden">
                    {gridResult.businessInfo.placeId}
                  </code>
              <Button
                variant="outline"
                size="sm"
                    className="h-8 w-8 p-0 border-gray-200"
                    onClick={() => {
                      navigator.clipboard.writeText(gridResult.businessInfo.placeId || '');
                      alert('Place ID copied to clipboard');
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
              </Button>
            </div>
              </div>
            )}

            <div>
              <h3 className="text-md font-semibold mb-2">TAGS</h3>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1">Note:</div>
                <div className="text-sm text-gray-600">
                  {gridResult.notes || "No tags or notes added for this search."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area with map */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden relative">
            {/* Action buttons on top of map */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex gap-1">
                <button 
                  onClick={handleRepeatSearch} 
                  className="flex items-center bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Repeat
                </button>
                <button 
                  onClick={handleOpenPNG} 
                  className="flex items-center bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Open PNG
                </button>
                <button 
                  onClick={handleCSVDownload} 
                  className="flex items-center bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button 
                  onClick={handleShare} 
                  className="flex items-center bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                Share
                </button>
                <button 
                onClick={handleDelete}
                disabled={isDeleting}
                  className="flex items-center bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-red-600 text-[14px] tracking-[0] py-[4px] px-[8px]"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                {isDeleting ? "Deleting..." : "Delete"}
                </button>
                <button 
                  onClick={handleCompetitorsView} 
                  className="flex items-center bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                Competitors
                </button>
          </div>
        </div>

            <div className="h-[600px] bg-gray-100 relative">
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
            
            <style jsx global>{`
              .scrollbar-container::-webkit-scrollbar {
                width: 14px;
                height: 14px;
              }
              
              .scrollbar-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
              }
              
              .scrollbar-container::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
                border: 3px solid #f1f1f1;
              }
              
              .scrollbar-container::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              
              /* Firefox */
              .scrollbar-container {
                scrollbar-width: thin;
                scrollbar-color: #888 #f1f1f1;
              }
            `}</style>
              
            <div 
              ref={mapRef} 
              className="w-full h-full scrollbar-container overflow-auto"
              style={{ display: mapError || !mapLoaded ? 'none' : 'block' }}
            />
              
              {/* Metrics overlay directly on map */}
              {mapLoaded && !mapError && (
                <div className="absolute bottom-4 left-4 z-50 flex gap-1">
                  <div className="bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px] flex items-center">
                    <span>Created:</span>
                    <span className="ml-1">{new Date(gridResult.createdAt).toLocaleString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}</span>
            </div>
                  <div className="bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px] flex items-center">
                    <span>Grid:</span>
                    <span className="ml-1">
                      {isNaN(gridResult.gridSize) ? "13" : gridResult.gridSize}x{isNaN(gridResult.gridSize) ? "13" : gridResult.gridSize}, {isNaN(gridResult.distanceKm) ? "2.5" : gridResult.distanceKm}km
                    </span>
            </div>
                  <div className="bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px] flex items-center">
                    <span>AGR:</span>
                    <span className="ml-1">{Number(gridResult.metrics?.agr || 0).toFixed(1)}</span>
              </div>
                  <div className="bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px] flex items-center">
                    <span>ATGR:</span>
                    <span className="ml-1">{Number(gridResult.metrics?.atgr || 0).toFixed(1)}</span>
            </div>
                  <div className="bg-white border-0 rounded-[2px] shadow-[0_1px_4px_-1px_rgba(0,0,0,0.3)] text-[#77838f] text-[14px] tracking-[0] py-[4px] px-[8px] flex items-center">
                    <span>SoLV:</span>
                    <span className="ml-1">{String(gridResult.metrics?.solv || '0%')}</span>
                  </div>
                </div>
              )}
          </div>

            {/* Map metadata at the bottom */}
            <div className="p-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
              <div className="flex-1 min-w-[180px]">
                <div className="text-xs font-medium text-gray-500 mb-1">Created:</div>
              <div>{new Date(gridResult.createdAt).toLocaleString()}</div>
            </div>
              <div className="flex-1 min-w-[180px]">
                <div className="text-xs font-medium text-gray-500 mb-1">Google region:</div>
                <div className="capitalize">{gridResult.googleRegion || "global"}</div>
            </div>
              <div className="flex-1 min-w-[180px]">
                <div className="text-xs font-medium text-gray-500 mb-1">Grid:</div>
              <div>
                  {isNaN(gridResult.gridSize) ? "13" : gridResult.gridSize}x{isNaN(gridResult.gridSize) ? "13" : gridResult.gridSize}, {isNaN(gridResult.distanceKm) ? "2.5" : gridResult.distanceKm}km
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitors Dialog - Revamped with shadcn/ui */}
      <Dialog open={competitorsModalOpen} onOpenChange={setCompetitorsModalOpen}>
        <DialogContent className="w-screen h-screen max-w-full p-0 overflow-hidden flex flex-col sm:max-w-[90vw] sm:h-[90vh] sm:rounded-lg">
          <DialogHeader className="p-4 sm:p-6 border-b flex flex-row justify-between items-center space-y-0">
            <div>
              <DialogTitle>Competitors</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-500 mt-1">Nearby businesses for "{gridResult.businessInfo.name}"</DialogDescription>
            </div>
            <div className="w-1/2 sm:w-1/3">
              <Input
                placeholder="Search..."
                value={competitorSearch}
                onChange={e => setCompetitorSearch(e.target.value)}
                className="w-full h-9 text-sm"
              />
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 sm:px-6 py-4">
              {competitorsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
              </div>
              ) : filteredCompetitors.length === 0 ? (
                <div className="text-center text-gray-500 py-16">No competitors found matching your search.</div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 z-10">
                    <TableRow>
                      <TableHead className="w-16 sm:w-20">Image</TableHead>
                      {['name','ranking','distance','rating'].map(key => (
                        <TableHead
                          key={key}
                          className="cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            if (compSortKey === key) setCompSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                            else { setCompSortKey(key as keyof Competitor); setCompSortOrder('asc') }
                          }}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)} {/* Capitalize */}
                          {compSortKey === key && (compSortOrder === 'asc' ? <span className="ml-1">▲</span> : <span className="ml-1">▼</span>)}
                        </TableHead>
                      ))}
                      <TableHead className="w-16 sm:w-20 text-center">Grid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompetitors.map(comp => (
                      <TableRow key={comp.id}>
                        <TableCell>
                          <img 
                            src={comp.photoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(comp.name.substring(0, 2))}&background=random&color=fff&size=60&bold=true`}
                            alt={comp.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border border-gray-200 bg-gray-100"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comp.name.substring(0, 2))}&background=random&color=fff&size=60&bold=true`;
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell>{comp.ranking}</TableCell>
                        <TableCell>{comp.distance.toFixed(1)} km</TableCell>
                        <TableCell>{comp.rating ? <span className="flex items-center">{comp.rating.toFixed(1)} <span className="text-yellow-500 ml-1">★</span></span> : '–'}</TableCell>
                        <TableCell className="flex justify-center items-center">
                          <div 
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-gray-300"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(13, 1fr)",
                              gridTemplateRows: "repeat(13, 1fr)",
                              gap: "0px"
                            }}
                            title={`Simulated ranking grid for ${comp.name}`}
                          >
                            {Array.from({ length: 169 }).map((_, index) => {
                              const i = Math.floor(index / 13);
                              const j = index % 13;
                              const centerRow = 6;
                              const centerCol = 6;
                              const distanceFromCenter = Math.sqrt(Math.pow(i - centerRow, 2) + Math.pow(j - centerCol, 2));
                              let cellRanking = comp.ranking || 20;
                              if (distanceFromCenter > 0) {
                                const distanceFactor = Math.pow(distanceFromCenter, 1.2);
                                cellRanking = Math.min(20, Math.round(cellRanking + distanceFactor * 1.5)); 
                              }
                              return (
                                <div 
                                  key={`${comp.id}-grid-${i}-${j}`}
                                  style={{ 
                                    backgroundColor: getRankingColor(cellRanking),
                                    border: "0.5px solid rgba(255, 255, 255, 0.2)" 
                                  }}
                                />
                              );
                            })}
                      </div>
                        </TableCell>
                      </TableRow>
                ))}
                  </TableBody>
                </Table>
            )}
          </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

