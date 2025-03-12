const { Keypair } = require('@solana/web3.js');
const axios = require('axios');
const { createKeypairFromPrivateKey } = require('../../src/services/auth');
const likeService = require('../../src/services/like');
require('dotenv').config();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get page number from query params, default to 1
  const page = parseInt(req.query.page) || 1;
  
  try {
    // Get the first wallet from the request or generate a new one for authentication
    let keypair;
    try {
      // Try to use an existing wallet if available
      const wallets = await likeService.getStoredWallets();
      if (wallets && wallets.length > 0) {
        keypair = createKeypairFromPrivateKey(wallets[0].privateKey);
      } else {
        // Generate a new keypair if no wallets are available
        keypair = Keypair.generate();
      }
    } catch (error) {
      // Generate a new keypair if there's an error
      keypair = Keypair.generate();
    }
    
    // Get auth token
    const authToken = await likeService.getAuthToken(keypair);
    
    // Set up request parameters
    const apiBaseUrl = process.env.API_BASE_URL || 'https://api.dumpdump.fun/api/v1';
    const apiOrigin = process.env.API_ORIGIN || 'https://test.flipn.fun';
    const apiReferer = process.env.API_REFERER || 'https://test.flipn.fun/';
    
    // Make request to FlipN API
    console.log('Requesting project list from:', `${apiBaseUrl}/project/trends/list`);
    
    try {
      const response = await axios({
        method: 'get',
        url: `${apiBaseUrl}/project/trends/list`,
        headers: {
          'Authorization': authToken,
          'Origin': apiOrigin,
          'Referer': apiReferer
        },
        params: {
          limit: 100,
          page: page
        }
      });
      
      // Extract the project list from the response
      let projectList = [];
      if (response.data && response.data.code === 0 && response.data.data && Array.isArray(response.data.data.list)) {
        projectList = response.data.data.list;
        console.log(`Successfully extracted ${projectList.length} projects from the API response`);
      } else {
        console.warn('Unexpected API response format:', JSON.stringify(response.data).substring(0, 100) + '...');
      }
      
      // Return project list with pagination info
      return res.status(200).json({
        success: true,
        projects: projectList,
        pagination: {
          page: page,
          limit: 30,
          hasMore: projectList.length === 30 // If we got the full limit, there might be more
        }
      });
    } catch (error) {
      console.error('Error getting project list:', error);
      
      // Try alternative endpoint if first one fails
      try {
        console.log('Trying alternative endpoint:', `${apiBaseUrl}/project/trends/list`);
        const altResponse = await axios({
          method: 'get',
          url: `${apiBaseUrl}/project/trends/list`,
          headers: {
            'Authorization': authToken,
            'Origin': apiOrigin,
            'Referer': apiReferer
          },
          params: {
            limit: 100,
            page: page
          }
        });
        
        // Extract the project list from the alternative response
        let projectList = [];
        if (altResponse.data && altResponse.data.code === 0 && altResponse.data.data && Array.isArray(altResponse.data.data.list)) {
          projectList = altResponse.data.data.list;
          console.log(`Successfully extracted ${projectList.length} projects from the alternative API response`);
        } else {
          console.warn('Unexpected alternative API response format:', JSON.stringify(altResponse.data).substring(0, 100) + '...');
        }
        
        return res.status(200).json({
          success: true,
          projects: projectList,
          pagination: {
            page: page,
            limit: 30,
            hasMore: projectList.length === 30 // If we got the full limit, there might be more
          }
        });
      } catch (altError) {
        console.error('Error with alternative endpoint:', altError);
        return res.status(500).json({ 
          error: 'Failed to get project list', 
          message: error.message,
          details: error.response ? error.response.data : null
        });
      }
    }
  } catch (error) {
    console.error('Error getting project list:', error);
    return res.status(500).json({ 
      error: 'Failed to get project list', 
      message: error.message
    });
  }
};
