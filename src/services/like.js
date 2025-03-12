const axios = require('axios');
const { generateSignatureAndGetToken } = require('./auth');
const dotenv = require('dotenv');

dotenv.config();

// Default API endpoints (can be overridden by environment variables)
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.dumpdump.fun/api/v1';
const API_ORIGIN = process.env.API_ORIGIN || 'https://test.flipn.fun';
const API_REFERER = process.env.API_REFERER || 'https://test.flipn.fun/';

/**
 * Service for handling liking functionality
 */
class LikeService {
  /**
   * Get stored wallets from a file
   * @returns {Promise<Array>} - List of stored wallets
   */
  async getStoredWallets() {
    try {
      const fs = require('fs');
      const path = require('path');
      const walletsPath = path.join(__dirname, '../../wallets.json');
      
      if (!fs.existsSync(walletsPath)) {
        return [];
      }
      
      const walletsData = fs.readFileSync(walletsPath, 'utf8');
      const wallets = JSON.parse(walletsData);
      
      return wallets.wallets || [];
    } catch (error) {
      console.error('Error getting stored wallets:', error);
      return [];
    }
  }
  
  /**
   * Get auth token for API requests
   * @param {Object} keypair - Solana keypair
   * @returns {Promise<string>} - Auth token
   */
  async getAuthToken(keypair) {
    return await generateSignatureAndGetToken(keypair);
  }
  
