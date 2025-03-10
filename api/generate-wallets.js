const { Keypair } = require('@solana/web3.js');
// Fix for bs58 v6.0.0 which uses ES modules
const bs58 = require('bs58').default || require('bs58');

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
        privateKey = Buffer.from(keypair.secretKey).toString('base64');
      }
      
      wallets.push({
        publicKey,
        privateKey
      });
    }
    
    return res.status(200).json({
      success: true,
      wallets
    });
  } catch (error) {
    console.error('Error generating wallets:', error);
    return res.status(500).json({ error: 'Failed to generate wallets', message: error.message });
  }
};
