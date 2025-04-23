import { type NextRequest, NextResponse } from "next/server"
import { getGridResultById } from "@/lib/geogrid-service"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return new NextResponse("Missing grid ID", { status: 400 })
  }

  try {
    const gridResult = await getGridResultById(id)

    if (!gridResult) {
      return new NextResponse("Grid not found", { status: 404 })
    }

    // For now, return a placeholder image
    // In a real implementation, you would generate an actual image based on the grid data
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: "/placeholder.svg?height=100&width=100",
      },
    })
  } catch (error) {
    console.error("Error generating grid image:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
