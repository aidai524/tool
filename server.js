const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Keypair, Connection, PublicKey } = require('@solana/web3.js');
// Fix for bs58 v6.0.0 which uses ES modules
const bs58 = require('bs58').default || require('bs58');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { setGlobalDispatcher, ProxyAgent } = require('undici');
const axios = require('axios');
const { createKeypairFromPrivateKey, createKeypairFromBase64PrivateKey } = require('./src/services/auth');
const likeService = require('./src/services/like');
const buyService = require('./src/services/buy');
const { likeConfig } = require('./src/config/like.config');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// const httpDispatcher = new ProxyAgent({ uri: "http://127.0.0.1:4780" });
// setGlobalDispatcher(httpDispatcher);

// Initialize Solana connection (devnet for balance checking)
const solanaConnection = new Connection(process.env.RPC, {
  fetch: fetch
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// Routes
app.post('/api/generate-wallets', async (req, res) => {
  try {
    const { count } = req.body;
    const walletCount = parseInt(count) || 1;
    
    if (walletCount <= 0 || walletCount > 100) {
      return res.status(400).json({ error: 'Wallet count must be between 1 and 100' });
    }
    
    const wallets = [];
    
    for (let i = 0; i < walletCount; i++) {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();
      
      // Handle bs58 encoding safely
      let privateKey;
      try {
        privateKey = bs58.encode(keypair.secretKey);
      } catch (encodeError) {
        console.error('Error encoding with bs58:', encodeError);
        // Fallback to Buffer encoding if bs58 fails
        privateKey = Buffer.from(keypair.secretKey).toString('base64');
      }
      
      // Get initial balance (will be 0 for new wallets)
      let balance = 0;
      try {
        balance = await solanaConnection.getBalance(keypair.publicKey);
        balance = balance / 1000000000; // Convert lamports to SOL
      } catch (balanceError) {
        console.error('Error getting wallet balance:', balanceError);
      }
      
      wallets.push({
        publicKey,
        privateKey,
        balance
      });
    }
    
    res.json({ wallets });
  } catch (error) {
    console.error('Error generating wallets:', error);
    res.status(500).json({ error: 'Failed to generate wallets' });
  }
});

app.post('/api/import-wallets', async (req, res) => {
  try {
    const { wallets } = req.body;
    
    if (!Array.isArray(wallets)) {
      return res.status(400).json({ error: 'Invalid wallet data format' });
    }
    
    // Validate each wallet and add balance
    const validatedWallets = [];
    
    for (const wallet of wallets) {
      try {
        if (!wallet.privateKey) continue;
        
        const secretKey = bs58.decode(wallet.privateKey);
        const keypair = Keypair.fromSecretKey(secretKey);
        const publicKey = keypair.publicKey.toString();
        
        // If the public key matches, it's a valid wallet
        if (publicKey === wallet.publicKey) {
          // Get wallet balance
          let balance = 0;
          try {
            balance = await solanaConnection.getBalance(keypair.publicKey);
            balance = balance / 1000000000; // Convert lamports to SOL
          } catch (balanceError) {
            console.error('Error getting wallet balance:', balanceError);
          }
          
          validatedWallets.push({
            publicKey,
            privateKey: wallet.privateKey,
            balance
          });
        }
      } catch (error) {
        console.error('Error validating wallet:', error);
      }
    }
    
    res.json({ 
      success: true, 
      imported: validatedWallets.length,
      wallets: validatedWallets
    });
  } catch (error) {
    console.error('Error importing wallets:', error);
    res.status(500).json({ error: 'Failed to import wallets' });
  }
});

// Liking routes
app.post('/api/like-projects', async (req, res) => {
  try {
    const { wallets, targetTokens, delays } = req.body;
    
    if (!Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ error: 'No wallets provided' });
    }
    
    if (!Array.isArray(targetTokens) || targetTokens.length === 0) {
      return res.status(400).json({ error: 'No target tokens provided' });
    }
    
    // Use provided delays or default from config
    const likeDelays = delays || likeConfig.delays;
    
    // Start batch liking process
    const results = await likeService.batchLike(wallets, targetTokens, likeDelays);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in batch liking:', error);
    res.status(500).json({ error: 'Failed to perform batch liking', message: error.message });
  }
});

