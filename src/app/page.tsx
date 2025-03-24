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

export default function Home() {
  const { currentUser } = useAuth();

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

  // This is used in the JSX below
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
    
    // Reset source image too, to encourage user to try a different image
    if (status === 'failed') {
      setSourceImage(null);
    }
    
    // Show a confirmation message
    if (status === 'failed') {
      toast.info('All cleared. Try again with a new image.');
    }
  };

  useEffect(() => {
    // Check for localStorage support (needed for fallback storage)
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (_) {
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
    <div className="container mx-auto px-4 py-8">
      {currentUser ? (
        <div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold mb-4">Select Target Image</h2>
              <TargetImageSelector 
                onSelectImage={setTargetImage} 
                selectedImage={targetImage}
                disabled={status === 'loading'}
              />
            </div>
            
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold mb-4">Upload Your Face</h2>
              <ImageUploader 
                onImageSelected={handleSourceImageSelected} 
                label="Drop or select your face image"
                disabled={status === 'loading'}
              />
            </div>
          </div>
          
          {/* Preview Section */}
          {(targetImage || sourceImage) && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Preview</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-around items-center">
                {targetImage && (
                  <div className="text-center">
                    <h3 className="font-medium mb-2">Target Image</h3>
                    <div className="relative w-52 h-52 rounded-lg overflow-hidden border-2 border-blue-500">
                      <Image 
                        src={targetImage} 
                        alt="Target image" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">This is where your face will be placed</p>
                  </div>
                )}
                
                {targetImage && sourceImage && (
                  <div className="text-center py-10">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {sourceImage && (
                  <div className="text-center">
                    <h3 className="font-medium mb-2">Your Face</h3>
                    <div className="relative w-52 h-52 rounded-lg overflow-hidden border-2 border-green-500">
                      <Image 
                        src={URL.createObjectURL(sourceImage)} 
                        alt="Source image" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">This face will be swapped onto the target</p>
                  </div>
                )}
              </div>
              
              {targetImage && sourceImage && (
                <div className="mt-6 text-center">
                  <p className="mb-4 text-sm text-gray-700">
                    Your face from the source image will be swapped onto the target image. For best results, 
                    ensure that your face is clearly visible in the source image.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!targetImage || !sourceImage || status === 'loading'}
              className={`w-full mt-8 py-3 px-6 rounded-md text-white font-medium ${
                !targetImage || !sourceImage || status === 'loading'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {status === 'loading' ? 'Processing...' : 'Create Face Swap'}
            </button>
          </div>
          
          <div className="mt-8">
            <ResultDisplay
              status={status}
              resultUrl={resultUrl}
              error={error}
              onTryAgain={handleReset}
              taskId={taskId}
            />
          </div>
          
          {currentUser && status !== 'loading' && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Your History</h2>
              <GenerationHistory
                userId={currentUser.uid}
                onSelectGeneration={(generation) => {
                  setResultUrl(generation.resultImage);
                  setStatus('succeeded');
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12">
          <h1 className="text-3xl font-bold mb-8">Face Swap App</h1>
          <p className="text-xl mb-8 text-center max-w-2xl">
            Sign in to start creating amazing face swaps with our AI-powered technology.
          </p>
          <LoginButton />
        </div>
      )}
    </div>
  );
}
