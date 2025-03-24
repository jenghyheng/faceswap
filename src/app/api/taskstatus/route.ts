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

export async function GET(request: NextRequest) {
  try {
    // Get the taskId from the URL query parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    // Use API key from environment variable if not provided in query
    const queryApiKey = searchParams.get('apiKey');
    const apiKey = queryApiKey || process.env.NEXT_PUBLIC_PIAPI_KEY || '';

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is not configured in environment variables' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Make the API call to check task status
    const response = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    // Parse the API response
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || 'Error from external API',
          code: response.status,
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    // Handle the API response format: { code: 200, data: { task_id, status, output }, message: 'success' }
    if (data.code === 200 && data.data) {
      return NextResponse.json({
        success: true,
        data: {
          id: data.data.task_id,
          status: data.data.status,
          output: data.data.output,
          error: data.data.error,
        },
      }, { headers: corsHeaders });
    }

    // Fallback to alternative format
    return NextResponse.json({
      success: true,
      data: {
        id: data.id || data.task_id,
        status: data.status,
        output: data.output,
        error: data.error,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in taskstatus API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 