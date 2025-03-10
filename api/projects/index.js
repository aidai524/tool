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
    
    return res.status(200).json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    return res.status(500).json({ error: 'Failed to get projects', message: error.message });
  }
};
