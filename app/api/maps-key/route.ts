import { NextResponse } from "next/server"

export async function GET() {
  // Instead of returning the API key directly, return a proxy token or session-specific token
  // that can be used to make requests through a server-side proxy

  return NextResponse.json({
    status: "success",
    message: "Use server-side Google Maps integration",
  })
}
