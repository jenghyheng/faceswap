'use client';

import React from 'react';
import Image from 'next/image';
import { SwapStatus } from '@/types';

interface ResultDisplayProps {
  status: SwapStatus;
  resultUrl: string | null;
  error: string | null;
  onTryAgain: () => void;
  taskId: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  status,
  resultUrl,
  error,
  onTryAgain,
  taskId,
}) => {
  if (status === 'idle') {
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="p-8 bg-gray-50 rounded-lg text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 mb-4 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <p className="mt-4 text-gray-600">Processing your face swap... This may take a minute.</p>
        {taskId && <p className="mt-2 text-xs text-gray-500">Task ID: {taskId}</p>}
      </div>
    );
  }

  if (status === 'failed') {
    // Determine what kind of error occurred and suggest troubleshooting steps
    let errorTitle = 'Face Swap Failed';
    const errorMessage = error || 'An error occurred during processing';
    let troubleshootingSteps: string[] = [];
    
    // Parse error type based on error message text
    if (error?.includes('token') && error?.includes('JSON')) {
      errorTitle = 'API Communication Error';
      troubleshootingSteps = [
        'Check your API key in the environment variables',
        'The API service might be temporarily unavailable',
        'Try again in a few minutes',
      ];
    } else if (error?.includes('permission')) {
      errorTitle = 'Authentication Error';
      troubleshootingSteps = [
        'Try signing out and signing in again',
        'The Firebase security rules might need to be updated',
      ];
    } else if (error?.includes('face')) {
      errorTitle = 'Face Detection Failed';
      troubleshootingSteps = [
        'Ensure your image has a clearly visible face',
        'Try with a different image with better lighting',
        'Make sure the face is not obscured or too small',
      ];
    }
    
    return (
      <div className="p-8 bg-red-50 rounded-lg border border-red-100">
        <h3 className="text-xl font-semibold text-red-700 mb-2">{errorTitle}</h3>
        <p className="text-red-600 mb-4">{errorMessage}</p>
        
        {troubleshootingSteps.length > 0 && (
          <>
            <h4 className="font-medium text-red-700 mt-4 mb-2">Troubleshooting Steps:</h4>
            <ul className="list-disc list-inside text-red-600 space-y-1 mb-4">
              {troubleshootingSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </>
        )}
        
        {taskId && (
          <p className="text-xs text-red-500 mt-2 mb-4">
            Task ID: {taskId}
          </p>
        )}
        
        <button
          onClick={onTryAgain}
          className="mt-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'succeeded' && resultUrl) {
    return (
      <div className="p-8 bg-green-50 rounded-lg border border-green-100">
        <h3 className="text-xl font-semibold text-green-700 mb-4">Face Swap Complete!</h3>
        <div className="relative w-full h-64 sm:h-80 md:h-96 mb-4 overflow-hidden rounded-lg">
          <Image
            src={resultUrl}
            alt="Face swap result"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={resultUrl}
            download="face-swap-result.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Download Result
          </a>
          <button
            onClick={onTryAgain}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultDisplay; 