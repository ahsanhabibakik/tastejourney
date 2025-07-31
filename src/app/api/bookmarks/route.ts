import { NextResponse } from 'next/server';

// For demo: bookmarks stored in-memory (reset on server restart)
let bookmarks: string[] = [];

export async function GET() {
  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  const { destination } = await request.json();
  if (destination && !bookmarks.includes(destination)) {
    bookmarks.push(destination);
  }
  return NextResponse.json({ bookmarks });
}

export async function DELETE(request: Request) {
  const { destination } = await request.json();
  bookmarks = bookmarks.filter((d) => d !== destination);
  return NextResponse.json({ bookmarks });
}
