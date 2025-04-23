import { NextResponse } from "next/server"
import { getGridResults, getGridResultById } from "@/lib/geogrid-service"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (id) {
      const result = await getGridResultById(id)
      if (!result) {
        return NextResponse.json({ error: "Grid result not found" }, { status: 404 })
      }
      return NextResponse.json(result)
    } else {
      const results = await getGridResults()
      return NextResponse.json(results)
    }
  } catch (error) {
    console.error("Error fetching grid results:", error)
    return NextResponse.json({ error: "Failed to fetch grid results" }, { status: 500 })
  }
}
