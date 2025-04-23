import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const keyword = searchParams.get("keyword")
    const radius = searchParams.get("radius") || "5000" // Default 5km radius

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing required parameters: lat and lng" }, { status: 400 })
    }

    // For security, we should store this in environment variables
    const apiKey = "AIzaSyBRnwPG0qFKc6dMl5qDG2h2Q0-NPDbadB8"

    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${apiKey}`

    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Transform the data to include only what we need
    const places = data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      types: place.types || [],
    }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error("Error fetching nearby places:", error)
    return NextResponse.json({ error: "Failed to fetch nearby places" }, { status: 500 })
  }
}
