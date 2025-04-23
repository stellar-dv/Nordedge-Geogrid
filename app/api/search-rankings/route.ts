import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get("keyword")
    const location = searchParams.get("location")

    if (!keyword || !location) {
      return NextResponse.json({ error: "Missing required parameters: keyword and location" }, { status: 400 })
    }

    // Generate a deterministic but realistic ranking based on the keyword and location
    const generateRanking = (keyword: string, location: string, date: Date) => {
      // Create a hash from keyword and location to get consistent results
      const hash = (str: string) => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash // Convert to 32bit integer
        }
        return Math.abs(hash)
      }

      const combinedHash = hash(keyword + location)

      // Base ranking between 1 and 30
      const baseRanking = (combinedHash % 30) + 1

      // Add some variation based on the date
      const dayVariation = (date.getDate() % 5) - 2 // -2 to +2

      // Ensure ranking stays between 1 and 100
      return Math.max(1, Math.min(100, baseRanking + dayVariation))
    }

    // Generate data for the last 30 days
    const today = new Date()
    const data = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const formattedDate = date.toISOString().split("T")[0]
      const ranking = generateRanking(keyword, location, date)

      data.push({
        date: formattedDate,
        ranking: ranking,
        keyword: keyword,
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error generating ranking data:", error)
    return NextResponse.json({ error: "Failed to generate ranking data" }, { status: 500 })
  }
}
