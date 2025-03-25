'use client';

import React from 'react';
import Image from 'next/image';
import { SwapStatus } from '@/types';
import useMobileDetect from '@/hooks/useMobileDetect';

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
  const { isMobile } = useMobileDetect();

  if (status === 'idle') {
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 mb-4 bg-gray-300 rounded-lg relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-1/2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <p className="text-gray-600">
            Processing your face swap{isMobile ? '...' : '... This may take a minute.'}
          </p>
          <div className="mt-3 w-full max-w-md bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full animate-progress"></div>
          </div>
        </div>
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
      <div className="p-6 bg-red-50 rounded-lg border border-red-100">
        <div className="flex items-center mb-3">
          <div className="rounded-full bg-red-100 p-2 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-700">{errorTitle}</h3>
        </div>
        <p className="text-red-600 mb-4 text-sm">{errorMessage}</p>
        
        {troubleshootingSteps.length > 0 && (
          <div className="mb-4 bg-white rounded p-3 border border-red-100">
            <h4 className="font-medium text-red-700 text-sm mb-2">Try these steps:</h4>
            <ul className="list-disc list-inside text-red-600 text-xs space-y-1">
              {troubleshootingSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}
        
        {taskId && (
          <p className="text-xs text-red-500 mt-2 mb-4">
            Task ID: {taskId}
          </p>
        )}
        
        <button
          onClick={onTryAgain}
          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'succeeded' && resultUrl) {
    return (
      <div className="p-6 bg-green-50 rounded-lg border border-green-100">
        <div className="flex items-center mb-4">
          <div className="rounded-full bg-green-100 p-2 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-700">Face Swap Complete!</h3>
        </div>
        
        <div className="relative w-full aspect-square max-h-96 mb-6 overflow-hidden rounded-lg border border-green-200 bg-white shadow-sm">
          <Image
            src={resultUrl}
            alt="Face swap result"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <a
            href={resultUrl}
            download="face-swap-result.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {isMobile ? 'Download' : 'Download Result'}
          </a>
          <button
            onClick={onTryAgain}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {isMobile ? 'New Swap' : 'Create Another'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultDisplay; 