import { NextRequest, NextResponse } from 'next/server'

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json()
    
    if (!placeId) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 })
    }
    
    // Fetch place details including reviews from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,formatted_address,geometry,types,user_ratings_total&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.error_message || "Failed to fetch place details" }, { status: 400 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching place details:", error)
    return NextResponse.json({ error: "Failed to fetch place details" }, { status: 500 })
  }
} 