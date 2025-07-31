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
    return NextResponse.json(
      { error: "q (query) is required" },
      { status: 400 }
    );
  }

  let url = "";
  switch (type) {
    case "google":
      url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
        q
      )}&api_key=${SERPAPI_KEY}`;
      break;
    case "maps":
      url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
        q
      )}&api_key=${SERPAPI_KEY}`;
      break;
    case "places":
      url = `https://serpapi.com/search.json?engine=google_places&q=${encodeURIComponent(
        q
      )}&api_key=${SERPAPI_KEY}`;
      break;
    case "youtube":
      // SerpApi’s YouTube engine requires `search_query` instead of `q`
      url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(
        q
      )}&api_key=${SERPAPI_KEY}`;
      break;
    case "knowledge_graph":
      url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
        q
      )}&api_key=${SERPAPI_KEY}&google_domain=google.com&gl=us&hl=en`;
      break;
    default:
      return NextResponse.json(
        { error: "Unsupported type" },
        { status: 400 }
      );
  }

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      // Try to parse SerpApi's own error message, otherwise send raw text
      let errBody: unknown;
      try {
        errBody = JSON.parse(text);
      } catch {
        errBody = { error: text };
      }
      console.error(`[SerpApi ${type}] ${res.status}:`, errBody);
      return NextResponse.json(errBody, { status: res.status });
    }

    const data = JSON.parse(text);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("Unexpected fetch error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
