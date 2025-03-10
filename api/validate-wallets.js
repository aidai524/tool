const { PublicKey } = require('@solana/web3.js');
const { createKeypairFromPrivateKey } = require('../src/services/auth');

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
    const { wallets } = req.body;
    
    if (!Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ error: 'No wallets provided' });
    }
    
    const validatedWallets = [];
    const invalidWallets = [];
    
    for (const wallet of wallets) {
      try {
        // Validate public key
        let isValidPublicKey = false;
        try {
          new PublicKey(wallet.publicKey);
          isValidPublicKey = true;
        } catch (error) {
          isValidPublicKey = false;
        }
        
        // Validate private key by attempting to create a keypair
        let keypair = null;
        let isValidPrivateKey = false;
        try {
          keypair = createKeypairFromPrivateKey(wallet.privateKey);
          isValidPrivateKey = true;
        } catch (error) {
          isValidPrivateKey = false;
        }
        
        // Check if the private key corresponds to the public key
        let keysMatch = false;
        if (isValidPublicKey && isValidPrivateKey && keypair) {
          keysMatch = keypair.publicKey.toString() === wallet.publicKey;
        }
        
        if (isValidPublicKey && isValidPrivateKey && keysMatch) {
          validatedWallets.push({
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey
          });
        } else {
          invalidWallets.push({
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey,
            errors: {
              invalidPublicKey: !isValidPublicKey,
              invalidPrivateKey: !isValidPrivateKey,
              keyMismatch: isValidPublicKey && isValidPrivateKey && !keysMatch
            }
          });
        }
      } catch (walletError) {
        invalidWallets.push({
          publicKey: wallet.publicKey,
          privateKey: wallet.privateKey,
          errors: {
            processingError: walletError.message
          }
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      validatedWallets,
      invalidWallets,
      stats: {
        total: wallets.length,
        valid: validatedWallets.length,
        invalid: invalidWallets.length
      }
    });
  } catch (error) {
    console.error('Error validating wallets:', error);
    return res.status(500).json({ error: 'Failed to validate wallets', message: error.message });
  }
};
