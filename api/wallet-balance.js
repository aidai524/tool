const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

// Initialize Solana connection
const rpcUrl = process.env.RPC || 'https://api.devnet.solana.com';
const formattedRpcUrl = rpcUrl.startsWith('http') ? rpcUrl : `https://${rpcUrl}`;

const solanaConnection = new Connection(formattedRpcUrl, {
  fetch: fetch
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract public key from URL path
    const publicKey = req.url.split('/').pop();
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }
    
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await solanaConnection.getBalance(pubKey);
      const solBalance = balance / 1000000000; // Convert lamports to SOL
      
      return res.status(200).json({
        success: true,
        balance: solBalance
      });
    } catch (error) {
      console.error('Error getting balance:', error);
      return res.status(400).json({ error: 'Invalid public key' });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
