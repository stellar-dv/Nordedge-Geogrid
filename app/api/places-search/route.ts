import { NextResponse } from 'next/server'
import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export async function POST(request: Request) {
  try {
    const { query, location, radius } = await request.json()

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('Missing Google Maps API key in environment variables')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }
    
    // Validate location data
    if (!location || typeof location !== 'object' || !('lat' in location) || !('lng' in location)) {
      return NextResponse.json(
        { error: 'Invalid location format. Must provide {lat, lng} object' },
        { status: 400 }
      )
    }
    
    // Validate radius
    const validRadius = typeof radius === 'number' && radius > 0 && radius <= 50000 
      ? radius 
      : 5000 // Default to 5km if invalid
    
    // Format location for the Google Places API (which expects it as string "lat,lng")
    const locationString = `${location.lat},${location.lng}`
    
    console.log(`Searching for "${query}" at location ${locationString} with radius ${validRadius}m`)
    
    try {
    const response = await client.placesNearby({
      params: {
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        location: locationString,
        radius: validRadius,
        keyword: query,
        type: 'establishment',
      },
    })

      // Handle different Google Places API status codes
    if (response.data.status !== 'OK') {
        console.error(`Google Places API returned status: ${response.data.status}`, response.data.error_message)
        
        // Map specific error codes to appropriate responses
        switch (response.data.status) {
          case 'ZERO_RESULTS':
            // This is not an error, just no results found
            return NextResponse.json({ results: [] })
          
          case 'OVER_QUERY_LIMIT':
            return NextResponse.json(
              { error: 'API query limit exceeded. Please try again later.' },
              { status: 429 }
            )
            
          case 'REQUEST_DENIED':
            return NextResponse.json(
              { error: 'API request was denied. Please check API key configuration.' },
              { status: 403 }
            )
            
          case 'INVALID_REQUEST':
            return NextResponse.json(
              { error: 'Invalid request parameters.' },
              { status: 400 }
            )
            
          case 'UNKNOWN_ERROR':
            return NextResponse.json(
              { error: 'Google Places API encountered an unknown error. Please try again.' },
              { status: 500 }
            )
            
          default:
            return NextResponse.json(
              { error: `Google Places API error: ${response.data.status}` },
              { status: 500 }
            )
        }
    }

    return NextResponse.json({
      results: response.data.results.map((place) => ({
        name: place.name,
        place_id: place.place_id,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        vicinity: place.vicinity,
        types: place.types,
      })),
    })
    } catch (apiError: any) {
      console.error('Google Places API request failed:', apiError.message)
      return NextResponse.json(
        { error: 'Failed to connect to Google Places API' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in places-search API:', error)
    return NextResponse.json(
      { error: 'Failed to process search request' },
      { status: 500 }
    )
  }
}
