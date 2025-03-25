import axios from 'axios';
import { API_ENDPOINTS, TaskCreateResponse, TaskStatusResponse } from '@/types';

/**
 * Convert a file to a base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Extract base64 data from a data URL
 */
export const extractBase64FromDataUrl = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || '';
};

/**
 * Creates a face swap task with piapi.ai API
 */
export const createFaceSwapTask = async (
  targetImage: string | File,
  sourceImage: File
): Promise<TaskCreateResponse> => {
  try {
    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_PIAPI_KEY || '';
    
    if (!apiKey) {
      return {
        success: false,
        taskId: '',
        error: 'API key is not configured in environment variables',
      };
    }

    // Log some info about the images for debugging
    console.log('Creating face swap task with images:', {
      sourceImageSize: sourceImage.size,
      sourceImageType: sourceImage.type
    });

    // Prepare request data
    let targetImageData: string;
    let sourceImageData = '';

    // Process target image to be either URL or base64
    if (typeof targetImage === 'string') {
      // If it's already a URL, use it directly
      targetImageData = targetImage;
    } else {
      // Convert File to base64
      const base64 = await fileToBase64(targetImage);
      // Use the full base64 string including data:image/... prefix
      targetImageData = base64;
    }

    // Process source image (swap face image)
    sourceImageData = await fileToBase64(sourceImage);

    // Prepare request body in the format specified by the API docs
    const requestBody = {
      model: "Qubico/image-toolkit",
      task_type: "face-swap",
      input: {
        target_image: targetImageData,
        swap_image: sourceImageData
      }
    };

    // Make the API request to piapi.ai
    try {
      console.log('Making API request to PiAPI.ai...');
      
      const response = await axios.post(API_ENDPOINTS.CREATE_TASK, requestBody, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Accept any status code to handle it manually
      });
      
      // Check if response is valid and contains data
      if (!response.data) {
        console.error('Empty response from API:', response.statusText);
        return {
          success: false,
          taskId: '',
          error: `Invalid response from API: ${response.statusText}`,
        };
      }

      // Log the response for debugging
      console.log('API response:', JSON.stringify(response.data, null, 2));
      
      // Handle the API response format properly
      if (response.data.code === 200 && response.data.data) {
        return {
          success: true,
          taskId: response.data.data.task_id,
        };
      }

      // Fallback to alternative format
      if (response.data.id || response.data.task_id) {
        return {
          success: true,
          taskId: response.data.id || response.data.task_id,
        };
      }
      
      // Handle error responses
      if (response.status >= 400) {
        const errorMessage = response.data.message || response.data.error || 'Error from PiAPI.ai';
        console.error('API error:', errorMessage);
        
        // Check if error is related to image size
        if (errorMessage.toLowerCase().includes('image size') || 
            errorMessage.toLowerCase().includes('too large') ||
            errorMessage.toLowerCase().includes('maximum is')) {
          return {
            success: false,
            taskId: '',
            error: `Image size issue: ${errorMessage}. Please use a smaller image or try our auto-compression.`,
          };
        }
        
        return {
          success: false,
          taskId: '',
          error: errorMessage,
        };
      }
      
      // If we get here, the response format is unexpected
      console.error('Unexpected API response format:', response.data);
      return {
        success: false,
        taskId: '',
        error: 'Unexpected API response format',
      };
    } catch (apiError) {
      console.error('API call error:', apiError);
      return {
        success: false,
        taskId: '',
        error: apiError instanceof Error ? apiError.message : 'Error making API request',
      };
    }
  } catch (error) {
    console.error('Error creating face swap task:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        taskId: '',
        error: error.response.data?.message || error.message,
      };
    }
    
    return {
      success: false,
      taskId: '',
      error: error instanceof Error ? error.message : 'Unknown error creating face swap task',
    };
  }
};

/**
 * Check the status of a task with piapi.ai API
 */
export const checkTaskStatus = async (taskId: string): Promise<TaskStatusResponse> => {
  try {
    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_PIAPI_KEY || '';
    
    if (!apiKey) {
      return {
        success: false,
        id: taskId,
        status: 'failed',
        error: 'API key is not configured in environment variables',
      };
    }
    
    // Make API request to check task status
    const response = await axios.get(`${API_ENDPOINTS.GET_TASK}/${taskId}`, {
      headers: {
        'X-API-KEY': apiKey,
      },
      validateStatus: () => true, // Accept any status code to handle it manually
    });

    // Check if the response is valid
    if (!response.data) {
      return {
        success: false,
        id: taskId,
        status: 'failed',
        error: `Invalid response from API: ${response.statusText}`,
      };
    }

    const responseData = response.data;

    // Handle the API response format: { code: 200, data: { task_id, status, output }, message: 'success' }
    if (responseData.code === 200 && responseData.data) {
      return {
        success: true,
        id: responseData.data.task_id,
        status: responseData.data.status,
        output: responseData.data.output,
        error: responseData.data.error,
      };
    }

    // Fallback to alternative format
    return {
      success: true,
      id: responseData.id || responseData.task_id || taskId,
      status: responseData.status,
      output: responseData.output,
      error: responseData.error,
    };
  } catch (error) {
    console.error('Error checking task status:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        id: taskId,
        status: 'failed',
        error: error.response.data?.message || error.message,
      };
    }
    
    return {
      success: false,
      id: taskId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error checking task status',
    };
  }
}; 