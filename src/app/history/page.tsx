'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { getUserGenerations } from '@/utils/firebase';
import { Generation } from '@/types';
import { toast } from 'react-toastify';

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);

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
        console.log(`Fetching generations for user: ${currentUser.uid}`);
        const userGenerations = await getUserGenerations(currentUser.uid);
        console.log(`Successfully fetched ${userGenerations.length} generations`);
        
        setGenerations(userGenerations as Generation[]);
        setError(null);
      } catch (err) {
        console.error('Error fetching generations:', err);
        
        if (err instanceof Error) {
          setError(err.message);
          
          // Add specific error handling
          if (err.message.includes('permission')) {
            setError('Firebase permissions error. Please check your Firestore security rules.');
          } else if (err.message.includes('network')) {
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
  }, [currentUser]);

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

  // Add the getFirebaseRulesInstructions function but simplified
  const getFirebaseRulesInstructions = () => {
    return (
      <div className="mt-4">
        <p className="text-red-600 mb-4">
          <strong>Firebase Permissions Error:</strong> You need to update your Firestore security rules to allow access to your data.
        </p>
        <div className="mt-6">
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Firebase Console
          </a>
        </div>
      </div>
    );
  };

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
        <Link 
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Face Swap
        </Link>
      </div>

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
          
          {error.includes('permission') && getFirebaseRulesInstructions()}
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-xl font-semibold">Generation Details</h2>
                  <button 
                    onClick={() => setSelectedGeneration(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/2">
                      <div className="relative h-80 w-full rounded-lg overflow-hidden">
                        {selectedGeneration.resultImage && selectedGeneration.resultImage.startsWith('http') ? (
                          <Image
                            src={selectedGeneration.resultImage}
                            alt="Face swap result"
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gray-100">
                            <div className="text-center p-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-gray-500 mt-4">Image not available or still processing</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <a
                          href={selectedGeneration.resultImage?.startsWith('http') ? selectedGeneration.resultImage : '#'}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                            !selectedGeneration.resultImage || !selectedGeneration.resultImage.startsWith('http') 
                              ? 'opacity-50 cursor-not-allowed' 
                              : ''
                          }`}
                          onClick={(e) => {
                            if (!selectedGeneration.resultImage || !selectedGeneration.resultImage.startsWith('http')) {
                              e.preventDefault();
                              toast.error('Image is not available for download yet');
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
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
                          {selectedGeneration.targetImage && selectedGeneration.targetImage.startsWith('http') ? (
                            <div className="mt-2 relative h-20 w-20 rounded overflow-hidden">
                              <Image
                                src={selectedGeneration.targetImage}
                                alt="Target image"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <p className="text-gray-600 text-sm break-words">{selectedGeneration.targetImage}</p>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium">Task ID</h3>
                          <p className="text-gray-600 text-sm break-all">{selectedGeneration.taskId}</p>
                        </div>
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
                    {generation.resultImage && generation.resultImage.startsWith('http') ? (
                      <Image
                        src={generation.resultImage}
                        alt="Face swap result"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gray-100">
                        <div className="text-center p-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 text-xs mt-2">Processing...</p>
                        </div>
                      </div>
                    )}
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