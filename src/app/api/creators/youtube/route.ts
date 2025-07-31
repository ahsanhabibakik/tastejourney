import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location"); // e.g., city or country
  const keyword = searchParams.get("keyword") || "travel vlog";

  if (!location) {
    return NextResponse.json({ error: "location is required" }, { status: 400 });
  }

  try {
    // Use YouTube Search API to find creators by keyword and location in title/description
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=5&q=${encodeURIComponent(
      keyword + " " + location
    )}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch YouTube data");
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch YouTube creator data" }, { status: 500 });
  }
}
