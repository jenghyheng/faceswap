import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your own Firebase configuration values in production
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Change the collection name from 'generations' to 'generate-image'
const COLLECTION_NAME = 'generate-image';

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

// Initialize collection if it doesn't exist yet
export const ensureCollectionExists = async (collectionName: string) => {
  try {
    console.log(`Ensuring collection "${collectionName}" exists...`);
    // Simply query the collection to check if it exists and is accessible
    const colRef = collection(db, collectionName);
    const testQuery = query(colRef, limit(1));
    await getDocs(testQuery);
    console.log(`Collection "${collectionName}" exists or was created.`);
    return true;
  } catch (error) {
    console.error(`Error ensuring collection "${collectionName}" exists:`, error);
    throw error;
  }
};

// Save a generation to Firestore 
export const saveGeneration = async (userId: string, data: {
  sourceImage: string;
  targetImage: string;
  resultImage: string;
  taskId: string;
  timestamp?: Date;
}) => {
  try {
    console.log("Saving generation to Firestore for user:", userId);
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.error("Not authenticated");
      return null;
    }
    
    // Create a simple generation document
    const generationData = {
      userId,
      sourceImage: data.sourceImage,
      targetImage: data.targetImage,
      resultImage: data.resultImage,
      taskId: data.taskId,
      timestamp: new Date().toISOString(),
    };
    
    // Add the document to the generate-image collection
    const docRef = await addDoc(collection(db, COLLECTION_NAME), generationData);
    console.log("Generation saved successfully with ID:", docRef.id);
    
    // Keep only the 10 most recent generations for this user
    await limitUserGenerations(userId, 10);
    
    return docRef.id;
  } catch (error) {
    console.error("Error saving generation:", error);
    return null;
  }
};

// Limit the number of generations stored per user
const limitUserGenerations = async (userId: string, limit: number) => {
  try {
    // Get all generations for this user, ordered by timestamp
    const userGenerationsQuery = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(userGenerationsQuery);
    console.log(`User has ${querySnapshot.docs.length} generations`);
    
    // If the user has more than the limit, delete the oldest ones
    if (querySnapshot.docs.length > limit) {
      console.log(`Deleting ${querySnapshot.docs.length - limit} old generations`);
      
      // Get the documents to delete (the oldest ones)
      const docsToDelete = querySnapshot.docs.slice(limit);
      
      // Delete each document
      for (const doc of docsToDelete) {
        await deleteDoc(doc.ref);
        console.log(`Deleted old generation: ${doc.id}`);
      }
    }
  } catch (error) {
    console.error("Error limiting generations:", error);
  }
};

// Get user's generations from Firestore
export const getUserGenerations = async (userId: string) => {
  try {
    console.log("Fetching generations for user:", userId);
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.error("Not authenticated");
      return [];
    }
    
    // Create the query to get the most recent generations
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(10) // Only get the 10 most recent
    );
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} generations`);
    
    // Parse the data and handle timestamps
    const generations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Create a properly formatted generation object
      return {
        id: doc.id,
        userId: data.userId,
        sourceImage: data.sourceImage,
        targetImage: data.targetImage,
        resultImage: data.resultImage,
        taskId: data.taskId,
        timestamp: data.timestamp,
      };
    });
    
    return generations;
  } catch (error) {
    console.error("Error getting generations:", error);
    return [];
  }
};

// Test Firebase connection and permissions
export const testFirebaseConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    if (!auth.currentUser) {
      return { success: false, message: "Not authenticated. Please sign in." };
    }
    
    console.log("Testing Firebase Firestore connection...");
    
    // Get current timestamp for test document
    const timestamp = new Date().toISOString();
    
    // Try to create a test document in a test collection
    const testData = {
      userId: auth.currentUser.uid,
      email: auth.currentUser.email,
      testTimestamp: timestamp,
      message: "Connection test"
    };
    
    // Add test document
    const testDocRef = await addDoc(collection(db, "connectionTests"), testData);
    console.log("Test document created with ID:", testDocRef.id);
    
    // Delete the test document immediately to clean up
    await deleteDoc(testDocRef);
    console.log("Test document deleted successfully");
    
    return { 
      success: true, 
      message: `Connection successful. Firebase is working correctly. Test timestamp: ${timestamp}`
    };
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide more helpful messages based on common Firebase errors
      if (error.message.includes('permission-denied')) {
        errorMessage = "Firebase security rules are preventing access. Check your Firestore rules.";
      } else if (error.message.includes('unavailable')) {
        errorMessage = "Firebase services are currently unavailable. Check your internet connection.";
      } else if (error.message.includes('not-found')) {
        errorMessage = "The requested Firestore document or collection was not found.";
      }
    }
    
    return { success: false, message: errorMessage };
  }
};

// Update an existing generation in Firestore
export const updateGeneration = async (generationId: string, data: {
  resultImage?: string;
  status?: string;
}) => {
  try {
    console.log(`Updating generation ${generationId}...`);
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.error("Not authenticated");
      return false;
    }
    
    // Get a reference to the document
    const generationRef = doc(db, COLLECTION_NAME, generationId);
    
    // Update only the specified fields
    await updateDoc(generationRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Generation ${generationId} updated successfully`);
    return true;
  } catch (error) {
    console.error(`Error updating generation ${generationId}:`, error);
    return false;
  }
}; 