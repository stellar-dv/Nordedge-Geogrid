"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { BusinessInfo } from "@/types/business-info"
import { useState, useEffect } from "react"
import { GoogleMap } from "./google-map"
import { geocodeAddress as geocodeAddressAction } from "@/app/actions/geocode"

interface GridConfigSectionProps {
  businessInfo: BusinessInfo
}

export function GridConfigSection({ businessInfo }: GridConfigSectionProps) {
  const [gridSize, setGridSize] = useState("7x7")
  const [pointDistance, setPointDistance] = useState([1])
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 }) // Default to NYC
  const [locationInput, setLocationInput] = useState("")

  // Calculate recommended grid size based on service radius
  useEffect(() => {
    if (businessInfo.serviceRadius <= 5) {
      setGridSize("5x5")
      setPointDistance([0.5])
    } else if (businessInfo.serviceRadius <= 15) {
      setGridSize("7x7")
      setPointDistance([1])
    } else if (businessInfo.serviceRadius <= 30) {
      setGridSize("9x9")
      setPointDistance([2])
    } else {
      setGridSize("11x11")
      setPointDistance([3])
    }

    // Geocode the business location
    if (typeof businessInfo.location === 'string') {
      geocodeAddress(businessInfo.location);
    }
  }, [businessInfo.serviceRadius, businessInfo.location])

  // Function to geocode an address and update map center
  const geocodeAddress = async (address: string) => {
    try {
      const result = await geocodeAddressAction(address)

      if (result.success && result.data) {
        setMapCenter({ lat: result.data.lat, lng: result.data.lng })
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  // Handle manual location update
  const handleLocationUpdate = () => {
    if (locationInput) {
      geocodeAddress(locationInput)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Grid Configuration</CardTitle>
          <CardDescription>Based on your business type and service area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Grid Size</Label>
            <Select value={gridSize} onValueChange={setGridSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select grid size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3x3">3x3 (Small Area)</SelectItem>
                <SelectItem value="5x5">5x5 (Neighborhood)</SelectItem>
                <SelectItem value="7x7">7x7 (City Area)</SelectItem>
                <SelectItem value="9x9">9x9 (Large City)</SelectItem>
                <SelectItem value="11x11">11x11 (Metro Area)</SelectItem>
                <SelectItem value="13x13">13x13 (Regional)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {gridSize === "3x3" && "Best for very small service areas or single neighborhoods"}
              {gridSize === "5x5" && "Ideal for small businesses serving a few neighborhoods"}
              {gridSize === "7x7" && "Good balance for city-based businesses"}
              {gridSize === "9x9" && "Recommended for businesses serving entire cities"}
              {gridSize === "11x11" && "For businesses with wide metro coverage"}
              {gridSize === "13x13" && "For businesses serving multiple cities or regions"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Distance Between Points (miles)</Label>
              <span className="text-sm font-medium">{pointDistance[0].toFixed(1)}</span>
            </div>
            <Slider value={pointDistance} min={0.1} max={10} step={0.1} onValueChange={setPointDistance} />
            <p className="text-sm text-muted-foreground">
              {pointDistance[0] <= 0.5 && "Very dense grid for hyper-local analysis"}
              {pointDistance[0] > 0.5 && pointDistance[0] <= 1 && "Good for urban areas with high competition"}
              {pointDistance[0] > 1 && pointDistance[0] <= 3 && "Balanced coverage for suburban areas"}
              {pointDistance[0] > 3 && pointDistance[0] <= 5 && "Wider spacing for larger service areas"}
              {pointDistance[0] > 5 && "Very wide spacing for regional businesses"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gridCenter">Grid Center Location</Label>
            <div className="flex space-x-2">
              <Input
                id="gridCenter"
                placeholder={typeof businessInfo.location === 'string' ? businessInfo.location : 'Enter location'}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
              />
              <Button onClick={handleLocationUpdate}>Set</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {businessInfo.businessType === "physical"
                ? "For physical locations, center the grid on your business address"
                : "For service area businesses, center on high-value customer areas"}
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Total Coverage</h4>
            <p className="text-sm">
              This configuration will create a grid covering approximately{" "}
              <strong>{Math.pow(Number.parseInt(gridSize.split("x")[0]), 2)} points</strong> over a{" "}
              <strong>
                {(Number.parseInt(gridSize.split("x")[0]) - 1) * pointDistance[0]} x{" "}
                {(Number.parseInt(gridSize.split("x")[0]) - 1) * pointDistance[0]} mile
              </strong>{" "}
              area.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grid Center & Preview</CardTitle>
          <CardDescription>Optimal positioning for your business type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mb-4">
            <GoogleMap
              center={mapCenter}
              zoom={11}
              gridSize={Number.parseInt(gridSize.split("x")[0])}
              pointDistance={pointDistance[0]}
              searchKeyword={businessInfo.businessType === "restaurant" ? "restaurant" : businessInfo.businessType === "medical" ? "doctor" : "business"}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Recommended Center Point</h4>
            {businessInfo.businessType === "physical" ? (
              <p className="text-sm">
                For your physical location business, we recommend centering the grid on your actual business address.
                This provides the most accurate representation of how customers in your vicinity find you in search
                results.
              </p>
            ) : (
              <p className="text-sm">
                For your service area business (SAB), we recommend centering the grid on the most densely populated area
                within your service region, or the area with the highest concentration of potential customers. This
                "Sticky Grid" approach ensures you're tracking rankings in the most valuable locations.
              </p>
            )}

            <h4 className="font-medium pt-2">Coverage Justification</h4>
            <p className="text-sm">
              Based on your {businessInfo.serviceRadius} mile service radius, the recommended {gridSize} grid with{" "}
              {pointDistance[0].toFixed(1)} mile spacing between points will provide comprehensive coverage of your
              service area while maintaining sufficient detail to identify ranking patterns and opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
