export interface TargetImage {
  id: string;
  url: string;
}

export interface ApiResponse {
  taskId: string;
  status: string;
  resultUrl?: string;
}

export type SwapStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// Authentication types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// API response types
export interface TaskCreateResponse {
  success: boolean;
  taskId: string;
  message?: string;
  error?: string;
}

export interface TaskStatusResponse {
  success: boolean;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output?: {
    image_url?: string;
    image?: string;
    image_base64?: string;
  };
  error?: string | {
    message: string;
    code?: string;
  };
}

// Generation history types
export interface Generation {
  id: string;
  userId: string;
  sourceImage: string;
  targetImage: string;
  resultImage: string;
  taskId: string;
  timestamp: Date | string;
  createdBy?: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
  metadata?: {
    appVersion: string;
    browser: string;
    created: string;
    [key: string]: string | number | boolean | object;
  };
}

// API endpoints
export const API_ENDPOINTS = {
  CREATE_TASK: 'https://api.piapi.ai/api/v1/task',
  GET_TASK: 'https://api.piapi.ai/api/v1/task'
}; 