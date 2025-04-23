"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, MapPin, Building, Phone, Globe } from "lucide-react"
import type { BusinessInfo } from "@/types"

interface BusinessSearchProps {
  onBusinessSelect: (businessInfo: BusinessInfo) => void
}

export function BusinessSearch({ onBusinessSelect }: BusinessSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<BusinessInfo[]>([])
  const [manualEntry, setManualEntry] = useState(false)
  const [manualInfo, setManualInfo] = useState<BusinessInfo>({
    name: "",
    address: "",
    location: { lat: 47.6062, lng: -122.3321 }, // Default to Seattle
    category: "",
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    try {
      // Simulate API call with mock data
      await new Promise((resolve) => set(resolve, 1000))

      // Mock search results
      const mockResults: BusinessInfo[] = [
        {
          name: "Seattle Plumbing Experts",
          address: "123 Main St, Seattle, WA 98101",
          placeId: "place123",
          location: { lat: 47.6062, lng: -122.3321 },
          category: "Plumber",
          phone: "(206) 555-1234",
          website: "https://example.com",
        },
        {
          name: "Downtown Plumbing Services",
          address: "456 Pine St, Seattle, WA 98101",
          placeId: "place456",
          location: { lat: 47.6092, lng: -122.335 },
          category: "Plumber",
          phone: "(206) 555-5678",
          website: "https://example2.com",
        },
        {
          name: "Emerald City Plumbers",
          address: "789 Oak Dr, Seattle, WA 98102",
          placeId: "place789",
          location: { lat: 47.6142, lng: -122.3271 },
          category: "Plumber",
          phone: "(206) 555-9012",
          website: "https://example3.com",
        },
      ]

      setSearchResults(mockResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleManualInfoChange = (field: keyof BusinessInfo, value: string) => {
    setManualInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleManualSubmit = () => {
    if (manualInfo.name && manualInfo.address) {
      onBusinessSelect(manualInfo)
    }
  }

  return (
    <div className="space-y-6">
      {!manualEntry ? (
        <>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search for a business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3"
                onClick={handleSearch}
                disabled={isSearching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setManualEntry(true)}>
              Enter business details manually
            </Button>
          </div>

          {isSearching ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((business, index) => (
                <Card
                  key={index}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onBusinessSelect(business)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                        <Building className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{business.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {business.address}
                        </div>
                        {business.phone && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            {business.phone}
                          </div>
                        )}
                        {business.website && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Globe className="h-3.5 w-3.5 mr-1" />
                            {business.website}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              placeholder="Enter business name"
              value={manualInfo.name}
              onChange={(e) => handleManualInfoChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-address">Business Address</Label>
            <Input
              id="business-address"
              placeholder="Enter business address"
              value={manualInfo.address}
              onChange={(e) => handleManualInfoChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-category">Business Category</Label>
            <Input
              id="business-category"
              placeholder="Enter business category"
              value={manualInfo.category || ""}
              onChange={(e) => handleManualInfoChange("category", e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setManualEntry(false)}>
              Back to Search
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleManualSubmit}
              disabled={!manualInfo.name || !manualInfo.address}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
