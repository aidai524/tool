const { createKeypairFromPrivateKey } = require('../src/services/auth');
const buyService = require('../src/services/buy');
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    // Start batch buying process
    const results = await buyService.batchBuy(wallets, targetTokens, solAmount, slippageTolerance, delays);
    
    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in batch buying:', error);
    return res.status(500).json({ error: 'Failed to perform batch buying', message: error.message });
  }
};
