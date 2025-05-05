"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { PlusCircle, Search, X, MapPin, Calendar, BarChart2, TrendingUp, Filter, Grid, Loader2, Star, LineChart, MapIcon, User, LayersIcon } from "lucide-react"
import { GridImageGenerator } from "./grid-image-generator"
import { DetailedGridView } from "./detailed-grid-view"
import { type GridResult, deleteGridResult } from "@/lib/geogrid-service"
import { AdvancedCompetitorAnalysis } from "./advanced-competitor-analysis"
import { GeoKeywordTrends } from "./geo-keyword-trends"
import { BusinessLocationTracker } from "./business-location-tracker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface GridResultDisplay extends Omit<GridResult, 'gridSize' | 'metrics'> {
  gridSize: number;
  metrics: {
    agr: number;
    atgr: number;
    solv: number;
    averageRank: number;
    visibilityPercentage: number;
    top20AverageRank: number;
  };
}

export function DashboardHome() {
  const [gridResults, setGridResults] = useState<GridResult[]>([])
  const [businessFilter, setBusinessFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [tagFilter, setTagFilter] = useState("All")
  const [gridSizeFilter, setGridSizeFilter] = useState("All")
  const [searchTermFilter, setSearchTermFilter] = useState("")
  const [selectedGridResult, setSelectedGridResult] = useState<GridResult | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("grid-results")

  // Load grid results
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Simulate loading delay
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Use the API route instead of direct database call
        const response = await fetch("/api/grid-results")
        if (!response.ok) {
          throw new Error(`Error fetching grid results: ${response.status}`)
        }
        const results = await response.json()
        setGridResults(results || []) // Ensure we always set an array
      } catch (error) {
        console.error("Error loading grid results:", error)
        setGridResults([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Get unique business names for filter
  const businessNames = ["All", ...new Set(gridResults.map((result) => result.businessInfo.name))]

  // Get unique categories for filter
  const categories = ["All", ...new Set(gridResults.map((result) => result.businessInfo.category || "Uncategorized"))]

  // Get unique grid sizes for filter
  const gridSizes = ["All", ...new Set(gridResults.map((result) => result.gridSize))]

  // Filter results
  const filteredResults = gridResults.filter((result) => {
    if (businessFilter !== "All" && result.businessInfo.name !== businessFilter) return false
    if (categoryFilter !== "All" && result.businessInfo.category !== categoryFilter) return false
    if (gridSizeFilter !== "All" && result.gridSize !== gridSizeFilter) return false
    if (searchTermFilter && !result.searchTerm.toLowerCase().includes(searchTermFilter.toLowerCase())) return false
    return true
  })

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this grid result?")) {
      setIsDeleting(true)
      try {
        const deleted = await deleteGridResult(id)
        if (deleted) {
          // Refresh the grid results after deletion
          const response = await fetch("/api/grid-results")
          if (!response.ok) {
            throw new Error(`Error fetching grid results: ${response.status}`)
          }
          const updatedResults = await response.json()
          setGridResults(updatedResults || [])
        }
      } catch (error) {
        console.error("Error deleting grid result:", error)
        alert("Failed to delete grid result")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  // Clear filters
  const clearFilters = () => {
    setBusinessFilter("All")
    setCategoryFilter("All")
    setTagFilter("All")
    setGridSizeFilter("All")
    setSearchTermFilter("")
  }

  // Toggle item selection
  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Calculate statistics
  const totalGrids = gridResults.length;
  const averageRank = gridResults.reduce((acc, result) => acc + (result.metrics.averageRank || 0), 0) / totalGrids || 0;
  const visibilityPercentage = gridResults.reduce((acc, result) => acc + (result.metrics.visibilityPercentage || 0), 0) / totalGrids || 0;
  const top20Average = gridResults.reduce((acc, result) => acc + (result.metrics.top20AverageRank || 0), 0) / totalGrids || 0;

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto pt-24 pb-10 px-4 animate-pulse">
        <div className="flex justify-end mb-6">
          <div className="h-10 w-36 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-12 w-full bg-gray-200 rounded mb-6"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 w-full bg-gray-200 rounded mb-4"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto pt-24 pb-10 px-4">
      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Grids</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalGrids}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Grid className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Rank</p>
              <h3 className="text-2xl font-bold text-gray-900">{averageRank.toFixed(1)}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Visibility %</p>
              <h3 className="text-2xl font-bold text-gray-900">{visibilityPercentage.toFixed(1)}%</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <BarChart2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Top 20 Avg.</p>
              <h3 className="text-2xl font-bold text-gray-900">{top20Average.toFixed(1)}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <BarChart2 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="grid-results" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6 bg-muted/50 p-1">
          <TabsTrigger value="grid-results" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Grid Results
          </TabsTrigger>
          <TabsTrigger value="keyword-insights" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Keyword Insights
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
        </TabsList>

        {/* Grid Results Tab */}
        <TabsContent value="grid-results">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by term..."
                  value={searchTermFilter}
                  onChange={(e) => setSearchTermFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Link href="/new-search" passHref>
                  <Button size="sm" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    New Search
                  </Button>
                </Link>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-4">
                <div className="w-full md:w-auto">
                  <Label htmlFor="business-filter" className="text-xs font-medium block mb-1">Business</Label>
                  <Select
                    value={businessFilter}
                    onValueChange={setBusinessFilter}
                  >
                    <SelectTrigger id="business-filter" className="w-full md:w-52">
                      <SelectValue placeholder="All businesses" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-auto">
                  <Label htmlFor="category-filter" className="text-xs font-medium block mb-1">Category</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger id="category-filter" className="w-full md:w-52">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-auto">
                  <Label htmlFor="grid-filter" className="text-xs font-medium block mb-1">Grid Size</Label>
                  <Select
                    value={gridSizeFilter}
                    onValueChange={setGridSizeFilter}
                  >
                    <SelectTrigger id="grid-filter" className="w-full md:w-36">
                      <SelectValue placeholder="All sizes" />
                    </SelectTrigger>
                    <SelectContent>
                      {gridSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size === "All" ? "All sizes" : `${size}x${size}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-auto flex items-end">
                  <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4">
                    <Checkbox
                      checked={selectedItems.length === filteredResults.length && filteredResults.length > 0}
                      onCheckedChange={() => {
                        if (selectedItems.length === filteredResults.length) {
                          setSelectedItems([]);
                        } else {
                          setSelectedItems(filteredResults.map(result => result.id));
                        }
                      }}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search term
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grid Ranks
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grid
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Grid className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium mb-1">No grid results found</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your filters or create a new grid search</p>
                        <Link href="/new-search" passHref>
                          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <PlusCircle className="h-4 w-4" />
                            New GeoGrid Search
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedItems.includes(result.id)}
                          onCheckedChange={() => toggleSelectItem(result.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => setSelectedGridResult(result)}>
                            {result.businessInfo.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1 inline text-gray-400" />
                            {result.businessInfo.address}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {result.businessInfo.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">{result.searchTerm}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(result.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-gray-500 w-14">AGR:</span>
                            <span className="font-medium">{result.metrics.agr ? result.metrics.agr.toFixed(1) : "N/A"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-gray-500 w-14">ATGR:</span>
                            <span className="font-medium">{result.metrics.atgr ? result.metrics.atgr.toFixed(2) : "N/A"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-gray-500 w-14">SoLV:</span>
                            <span className="font-medium">{result.metrics.solv || "0%"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 mx-auto cursor-pointer" onClick={() => setSelectedGridResult(result)}>
                          <GridImageGenerator gridResult={result} width={64} height={64} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setSelectedGridResult(result)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(result.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Keyword Insights Tab */}
        <TabsContent value="keyword-insights">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Keyword Trends & Insights</h2>
            </div>
            <GeoKeywordTrends searchTerm="local business" initialKeywords={["local business", "service near me"]} className="mt-4" />
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Competitor Analysis</h2>
            </div>
            <AdvancedCompetitorAnalysis 
              businessName="Your Business"
              location={{ lat: 37.7749, lng: -122.4194 }}
              searchTerm="local business"
              className="mt-4"
            />
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Business Locations</h2>
            </div>
            <BusinessLocationTracker />
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Grid View Dialog (Fullscreen) */}
      {selectedGridResult && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center sticky top-0 bg-white z-10">
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium p-2"
              onClick={() => {
                setSelectedGridResult(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to list
            </Button>
          </div>

          {/* DetailedGridView renders map and controls */}
          <div className="flex-1 overflow-hidden">
            <DetailedGridView
              gridResult={selectedGridResult as any}
              isOpen={true}
              onClose={() => setSelectedGridResult(null)}
              onDelete={() => {
                handleDelete(selectedGridResult.id);
                setSelectedGridResult(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
