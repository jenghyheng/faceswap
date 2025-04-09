'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">About FaceSwap App</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="mb-4">
          FaceSwap is a simple application that uses AI to swap faces between images. 
          It leverages the PiAPI.ai service to perform the face swapping operation.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          <li>Sign in with your Google account</li>
          <li>Select a target image from the predefined options</li>
          <li>Upload your face image (the source image to swap from)</li>
          <li>Click &quot;Generate Face Swap&quot; to start the process</li>
          <li>Wait for the processing to complete</li>
          <li>View and download your result</li>
        </ol>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Configuration</h2>
        <p className="mb-4">
          The application requires the following configurations:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li>Firebase for authentication and storing generation history</li>
          <li>PiAPI.ai API key for face swapping functionality</li>
        </ul>
        
        <p className="mb-4">
          The API key should be set in your environment variables as <code>NEXT_PUBLIC_PIAPI_KEY</code>.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Privacy</h2>
        <p className="mb-6">
          All face swapping operations are performed via the PiAPI.ai service. Your uploaded images are 
          temporarily stored to complete the face swap operation, but are not permanently stored unless 
          you are signed in and the application saves your generation history.
        </p>
        
        <div className="mt-8">
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 