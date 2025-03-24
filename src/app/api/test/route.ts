import { NextRequest, NextResponse } from 'next/server';

// Set CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { targetImage, swapImage, apiKey } = await request.json() as {
      targetImage: string;
      swapImage: string;
      apiKey: string;
    };
    
    return NextResponse.json({
      message: 'Test API called successfully',
      params: {
        targetImage: typeof targetImage === 'string' ? targetImage.substring(0, 50) + '...' : 'Invalid',
        swapImage: typeof swapImage === 'string' ? swapImage.substring(0, 50) + '...' : 'Invalid',
        apiKey: apiKey ? '******' : 'Missing'
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in test API route:', error);
    return NextResponse.json(
      {
        error: 'Error in test API route',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 