import { type NextRequest, NextResponse } from "next/server"

const API_BASE = process.env.API_BASE || "http://localhost:8000/fires"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get("endpoint") || ""
    let url = `${API_BASE}/${endpoint}`

    const queryParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== "endpoint") {
        queryParams.append(key, value)
      }
    })

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch data from API" }, { status: 500 })
  }
}
