import { NextRequest, NextResponse } from "next/server";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const place = searchParams.get("place");
  if (!place) {
    return NextResponse.json({ error: "place is required" }, { status: 400 });
  }

  try {
    // Google Places API: Place Search
    const googleUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      place
    )}&inputtype=textquery&fields=formatted_address,name,geometry,place_id,types,photos,rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
    const googleRes = await fetch(googleUrl);
    const googleData = await googleRes.json();

    // OpenStreetMap Nominatim API: Geocoding
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      place
    )}`;
    const osmRes = await fetch(osmUrl);
    const osmData = await osmRes.json();

    return NextResponse.json({ success: true, google: googleData, osm: osmData });
  } catch {
    return NextResponse.json({ error: "Failed to fetch location details" }, { status: 500 });
  }
}
