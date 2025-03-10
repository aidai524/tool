/**
 * Buy management functionality
 */
class BuyManager {
  constructor() {
    // DOM Elements for buy functionality
    this.buyTargetTokensInput = document.getElementById('buyTargetTokens');
    this.solAmountInput = document.getElementById('solAmount');
    this.slippageToleranceInput = document.getElementById('slippageTolerance');
    this.buyWalletMinDelayInput = document.getElementById('buyWalletMinDelay');
    this.buyWalletMaxDelayInput = document.getElementById('buyWalletMaxDelay');
    this.buyDelayInput = document.getElementById('buyDelay');
    this.buySelectedWalletCount = document.getElementById('buySelectedWalletCount');
    this.buySelectedWalletsList = document.getElementById('buySelectedWalletsList');
    this.startBuyBtn = document.getElementById('startBuyBtn');
    this.buyResultsContainer = document.getElementById('buyResultsContainer');
    this.buyProgress = document.getElementById('buyProgress');
    this.buySuccessCount = document.getElementById('buySuccessCount');
    this.buyFailedCount = document.getElementById('buyFailedCount');
    this.buyLog = document.getElementById('buyLog');
    
    // Store selected wallets
    this.selectedWallets = [];
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners for buy functionality
   */
  initEventListeners() {
    // Start batch buying
    this.startBuyBtn.addEventListener('click', () => this.startBatchBuying());
  }
  
  /**
   * Update selected wallets list
   * @param {Array} wallets - Array of wallet objects
   */
  updateSelectedWallets(wallets) {
    this.selectedWallets = wallets;
    this.buySelectedWalletCount.textContent = wallets.length;
    
    // Update UI
    this.renderSelectedWallets();
    
    // Enable/disable start button
    this.startBuyBtn.disabled = wallets.length === 0;
  }
  
  /**
   * Render selected wallets in UI
   */
  renderSelectedWallets() {
    this.buySelectedWalletsList.innerHTML = '';
    
    this.selectedWallets.forEach((wallet, index) => {
      const li = document.createElement('li');
      
      li.innerHTML = `
        <span>${wallet.publicKey.substring(0, 10)}...${wallet.publicKey.substring(wallet.publicKey.length - 5)}</span>
        <button class="remove-wallet-btn" data-index="${index}">✕</button>
      `;
      
      this.buySelectedWalletsList.appendChild(li);
    });
    
    // Add event listeners for remove buttons
    document.querySelectorAll('#buySelectedWalletsList .remove-wallet-btn').forEach(button => {
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
   * Add log entry to the buy log
   * @param {string} message - Log message
   * @param {string} type - Log type (info, success, error)
   */
  addLogEntry(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    this.buyLog.appendChild(logEntry);
    
    // Auto-scroll to bottom
    this.buyLog.scrollTop = this.buyLog.scrollHeight;
  }
  
  /**
   * Start batch buying process
   */
  async startBatchBuying() {
    if (this.selectedWallets.length === 0) {
      alert('Please select at least one wallet to use for buying');
      return;
    }
    
    const targetTokens = this.buyTargetTokensInput.value
      .split(',')
      .map(token => token.trim())
      .filter(token => token);
    
    if (targetTokens.length === 0) {
      alert('Please enter at least one target token');
      return;
    }
    
    // Get purchase settings
    const solAmount = parseFloat(this.solAmountInput.value);
    const slippageTolerance = parseFloat(this.slippageToleranceInput.value);
    
    // Validate purchase settings
    if (isNaN(solAmount) || solAmount <= 0) {
      alert('SOL amount must be greater than 0');
      return;
    }
    
    if (isNaN(slippageTolerance) || slippageTolerance <= 0 || slippageTolerance > 100) {
      alert('Slippage tolerance must be between 0.1 and 100');
      return;
    }
    
    // Get delay settings
    const delays = {
      wallet: {
        min: parseInt(this.buyWalletMinDelayInput.value) || 50,
        max: parseInt(this.buyWalletMaxDelayInput.value) || 100
      },
      buy: {
        fixed: parseInt(this.buyDelayInput.value) || 100
      }
    };
    
    // Validate delay settings
    if (delays.wallet.min <= 0 || delays.wallet.max <= 0 || delays.buy.fixed <= 0) {
      alert('Delay values must be greater than 0');
      return;
    }
    
    if (delays.wallet.min > delays.wallet.max) {
      alert('Wallet min delay cannot be greater than max delay');
      return;
    }
    
    // Disable start button
    this.startBuyBtn.disabled = true;
    this.startBuyBtn.textContent = 'Buying in progress...';
    
    // Reset results
    this.buyResultsContainer.style.display = 'block';
    this.buyProgress.style.width = '0%';
    this.buySuccessCount.textContent = '0';
    this.buyFailedCount.textContent = '0';
    this.buyLog.innerHTML = '';
    
    // Add initial log entry
    this.addLogEntry('Starting batch buying process...', 'info');
    this.addLogEntry(`Selected ${this.selectedWallets.length} wallets`, 'info');
    this.addLogEntry(`Target tokens: ${targetTokens.join(', ')}`, 'info');
    this.addLogEntry(`SOL amount per token: ${solAmount}`, 'info');
    this.addLogEntry(`Slippage tolerance: ${slippageTolerance}%`, 'info');
    
    try {
      // Start batch buying
      const response = await fetch('/api/buy-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallets: this.selectedWallets,
          targetTokens,
          solAmount,
          slippageTolerance,
          delays
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update results
      this.updateBuyResults(data.results);
      
      // Add final log entry
      this.addLogEntry('Batch buying process completed', 'info');
    } catch (error) {
      this.addLogEntry(`Error: ${error.message}`, 'error');
      alert(`Error during batch buying: ${error.message}`);
    } finally {
      // Re-enable start button
      this.startBuyBtn.disabled = false;
      this.startBuyBtn.textContent = 'Start Batch Buying';
    }
  }
  
  /**
   * Update buy results in UI
   * @param {Object} results - Results from batch buying
   */
  updateBuyResults(results) {
    // Update counts
    this.buySuccessCount.textContent = results.success;
    this.buyFailedCount.textContent = results.failed;
    
    // Update progress bar
    const total = results.success + results.failed;
    const progressPercentage = total > 0 ? (results.success / total) * 100 : 0;
    this.buyProgress.style.width = `${progressPercentage}%`;
    
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
        this.addLogEntry(`- ${detail}`, 'info');
      });
    }
  }
}

// Initialize buy manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.buyManager = new BuyManager();
});
