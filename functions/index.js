const axios = require('axios');
const cors = require('cors')({ origin: true });

/**
 * Google Cloud Function for Face Swap
 * 
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
exports.faceSwap = (req, res) => {
  // Enable CORS
  return cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).send({ error: 'Method not allowed' });
      }

      const { targetImage, swapImage, apiKey } = req.body;

      // Validate required parameters
      if (!targetImage || !swapImage || !apiKey) {
        return res.status(400).send({ 
          error: 'Missing required parameters: targetImage, swapImage, or apiKey' 
        });
      }

      // Prepare request to piapi.ai
      const data = JSON.stringify({
        "model": "Qubico/image-toolkit",
        "task_type": "face-swap",
        "input": {
          "target_image": targetImage,
          "swap_image": swapImage
        }
      });

      const config = {
        method: 'post',
        url: 'https://api.piapi.ai/api/v1/task',
        headers: { 
          'x-api-key': apiKey, 
          'Content-Type': 'application/json'
        },
        data: data
      };

      // Call the face swap API
      const response = await axios(config);
      
      // Return the response from the face swap API
      return res.status(200).send(response.data);
    } catch (error) {
      console.error('Error:', error.message);
      
      // Return appropriate error response
      return res.status(500).send({
        error: 'An error occurred while processing the request',
        details: error.message
      });
    }
  });
}; 