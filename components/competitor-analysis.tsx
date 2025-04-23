"use client"

import { useState, useEffect } from "react"
import type { BusinessInfo, MapCenter, Competitor } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, MapPin, Star } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts"

interface CompetitorAnalysisProps {
  businessInfo: BusinessInfo
  mapCenter: MapCenter
}

export function CompetitorAnalysis({ businessInfo, mapCenter }: CompetitorAnalysisProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  useEffect(() => {
    async function fetchCompetitors() {
      if (!mapCenter) return

      setIsLoading(true)
      setError(null)

      try {
        const keyword = (businessInfo.category || "business").toLowerCase()
        const radius = 5000 // Default 5km radius

        const response = await fetch(
          `/api/nearby-places?lat=${mapCenter.lat}&lng=${mapCenter.lng}&keyword=${encodeURIComponent(keyword)}&radius=${radius}`,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setCompetitors(data.places || [])
      } catch (err) {
        console.error("Error fetching competitors:", err)
        setError("Failed to load competitor data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompetitors()
  }, [businessInfo, mapCenter])

  // Sort competitors by rating
  const sortedByRating = [...competitors].sort((a, b) => b.rating - a.rating)

  // Prepare data for charts
  const ratingData = sortedByRating.slice(0, 5).map((competitor) => ({
    name: competitor.name.length > 15 ? competitor.name.substring(0, 15) + "..." : competitor.name,
    rating: competitor.rating,
  }))

  // Rating distribution data
  const ratingDistributionData = [
    {
      name: "5 Stars",
      value: sortedByRating.filter((c) => c.rating >= 4.8).length,
      fill: "#10b981",
    },
    {
      name: "4 Stars",
      value: sortedByRating.filter((c) => c.rating >= 4 && c.rating < 4.8).length,
      fill: "#22c55e",
    },
    {
      name: "3 Stars",
      value: sortedByRating.filter((c) => c.rating >= 3 && c.rating < 4).length,
      fill: "#f59e0b",
    },
    {
      name: "2 Stars",
      value: sortedByRating.filter((c) => c.rating >= 2 && c.rating < 3).length,
      fill: "#f97316",
    },
    {
      name: "1 Star",
      value: sortedByRating.filter((c) => c.rating < 2).length,
      fill: "#ef4444",
    },
  ]

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <CardTitle>Competitive Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-2" />
              <p className="text-slate-600">Loading competitor data...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : competitors.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600">No competitor data available for this location</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="rating">Rating Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitors.slice(0, 6).map((competitor) => (
                  <div
                    key={competitor.id}
                    className="p-4 border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="font-medium text-slate-900">{competitor.name}</div>
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-amber-600" />
                        {competitor.address}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Star className="h-3.5 w-3.5 text-amber-500 mr-1" />
                          <span className="text-sm font-medium">{competitor.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {competitors.length > 6 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-600">Showing 6 of {competitors.length} competitors in your area</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rating">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip formatter={(value) => [`${value} stars`, "Rating"]} />
                    <Legend />
                    <Bar dataKey="rating" name="Average Rating" fill="#f59e0b">
                      {ratingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#f59e0b" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-medium text-slate-900 mb-4">Rating Distribution</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ratingDistributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label
                        />
                        <Tooltip formatter={(value) => [`${value} businesses`, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-medium text-slate-900 mb-4">Key Insights</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mt-1.5 mr-2"></span>
                      Average competitor rating:{" "}
                      <strong className="ml-1">
                        {(sortedByRating.reduce((sum, c) => sum + c.rating, 0) / sortedByRating.length).toFixed(1)}{" "}
                        stars
                      </strong>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mt-1.5 mr-2"></span>
                      Top rated competitor: <strong className="ml-1">{sortedByRating[0]?.name}</strong> with{" "}
                      {sortedByRating[0]?.rating.toFixed(1)} stars
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mt-1.5 mr-2"></span>
                      {sortedByRating.filter((c) => c.rating >= 4.5).length} competitors have excellent ratings (4.5+
                      stars)
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mt-1.5 mr-2"></span>
                      {sortedByRating.filter((c) => c.rating < 4).length} competitors have ratings below 4 stars
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
