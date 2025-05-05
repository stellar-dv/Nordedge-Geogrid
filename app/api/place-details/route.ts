import { NextResponse } from 'next/server'
import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export async function POST(request: Request) {
  try {
    const { placeId } = await request.json()

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('Missing Google Maps API key in environment variables')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }
    
    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      )
    }
    
    try {
      const response = await client.placeDetails({
        params: {
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          place_id: placeId,
          fields: [
            'name', 
            'place_id', 
            'formatted_address', 
            'geometry', 
            'types', 
            'website', 
            'formatted_phone_number',
            'opening_hours',
            'rating',
            'user_ratings_total',
            'price_level',
            'photos'
          ]
        }
      })

      if (response.data.status !== 'OK') {
        console.error(`Google Places API returned status: ${response.data.status}`, response.data.error_message)
        
        switch (response.data.status) {
          case 'NOT_FOUND':
            return NextResponse.json(
              { error: 'Place not found' },
              { status: 404 }
            )
            
          case 'INVALID_REQUEST':
            return NextResponse.json(
              { error: 'Invalid place ID' },
              { status: 400 }
            )
            
          default:
            return NextResponse.json(
              { error: `Google Places API error: ${response.data.status}` },
              { status: 500 }
            )
        }
      }

      const place = response.data.result

      return NextResponse.json({
        place: {
          name: place.name,
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
          types: place.types,
          website: place.website,
          formatted_phone_number: place.formatted_phone_number,
          opening_hours: place.opening_hours,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          price_level: place.price_level,
          photos: place.photos ? place.photos.map(photo => ({
            photo_reference: photo.photo_reference,
            height: photo.height,
            width: photo.width,
            html_attributions: photo.html_attributions
          })) : []
        }
      })
    } catch (apiError: any) {
      console.error('Google Places API place details request failed:', apiError.message)
      return NextResponse.json(
        { error: 'Failed to fetch place details' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in place-details API:', error)
    return NextResponse.json(
      { error: 'Failed to process place details request' },
      { status: 500 }
    )
  }
} 