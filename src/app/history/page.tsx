'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { getUserGenerations, saveGeneration, testFirebaseConnection } from '@/utils/firebase';
import { Generation } from '@/types';
import { toast } from 'react-toastify';

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a function to add logs that will be displayed in debug panel
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // Scroll to bottom of logs when they update
  useEffect(() => {
    if (logsEndRef.current && showDebug) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showDebug]);

  // Fetch generations when component mounts
  useEffect(() => {
    const fetchGenerations = async () => {
      if (!currentUser) {
        setLoading(false);
        setError(null);
        setGenerations([]);
        return;
      }

      try {
        setLoading(true);
        addLog(`Fetching generations for user: ${currentUser.uid}`);
        const userGenerations = await getUserGenerations(currentUser.uid);
        addLog(`Successfully fetched ${userGenerations.length} generations`);
        
        // Detailed logging of fetched generations
        if (userGenerations.length === 0) {
          addLog('No generations found in Firestore.');
        } else {
          addLog(`First generation ID: ${userGenerations[0].id}`);
          addLog(`First generation timestamp: ${formatTimestamp(userGenerations[0].timestamp)}`);
        }
        
        setGenerations(userGenerations as Generation[]);
        setError(null);
      } catch (err) {
        console.error('Error fetching generations:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addLog(`Error fetching generations: ${errorMessage}`);
        
        if (err instanceof Error) {
          setError(err.message);
          
          // Add specific error handling
          if (err.message.includes('permission')) {
            addLog('Firebase permissions error detected. Check your Firestore rules.');
            setError('Firebase permissions error. Please check your Firestore security rules.');
          } else if (err.message.includes('network')) {
            addLog('Network error detected. Check your internet connection.');
            setError('Network error. Please check your internet connection.');
          }
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGenerations();
  }, [currentUser, addLog]);

  // Add function to test Firebase connection
  const testConnection = async () => {
    if (!currentUser) {
      toast.error('You need to be signed in to test the Firebase connection');
      return;
    }

    try {
      addLog('Starting Firebase connection test...');
      toast.info('Testing Firebase connection...');
      const result = await testFirebaseConnection();
      
      if (result.success) {
        addLog(`Firebase connection test succeeded: ${result.message}`);
        toast.success(`Firebase connection successful: ${result.message}`);
        console.log('Firebase connection test result:', result);
      } else {
        addLog(`Firebase connection test failed: ${result.message}`);
        toast.error(`Firebase connection failed: ${result.message}`);
        console.error('Firebase connection test failed:', result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error testing Firebase connection: ${errorMessage}`);
      console.error('Error testing Firebase connection:', err);
      if (err instanceof Error) {
        toast.error(`Connection error: ${err.message}`);
      } else {
        toast.error('Unknown error testing Firebase connection');
      }
    }
  };

  // Add helper function to create a test generation
  const createTestGeneration = async () => {
    if (!currentUser) {
      toast.error('You need to be signed in to create a test generation');
      return;
    }

    try {
      setLoading(true);
      
      addLog(`Creating test generation for user: ${currentUser.uid}`);
      console.log('Creating test generation for user:', currentUser.uid);
      toast.info('Creating test generation...');
      
      // Create a test image URL that's always accessible
      const testImageUrl = 'https://picsum.photos/400/400';
      
      // Create a more detailed sample generation with metadata
      const generationData = {
        sourceImage: JSON.stringify({
          name: 'test-source.jpg',
          type: 'image/jpeg',
          size: '25 KB'
        }),
        targetImage: testImageUrl,
        resultImage: testImageUrl,
        taskId: `test-${Date.now()}`,
        timestamp: new Date()
      };
      
      addLog(`Generation data prepared: ${JSON.stringify(generationData, null, 2)}`);
      console.log('Test generation data:', generationData);
      
      // Save to Firestore
      addLog('Attempting to save to Firestore...');
      const generationId = await saveGeneration(currentUser.uid, generationData);
      
      addLog(`Generation saved with ID: ${generationId}`);
      console.log('Test generation saved with ID:', generationId);
      toast.success(`Test generation created with ID: ${generationId}`);
      
      // Refresh the generations list
      addLog('Refreshing generations list...');
      const userGenerations = await getUserGenerations(currentUser.uid);
      addLog(`Fetched ${userGenerations.length} generations`);
      console.log('Fetched updated generations:', userGenerations.length);
      setGenerations(userGenerations as Generation[]);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error creating test generation: ${errorMessage}`);
      console.error('Error creating test generation:', err);
      if (err instanceof Error) {
        toast.error(`Error: ${err.message}`);
        console.error('Error details:', err);
        
        // Special handling for permission errors
        if (err.message.includes('permission')) {
          toast.error('Firebase permissions error. Please check your Firestore rules.');
          addLog('Firebase permissions error detected. Check your Firestore rules.');
        }
      } else {
        toast.error('Unknown error creating test generation');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    addLog(`Handling file upload: ${file.name} (${file.type}, ${Math.round(file.size/1024)} KB)`);
    
    // Read file as data URL for display
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedImage(dataUrl);
      addLog(`Image converted to data URL (length: ${dataUrl.length} chars)`);
      addLog(`Data URL starts with: ${dataUrl.substring(0, 50)}...`);
      
      // Log file info
      const fileInfo = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString(),
      };
      addLog(`File details: ${JSON.stringify(fileInfo)}`);
    };
    
    reader.onerror = (error) => {
      addLog(`Error reading file: ${error}`);
      toast.error('Error processing image');
    };
    
    reader.readAsDataURL(file);
    toast.success(`Image uploaded: ${file.name}`);
  };
  
  // Function to create test generation with uploaded image
  const createTestWithUploadedImage = async () => {
    if (!currentUser) {
      toast.error('You need to be signed in to create a test generation');
      addLog('Test aborted: User not signed in');
      return;
    }
    
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      addLog('Test aborted: No image uploaded');
      return;
    }
    
    try {
      setLoading(true);
      addLog(`Creating test generation with uploaded image for user: ${currentUser.uid}`);
      addLog(`User email: ${currentUser.email}`);
      toast.info('Creating test generation with uploaded image...');
      
      // Create source image metadata
      const sourceImageInfo = {
        name: 'uploaded-source.jpg',
        type: 'image/jpeg',
        size: `${Math.round(uploadedImage.length / 1024)} KB approx`,
        dataUrlLength: uploadedImage.length,
        isDataUrl: uploadedImage.startsWith('data:'),
      };
      
      // Create a more detailed sample generation with metadata
      const generationData = {
        sourceImage: JSON.stringify(sourceImageInfo),
        targetImage: uploadedImage.substring(0, 100) + '...',  // Don't log the full data URL
        resultImage: uploadedImage,
        taskId: `test-upload-${Date.now()}`,
        timestamp: new Date()
      };
      
      addLog(`Generation metadata prepared: ${JSON.stringify({
        ...generationData,
        targetImage: '(data URL truncated)',
        resultImage: '(data URL truncated)',
      }, null, 2)}`);
      
      // Save to Firestore
      addLog('Attempting to save uploaded image to Firestore...');
      const startTime = Date.now();
      const generationId = await saveGeneration(currentUser.uid, generationData);
      const endTime = Date.now();
      
      addLog(`Generation saved with ID: ${generationId}`);
      addLog(`Save operation took ${endTime - startTime}ms`);
      toast.success(`Test generation created with ID: ${generationId}`);
      
      // Refresh the generations list
      addLog('Refreshing generations list...');
      const userGenerations = await getUserGenerations(currentUser.uid);
      addLog(`Fetched ${userGenerations.length} generations`);
      setGenerations(userGenerations as Generation[]);
      setError(null);
      
      // Clear the uploaded image
      setUploadedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      addLog('Cleared uploaded image data');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error creating test generation: ${errorMessage}`);
      if (err instanceof Error && 'code' in err) {
        addLog(`Firebase error code: ${(err as { code: string }).code}`);
      }
      console.error('Error creating test generation with uploaded image:', err);
      if (err instanceof Error) {
        toast.error(`Error: ${err.message}`);
      } else {
        toast.error('Unknown error creating test generation');
      }
    } finally {
      setLoading(false);
      addLog('Loading state reset');
    }
  };

  // Enhanced error message for Firebase permissions
  const getFirebaseRulesInstructions = () => {
    return (
      <div className="mt-4">
        <h3 className="font-medium text-red-700 mb-2">How to Fix Firebase Permissions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-red-600 mb-4">
          <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
          <li>Select your project</li>
          <li>Navigate to "Firestore Database" in the left sidebar</li>
          <li>Click on the "Rules" tab</li>
          <li>Replace ALL existing rules with the following simplified rules:</li>
        </ol>
        
        <div className="bg-white p-4 rounded border-2 border-red-200 font-mono text-sm overflow-x-auto">
          rules_version = &apos;2&apos;;<br/>
          service cloud.firestore &#123;<br/>
          &nbsp;&nbsp;match /databases/&#123;database&#125;/documents &#123;<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;match /&#123;document=**&#125; &#123;<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if request.auth != null;<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
          &nbsp;&nbsp;&#125;<br/>
          &#125;
        </div>
        
        <p className="mt-4 text-red-600">
          These simplified rules allow any authenticated user to read/write any document.
          This is less secure but ensures your app works for testing.
        </p>
        
        <div className="mt-4 bg-yellow-50 p-4 border border-yellow-200 rounded text-yellow-800">
          <p className="font-semibold">After testing, use more secure rules:</p>
          <p className="mt-2 text-sm">
            Once your app is working, consider using more restrictive rules that only allow users
            to access their own data. See the README for more secure rule examples.
          </p>
        </div>
      </div>
    );
  };

  // Helper function to format timestamps consistently
  function formatTimestamp(timestamp: Date | string): string {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Unknown date';
    }
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Sign In Required</h2>
          <p className="text-yellow-700 mb-6">
            Please sign in to view your generation history.
          </p>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Generation History</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            disabled={loading}
          >
            Test Firebase
          </button>
          <button
            onClick={createTestGeneration}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            Create Test Entry
          </button>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Face Swap
          </Link>
        </div>
      </div>

      {/* Image upload section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Test with Your Own Image</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Upload any image to create a test entry with it
            </p>
          </div>
          
          {uploadedImage && (
            <div className="relative w-20 h-20 border border-gray-300 rounded overflow-hidden">
              <Image 
                src={uploadedImage} 
                alt="Uploaded image"
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <button
            onClick={createTestWithUploadedImage}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            disabled={loading || !uploadedImage}
          >
            Test with Uploaded Image
          </button>
        </div>
      </div>

      {/* Debug panel */}
      {showDebug && (
        <div className="mb-6 p-4 bg-black text-white rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Debug Console</h2>
            <button 
              onClick={() => setLogs([])}
              className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-gray-900 p-3 rounded max-h-60 overflow-y-auto font-mono text-xs">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="pb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet. Actions will be logged here.</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-32 h-32 mb-4 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading your generation history...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 rounded-lg border border-red-100">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading History</h2>
          <p className="text-red-600 mb-4">{error}</p>
          
          {error.includes('permission') && (
            <>
              <p className="text-red-600 mb-4">
                <strong>Firebase Permissions Error:</strong> You need to update your Firestore security rules to allow access to your data.
              </p>
              {getFirebaseRulesInstructions()}
              
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Open Firebase Console
                </button>
              </div>
            </>
          )}
        </div>
      ) : generations.length === 0 ? (
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Generations Found</h2>
          <p className="text-gray-600 mb-6">
            You haven&apos;t created any face swaps yet. Try creating one!
          </p>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Face Swap
          </Link>
        </div>
      ) : (
        <>
          {selectedGeneration ? (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold">Generation Details</h2>
                    <button 
                      onClick={() => setSelectedGeneration(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Back to List
                    </button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/2">
                      <div className="relative h-80 w-full rounded-lg overflow-hidden">
                        <Image 
                          src={selectedGeneration.resultImage} 
                          alt="Face swap result"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="mt-4">
                        <a
                          href={selectedGeneration.resultImage}
                          download="faceswap-result.jpg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Download Result
                        </a>
                      </div>
                    </div>
                    
                    <div className="md:w-1/2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Created At</h3>
                          <p className="text-gray-600">
                            {formatTimestamp(selectedGeneration.timestamp)}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium">Source Image</h3>
                          <p className="text-gray-600 text-sm break-words">{selectedGeneration.sourceImage}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium">Target Image</h3>
                          <p className="text-gray-600 text-sm break-words">{selectedGeneration.targetImage}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium">Task ID</h3>
                          <p className="text-gray-600 text-sm break-all">{selectedGeneration.taskId}</p>
                        </div>
                        
                        {selectedGeneration.metadata && (
                          <div>
                            <h3 className="text-lg font-medium">Additional Info</h3>
                            <div className="text-gray-600 text-sm">
                              <p>App Version: {selectedGeneration.metadata.appVersion}</p>
                              {selectedGeneration.metadata.created && (
                                <p>Created: {formatTimestamp(selectedGeneration.metadata.created)}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {generations.map((generation) => (
                <div 
                  key={generation.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedGeneration(generation)}
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={generation.resultImage}
                      alt="Face swap result"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500">
                      {generation.timestamp instanceof Date 
                        ? generation.timestamp.toLocaleString() 
                        : formatTimestamp(generation.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 