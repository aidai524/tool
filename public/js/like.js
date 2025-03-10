/**
 * Like management functionality
 */
class LikeManager {
  constructor() {
    // DOM Elements for like functionality
    this.targetTokensInput = document.getElementById('targetTokens');
    this.walletMinDelayInput = document.getElementById('walletMinDelay');
    this.walletMaxDelayInput = document.getElementById('walletMaxDelay');
    this.likeDelayInput = document.getElementById('likeDelay');
    this.selectedWalletCount = document.getElementById('selectedWalletCount');
    this.selectedWalletsList = document.getElementById('selectedWalletsList');
    this.startLikeBtn = document.getElementById('startLikeBtn');
    this.likeResultsContainer = document.getElementById('likeResultsContainer');
    this.likeProgress = document.getElementById('likeProgress');
    this.likeSuccessCount = document.getElementById('likeSuccessCount');
    this.likeFailedCount = document.getElementById('likeFailedCount');
    this.likeLog = document.getElementById('likeLog');
    
    // Store selected wallets
    this.selectedWallets = [];
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners for like functionality
   */
  initEventListeners() {
    // Start batch liking
    this.startLikeBtn.addEventListener('click', () => this.startBatchLiking());
  }
  
  /**
   * Update selected wallets list
   * @param {Array} wallets - Array of wallet objects
   */
  updateSelectedWallets(wallets) {
    this.selectedWallets = wallets;
    this.selectedWalletCount.textContent = wallets.length;
    
    // Update UI
    this.renderSelectedWallets();
    
    // Enable/disable start button
    this.startLikeBtn.disabled = wallets.length === 0;
  }
  
  /**
   * Render selected wallets in UI
   */
  renderSelectedWallets() {
    this.selectedWalletsList.innerHTML = '';
    
    this.selectedWallets.forEach((wallet, index) => {
      const li = document.createElement('li');
      
      li.innerHTML = `
        <span>${wallet.publicKey.substring(0, 10)}...${wallet.publicKey.substring(wallet.publicKey.length - 5)}</span>
        <button class="remove-wallet-btn" data-index="${index}">✕</button>
      `;
      
      this.selectedWalletsList.appendChild(li);
    });
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-wallet-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        this.removeWallet(index);
      });
    });
  }
  
  /**
   * Remove wallet from selected list
   * @param {number} index - Index of wallet to remove
   */
  removeWallet(index) {
    this.selectedWallets.splice(index, 1);
    this.updateSelectedWallets(this.selectedWallets);
  }
  
  /**
   * Start batch liking process
   */
  async startBatchLiking() {
    if (this.selectedWallets.length === 0) {
      alert('Please select at least one wallet to use for liking');
      return;
    }
    
    const targetTokens = this.targetTokensInput.value
      .split(',')
      .map(token => token.trim())
      .filter(token => token);
    
    if (targetTokens.length === 0) {
      alert('Please enter at least one target token');
      return;
    }
    
    // Get delay settings
    const delays = {
      wallet: {
        min: parseInt(this.walletMinDelayInput.value) || 50,
        max: parseInt(this.walletMaxDelayInput.value) || 100
      },
      like: {
        fixed: parseInt(this.likeDelayInput.value) || 100
      }
    };
    
    // Validate delay settings
    if (delays.wallet.min <= 0 || delays.wallet.max <= 0 || delays.like.fixed <= 0) {
      alert('Delay values must be greater than 0');
      return;
    }
    
    if (delays.wallet.min > delays.wallet.max) {
      alert('Wallet min delay cannot be greater than max delay');
      return;
    }
    
    // Disable start button
    this.startLikeBtn.disabled = true;
    this.startLikeBtn.textContent = 'Liking in progress...';
    
    // Reset results
    this.likeResultsContainer.style.display = 'block';
    this.likeProgress.style.width = '0%';
    this.likeSuccessCount.textContent = '0';
    this.likeFailedCount.textContent = '0';
    this.likeLog.innerHTML = '';
    
    // Add initial log entry
    this.addLogEntry('Starting batch liking process...', 'info');
    this.addLogEntry(`Selected ${this.selectedWallets.length} wallets`, 'info');
    this.addLogEntry(`Target tokens: ${targetTokens.join(', ')}`, 'info');
    
    try {
      // Start batch liking
      const response = await fetch('/api/like-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallets: this.selectedWallets,
          targetTokens,
          delays
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update results
      this.updateLikeResults(data.results);
      
      // Add final log entry
      this.addLogEntry('Batch liking process completed', 'info');
    } catch (error) {
      this.addLogEntry(`Error: ${error.message}`, 'error');
      alert(`Error during batch liking: ${error.message}`);
    } finally {
      // Re-enable start button
      this.startLikeBtn.disabled = false;
      this.startLikeBtn.textContent = 'Start Batch Liking';
    }
  }
  
  /**
   * Update like results in UI
   * @param {Object} results - Results from batch liking
   */
  updateLikeResults(results) {
    // Update counts
    this.likeSuccessCount.textContent = results.success;
    this.likeFailedCount.textContent = results.failed;
    
    // Update progress bar
    const total = results.success + results.failed;
    const progressPercentage = total > 0 ? (results.success / total) * 100 : 0;
    this.likeProgress.style.width = `${progressPercentage}%`;
    
    // Add log entries for errors
    if (results.errors && results.errors.length > 0) {
      this.addLogEntry('Errors encountered:', 'error');
      results.errors.forEach(error => {
        this.addLogEntry(`- ${error}`, 'error');
      });
    }
    
    // Add log entries for details
    if (results.details && results.details.length > 0) {
      this.addLogEntry('Operation details:', 'info');
      results.details.forEach(detail => {
        const logType = detail.success ? 'success' : 'error';
        const message = `Wallet ${detail.wallet.substring(0, 10)}... ${detail.success ? 'successfully liked' : 'failed to like'} project ${detail.project}`;
        this.addLogEntry(message, logType);
      });
    }
  }
  
  /**
   * Add entry to like log
   * @param {string} message - Log message
   * @param {string} type - Log type (info, success, error)
   */
  addLogEntry(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = message;
    
    this.likeLog.appendChild(entry);
    
    // Scroll to bottom
    this.likeLog.scrollTop = this.likeLog.scrollHeight;
  }
}

// Initialize like manager
window.likeManager = new LikeManager();
