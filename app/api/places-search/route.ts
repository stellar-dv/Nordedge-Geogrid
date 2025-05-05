import { NextResponse } from 'next/server'
import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export async function POST(request: Request) {
  try {
    const { query, location, radius, type, rankBy, pageToken } = await request.json()

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('Missing Google Maps API key in environment variables')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }
    
    // Use Google Text Search API for nationwide search when query is provided without specific location context
    const isNationwideSearch = query && (!location || radius > 50000);
    
    if (isNationwideSearch) {
      console.log(`Performing nationwide search for "${query}"${pageToken ? ' with page token' : ''}`)
      
      try {
        // Build request parameters for a text search
        const params: any = {
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          query: query,
        };
        
        // Use page token if provided
        if (pageToken) {
          params.pagetoken = pageToken;
        }
        
        // Add location bias if provided, but don't restrict to it
        if (location && location.lat && location.lng) {
          params.location = `${location.lat},${location.lng}`;
          params.radius = 50000; // 50km radius as location bias, not restriction
        }
        
        // Use Text Search API instead of Nearby Search
        const response = await client.textSearch({
          params: params,
        });
        
        // Handle different Google Places API status codes
        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          console.error(`Google Places API returned status: ${response.data.status}`, response.data.error_message)
          
          // Map specific error codes to appropriate responses
          // Using string comparison instead of enum for better compatibility
          const status = response.data.status as string;
          
          switch (status) {
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
                { error: `Google Places API error: ${status}` },
                { status: 500 }
              )
          }
        }
        
        // Format the results
        return NextResponse.json({
          results: response.data.results.map((place) => ({
            name: place.name,
            place_id: place.place_id,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            vicinity: place.vicinity,
            formatted_address: place.formatted_address,
            types: place.types,
            geometry: place.geometry,
            photos: place.photos ? place.photos.map(photo => ({
              photo_reference: photo.photo_reference,
              height: photo.height,
              width: photo.width,
              html_attributions: photo.html_attributions
            })) : [],
            opening_hours: place.opening_hours
          })),
          nextPageToken: response.data.next_page_token || null
        })
      } catch (apiError: any) {
        console.error('Google Places API Text Search request failed:', apiError.message)
        return NextResponse.json(
          { error: 'Failed to connect to Google Places API' },
          { status: 500 }
        )
      }
    } else {
      // Original nearby search logic
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
      
      console.log(`Searching for "${query || 'nearby businesses'}" at location ${locationString} with radius ${validRadius}m${type ? `, type: ${type}` : ''}${pageToken ? ', with page token' : ''}`)
      
      try {
        // Build request parameters
        const params: any = {
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          location: locationString,
          type: type || 'establishment',
        };
        
        // If using a page token, add it to the parameters
        if (pageToken) {
          params.pagetoken = pageToken;
        } else {
          // If rankBy is 'distance', radius must not be included
          if (rankBy === 'distance') {
            params.rankby = 'distance';
            // When using rankBy=distance, we need either a keyword, name, or type
            if (!query && !type) {
              params.type = 'establishment';
            }
          } else {
            params.radius = validRadius;
          }
          
          // Only include keyword if query is not empty
          if (query && query.trim() !== '') {
            params.keyword = query;
          }
        }

        const response = await client.placesNearby({
          params: params,
        })

        // Handle different Google Places API status codes
        if (response.data.status !== 'OK') {
          console.error(`Google Places API returned status: ${response.data.status}`, response.data.error_message)
          
          // Map specific error codes to appropriate responses
          // Using string comparison instead of enum for better compatibility
          const status = response.data.status as string;
          
          switch (status) {
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
                { error: `Google Places API error: ${status}` },
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
            geometry: place.geometry,
            photos: place.photos ? place.photos.map(photo => ({
              photo_reference: photo.photo_reference,
              height: photo.height,
              width: photo.width,
              html_attributions: photo.html_attributions
            })) : []
          })),
          nextPageToken: response.data.next_page_token || null
        })
      } catch (apiError: any) {
        console.error('Google Places API request failed:', apiError.message)
        return NextResponse.json(
          { error: 'Failed to connect to Google Places API' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Error in places-search API:', error)
    return NextResponse.json(
      { error: 'Failed to process search request' },
      { status: 500 }
    )
  }
}
