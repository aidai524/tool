const { Connection, Transaction, Keypair, sendAndConfirmTransaction, ComputeBudgetProgram } = require('@solana/web3.js');
const { createKeypairFromPrivateKey } = require('./auth');
const axios = require('axios');
const bs58 = require('bs58').default || require('bs58');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { setGlobalDispatcher, ProxyAgent } = require('undici');

// Load environment variables
dotenv.config();

// const httpDispatcher = new ProxyAgent({ uri: "http://127.0.0.1:4780" });
// setGlobalDispatcher(httpDispatcher);


// FlipN class implementation for Node.js
class FlipN {
  constructor() {
    this.rpc = process.env.RPC || 'https://api.mainnet-beta.solana.com';
    this.programId = process.env.PROGRAM_ID;
    this.connection = new Connection(this.rpc, {
      fetch: fetch
    });
  }

  async init(params) {
    this.owner = Keypair.fromSecretKey(bs58.decode(params.privateKey));
    this.tokenAddress = params.tokenAddress;

    // Additional initialization if needed
    return this;
  }

  async estimate(inNumber, inType = 'sol') {
    try {
      // Call the FlipN API to get the estimate
      const apiBaseUrl = process.env.API_BASE_URL || 'https://api.dumpdump.fun/api/v1';
      const url = `${apiBaseUrl}/estimate`;

      // Ensure addresses are properly formatted
      const ownerAddress = this.owner.publicKey.toBase58();

      const params = {
        inNumber: inNumber,
        inType: inType,
        owner: ownerAddress,
        tokenAddress: this.tokenAddress,
        type: 1
      };

      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');

      const response = await fetch(`${url}?${queryString}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data && data.quote) {
        return data.quote
      }


      throw new Error(`Failed to get estimate from API: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('\n[ERROR] Error estimating token amount:', error);
      if (error.response) {
        console.error(`[ERROR] Status: ${error.response.status}`);
        console.error(`[ERROR] Response data:`, JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  async buyToken(quote, maxSolAmount) {
    try {
      // Call the FlipN API to create a buy transaction
      const apiBaseUrl = process.env.API_BASE_URL || 'https://api.dumpdump.fun/api/v1';
      const url = `${apiBaseUrl}/buy`;

      // Ensure addresses are properly formatted
      const ownerAddress = this.owner.publicKey.toBase58();

      console.log('quote: ', quote, ownerAddress);

      const params = {
        inNumber: maxSolAmount,
        inType: 'sol',
        owner: ownerAddress,
        params: JSON.stringify(quote),
        tokenAddress: this.tokenAddress,
        type: 1
      };

      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');


      const response = await fetch(`${url}?${queryString}`, {
        method: 'get',
        headers: {
          'accept': 'application/json'
        }
      })

      const responseData = await response.json();

      console.log('responseData: ', responseData);

      if (responseData && responseData.txId) {
        const txBase64 = responseData.txId;
        // Return the transaction for signing
        return txBase64;
      }

      throw new Error(`Failed to create buy transaction: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('\n[ERROR] Error creating buy transaction:', error);
      if (error.response) {
        console.error(`[ERROR] Status: ${error.response.status}`);
        console.error(`[ERROR] Response data:`, JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  async signAndSendTransaction(txBase64) {
    try {
      // Decode the transaction
      const txBuffer = Buffer.from(txBase64, 'base64');
      const transaction = Transaction.from(txBuffer);

      // Get the latest blockhash
      const latestBlockhash = await this.connection.getLatestBlockhash();
      console.log('latestBlockhash: ', latestBlockhash);

      // Update transaction with latest blockhash and fee payer
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = this.owner.publicKey;

      console.log('transaction: ', this.owner.publicKey.toBase58());

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.owner],
        {
          skipPreflight: true
        }
      );

      console.log('Transaction signature: ', signature);

      return {
        signature,
        confirmation: true
      };
    } catch (error) {
      console.error('Error signing and sending transaction:', error);
      throw error;
    }
  }
}

/**
 * Get stored wallets from wallets.json file
 * @returns {Promise<Array>} Array of wallet objects
 */
async function getStoredWallets() {
  try {
    const walletsPath = path.join(__dirname, '../../wallets.json');
    const data = await fs.readFile(walletsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading wallets:', error);
    return [];
  }
}

/**
 * Batch buy tokens
 * @param {Array} wallets - Array of wallet objects
 * @param {Array} targetTokens - Array of token addresses
 * @param {Object} solAmount - SOL amount per token
 * @param {number} slippageTolerance - Slippage tolerance percentage
 * @param {Object} delays - Delay settings
 * @returns {Promise<Object>} Results of batch buying
 */
async function batchBuy(wallets, targetTokens, solAmount, slippageTolerance, delays) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    details: []
  };

  // Process each wallet
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];

    // Random delay between wallets
    if (i > 0 && delays && delays.wallet) {
      const walletDelay = Math.floor(
        Math.random() * (delays.wallet.max - delays.wallet.min) + delays.wallet.min
      );
      await new Promise(resolve => setTimeout(resolve, walletDelay));
    }

    // Process each token for this wallet
    for (let j = 0; j < targetTokens.length; j++) {
      const tokenAddress = targetTokens[j];

      // Delay between buys
      if (j > 0 && delays && delays.buy) {
        await new Promise(resolve => setTimeout(resolve, delays.buy.fixed));
      }

      try {
        // Initialize FlipN with wallet
        const flipN = new FlipN();
        await flipN.init({
          privateKey: wallet.privateKey,
          tokenAddress: tokenAddress
        });

        // Estimate token amount
        const quote = await flipN.estimate(solAmount, 'sol');

        // Apply slippage tolerance (3% as in reference code)
        // const adjustedTokenAmount = tokenAmount * (1 - 0.03);

        // Create buy transaction
        const txBase64 = await flipN.buyToken(quote, solAmount);

        // Sign and send transaction
        const { signature } = await flipN.signAndSendTransaction(txBase64);

        // Record success
        results.success++;
        results.details.push(`Wallet ${wallet.publicKey.substring(0, 10)}... bought ${tokenAddress.substring(0, 10)}... (Signature: ${signature.substring(0, 10)}...)`);

        console.log(`Success: Wallet ${wallet.publicKey.substring(0, 10)}... bought ${tokenAddress.substring(0, 10)}...`);
      } catch (error) {
        // Record failure
        results.failed++;
        const errorMessage = `Error with wallet ${wallet.publicKey.substring(0, 10)}... buying ${tokenAddress.substring(0, 10)}...: ${error.message}`;
        results.errors.push(errorMessage);

        console.error(errorMessage);
      }
    }
  }

  return results;
}

module.exports = {
  batchBuy,
  getStoredWallets,
  FlipN
};
