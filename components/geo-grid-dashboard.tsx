"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BusinessSearch } from "./business-search"
import { ModernDashboard } from "./modern-dashboard"
import type { BusinessInfo } from "@/types/business-info"
import { DashboardHome } from "./dashboard-home"

export function GeoGridDashboard() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  const handleBusinessSelect = (info: BusinessInfo) => {
    setBusinessInfo(info)
    setShowSearch(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showSearch ? (
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">Local Viking GeoGrid Rank Tracking Analysis</h1>
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Business Search</CardTitle>
              <CardDescription>Search for a business to analyze its local rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessSearch onBusinessSelect={handleBusinessSelect} />
            </CardContent>
          </Card>
        </div>
      ) : businessInfo ? (
        <ModernDashboard businessInfo={businessInfo} />
      ) : (
        <DashboardHome />
      )}
    </div>
  )
}
