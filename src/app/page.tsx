'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import LoginButton from '@/components/LoginButton';
import TargetImageSelector from '@/components/TargetImageSelector';
import ImageUploader from '@/components/ImageUploader';
import ResultDisplay from '@/components/ResultDisplay';
import GenerationHistory from '@/components/GenerationHistory';
import { createFaceSwapTask, checkTaskStatus } from '@/utils/api';
import { saveGeneration, updateGeneration } from '@/utils/firebase';
import { SwapStatus, Generation } from '@/types';
import Image from 'next/image';
import useMobileDetect from '@/hooks/useMobileDetect';

export default function Home() {
  const { currentUser } = useAuth();
  const { isMobile } = useMobileDetect();
  
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // First save the task when it's created
  const saveTaskToHistory = useCallback(async (id: string) => {
    if (!currentUser || !targetImage || !sourceImage) {
      console.log("Not saving task to history: missing required data");
      return null;
    }
    
    try {
      console.log("Saving initial task to history...");
      
      // Create a simple object with the essential data
      const generationData = {
        // Store minimal source image info
        sourceImage: sourceImage.name || "Uploaded image",
        // Store the target image URL 
        targetImage: targetImage,
        // Use a placeholder image URL instead of "processing" text
        resultImage: "/images/placeholder.png", 
        // Store the task ID for reference
        taskId: id,
        // Store the timestamp
        timestamp: new Date()
      };
      
      console.log("Saving initial task data to Firestore:", generationData);
      
      const generationId = await saveGeneration(currentUser.uid, generationData);
      
      console.log(`Initial task saved with ID: ${generationId}`);
      return generationId;
    } catch (err) {
      console.error('Error saving initial task:', err);
      return null;
    }
  }, [currentUser, targetImage, sourceImage]);

  // Then update the task with the result later
  const updateTaskWithResult = useCallback(async (resultImageUrl: string, generationId: string | null) => {
    if (!currentUser || !generationId) {
      console.log("Cannot update task: missing required data");
      return;
    }
    
    try {
      console.log(`Updating task ${generationId} with result image...`);
      
      // Update the generation with the result image
      await updateGeneration(generationId, {
        resultImage: resultImageUrl,
        status: 'completed'
      });
      
      console.log(`Task updated with result image`);
      toast.success('Face swap saved to your history');
    } catch (err) {
      console.error('Error updating task with result:', err);
      toast.warning('Could not update history with result, but your image was generated successfully.');
    }
  }, [currentUser]);
  
  // Function to handle source image selection
  const handleSourceImageSelected = (file: File) => {
    setSourceImage(file);
  };

  // Used in a component that's not currently rendered
  const handleSelectGeneration = (generation: Generation) => {
    setResultUrl(generation.resultImage);
    setStatus('succeeded');
  };

  /**
   * Create a new face swap task
   */
  const createFaceSwap = async () => {
    if (!targetImage || !sourceImage) {
      toast.error('Both target and source images are required');
      return;
    }

    setStatus('loading');
    setError(null);
    
    try {
      // Skip the upload step and directly create the face swap task
      const taskResponse = await createFaceSwapTask(
        targetImage,
        sourceImage
      );

      if (!taskResponse.success) {
        // Check if this is an image size related error
        if (taskResponse.error && typeof taskResponse.error === 'string') {
          const errorLowerCase = taskResponse.error.toLowerCase();
          if (errorLowerCase.includes('image size') || 
              errorLowerCase.includes('too large') || 
              errorLowerCase.includes('maximum is')) {
            // Show a better error message for size issues
            throw new Error('Image size is too large. Please use a smaller image or allow our automatic compression to work.');
          }
        }
        
        throw new Error(taskResponse.error || 'Failed to create face swap task');
      }

      setTaskId(taskResponse.taskId);
      
      // Save the initial task to history
      const generationId = await saveTaskToHistory(taskResponse.taskId);
      
      // Start polling with the generation ID
      startPolling(taskResponse.taskId, generationId);
    } catch (err) {
      console.error('Error in createFaceSwap:', err);
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // Help the user understand what to do for size errors
      if (err instanceof Error && err.message.toLowerCase().includes('image size')) {
        toast.error('Please select a smaller image or try again with compression', { autoClose: 7000 });
      }
    }
  };

  /**
   * Start polling for task status
   */
  const startPolling = useCallback(async (id: string, generationId: string | null) => {
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
        return;
      }
      
      try {
        console.log(`Polling task status for task ID: ${id}, attempt ${attempts + 1}`);
        const response = await checkTaskStatus(id);
        
        console.log('Task status response:', JSON.stringify(response, null, 2));
        
        if (!response.success) {
          throw new Error(response.error instanceof Object 
            ? response.error.message 
            : response.error || 'Failed to check task status');
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
          } else {
            console.log('Setting result URL:', outputUrl);
            setResultUrl(outputUrl);
            
            // Update the task with the result image
            await updateTaskWithResult(outputUrl, generationId);
          }
          
          setIsPolling(false);
          return;
        } else if (status === 'failed') {
          // Task failed
          throw new Error(response.error instanceof Object 
            ? response.error.message 
            : response.error || 'Task processing failed');
        }
        
        // Still processing, continue polling
        attempts++;
        console.log(`Task still processing, waiting ${interval/1000} seconds for next check`);
        setTimeout(poll, interval);
      } catch (err) {
        console.error('Error in polling:', err);
          setStatus('failed');
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsPolling(false);
      }
    };
    
    poll();
  }, [isPolling, updateTaskWithResult]);

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('Please sign in to create face swaps');
      return;
    }

    if (!targetImage || !sourceImage) {
      toast.error('Please select both target and source images');
      return;
    }

    createFaceSwap();
  };

  const handleReset = () => {
    // Clear all state to start fresh
    setStatus('idle');
    setResultUrl(null);
    setError(null);
    setTaskId(null);
    
    // Explicitly stop any ongoing polling
    setIsPolling(false);
    
    // Always reset source image
    setSourceImage(null);
    
    // Show a confirmation message
    toast.info('Ready for a new face swap!');
  };

  useEffect(() => {
    // Check for localStorage support (needed for fallback storage)
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (_error) {
      console.warn("localStorage is not available. Generation history may not work correctly.");
      toast.warning("Your browser doesn't fully support all features. Generation history may not work correctly.");
    }
    
    // Check for API key configuration
    const apiKey = process.env.NEXT_PUBLIC_PIAPI_KEY;
    if (!apiKey) {
      console.error("API key is not configured in environment variables");
      toast.error("API key is not configured. Please check your environment variables.", {
        autoClose: false,
      });
    } else if (apiKey === 'your_piapi_key_here') {
      console.error("Default placeholder API key is being used");
      toast.error("You're using the placeholder API key. Please update your .env.local file with your actual PiAPI key.", {
        autoClose: false,
      });
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {currentUser ? (
        <div>
          
          
          {/* When result is ready, show just the result and history */}
          {status === 'succeeded' && resultUrl ? (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Swap
                </button>
              </div>
              <div className="mt-4">
                <ResultDisplay
                  status={status}
                  resultUrl={resultUrl}
                  error={error}
                  onTryAgain={handleReset}
                  taskId={taskId}
                />
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Your History</h2>
                <GenerationHistory
                  userId={currentUser.uid}
                  onSelectGeneration={handleSelectGeneration}
                />
              </div>
            </>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-8">
             
              
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Step 1: Upload your face Image</h2>
                  <ImageUploader
                    onImageSelected={handleSourceImageSelected}
                    disabled={status === 'loading'}
                    label="Upload Your Photo"
                  />
                </div>

                {sourceImage && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Step 2: Select your template image</h2>
                    <TargetImageSelector
                      onSelectImage={setTargetImage}
                      selectedImage={targetImage}
                      disabled={status === 'loading'}
                    />
                  </div>
                )}

                {sourceImage && targetImage && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleSubmit}
                      disabled={status === 'loading' || !sourceImage || !targetImage}
                      className={`
                        px-6 py-3 rounded-lg font-semibold text-white
                        ${status === 'loading' 
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                        transition-colors duration-150
                      `}
                    >
                      {status === 'loading' ? 'Processing...' : 'Create Face Swap'}
                    </button>
                  </div>
                )}

                {status === 'succeeded' && resultUrl && (
                  <div>
                    <ResultDisplay 
                      resultUrl={resultUrl}
                      status={status}
                      error={error}
                      taskId={taskId}
                      onTryAgain={() => {
                        setSourceImage(null);
                        setTargetImage(null);
                        setResultUrl(null);
                        setStatus('idle');
                        setError(null);
                        setTaskId(null);
                      }}
                    />
                  </div>
                )}

                {error && (
                  <div className="text-red-500 text-center">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-10">
          <h1 className="text-2xl font-bold mb-6">Face Swap App</h1>
          <p className="text-lg mb-8 text-center max-w-md">
            Sign in to start creating amazing face swaps with our AI technology.
          </p>
          <LoginButton />
        </div>
      )}
    </div>
  );
}
