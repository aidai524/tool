const { createKeypairFromPrivateKey } = require('../src/services/auth');
const likeService = require('../src/services/like');
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
    const { wallets, targetProjects, delays } = req.body;
    
    if (!Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ error: 'No wallets provided' });
    }
    
    if (!Array.isArray(targetProjects) || targetProjects.length === 0) {
      return res.status(400).json({ error: 'No target projects provided' });
    }
    
    // Start batch liking process
    const results = await likeService.batchLike(wallets, targetProjects, delays);
    
    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in batch liking:', error);
    return res.status(500).json({ error: 'Failed to perform batch liking', message: error.message });
  }
};
