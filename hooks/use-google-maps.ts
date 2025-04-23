"use client"

import { useState, useEffect } from "react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadMaps = async () => {
      try {
        await loadGoogleMaps()
        setIsLoaded(true)
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        setLoadError("Failed to load Google Maps API")
      }
    }

    loadMaps()
  }, [])

  return { isLoaded, loadError }
}
