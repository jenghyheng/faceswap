'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { checkTaskStatus } from '@/utils/api';
import { updateGeneration } from '@/utils/firebase';
import { useAuth } from '@/context/AuthContext';
import { SwapStatus } from '@/types';
import Link from 'next/link';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<SwapStatus>('loading');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  useEffect(() => {
    const taskIdParam = searchParams.get('taskId');
    const genIdParam = searchParams.get('generationId');
    
    if (!taskIdParam) {
      toast.error('Missing task ID, redirecting to home');
      router.push('/');
      return;
    }

    setTaskId(taskIdParam);
    if (genIdParam) {
      setGenerationId(genIdParam);
    }

    // Start polling for the task status
    startPolling(taskIdParam, genIdParam);
  }, [searchParams, router]);

  const startPolling = async (id: string, genId: string | null) => {
    if (isPolling) return;
    
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes maximum (with 5s interval)
    const interval = 5000; // 5 seconds between checks
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setStatus('failed');
        setError('Operation timed out after 5 minutes');
        setIsPolling(false);
        toast.error('Face swap operation timed out. Please try again.');
        return;
      }
      
      try {
        console.log(`Polling task status for task ID: ${id}, attempt ${attempts + 1}`);
        const response = await checkTaskStatus(id);
        
        console.log('Task status response:', JSON.stringify(response, null, 2));
        
        if (!response.success) {
          const errorMessage = response.error instanceof Object 
            ? response.error.message 
            : response.error || 'Failed to check task status';
          
          console.error('Task status check failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        const status = response.status;
        console.log(`Task status: ${status}`);
        
        if (status === 'completed') {
          // Task completed successfully
          setStatus('succeeded');
          
          console.log('Task completed! Full response:', JSON.stringify(response, null, 2));
          
          // Extract the result URL from the response
          let outputUrl = '';
          
          // Check different response formats to find the image URL
          if (response.output && typeof response.output === 'object') {
            // New format: output is an object with image_url
            outputUrl = response.output.image_url || '';
            console.log('Found image URL in output object:', outputUrl);
          } else if (response.output && typeof response.output === 'string') {
            // Old format: output is a string URL
            outputUrl = response.output;
            console.log('Found image URL as string:', outputUrl);
          }
          
          if (!outputUrl) {
            console.error('No output URL found in the response');
            toast.warning('Task completed but no result image was returned');
            setStatus('failed');
            setError('Task completed but no result image was returned');
          } else {
            console.log('Setting result URL:', outputUrl);
            setResultUrl(outputUrl);
            
            // Update the task with the result image if we have a generation ID
            if (genId && currentUser) {
              await updateGeneration(genId, {
                resultImage: outputUrl,
                status: 'completed'
              });
              toast.success('Face swap completed and saved to your history!');
            } else {
              toast.success('Face swap completed successfully!');
            }
          }
          
          setIsPolling(false);
          return;
        } else if (status === 'failed') {
          // Task failed
          const errorMessage = response.error instanceof Object 
            ? response.error.message 
            : response.error || 'Task processing failed';
          
          console.error('Task failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        // Still processing, continue polling
        attempts++;
        console.log(`Task still processing, waiting ${interval/1000} seconds for next check. Attempt ${attempts}/${maxAttempts}`);
        setTimeout(poll, interval);
      } catch (err) {
        console.error('Error in polling:', err);
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsPolling(false);
        toast.error('Error checking face swap status. Please try again.');
      }
    };
    
    // Start polling immediately
    poll();
  };

  const handleTryAgain = () => {
    router.push('/');
  };

  return (
    <div className="space-y-8">
      {status === 'loading' && (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating Face Swap</h3>
            <p className="text-gray-600">Please wait while our AI works its magic...</p>
          </div>
        </div>
      )}

      {status === 'succeeded' && resultUrl && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-center mb-4">Your Face Swap Result</h2>
            <div className="relative w-full aspect-square max-w-md mx-auto mb-4 rounded-lg overflow-hidden">
              <Image 
                src={resultUrl}
                alt="Face Swap Result"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Link 
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full text-center"
              >
                Create Another
              </Link>
              {currentUser && (
                <Link 
                  href="/history"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-full text-center"
                >
                  View My History
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-500 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Generation Failed</h3>
            <p className="mb-4">{error || 'There was an error generating your face swap'}</p>
            <button 
              onClick={handleTryAgain}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function ResultsLoading() {
  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-sm">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 mb-4 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Results</h3>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Face Swap Results</h1>
        
        <Suspense fallback={<ResultsLoading />}>
          <ResultsContent />
        </Suspense>
      </div>
    </div>
  );
} 