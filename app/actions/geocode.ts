"use server"

import type { MapCenter } from "@/types"

export async function geocodeAddress(address: string): Promise<{
  success: boolean
  data?: MapCenter
  error?: string
}> {
  try {
    // For security, we should store this in environment variables
    const apiKey = "AIzaSyBRnwPG0qFKc6dMl5qDG2h2Q0-NPDbadB8"

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
      { cache: "no-store" },
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return {
        success: false,
        error: `Geocoding failed: ${data.status || "No results found"}`,
      }
    }

    const { lat, lng } = data.results[0].geometry.location
    return { success: true, data: { lat, lng } }
  } catch (error) {
    console.error("Geocoding error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown geocoding error",
    }
  }
}
