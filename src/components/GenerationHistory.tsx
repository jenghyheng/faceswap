'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getUserGenerations } from '@/utils/firebase';
import { Generation } from '@/types';

interface GenerationHistoryProps {
  userId: string;
  onSelectGeneration?: (generation: Generation) => void;
}

const GenerationHistory: React.FC<GenerationHistoryProps> = ({ userId, onSelectGeneration }) => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        if (!userId) return;
        
        setLoading(true);
        const userGenerations = await getUserGenerations(userId);
        setGenerations(userGenerations as Generation[]);
        setError(null);
      } catch (err) {
        console.error('Error fetching generations:', err);
        setError('Failed to load your previous generations');
      } finally {
        setLoading(false);
      }
    };

    fetchGenerations();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading your previous generations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">You haven&apos;t created any face swaps yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Your Previous Generations</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {generations.map((generation) => (
          <div 
            key={generation.id} 
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectGeneration && onSelectGeneration(generation)}
          >
            <div className="relative h-40 w-full">
              {generation.resultImage && (generation.resultImage !== "processing") && generation.resultImage.startsWith('http') ? (
                <Image
                  src={generation.resultImage}
                  alt="Face swap result"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gray-100">
                  <p className="text-gray-500 text-sm">Processing...</p>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-500">
                {formatTimestamp(generation.timestamp)}
              </p>
            </div>
          </div>
        ))}
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

export default GenerationHistory; 