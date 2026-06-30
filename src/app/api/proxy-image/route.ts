import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    let fetchUrl = url;
    
    // Extract Google Drive ID if it's a Drive URL
    if (url.includes('drive.google.com')) {
      let fileId = null;
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        fileId = match[1];
      } else {
        try {
          const urlObj = new URL(url);
          fileId = urlObj.searchParams.get('id');
        } catch (e) {}
      }
      
      if (fileId) {
        fetchUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
      }
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: res.status });
    }
    
    const buffer = await res.arrayBuffer();
    
    // We override the headers to prevent browser from treating it as an attachment
    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('content-type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
