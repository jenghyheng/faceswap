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
import { getRandomTargetImage } from '@/utils/imageUtils';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { currentUser } = useAuth();
  const { isMobile } = useMobileDetect();
  const router = useRouter();
  
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [useLocalImages, setUseLocalImages] = useState<boolean>(false);

  // Function to handle source image selection
  const handleSourceImageSelected = (file: File) => {
    console.log("Source image selected:", file.name);
    setSourceImage(file);
    
    // Automatically select a random target image
    const randomImage = getRandomTargetImage(useLocalImages, failedImages);
    console.log("Target image selected:", randomImage.url);
    setTargetImage(randomImage.url);
  };

  // Handle image loading failures
  const handleImageLoadFailure = useCallback((imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]));
    
    // If all remote images fail, switch to local images
    if ([...failedImages].length >= 3) {
      setUseLocalImages(true);
      toast.info('Using local images due to connection issues');
    }
  }, [failedImages]);

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

  // Used in a component that's not currently rendered
  const handleSelectGeneration = (generation: Generation) => {
    // Redirect to results page with the generation info
    if (generation.taskId) {
      router.push(`/results?taskId=${generation.taskId}`);
    }
  };

  /**
   * Create a new face swap task
   */
  const createFaceSwap = async (sourceImg: File, targetImg: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log("Starting face swap process with source image:", sourceImg.name);
      
      // Skip the upload step and directly create the face swap task
      const taskResponse = await createFaceSwapTask(
        targetImg,
        sourceImg
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

      console.log("Task created successfully with ID:", taskResponse.taskId);
      
      // Save the initial task to history
      const generationId = await saveTaskToHistory(taskResponse.taskId);
      console.log("Task saved to history with ID:", generationId);
      
      // Navigate to the results page instead of polling here
      router.push(`/results?taskId=${taskResponse.taskId}${generationId ? `&generationId=${generationId}` : ''}`);
    } catch (err) {
      console.error('Error in createFaceSwap:', err);
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // Help the user understand what to do for size errors
      if (err instanceof Error && err.message.toLowerCase().includes('image size')) {
        toast.error('Please select a smaller image or try again with compression', { autoClose: 7000 });
      } else {
        toast.error('Failed to create face swap. Please try again.', { autoClose: 5000 });
      }
    }
  };

  // Handles the submission of the face swap request
  const handleSubmit = (sourceImg: File, targetImg: string) => {
    if (!currentUser) {
      toast.error('Please sign in to create face swaps');
      return;
    }

    if (!targetImg || !sourceImg) {
      toast.error('Both target and source images are required');
      return;
    }

    createFaceSwap(sourceImg, targetImg);
  };

  // Reset the state to start over
  const handleReset = () => {
    setSourceImage(null);
    setTargetImage(null);
    setStatus('idle');
    setError(null);
    setTaskId(null);
  };

  // Show login request if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-6">Face Swap App</h1>
          <p className="mb-8 text-gray-600">Please sign in to use the face swap feature and save your creations.</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Face Swap App</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Upload Your Photo</h2>
            <ImageUploader
              onImageSelected={handleSourceImageSelected}
              onGenerate={() => {
                console.log("Generate button clicked. Source image:", !!sourceImage, "Target image:", !!targetImage);
                
                // Set loading state immediately to provide visual feedback
                setStatus('loading');
                
                if (!currentUser) {
                  toast.error('Please sign in to create face swaps');
                  setStatus('idle');
                  return;
                }
                
                if (!sourceImage) {
                  toast.error('Please upload an image first');
                  setStatus('idle');
                  return;
                }
                
                if (!targetImage) {
                  // This shouldn't happen, but just in case
                  const randomImage = getRandomTargetImage(useLocalImages, failedImages);
                  setTargetImage(randomImage.url);
                  // Wait a moment for state to update
                  setTimeout(() => {
                    handleSubmit(sourceImage, randomImage.url);
                  }, 100);
                  return;
                }
                
                // All checks passed, proceed with face swap
                handleSubmit(sourceImage, targetImage);
              }}
              label="Upload Your Photo"
              disabled={isProcessing}
            />
          </div>

          {status === 'loading' && (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 mb-4 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Starting Face Swap</h3>
                <p className="text-gray-600">Initiating the process...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
