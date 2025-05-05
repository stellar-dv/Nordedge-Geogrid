import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get('reference')
    const maxWidth = searchParams.get('maxwidth') || '400'
    const maxHeight = searchParams.get('maxheight') || '400'

    if (!photoReference) {
      return NextResponse.json({ error: 'Missing photo reference' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    // Build URL to Google's Places Photos API
    const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photoReference}&maxwidth=${maxWidth}&maxheight=${maxHeight}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

    // Fetch the image
    const response = await fetch(googleUrl)

    if (!response.ok) {
      console.error(`Error fetching photo: ${response.status} ${response.statusText}`)
      // Return a fallback image
      return NextResponse.redirect('https://via.placeholder.com/150?text=No+Image')
    }

    // Get the image data
    const imageData = await response.arrayBuffer()
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error in place-photo API:', error)
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
  }
} 