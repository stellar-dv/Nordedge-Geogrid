"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { MapPin, Star, Users, TrendingUp } from "lucide-react"
import type { BusinessInfo } from "@/types/business-info"

interface CompetitiveAnalysisProps {
  businessInfo: BusinessInfo
  gridCenter: { lat: number; lng: number } | null
}

interface Competitor {
  id: string
  name: string
  address: string
  rating: number
  userRatingsTotal: number
  types: string[]
  location: {
    lat: number
    lng: number
  }
}

export function CompetitiveAnalysis({ businessInfo, gridCenter }: CompetitiveAnalysisProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompetitors() {
      if (!gridCenter) return

      setIsLoading(true)
      setError(null)

      try {
        const keyword = businessInfo.keywords[0] || businessInfo.category.toLowerCase()
        const radius = businessInfo.serviceRadius * 1000 // Convert km to meters

        const response = await fetch(
          `/api/nearby-places?lat=${gridCenter.lat}&lng=${gridCenter.lng}&keyword=${encodeURIComponent(keyword)}&radius=${radius}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch competitors")
        }

        const data = await response.json()
        setCompetitors(data.places)
      } catch (err) {
        console.error("Error fetching competitors:", err)
        setError("Failed to load competitor data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompetitors()
  }, [businessInfo, gridCenter])

  // Sort competitors by rating
  const sortedByRating = [...competitors].sort((a, b) => b.rating - a.rating)

  // Sort competitors by review count
  const sortedByReviews = [...competitors].sort((a, b) => b.userRatingsTotal - a.userRatingsTotal)

  // Prepare data for charts
  const ratingData = sortedByRating.slice(0, 5).map((competitor) => ({
    name: competitor.name.length > 15 ? competitor.name.substring(0, 15) + "..." : competitor.name,
    rating: competitor.rating,
  }))

  const reviewData = sortedByReviews.slice(0, 5).map((competitor) => ({
    name: competitor.name.length > 15 ? competitor.name.substring(0, 15) + "..." : competitor.name,
    reviews: competitor.userRatingsTotal,
  }))

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Competitive Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading competitor data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : competitors.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">No competitor data available</p>
          </div>
        ) : (
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="rating">Rating Chart</TabsTrigger>
              <TabsTrigger value="reviews">Review Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitors.slice(0, 6).map((competitor) => (
                  <Card key={competitor.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="font-medium">{competitor.name}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {competitor.address}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                            <span className="text-sm">{competitor.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 text-blue-500 mr-1" />
                            <span className="text-sm">{competitor.userRatingsTotal} reviews</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                    <Bar dataKey="rating" name="Average Rating" fill="#4f46e5">
                      {ratingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#4f46e5" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Rating Distribution</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "5 Stars",
                              value: sortedByRating.filter((c) => c.rating >= 4.8).length,
                              fill: "#4ade80",
                            },
                            {
                              name: "4 Stars",
                              value: sortedByRating.filter((c) => c.rating >= 4 && c.rating < 4.8).length,
                              fill: "#a3e635",
                            },
                            {
                              name: "3 Stars",
                              value: sortedByRating.filter((c) => c.rating >= 3 && c.rating < 4).length,
                              fill: "#facc15",
                            },
                            {
                              name: "2 Stars",
                              value: sortedByRating.filter((c) => c.rating >= 2 && c.rating < 3).length,
                              fill: "#fb923c",
                            },
                            {
                              name: "1 Star",
                              value: sortedByRating.filter((c) => c.rating < 2).length,
                              fill: "#f87171",
                            },
                          ]}
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
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Key Insights</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Average competitor rating:{" "}
                      <strong>
                        {(sortedByRating.reduce((sum, c) => sum + c.rating, 0) / sortedByRating.length).toFixed(1)}{" "}
                        stars
                      </strong>
                    </li>
                    <li>
                      Top rated competitor: <strong>{sortedByRating[0]?.name}</strong> with{" "}
                      {sortedByRating[0]?.rating.toFixed(1)} stars
                    </li>
                    <li>
                      {sortedByRating.filter((c) => c.rating >= 4.5).length} competitors have excellent ratings (4.5+
                      stars)
                    </li>
                    <li>{sortedByRating.filter((c) => c.rating < 4).length} competitors have ratings below 4 stars</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reviewData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} reviews`, "Total Reviews"]} />
                    <Legend />
                    <Bar dataKey="reviews" name="Total Reviews" fill="#4f46e5">
                      {reviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#4f46e5" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Review Volume Distribution</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "500+ Reviews",
                              value: sortedByReviews.filter((c) => c.userRatingsTotal >= 500).length,
                              fill: "#4ade80",
                            },
                            {
                              name: "100-499 Reviews",
                              value: sortedByReviews.filter(
                                (c) => c.userRatingsTotal >= 100 && c.userRatingsTotal < 500,
                              ).length,
                              fill: "#a3e635",
                            },
                            {
                              name: "50-99 Reviews",
                              value: sortedByReviews.filter((c) => c.userRatingsTotal >= 50 && c.userRatingsTotal < 100)
                                .length,
                              fill: "#facc15",
                            },
                            {
                              name: "10-49 Reviews",
                              value: sortedByReviews.filter((c) => c.userRatingsTotal >= 10 && c.userRatingsTotal < 50)
                                .length,
                              fill: "#fb923c",
                            },
                            {
                              name: "<10 Reviews",
                              value: sortedByReviews.filter((c) => c.userRatingsTotal < 10).length,
                              fill: "#f87171",
                            },
                          ]}
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
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Key Insights</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Average review count:{" "}
                      <strong>
                        {Math.round(
                          sortedByReviews.reduce((sum, c) => sum + c.userRatingsTotal, 0) / sortedByReviews.length,
                        )}{" "}
                        reviews
                      </strong>
                    </li>
                    <li>
                      Most reviewed competitor: <strong>{sortedByReviews[0]?.name}</strong> with{" "}
                      {sortedByReviews[0]?.userRatingsTotal} reviews
                    </li>
                    <li>
                      {sortedByReviews.filter((c) => c.userRatingsTotal >= 100).length} competitors have significant
                      review volume (100+ reviews)
                    </li>
                    <li>Review volume correlates with visibility in search results and customer trust</li>
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
