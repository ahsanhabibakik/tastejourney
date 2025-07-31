import { NextRequest, NextResponse } from "next/server";

const SERPAPI_KEY = process.env.SERPAPI_KEY;

/**
 * Supported types: google, maps, places, youtube, knowledge_graph
 * Example: /api/serpapi?type=google&q=paris+travel
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "google";
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json({ error: "q (query) is required" }, { status: 400 });
  }

  let url = "";
  switch (type) {
    case "google":
      url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}`;
      break;
    case "maps":
      url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}`;
      break;
    case "places":
      url = `https://serpapi.com/search.json?engine=google_places&q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}`;
      break;
    case "youtube":
      url = `https://serpapi.com/search.json?engine=youtube&q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}`;
      break;
    case "knowledge_graph":
      url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}&google_domain=google.com&gl=us&hl=en`;
      break;
    default:
      return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch from SerpApi");
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch from SerpApi" }, { status: 500 });
  }
}