  /**
   * Get projects for a specific token
   * @param {Object} keypair - Solana keypair
   * @param {string} targetToken - Target token to get projects for
   * @returns {Promise<Array>} - List of projects
   */
  async getProjects(keypair, targetToken) {
    try {
      console.log('\n=== Getting Projects ===');
      console.log('Target Token:', targetToken);

      // Ensure we have a valid auth token
      const authToken = await generateSignatureAndGetToken(keypair);
      
      const url = `${API_BASE_URL}/project?address=${encodeURIComponent(targetToken)}`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Origin': API_ORIGIN,
        'Referer': API_REFERER
      };
      
      // 输出等效的curl命令，方便调试
      const curlCommand = `curl -X GET "${url}" \
      -H "Authorization: ${authToken}" \
      -H "Origin: ${API_ORIGIN}" \
      -H "Referer: ${API_REFERER}" \
      -H "Content-Type: application/json"`;
      
      console.log('\n=== Projects Request cURL ===');
      console.log(curlCommand);
      
      const response = await axios.get(url, { headers });
      const data = response.data;

      console.log('\n=== Projects Response ===');
      console.log(JSON.stringify(data, null, 2));

      // 添加更多的验证和错误处理
      if (data.code === 0) {
        if (Array.isArray(data.data)) {
          console.log(`Found ${data.data.length} projects`);
          return data.data;
        } else if (data.data === null) {
          console.log('API returned null data, using mock project for testing');
          // 创建一个模拟项目以测试点赞功能
          return [{
            id: targetToken, // 使用targetToken作为项目的ID
            name: 'Test Project'
          }];
        } else {
          console.log('Unexpected data format:', data.data);
          return [];
        }
      } else {
        console.log('API returned error code:', data.code, data.message || '');
        return [];
      }
    } catch (error) {
      console.error('Failed to get projects:', error.response?.data || error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      }
      return [];
    }
  }

  /**
   * Like a specific project
   * @param {Object} keypair - Solana keypair
   * @param {string} project_id - ID of the project to like
   * @returns {Promise<Object>} - Response from the like request
   */
  async likeProject(keypair, project_id) {
    try {
      console.log('\n=== Liking Project ===');
      console.log('Project ID:', project_id);
      
      // Ensure we have a valid auth token
      const token = await generateSignatureAndGetToken(keypair);
      
      // 保持原有 API 端点路径，使用 id 作为查询参数名，但传入的值是 project_id
      const url = `${API_BASE_URL}/project/like?id=${encodeURIComponent(project_id)}`;
      
      // 使用空的请求体
      const body = '';
      
      const headers = {
        'accept': 'application/json',
        'Authorization': token,
        'Origin': API_ORIGIN,
        'Referer': API_REFERER
      };
      
      // 输出详细的请求信息便于调试
      console.log('\n=== Like Request Parameters (Raw) ===');
      console.log('URL with query params:', url);
      console.log('Authorization Token:', token);
      console.log('Request Body: empty (as required)');
      
      // 构建完整的curl命令，匹配成功的格式
      const curlCommand = `curl -X 'POST' \
  '${url}' \
  -H 'accept: application/json' \
  -H 'Authorization: ${token}' \
  -H 'Origin: ${API_ORIGIN}' \
  -H 'Referer: ${API_REFERER}' \
  -d ''`;
      
      console.log('\n=== Like Request cURL Command (Copy/Paste Ready) ===');
      console.log(curlCommand);
      
      // 发送点赞请求 - 注意我们现在使用空请求体
      console.log('\n=== Sending Like Request ===');
      const response = await axios.post(url, body, { headers });
      
      console.log('\n=== Like Response ===');
      console.log(JSON.stringify(response.data, null, 2));
      
      // 检查响应格式是否符合预期
      // 预期的响应格式是数组: [
      //   {
      //     "launchedLikeNum": 0,
      //     "likeNum": 0,
      //     "likeNumToday": 0,
      //     "point": "string",
      //     "projectLikeNum": 0
      //   }
      // ]
      if (response.data && Array.isArray(response.data)) {
        console.log('Successfully liked project with expected array response format');
      } else if (response.data && response.data.code === 0) {
        console.log('Successfully liked project with code=0 response format');
      } else {
        console.log('Project liked but with unexpected response format:', typeof response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('\n=== Like Request Failed ===');
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
      }
      
      throw error;
    }
  }

  /**
   * Get random delay between min and max values
   * @param {number} min - Minimum delay in milliseconds
   * @param {number} max - Maximum delay in milliseconds
   * @returns {number} - Random delay in milliseconds
   */
  getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch like projects using multiple wallets
   * @param {Array} wallets - Array of wallet objects with publicKey and privateKey
   * @param {Array} targetTokens - Array of target tokens to like
   * @param {Object} delays - Delay configuration
   * @returns {Promise<Object>} - Results of the batch like operation
   */
  async batchLike(wallets, targetTokens, delays = { wallet: { min: 50, max: 100 }, like: { fixed: 100 } }) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      details: []
    };

    console.log('\n=== Starting Batch Like Operation ===');
    console.log(`Wallets: ${wallets.length}`);
    console.log(`Target Tokens: ${targetTokens.join(', ')}`);

    // Process each wallet
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      console.log(`\n=== Processing Wallet ${i + 1}/${wallets.length} ===`);
      console.log(`Public Key: ${wallet.publicKey}`);

      try {
        // Use the more flexible createKeypairFromPrivateKey function that handles both base58 and base64 formats
        const keypair = require('./auth').createKeypairFromPrivateKey(wallet.privateKey);
        
        // Process each target token - 直接对每个token进行点赞，不需要先获取项目列表
        for (const targetToken of targetTokens) {
          try {
            console.log(`\n=== Liking Token: ${targetToken} with Wallet: ${wallet.publicKey} ===`);
            
            // 直接调用点赞接口，使用token ID作为项目ID，现在参数名是 project_id
            const likeResult = await this.likeProject(keypair, targetToken);
            
            results.details.push({
              wallet: wallet.publicKey,
              token: targetToken,
              success: true,
              result: likeResult
            });
            
            results.success++;
            console.log(`Successfully liked token ${targetToken} with wallet ${wallet.publicKey}`);
            
            // Add delay between likes
            const likeDelay = delays.like.fixed || this.getRandomDelay(delays.like.min, delays.like.max);
            console.log(`Waiting ${likeDelay}ms before next like...`);
            await this.sleep(likeDelay);
          } catch (error) {
            console.error(`Failed to like token ${targetToken} with wallet ${wallet.publicKey}:`, error.message);
            
            results.details.push({
              wallet: wallet.publicKey,
              token: targetToken,
              success: false,
              error: error.message
            });
            
            results.failed++;
            results.errors.push(error.message);
          }
        }
      } catch (error) {
        console.error(`Failed to process wallet ${wallet.publicKey}:`, error.message);
        results.failed++;
        results.errors.push(error.message);
      }
      
      // Add delay between wallets (except for the last wallet)
      if (i < wallets.length - 1) {
        const walletDelay = this.getRandomDelay(delays.wallet.min, delays.wallet.max);
        console.log(`Waiting ${walletDelay}ms before next wallet...`);
        await this.sleep(walletDelay);
      }
    }
    
    console.log('\n=== Batch Like Operation Complete ===');
    console.log(`Success: ${results.success}`);
    console.log(`Failed: ${results.failed}`);
    
    return results;
  }
}

module.exports = new LikeService();
