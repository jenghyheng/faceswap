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
    const { targetImage, targetImageId, sourceImage } = await request.json();
    
    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_PIAPI_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is not configured in environment variables' },
        { status: 400 }
      );
    }

    if ((!targetImage && !targetImageId) || !sourceImage) {
      return NextResponse.json(
        { success: false, error: 'Both target and source images are required' },
        { status: 400 }
      );
    }

    // Prepare the request payload according to piapi.ai format
    const requestBody = {
      model: "Qubico/image-toolkit",
      task_type: "face-swap",
      input: {
        target_image: targetImage,
        swap_image: sourceImage
      }
    };

    // Make the API call to PiAPI.ai
    const response = await fetch('https://api.piapi.ai/api/v1/task', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Check if response status is OK before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Error from external API';
      let errorData;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (jsonError) {
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
    } catch (jsonError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON response from API',
          code: 500,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Handle the API response format properly
    if (data.code === 200 && data.data) {
      return NextResponse.json({
        success: true,
        taskId: data.data.task_id,
        code: 200,
      }, { headers: corsHeaders });
    }

    // Fallback to alternative format
    return NextResponse.json({
      success: true,
      taskId: data.id || data.task_id,
      code: 200,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in faceswap API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Helper function to create error responses
function createErrorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// If the function is not used at all, remove the entire function
// Otherwise, use the function where appropriate or add a comment to disable the linter for this specific case 