// Buying routes
app.post('/api/buy-tokens', async (req, res) => {
  try {
    const { wallets, targetTokens, solAmount, slippageTolerance, delays } = req.body;
    
    if (!Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ error: 'No wallets provided' });
    }
    
    if (!Array.isArray(targetTokens) || targetTokens.length === 0) {
      return res.status(400).json({ error: 'No target tokens provided' });
    }
    
    if (typeof solAmount !== 'number' || solAmount <= 0) {
      return res.status(400).json({ error: 'Invalid SOL amount' });
    }
    
    if (typeof slippageTolerance !== 'number' || slippageTolerance <= 0 || slippageTolerance > 100) {
      return res.status(400).json({ error: 'Invalid slippage tolerance' });
    }

    console.log('wallets: ', wallets);
    
    // Start batch buying process
    const results = await buyService.batchBuy(wallets, targetTokens, Number(solAmount) * (10 ** 9), slippageTolerance, delays);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in batch buying:', error);
    res.status(500).json({ error: 'Failed to perform batch buying', message: error.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const { walletKey, targetToken } = req.query;
    
    if (!walletKey) {
      return res.status(400).json({ error: 'Wallet key is required' });
    }
    
    if (!targetToken) {
      return res.status(400).json({ error: 'Target token is required' });
    }
    
    // Create keypair from the wallet key
    const keypair = createKeypairFromPrivateKey(walletKey);
    
    // Get projects for the target token
    const projects = await likeService.getProjects(keypair, targetToken);
    
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ error: 'Failed to get projects', message: error.message });
  }
});

// Get project list
app.get('/api/projects/list', async (req, res) => {
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
    console.log('Requesting project list from:', `${apiBaseUrl}/project/list`);
    
    // Log equivalent curl command for debugging
    const curlCommand = `curl -X GET "${apiBaseUrl}/project/list?launchType=1&limit=20" \
      -H "Authorization: ${authToken}" \
      -H "Origin: ${apiOrigin}" \
      -H "Referer: ${apiReferer}" \
      -H "Content-Type: application/json"`;
    console.log('\nEquivalent curl command:\n', curlCommand, '\n');
    try {
      const response = await axios({
        method: 'get',
        url: `${apiBaseUrl}/project/list`,  // Using project/list endpoint directly
        headers: {
          'Authorization': authToken,
          'Origin': apiOrigin,
          'Referer': apiReferer
        },
        params: {
          launchType: 1,
          limit: 30,
          page: page
        }
      });
      
      // Log the response structure for debugging
      console.log('Response data structure:', JSON.stringify(response.data).substring(0, 100) + '...');
      
      // Extract the project list from the response
      // The API returns data in the format: {"code":0,"data":{"list":[...]}}
      let projectList = [];
      if (response.data && response.data.code === 0 && response.data.data && Array.isArray(response.data.data.list)) {
        projectList = response.data.data.list;
        console.log(`Successfully extracted ${projectList.length} projects from the API response`);
      } else {
        console.warn('Unexpected API response format:', JSON.stringify(response.data).substring(0, 100) + '...');
      }
      
      // Return project list with pagination info
      res.json({
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
        console.log('Trying alternative endpoint:', `${apiBaseUrl}/project/list`);
        const altResponse = await axios({
          method: 'get',
          url: `${apiBaseUrl}/project/list`,
          headers: {
            'Authorization': authToken,
            'Origin': apiOrigin,
            'Referer': apiReferer
          },
          params: {
            launchType: 1,
            limit: 30,
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
        
        res.json({
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
        res.status(500).json({ 
          error: 'Failed to get project list', 
          message: error.message,
          details: error.response ? error.response.data : null
        });
      }
    }
    
    // Note: Response is now handled in the try/catch blocks above
  } catch (error) {
    console.error('Error getting project list:', error);
    res.status(500).json({ 
      error: 'Failed to get project list', 
      message: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const defaultEnv = `API_BASE_URL=https://api.dumpdump.fun/api/v1
API_ORIGIN=https://test.flipn.fun
API_REFERER=https://test.flipn.fun/
TARGET_LIST=
`;
  fs.writeFileSync(envPath, defaultEnv);
  console.log('Created default .env file');
}

// Get wallet balance
app.get('/api/wallet-balance/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }
    
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await solanaConnection.getBalance(pubKey);
      const solBalance = balance / 1000000000; // Convert lamports to SOL
      
      res.json({
        success: true,
        balance: solBalance
      });
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      res.status(400).json({ error: 'Invalid public key' });
    }
  } catch (error) {
    console.error('Error in wallet balance request:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
