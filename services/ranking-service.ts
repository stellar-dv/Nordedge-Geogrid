import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Add a mock implementation for the POST endpoint since we don't have a real backend
// This will generate realistic-looking data for the demo
export async function fetchRankingData(
  keyword: string,
  businessName: string,
  gridPoints: { lat: number; lng: number }[]
) {
  try {
    // First check if we have cached results for this search
    const { data: cachedResults, error: cacheError } = await supabase
      .from('grid_rankings_cache')
      .select('*')
      .eq('keyword', keyword)
      .eq('location', businessName)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!cacheError && cachedResults && cachedResults.length > 0) {
      const cacheAge = Date.now() - new Date(cachedResults[0].created_at).getTime()
      // Use cached results if they're less than 24 hours old
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return cachedResults[0].rankings
      }
    }

    // If no valid cache, fetch new rankings
    const rankings = await Promise.all(
      gridPoints.map(async (point, index) => {
        try {
          // Validate point has valid coordinates
          if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number' ||
              isNaN(point.lat) || isNaN(point.lng)) {
            console.error(`Invalid grid point at index ${index}:`, point);
            return 21;
          }
          
          console.log(`Fetching ranking for point ${index}: lat=${point.lat}, lng=${point.lng}`);
          
          // Use Google Places API to search for the business
          const response = await fetch('/api/places-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: keyword,
              location: {
                lat: Number(point.lat),
                lng: Number(point.lng)
              },
              radius: 5000, // 5km radius
            }),
          })

          // Log detailed error info if the response is not ok
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error for point ${index}:`, {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
          }

          const data = await response.json()
          
          // No results found
          if (!data.results || data.results.length === 0) {
            console.log(`No results for point ${index}, keyword "${keyword}"`);
            return 21;
          }
          
          console.log(`Point ${index}: Found ${data.results.length} results for "${keyword}"`);
          
          // Find the business in the results by partial name match
          const businessIndex = data.results.findIndex(
            (result: any) => {
              // Case insensitive partial match
              const resultName = result.name.toLowerCase();
              const searchName = businessName.toLowerCase();
              return resultName.includes(searchName) || searchName.includes(resultName);
            }
          )

          // Return the ranking (index + 1) or 21 if not found
          return businessIndex >= 0 ? businessIndex + 1 : 21
        } catch (error) {
          console.error(`Error fetching ranking for point ${index}:`, point, error)
          return 21 // Return 21 (not found) if there's an error
        }
      })
    )

    // Cache the results
    await supabase.from('grid_rankings_cache').insert({
      keyword,
      location: businessName,
      rankings,
      created_at: new Date().toISOString(),
    })

    return rankings
  } catch (error) {
    console.error('Error in fetchRankingData:', error)
    throw error
  }
}

// Function to calculate keyword performance metrics
export function calculateKeywordPerformance(data: number[][]) {
  if (!data || data.length === 0) return null

  const flatData = data.flat().filter((val) => val > 0)
  if (flatData.length === 0) return null

  const avgRanking = flatData.reduce((sum, val) => sum + val, 0) / flatData.length
  const top3Count = flatData.filter((val) => val <= 3).length
  const top3Percentage = (top3Count / flatData.length) * 100
  const otherCount = flatData.filter((val) => val > 10).length
  const otherPercentage = (otherCount / flatData.length) * 100

  return {
    avgRanking,
    top3Count,
    top3Percentage,
    otherCount,
    otherPercentage,
  }
}
