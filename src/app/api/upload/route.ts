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

// Increase the body size limit for the API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_PIAPI_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is not configured in environment variables' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File size exceeds limit. Maximum size allowed is ${Math.floor(maxSize / (1024 * 1024))}MB.` 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const fileType = file.type;
    const dataUri = `data:${fileType};base64,${base64}`;

    // Make the API call to upload the image to piapi.ai
    let response;
    try {
      response = await fetch('https://api.piapi.ai/api/v1/common/upload', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: dataUri
        }),
      });
    } catch (fetchError) {
      console.error('Network error in upload API:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Network error connecting to the API service. Please check your internet connection and try again.',
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if response status is OK before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Error from external API';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (_error) {
        // If the response is not JSON, use the status text
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: response.status,
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    // Parse the API response
    let data;
    try {
      data = await response.json();
    } catch (_error) {
      console.error('JSON parse error in upload API:');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response format from the API service. Please try again later.',
          code: 500,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Use console logging to debug the response format
    console.log('Upload API response:', JSON.stringify(data, null, 2));

    // Handle the API response format properly
    if (data.code === 200 && data.data) {
      return NextResponse.json({
        success: true,
        url: data.data.url,
        code: 200,
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name
        }
      }, { headers: corsHeaders });
    }
    
    // Fallback to alternative format
    if (data.url) {
      return NextResponse.json({
        success: true,
        url: data.url,
        code: 200,
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name
        }
      }, { headers: corsHeaders });
    }
    
    // If no valid response format is found
    return NextResponse.json({
      success: false,
      error: 'Invalid response format from API service. Please try again later.',
      code: 500,
    }, { status: 500, headers: corsHeaders });

  } catch (error) {
    console.error('Error in upload API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while processing your request. Please try again.',
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 