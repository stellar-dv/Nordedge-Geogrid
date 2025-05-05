"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { BusinessInfo } from "@/types/business-info"

interface BusinessInfoFormProps {
  onSubmit: (info: BusinessInfo) => void
}

export function BusinessInfoForm({ onSubmit }: BusinessInfoFormProps) {
  const [businessName, setBusinessName] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [keywords, setKeywords] = useState("")
  const [businessType, setBusinessType] = useState<"physical" | "sab">("physical")
  const [serviceRadius, setServiceRadius] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      name: businessName,
      address: location,
      category,
      location,
      keywords: keywords.split(",").map((k) => k.trim()),
      businessType,
      serviceRadius: Number.parseInt(serviceRadius, 10),
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Enter your business details to generate a GeoGrid analysis</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Primary Business Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Geographic Area (City/Region)</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Main Search Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., plumber, emergency plumbing, water heater repair"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Business Type</Label>
            <RadioGroup
              value={businessType}
              onValueChange={(value) => setBusinessType(value as "physical" | "sab")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="physical" id="physical" />
                <Label htmlFor="physical">Physical Location</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sab" id="sab" />
                <Label htmlFor="sab">Service Area Business (SAB)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceRadius">Service Radius (miles)</Label>
            <Input
              id="serviceRadius"
              type="number"
              min="1"
              max="100"
              value={serviceRadius}
              onChange={(e) => setServiceRadius(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Generate GeoGrid Analysis
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
