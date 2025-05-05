"use server"

import type { BusinessInfo } from "@/types"

export async function fetchPlaceDetails(placeId: string): Promise<{
  success: boolean
  data?: BusinessInfo
  error?: string
}> {
  try {
    // For security, we should store this in environment variables
    const apiKey = "AIzaSyBRnwPG0qFKc6dMl5qDG2h2Q0-NPDbadB8"

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,types,geometry,website,business_status&key=${apiKey}`

    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK" || !data.result) {
      return {
        success: false,
        error: `Place details not found: ${data.status || "No result"}`,
      }
    }

    const place = data.result

    // Determine business category from types
    let category = "Local Business"
    if (place.types) {
      const businessTypes = place.types.filter((type: string) => !["point_of_interest", "establishment"].includes(type))
      if (businessTypes.length > 0) {
        category = businessTypes[0].replace(/_/g, " ")
        // Capitalize first letter of each word
        category = category
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      }
    }

    return {
      success: true,
      data: {
        name: place.name || "Unknown Business",
        address: place.formatted_address || "Unknown Location",
        location: place.geometry?.location || { lat: 0, lng: 0 },
        category: category,
        placeId: placeId,
        keywords: [category.toLowerCase(), "local business"],
        businessType: "physical", // Default to physical
        serviceRadius: 10, // Default radius
      },
    }
  } catch (error) {
    console.error("Error fetching place details:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error fetching place details",
    }
  }
}
