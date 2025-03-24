# FaceSwap App

A simple face swap application built with Next.js and Firebase, using the PiAPI.ai service for face swapping functionality.

## Features

- User authentication via Firebase Auth
- Upload and swap faces using PiAPI.ai
- View previous face swap generations
- Responsive design

## Tech Stack

- Next.js 15
- React 19
- Firebase (Authentication & Firestore)
- TailwindCSS
- TypeScript
- PiAPI.ai face swap API

## Getting Started

### Prerequisites

1. Node.js 18 or higher
2. A Firebase project with Authentication (Google provider) and Firestore enabled
3. A PiAPI.ai API key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_PIAPI_KEY=your_piapi_key
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/faceswap.git
cd faceswap
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

1. Push your code to a GitHub repository.

2. Visit [Vercel](https://vercel.com/) and create a new project.

3. Import your GitHub repository.

4. Add the environment variables in the Vercel project settings.

5. Deploy!

## How It Works

1. Users sign in with their Google account
2. They select a target image from predefined options or upload their own
3. They upload their face image
4. The app sends the images to the PiAPI.ai API
5. The app polls for task completion
6. Once complete, the face swap result is displayed and saved to the user's history
7. Users can view their previous generations

## License

MIT

## Acknowledgements

- [PiAPI.ai](https://piapi.ai) for their face swap API
- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Dropzone](https://react-dropzone.js.org/)

## Troubleshooting

### API Errors

If you encounter `Unexpected token in JSON at position X` errors, it likely means:
1. Your API key is invalid or expired
2. The PiAPI service is temporarily unavailable
3. Network issues are preventing proper communication with the API

Solution: Check your API key in `.env.local` and ensure it's valid and not expired.

### Firebase Permissions Errors

If you see `FirebaseError: Missing or insufficient permissions`, you need to configure your Firestore security rules correctly. There are two approaches:

#### Option 1: Simple Rules for Testing (Recommended for beginners)

These rules allow any authenticated user to read and write to any document. This is less secure but makes development and testing easier:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Option 2: Secure Rules for Production

These rules only allow users to access their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /generations/{docId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    match /test_connection/{docId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

To apply these rules:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database in the left sidebar
4. Click on the "Rules" tab
5. Replace the rules with one of the options above
6. Click "Publish" to save your rules

If you're still experiencing permission errors after updating the rules:
1. Sign out and sign back in to refresh your auth token
2. Clear your browser cache
3. Check that the Firebase configuration values in your `.env.local` match your Firebase project

### Image Processing Errors

If face swapping fails with errors like "No face detected":
1. Make sure your source image contains a clearly visible face
2. Try a different target image
3. Ensure both images have good lighting and resolution
