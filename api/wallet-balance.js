const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

// Initialize Solana connection with a reliable RPC endpoint
// Using a public RPC endpoint that should be reliable
const rpcUrl = process.env.RPC || 'https://api.mainnet-beta.solana.com';

// Create a more robust connection
let solanaConnection;
try {
  solanaConnection = new Connection(rpcUrl, 'confirmed');
} catch (error) {
  console.error('Failed to initialize Solana connection:', error);
  // Fallback to a different RPC if primary fails
  solanaConnection = new Connection('https://api.devnet.solana.com', 'confirmed');
}

// Helper function to safely extract public key from different request formats
function extractPublicKey(req) {
  // Try different ways to get the public key
  if (req.params && req.params.publicKey) {
    return req.params.publicKey;
  }
  
  if (req.query && req.query.publicKey) {
    return req.query.publicKey;
  }
  
  // For Vercel serverless functions
  if (req.url) {
    const parts = req.url.split('/');
    return parts[parts.length - 1]; // Get the last part of the URL
  }
  
  return null;
}

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
    console.log('Wallet balance request received:', req.url);
    
    // Extract public key using the helper function
    const publicKey = extractPublicKey(req);
    console.log('Extracted public key:', publicKey);
    
    if (!publicKey) {
      console.log('No public key found in request');
      return res.status(400).json({ error: 'Public key is required' });
    }
    
    try {
      // Validate and create PublicKey object
      const pubKey = new PublicKey(publicKey);
      console.log('Valid public key:', pubKey.toString());
      
      // Get balance with retry logic
      let balance;
      let retries = 3;
      
      while (retries > 0) {
        try {
          balance = await solanaConnection.getBalance(pubKey);
          break; // Success, exit the retry loop
        } catch (balanceError) {
          console.error(`Balance fetch attempt failed (${retries} retries left):`, balanceError);
          retries--;
          if (retries === 0) throw balanceError;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      const solBalance = balance / 1000000000; // Convert lamports to SOL
      console.log('Balance fetched successfully:', solBalance, 'SOL');
      
      return res.status(200).json({
        success: true,
        balance: solBalance
      });
    } catch (error) {
      console.error('Error processing public key or getting balance:', error);
      return res.status(400).json({ 
        error: 'Invalid public key or balance fetch failed',
        message: error.message
      });
    }
  } catch (error) {
    console.error('Server error in wallet balance API:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};
