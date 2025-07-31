import { NextRequest, NextResponse } from "next/server";

// Optionally use process.env.NUMBEO_API_KEY if you have a key (not always required for free endpoints)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  if (!city) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }

  try {
    // Numbeo free endpoint for cost of living (no API key required for basic info)
    const url = `https://www.numbeo.com/api/city_prices?api_key=${process.env.NUMBEO_API_KEY || ""}&query=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch from Numbeo");
    }
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch cost of living data" }, { status: 500 });
  }
}
