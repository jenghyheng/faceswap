# Face Swap Google Cloud Function

This is a Google Cloud Function that serves as a backend for the Face Swap application.

## Deployment

1. Install the Google Cloud SDK
2. Authenticate with Google Cloud: `gcloud auth login`
3. Set your project: `gcloud config set project YOUR_PROJECT_ID`
4. Deploy the function:

```bash
gcloud functions deploy faceSwap \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated
```

## Environment Variables

No environment variables are required as the API key is passed from the frontend.

## Security Note

For production, consider storing the API key in a secure environment variable and implementing proper authentication for the Cloud Function. 