"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Map, Search, TrendingUp, Download, Plus, RefreshCcw, BarChart2 } from "lucide-react"
import { LoadingSpinner } from "./loading-spinner"

interface KeywordTrend {
  keyword: string
  searchVolume: number
  competitionScore: number
  cpc: number
  trendsData: {
    month: string
    volume: number
  }[]
  geoDistribution: {
    region: string
    percentage: number
  }[]
}

interface GeoKeywordTrendsProps {
  searchTerm?: string
  initialKeywords?: string[]
  businessLocation?: {
    lat: number
    lng: number
    city?: string
    state?: string
  }
  className?: string
}

export function GeoKeywordTrends({
  searchTerm = "",
  initialKeywords = [],
  businessLocation,
  className
}: GeoKeywordTrendsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [keywords, setKeywords] = useState<string[]>(initialKeywords.length > 0 ? initialKeywords : [searchTerm])
  const [keywordInput, setKeywordInput] = useState("")
  const [keywordData, setKeywordData] = useState<Record<string, KeywordTrend>>({})
  const [selectedTab, setSelectedTab] = useState("volume")
  const [comparisonRegion, setComparisonRegion] = useState<string>("national")
  const [regionOptions, setRegionOptions] = useState<string[]>([
    "national",
    "state", 
    "local"
  ])
  const [timeRange, setTimeRange] = useState<string>("6m")

  // Colors for charts
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6']

  // Load keyword data
  useEffect(() => {
    const fetchKeywordData = async () => {
      if (keywords.length === 0) return

      setIsLoading(true)
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Mock data generation for each keyword
        const mockData: Record<string, KeywordTrend> = {}
        
        keywords.forEach((keyword, index) => {
          // Create random trend data
          const trendMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const trendsData = trendMonths.slice(-6).map(month => {
            const baseVolume = 5000 + Math.random() * 10000
            // Add some spikes and dips
            const variation = (Math.random() * 0.4) - 0.2
            return {
              month,
              volume: Math.round(baseVolume * (1 + variation))
            }
          })

          // Create geographic distribution data
          const regions = ["California", "Texas", "New York", "Florida", "Illinois"]
          const remainingPercentage = 100 - (index * 5) - 20 // Ensure it adds up to 100
          
          const geoDistribution = [
            { region: "Your Region", percentage: 20 + (index * 5) },
            ...regions.map((region, i) => ({
              region,
              percentage: Math.round((remainingPercentage / regions.length) + ((i === index % regions.length) ? 10 : 0))
            }))
          ]
          
          // Normalize to 100%
          const totalPercentage = geoDistribution.reduce((sum, item) => sum + item.percentage, 0)
          geoDistribution.forEach(item => {
            item.percentage = Math.round((item.percentage / totalPercentage) * 100)
          })

          mockData[keyword] = {
            keyword,
            searchVolume: Math.round(8000 + Math.random() * 12000),
            competitionScore: Math.round((0.3 + Math.random() * 0.6) * 100) / 100,
            cpc: Math.round((1 + Math.random() * 4) * 100) / 100,
            trendsData,
            geoDistribution
          }
        })

        setKeywordData(mockData)
      } catch (error) {
        console.error("Error fetching keyword data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchKeywordData()
  }, [keywords, timeRange, comparisonRegion])

  // Add a keyword to the list
  const addKeyword = () => {
    if (keywordInput && !keywords.includes(keywordInput)) {
      setKeywords(prev => [...prev, keywordInput])
      setKeywordInput("")
    }
  }

  // Remove a keyword from the list
  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword))
  }

  // Handle input field keydown (for Enter key)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addKeyword()
    }
  }

  // Calculate average volume
  const getAverageVolume = (keyword: string) => {
    if (!keywordData[keyword]?.trendsData) return 0
    
    const volumes = keywordData[keyword].trendsData.map(item => item.volume)
    return Math.round(volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length)
  }

  // Prepare trend data for chart
  const prepareTrendData = () => {
    if (Object.keys(keywordData).length === 0) return []
    
    // Get all months from the first keyword
    const firstKeyword = Object.keys(keywordData)[0]
    if (!firstKeyword) return []
    
    const months = keywordData[firstKeyword].trendsData.map(item => item.month)
    
    // Create data points for each month with values for each keyword
    return months.map((month, i) => {
      const dataPoint: Record<string, any> = { month }
      
      keywords.forEach(keyword => {
        if (keywordData[keyword]?.trendsData?.[i]) {
          dataPoint[keyword] = keywordData[keyword].trendsData[i].volume
        }
      })
      
      return dataPoint
    })
  }

  const trendData = prepareTrendData()

  // Render loading state
  if (isLoading && Object.keys(keywordData).length === 0) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Geographic Keyword Trends</CardTitle>
            <CardDescription>Analyzing search volume and patterns...</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Geographic Keyword Trends</CardTitle>
              <CardDescription>
                Analyze search patterns across regions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="12m">12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Select value={comparisonRegion} onValueChange={setComparisonRegion}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Keyword Selection */}
          <div className="mb-6">
            <div className="flex gap-3 mb-2">
              <div className="flex-1">
                <Label htmlFor="keyword-input" className="sr-only">
                  Add Keyword
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="keyword-input"
                    placeholder="Add keyword to compare..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button 
                onClick={addKeyword} 
                disabled={!keywordInput || keywords.includes(keywordInput)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {keywords.map((keyword, index) => (
                <div 
                  key={keyword}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full"
                  style={{ borderLeft: `3px solid ${COLORS[index % COLORS.length]}` }}
                >
                  <span>{keyword}</span>
                  <button 
                    onClick={() => removeKeyword(keyword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              {keywords.length === 0 && (
                <div className="text-sm text-muted-foreground italic">
                  Add keywords to analyze trends
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="h-72 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Tabs for different views */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="volume" className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Volume Trends
                  </TabsTrigger>
                  <TabsTrigger value="geo" className="flex items-center gap-1">
                    <Map className="h-4 w-4" />
                    Geographic Distribution
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="flex items-center gap-1">
                    <BarChart2 className="h-4 w-4" />
                    Comparison
                  </TabsTrigger>
                </TabsList>

                {/* Volume Trends Tab */}
                <TabsContent value="volume" className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {keywords.map((keyword, index) => (
                          <Line
                            key={keyword}
                            type="monotone"
                            dataKey={keyword}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {keywords.map((keyword, index) => {
                      if (!keywordData[keyword]) return null
                      const data = keywordData[keyword]
                      
                      return (
                        <Card key={keyword} className="overflow-hidden">
                          <div 
                            className="h-1.5" 
                            style={{ background: COLORS[index % COLORS.length] }}
                          />
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2 truncate" title={keyword}>
                              {keyword}
                            </h4>
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                              <div>
                                <div className="text-muted-foreground">Avg. Search Volume</div>
                                <div className="font-medium">{getAverageVolume(keyword).toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Competition</div>
                                <div className="font-medium">{data.competitionScore.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Trend</div>
                                <div className="font-medium flex items-center">
                                  {Math.random() > 0.5 ? (
                                    <>
                                      <span className="text-green-600">+{Math.floor(Math.random() * 15) + 1}%</span>
                                      <TrendingUp className="h-3 w-3 text-green-600 ml-1" />
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-red-600">-{Math.floor(Math.random() * 10) + 1}%</span>
                                      <TrendingUp className="h-3 w-3 text-red-600 ml-1 rotate-180" />
                                    </>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">CPC</div>
                                <div className="font-medium">${data.cpc.toFixed(2)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                {/* Geographic Distribution Tab */}
                <TabsContent value="geo" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {keywords.slice(0, 2).map((keyword, index) => {
                      if (!keywordData[keyword]) return null
                      
                      return (
                        <div key={keyword} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{keyword}</h3>
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                          </div>
                          
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={keywordData[keyword].geoDistribution}
                                  dataKey="percentage"
                                  nameKey="region"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  labelLine={false}
                                >
                                  {keywordData[keyword].geoDistribution.map((entry, i) => (
                                    <Cell 
                                      key={`cell-${i}`} 
                                      fill={entry.region === "Your Region" 
                                        ? COLORS[index % COLORS.length] 
                                        : `${COLORS[index % COLORS.length]}${Math.floor(80 - i * 15).toString(16)}`} 
                                    />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value}%`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-3">Regional Interest Comparison</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={keywords.map(keyword => {
                                if (!keywordData[keyword]) return {}
                                
                                const yourRegion = keywordData[keyword].geoDistribution.find(
                                  item => item.region === "Your Region"
                                )
                                
                                return {
                                  name: keyword,
                                  "Your Region": yourRegion?.percentage || 0,
                                  "National Average": 100 - (yourRegion?.percentage || 0)
                                }
                              })}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" domain={[0, 100]} />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100} 
                                tick={{ fontSize: 12 }} 
                              />
                              <Tooltip formatter={(value) => `${value}%`} />
                              <Legend />
                              <Bar dataKey="Your Region" fill="#2563eb" stackId="a" />
                              <Bar dataKey="National Average" fill="#94a3b8" stackId="a" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-3">Search Volume Comparison</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={keywords.map(keyword => ({
                                name: keyword,
                                value: keywordData[keyword]?.searchVolume || 0
                              }))}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip formatter={(value) => value.toLocaleString()} />
                              <Bar 
                                dataKey="value" 
                                name="Search Volume" 
                                radius={[4, 4, 0, 0]}
                              >
                                {keywords.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-3">Competition Score</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={keywords.map(keyword => ({
                                name: keyword,
                                value: keywordData[keyword]?.competitionScore || 0
                              }))}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis domain={[0, 1]} />
                              <Tooltip formatter={(value) => value.toString(2)} />
                              <Bar 
                                dataKey="value" 
                                name="Competition" 
                                radius={[4, 4, 0, 0]}
                              >
                                {keywords.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Keyword Opportunities</h3>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <RefreshCcw className="h-3 w-3" />
                          Refresh
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CPC</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {keywords.map((keyword, index) => {
                              if (!keywordData[keyword]) return null
                              const data = keywordData[keyword]
                              
                              // Calculate opportunity score (higher volume, lower competition is better)
                              const opportunityScore = Math.round(
                                (data.searchVolume / 10000) * (1 - data.competitionScore) * 100
                              )
                              
                              return (
                                <tr key={keyword}>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div 
                                        className="h-2 w-2 rounded-full mr-2" 
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                      />
                                      <span className="font-medium">{keyword}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    {data.searchVolume.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    {data.competitionScore.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    ${data.cpc.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                      style={{
                                        backgroundColor: opportunityScore > 70 
                                          ? '#dcfce7' 
                                          : opportunityScore > 40 
                                            ? '#fef9c3' 
                                            : '#fee2e2',
                                        color: opportunityScore > 70 
                                          ? '#166534' 
                                          : opportunityScore > 40 
                                            ? '#854d0e' 
                                            : '#991b1b',
                                      }}
                                    >
                                      {opportunityScore > 70 
                                        ? 'High' 
                                        : opportunityScore > 40 
                                          ? 'Medium' 
                                          : 'Low'}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 