"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Search, Loader2 } from "lucide-react"
import type { BusinessInfo } from "@/types"

interface SearchControlsProps {
  businessInfo: BusinessInfo
  searchTerm: string
  setSearchTerm: (term: string) => void
  gridSize: number
  setGridSize: (size: number) => void
  distance: number
  setDistance: (distance: number) => void
  onSearch: () => void
  isSearching: boolean
}

export function SearchControls({
  businessInfo,
  searchTerm,
  setSearchTerm,
  gridSize,
  setGridSize,
  distance,
  setDistance,
  onSearch,
  isSearching,
}: SearchControlsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([
    "plumber",
    "emergency plumber",
    "water heater repair",
    "drain cleaning",
    "pipe repair",
  ])

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Business</h3>
            <p className="text-sm">{businessInfo.name}</p>
            <p className="text-xs text-gray-500">{businessInfo.address}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-term">Search Term</Label>
            <div className="relative">
              <Input
                id="search-term"
                placeholder="Enter search term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="grid-size">
                Grid Size: {gridSize}x{gridSize}
              </Label>
              <span className="text-xs text-gray-500">{gridSize * gridSize} points</span>
            </div>
            <Slider
              id="grid-size"
              min={3}
              max={13}
              step={2}
              value={[gridSize]}
              onValueChange={(value) => setGridSize(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="distance">Distance: {distance.toFixed(1)} km</Label>
              <span className="text-xs text-gray-500">Total: {(distance * 2).toFixed(1)} km</span>
            </div>
            <Slider
              id="distance"
              min={0.5}
              max={5}
              step={0.5}
              value={[distance]}
              onValueChange={(value) => setDistance(value[0])}
            />
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={onSearch}
            disabled={!searchTerm || isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
