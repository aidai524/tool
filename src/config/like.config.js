const dotenv = require('dotenv');

dotenv.config();

// Parse target tokens from environment variables or use default empty array
const targetTokens = (process.env.TARGET_LIST || '').split(',').filter(token => token.trim());

/**
 * Configuration for liking functionality
 */
const likeConfig = {
    // Target tokens to like
    targetTokens,
    
    // Delay configuration
    delays: {
        wallet: {
            min: 50,  // Minimum delay between wallets (ms)
            max: 100  // Maximum delay between wallets (ms)
        },
        like: {
            fixed: 100  // Fixed delay between likes (ms)
        }
    }
};

module.exports = { likeConfig };
