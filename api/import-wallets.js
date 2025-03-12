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
    console.log('Received wallet import request');
    const { wallets } = req.body;
    
    console.log('Wallets data received:', JSON.stringify(req.body).substring(0, 200) + '...');
    console.log('Number of wallets in request:', Array.isArray(wallets) ? wallets.length : 'Not an array');
    
    if (!Array.isArray(wallets) || wallets.length === 0) {
      console.error('No wallets provided or wallets is not an array');
      return res.status(400).json({ error: 'No wallets provided' });
    }
    
    // Log sample wallet structure (first wallet, with private key partially hidden)
    if (wallets.length > 0) {
      const sampleWallet = {...wallets[0]};
      if (sampleWallet.privateKey) {
        const keyLength = sampleWallet.privateKey.length;
        sampleWallet.privateKey = sampleWallet.privateKey.substring(0, 5) + '...' + 
                                 sampleWallet.privateKey.substring(keyLength - 5, keyLength);
      }
      console.log('Sample wallet structure:', JSON.stringify(sampleWallet));
    }
    
    const validatedWallets = [];
    const invalidWallets = [];
    
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      console.log(`Processing wallet ${i+1}/${wallets.length}`);
      
      // Skip wallets without required fields
      if (!wallet || !wallet.publicKey || !wallet.privateKey) {
        console.error(`Wallet ${i+1} is missing required fields:`, JSON.stringify(wallet));
        invalidWallets.push({
          publicKey: wallet?.publicKey || 'missing',
          privateKey: wallet?.privateKey ? '(private key present but not shown)' : 'missing',
          errors: { missingRequiredFields: true }
        });
        continue;
      }
      
      try {
        // Validate public key
        let isValidPublicKey = false;
        let pubKeyError = null;
        try {
          new PublicKey(wallet.publicKey);
          isValidPublicKey = true;
          console.log(`Wallet ${i+1}: Public key validation successful`);
        } catch (error) {
          pubKeyError = error.message;
          isValidPublicKey = false;
          console.error(`Wallet ${i+1}: Invalid public key:`, error.message);
        }
        
        // Validate private key by attempting to create a keypair
        let keypair = null;
        let isValidPrivateKey = false;
        let privKeyError = null;
        try {
          console.log(`Wallet ${i+1}: Attempting to create keypair from private key`);
          keypair = createKeypairFromPrivateKey(wallet.privateKey);
          isValidPrivateKey = true;
          console.log(`Wallet ${i+1}: Private key validation successful`);
        } catch (error) {
          privKeyError = error.message;
          isValidPrivateKey = false;
          console.error(`Wallet ${i+1}: Invalid private key:`, error.message);
        }
        
        // Check if the private key corresponds to the public key
        let keysMatch = false;
        if (isValidPublicKey && isValidPrivateKey && keypair) {
          const derivedPublicKey = keypair.publicKey.toString();
          keysMatch = derivedPublicKey === wallet.publicKey;
          console.log(`Wallet ${i+1}: Keys match check: ${keysMatch}`);
          console.log(`  Expected: ${wallet.publicKey}`);
          console.log(`  Derived:  ${derivedPublicKey}`);
        }
        
        // Accept the wallet if either:
        // 1. Both keys are valid and match, OR
        // 2. Private key is valid (we can derive a public key from it)
        if ((isValidPublicKey && isValidPrivateKey && keysMatch) || isValidPrivateKey) {
          // If private key is valid but public key doesn't match, use the derived public key
          const walletToAdd = {
            publicKey: isValidPrivateKey && !keysMatch ? keypair.publicKey.toString() : wallet.publicKey,
            privateKey: wallet.privateKey,
            balance: wallet.balance || 0
          };
          
          validatedWallets.push(walletToAdd);
          console.log(`Wallet ${i+1}: Successfully validated and added`);
        } else {
          invalidWallets.push({
            publicKey: wallet.publicKey,
            privateKey: '(private key present but not shown)',
            errors: {
              invalidPublicKey: !isValidPublicKey,
              publicKeyError: pubKeyError,
              invalidPrivateKey: !isValidPrivateKey,
              privateKeyError: privKeyError,
              keyMismatch: isValidPublicKey && isValidPrivateKey && !keysMatch
            }
          });
          console.log(`Wallet ${i+1}: Validation failed, added to invalid wallets list`);
        }
      } catch (walletError) {
        console.error(`Wallet ${i+1}: Unexpected error during processing:`, walletError);
        invalidWallets.push({
          publicKey: wallet.publicKey,
          privateKey: '(private key present but not shown)',
          errors: {
            processingError: walletError.message
          }
        });
      }
    }
    
    console.log('Import summary:');
    console.log(`- Total wallets processed: ${wallets.length}`);
    console.log(`- Successfully imported: ${validatedWallets.length}`);
    console.log(`- Invalid wallets: ${invalidWallets.length}`);
    
    return res.status(200).json({
      success: true,
      wallets: validatedWallets,
      imported: validatedWallets.length,
      invalid: invalidWallets.length,
      invalidWallets: invalidWallets.length > 0 ? invalidWallets : undefined
    });
  } catch (error) {
    console.error('Error importing wallets:', error);
    return res.status(500).json({ error: 'Failed to import wallets', message: error.message });
  }
};
