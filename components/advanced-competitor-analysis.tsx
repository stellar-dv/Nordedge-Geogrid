"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { LoadingSpinner } from "./loading-spinner"
import { ChevronDown, DownloadIcon, InfoIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

interface CompetitorData {
  id: string
  name: string
  rating: number
  reviewCount: number
  categories: string[]
  visibility: number
  rankingPower: number
  contentScore: number
  photoCount: number
  responsiveness: number
  avgResponseTime: number
  lastUpdated: string
  proximity: number
  rankPosition: number[]
}

interface AdvancedCompetitorAnalysisProps {
  businessId?: string
  businessName: string
  location: {
    lat: number
    lng: number
  }
  searchTerm: string
  className?: string
}

export function AdvancedCompetitorAnalysis({
  businessId,
  businessName,
  location,
  searchTerm,
  className,
}: AdvancedCompetitorAnalysisProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("rankingPower")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentTab, setCurrentTab] = useState("overview")

  // Simulated data loading
  useEffect(() => {
    const fetchCompetitors = async () => {
      setIsLoading(true)
      try {
        // Simulated API call - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Sample competitor data
        const mockCompetitors: CompetitorData[] = [
          {
            id: "comp1",
            name: "Top Competitor Inc",
            rating: 4.8,
            reviewCount: 512,
            categories: ["Service Business", "Local Service"],
            visibility: 92,
            rankingPower: 89,
            contentScore: 78,
            photoCount: 42,
            responsiveness: 95,
            avgResponseTime: 0.8,
            lastUpdated: "2023-12-15",
            proximity: 1.2,
            rankPosition: [1, 2, 1, 3, 1, 2, 4, 1, 2]
          },
          {
            id: "comp2",
            name: "Rising Star LLC",
            rating: 4.5,
            reviewCount: 267,
            categories: ["Service Business"],
            visibility: 75,
            rankingPower: 68,
            contentScore: 82,
            photoCount: 37,
            responsiveness: 87,
            avgResponseTime: 3.5,
            lastUpdated: "2023-11-28",
            proximity: 0.9,
            rankPosition: [5, 4, 3, 3, 2, 4, 5, 6, 4]
          },
          {
            id: "comp3",
            name: "Local Expert Services",
            rating: 4.2,
            reviewCount: 379,
            categories: ["Service Business", "Specialty Service"],
            visibility: 81,
            rankingPower: 76,
            contentScore: 64,
            photoCount: 28,
            responsiveness: 72,
            avgResponseTime: 6.2,
            lastUpdated: "2023-10-05",
            proximity: 1.7,
            rankPosition: [3, 4, 2, 5, 7, 8, 6, 3, 5]
          },
          {
            id: "comp4",
            name: "Premium Services Co",
            rating: 4.9,
            reviewCount: 183,
            categories: ["Premium Service", "Specialty Service"],
            visibility: 69,
            rankingPower: 74,
            contentScore: 88,
            photoCount: 65,
            responsiveness: 91,
            avgResponseTime: 1.2,
            lastUpdated: "2023-12-18",
            proximity: 2.1,
            rankPosition: [7, 5, 8, 6, 4, 3, 5, 7, 6]
          },
          {
            id: "comp5",
            name: "Your Business",
            rating: 4.6,
            reviewCount: 342,
            categories: ["Service Business", "Local Service"],
            visibility: 78,
            rankingPower: 72,
            contentScore: 70,
            photoCount: 31,
            responsiveness: 85,
            avgResponseTime: 4.1,
            lastUpdated: "2023-12-01",
            proximity: 0,
            rankPosition: [2, 3, 4, 2, 3, 5, 3, 4, 2]
          }
        ]
        
        // Add your business to the competitors list
        setCompetitors(mockCompetitors)
        
        // Auto-select your business and top competitor
        setSelectedCompetitors(["comp5", "comp1"])
      } catch (error) {
        console.error("Error fetching competitors:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompetitors()
  }, [businessId, location, searchTerm])

  const handleCompetitorToggle = (compId: string) => {
    setSelectedCompetitors(prev => 
      prev.includes(compId) 
        ? prev.filter(id => id !== compId) 
        : [...prev, compId]
    )
  }

  const sortedCompetitors = [...competitors].sort((a, b) => {
    // Always put "Your Business" at the top
    if (a.name === "Your Business") return -1
    if (b.name === "Your Business") return 1
    
    // Then sort by the selected criterion
    const valueA = a[sortBy as keyof CompetitorData] as number
    const valueB = b[sortBy as keyof CompetitorData] as number
    
    return sortDirection === "asc" 
      ? valueA - valueB 
      : valueB - valueA
  })

  // Prepare data for competitive radar chart
  const prepareRadarData = () => {
    const metrics = [
      { name: "Visibility", key: "visibility" },
      { name: "Ranking Power", key: "rankingPower" },
      { name: "Content Score", key: "contentScore" },
      { name: "Reviews", key: "reviewCount", normalize: true },
      { name: "Rating", key: "rating", scale: 20 },
      { name: "Responsiveness", key: "responsiveness" }
    ]
    
    // Only include selected competitors
    const filteredCompetitors = competitors.filter(comp => 
      selectedCompetitors.includes(comp.id)
    )
    
    return metrics.map(metric => {
      const dataPoint: any = { name: metric.name }
      
      filteredCompetitors.forEach(comp => {
        let value = comp[metric.key as keyof CompetitorData] as number
        
        // Normalize values if needed
        if (metric.normalize) {
          const max = Math.max(...competitors.map(c => c[metric.key as keyof CompetitorData] as number))
          value = (value / max) * 100
        }
        
        // Scale certain metrics
        if (metric.scale) {
          value = value * metric.scale
        }
        
        dataPoint[comp.name] = value
      })
      
      return dataPoint
    })
  }

  // Prepare rank position data for line chart
  const prepareRankData = () => {
    const filteredCompetitors = competitors.filter(comp => 
      selectedCompetitors.includes(comp.id)
    )
    
    return Array.from({ length: 9 }, (_, i) => {
      const dataPoint: any = { name: `P${i+1}` }
      
      filteredCompetitors.forEach(comp => {
        dataPoint[comp.name] = 20 - comp.rankPosition[i]
      })
      
      return dataPoint
    })
  }

  const radarData = prepareRadarData()
  const rankData = prepareRankData()

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Advanced Competitor Analysis</CardTitle>
              <CardDescription>
                Compare your business with local competitors for &quot;{searchTerm}&quot;
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="rankings">Ranking Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Select competitors to compare:</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <select 
                      className="text-sm border rounded p-1"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="rankingPower">Ranking Power</option>
                      <option value="visibility">Visibility</option>
                      <option value="rating">Rating</option>
                      <option value="reviewCount">Reviews</option>
                      <option value="proximity">Proximity</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sortedCompetitors.map(competitor => (
                    <div 
                      key={competitor.id}
                      className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                        competitor.name === "Your Business"
                          ? "bg-blue-50 border border-blue-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`comp-${competitor.id}`}
                          checked={selectedCompetitors.includes(competitor.id)}
                          onChange={() => handleCompetitorToggle(competitor.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          disabled={competitor.name === "Your Business"}
                        />
                        <div>
                          <div className="font-medium">
                            {competitor.name}
                            {competitor.name === "Your Business" && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">You</span>}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <span className="flex items-center">
                              <span className="text-yellow-500 mr-1">★</span>
                              {competitor.rating}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{competitor.reviewCount} reviews</span>
                            <span className="mx-2">•</span>
                            <span>{competitor.proximity} mi</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{competitor[sortBy as keyof CompetitorData]}</div>
                        <div className="text-xs text-muted-foreground">
                          {sortBy === "rankingPower" ? "Ranking Power" : 
                            sortBy === "reviewCount" ? "Reviews" :
                            sortBy === "proximity" ? "Miles away" :
                            sortBy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <div className="flex items-center mb-2">
                  <h3 className="text-sm font-medium">Competitive Performance Radar</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                        <InfoIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <p className="text-sm text-muted-foreground">
                        This radar chart shows how your business compares to selected competitors across key performance metrics.
                        Higher values (further from center) indicate better performance.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      
                      {competitors
                        .filter(comp => selectedCompetitors.includes(comp.id))
                        .map((comp, index) => (
                          <Radar
                            key={comp.id}
                            name={comp.name}
                            dataKey={comp.name}
                            stroke={comp.name === "Your Business" ? "#2563eb" : ["#f59e0b", "#10b981", "#6366f1", "#ec4899"][index % 4]}
                            fill={comp.name === "Your Business" ? "#2563eb" : ["#f59e0b", "#10b981", "#6366f1", "#ec4899"][index % 4]}
                            fillOpacity={0.2}
                          />
                        ))}
                      
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Review Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={competitors.filter(comp => selectedCompetitors.includes(comp.id)).map(comp => ({
                        name: comp.name,
                        rating: comp.rating,
                        reviews: comp.reviewCount
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="reviews" name="Review Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="rating" name="Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Visibility & Content Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={competitors.filter(comp => selectedCompetitors.includes(comp.id)).map(comp => ({
                        name: comp.name,
                        visibility: comp.visibility,
                        contentScore: comp.contentScore,
                        photoCount: comp.photoCount
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="visibility" name="Visibility %" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="contentScore" name="Content Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="photoCount" name="Photos" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rankings" className="space-y-4">
              <div>
                <div className="flex items-center mb-2">
                  <h3 className="text-sm font-medium">Grid Ranking Performance</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                        <InfoIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <p className="text-sm text-muted-foreground">
                        This chart shows ranking positions across 9 grid points. Higher values indicate better positions.
                        (P5 is typically the center of your grid)
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rankData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 20]} />
                      <Tooltip />
                      <Legend />
                      
                      {competitors
                        .filter(comp => selectedCompetitors.includes(comp.id))
                        .map((comp, index) => (
                          <Bar
                            key={comp.id}
                            dataKey={comp.name}
                            fill={comp.name === "Your Business" ? "#2563eb" : ["#f59e0b", "#10b981", "#6366f1", "#ec4899"][index % 4]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {competitors
                  .filter(comp => selectedCompetitors.includes(comp.id))
                  .map(comp => (
                    <Card key={comp.id} className={comp.name === "Your Business" ? "border-blue-200" : ""}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{comp.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Ranking Power</div>
                            <div className="text-xl font-semibold">{comp.rankingPower}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Visibility</div>
                            <div className="text-xl font-semibold">{comp.visibility}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Best Position</div>
                            <div className="text-xl font-semibold">
                              {Math.min(...comp.rankPosition)}
                              <span className="text-sm text-muted-foreground ml-1">
                                (P{comp.rankPosition.indexOf(Math.min(...comp.rankPosition)) + 1})
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Avg Position</div>
                            <div className="text-xl font-semibold">
                              {(comp.rankPosition.reduce((a, b) => a + b, 0) / comp.rankPosition.length).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 