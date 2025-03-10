/**
 * Wallet management functionality
 */
class WalletManager {
  constructor() {
    // DOM Elements for wallet generation
    this.generateBtn = document.getElementById('generateBtn');
    this.importBtn = document.getElementById('importBtn');
    this.importFile = document.getElementById('importFile');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.copyAllBtn = document.getElementById('copyAllBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.refreshAllBtn = document.getElementById('refreshAllBtn');
    this.useLikeBtn = document.getElementById('useLikeBtn');
    this.useBuyBtn = document.getElementById('useBuyBtn');
    this.walletsContainer = document.getElementById('walletsContainer');
    this.walletsTableBody = document.getElementById('walletsTableBody');
    this.walletCountInput = document.getElementById('walletCount');
    this.walletCountDisplay = document.getElementById('walletCountDisplay');
    this.selectAllWallets = document.getElementById('selectAllWallets');
    
    // Local storage key for wallets
    this.STORAGE_KEY = 'flipn_tool_wallets';
    
    // Store wallets in memory
    this.wallets = [];
    this.selectedWallets = new Set();
    
    // Load wallets from local storage
    this.loadWalletsFromStorage();
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners for wallet functionality
   */
  initEventListeners() {
    // Generate wallets
    this.generateBtn.addEventListener('click', () => this.generateWallets());
    
    // Import wallets
    this.importBtn.addEventListener('click', () => this.importWallets());
    
    // Download wallets
    this.downloadBtn.addEventListener('click', () => this.downloadWallets());
    
    // Copy all wallets
    this.copyAllBtn.addEventListener('click', () => this.copyAllWallets());
    
    // Clear wallets
    this.clearBtn.addEventListener('click', () => this.clearWallets());
    
    // Refresh all balances
    document.getElementById('refreshAllBtn').addEventListener('click', () => this.refreshAllBalances());
    
    // Use for liking
    this.useLikeBtn.addEventListener('click', () => this.useForLiking());
    
    // Use for buying
    this.useBuyBtn.addEventListener('click', () => this.useForBuying());
    
    // Select all wallets
    this.selectAllWallets.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
  }
  
  /**
   * Load wallets from local storage
   */
  loadWalletsFromStorage() {
    try {
      const storedWallets = localStorage.getItem(this.STORAGE_KEY);
      
      if (storedWallets) {
        this.wallets = JSON.parse(storedWallets);
        console.log(`Loaded ${this.wallets.length} wallets from local storage`);
        
        if (this.wallets.length > 0) {
          this.displayWallets();
          this.walletsContainer.style.display = 'block';
          this.walletCountDisplay.textContent = `(${this.wallets.length})`;
        }
      }
    } catch (error) {
      console.error('Error loading wallets from storage:', error);
    }
  }
  
  /**
   * Save wallets to local storage
   */
  saveWalletsToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.wallets));
      console.log(`Saved ${this.wallets.length} wallets to local storage`);
    } catch (error) {
      console.error('Error saving wallets to storage:', error);
    }
  }
  
  /**
   * Generate wallets
   */
  async generateWallets() {
    const count = this.walletCountInput.value;
    
    if (count <= 0 || count > 100) {
      alert('Please enter a number between 1 and 100');
      return;
    }
    
    this.generateBtn.disabled = true;
    this.generateBtn.textContent = 'Generating...';
    
    try {
      const response = await fetch('/api/generate-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Append new wallets to existing ones instead of replacing
      this.wallets = [...this.wallets, ...data.wallets];
      this.displayWallets();
      
      // Save to local storage
      this.saveWalletsToStorage();
      
      this.walletsContainer.style.display = 'block';
      this.walletCountDisplay.textContent = `(${this.wallets.length})`;
    } catch (error) {
      alert(`Error generating wallets: ${error.message}`);
    } finally {
      this.generateBtn.disabled = false;
      this.generateBtn.textContent = 'Generate Wallets';
    }
  }
  
  /**
   * Import wallets from file
   */
  importWallets() {
    if (!this.importFile.files.length) {
      alert('Please select a file to import');
      return;
    }
    
    const file = this.importFile.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (!importedData.wallets || !Array.isArray(importedData.wallets)) {
          throw new Error('Invalid wallet data format');
        }
        
        const response = await fetch('/api/import-wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ wallets: importedData.wallets })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Append imported wallets to existing ones
        this.wallets = [...this.wallets, ...data.wallets];
        this.displayWallets();
        
        // Save to local storage
        this.saveWalletsToStorage();
        
        this.walletsContainer.style.display = 'block';
        this.walletCountDisplay.textContent = `(${this.wallets.length})`;
        
        alert(`Successfully imported ${data.imported} wallets`);
      } catch (error) {
        alert(`Error importing wallets: ${error.message}`);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file');
    };
    
    reader.readAsText(file);
  }
  
  /**
   * Download wallets as JSON
   */
  downloadWallets() {
    if (this.wallets.length === 0) {
      alert('No wallets to download');
      return;
    }
    
    const dataStr = JSON.stringify({ wallets: this.wallets }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `solana-wallets-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  }
  
  /**
   * Copy all wallets to clipboard
   */
  copyAllWallets() {
    if (this.wallets.length === 0) {
      alert('No wallets to copy');
      return;
    }
    
    const walletsText = this.wallets.map((wallet, index) => 
      `Wallet ${index + 1}:\nPublic Key: ${wallet.publicKey}\nBalance: ${typeof wallet.balance === 'number' ? wallet.balance.toFixed(6) : '0.000000'} SOL`
    ).join('\n\n');
    
    navigator.clipboard.writeText(walletsText)
      .then(() => {
        alert('All wallets copied to clipboard');
      })
      .catch(err => {
        alert('Failed to copy wallets to clipboard');
        console.error('Copy failed:', err);
      });
  }
  
  /**
   * Clear all wallets
   */
  clearWallets() {
    if (confirm('Are you sure you want to clear all wallets?')) {
      this.wallets = [];
      this.selectedWallets.clear();
      this.walletsTableBody.innerHTML = '';
      this.walletsContainer.style.display = 'none';
      
      // Clear from local storage
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Update like tab
      if (window.likeManager) {
        window.likeManager.updateSelectedWallets([]);
      }
    }
  }
  
  /**
   * Use selected wallets for liking and buying
   */
  useForLiking() {
    if (this.selectedWallets.size === 0) {
      alert('Please select at least one wallet to use for liking');
      return;
    }
    
    const selectedWalletsList = Array.from(this.selectedWallets).map(index => this.wallets[index]);
    
    // Switch to like tab
    document.querySelector('.tab-btn[data-tab="like-tab"]').click();
    
    // Update like tab with selected wallets
    if (window.likeManager) {
      window.likeManager.updateSelectedWallets(selectedWalletsList);
    }
  }
  
  /**
   * Use selected wallets for buying
   */
  useForBuying() {
    if (this.selectedWallets.size === 0) {
      alert('Please select at least one wallet to use for buying');
      return;
    }
    
    const selectedWalletsList = Array.from(this.selectedWallets).map(index => this.wallets[index]);
    
    // Switch to buy tab
    document.querySelector('.tab-btn[data-tab="buy-tab"]').click();
    
    // Update buy tab with selected wallets
    if (window.buyManager) {
      window.buyManager.updateSelectedWallets(selectedWalletsList);
    }
  }
  
  /**
   * Toggle select all wallets
   * @param {boolean} checked - Whether to select or deselect all
   */
  toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll('.wallet-checkbox');
    
    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = checked;
      
      if (checked) {
        this.selectedWallets.add(index);
      } else {
        this.selectedWallets.delete(index);
      }
    });
  }
  
  /**
   * Toggle wallet selection
   * @param {number} index - Index of the wallet to toggle
   * @param {boolean} checked - Whether to select or deselect
   */
  toggleWalletSelection(index, checked) {
    if (checked) {
      this.selectedWallets.add(index);
    } else {
      this.selectedWallets.delete(index);
    }
    
    // Update select all checkbox
    this.updateSelectAllCheckbox();
  }
  
  /**
   * Update select all checkbox based on individual selections
   */
  updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('.wallet-checkbox');
    const allChecked = this.selectedWallets.size === checkboxes.length;
    
    this.selectAllWallets.checked = allChecked;
  }
  
  /**
   * Display wallets in table
   */
  displayWallets() {
    this.walletsTableBody.innerHTML = '';
    
    this.wallets.forEach((wallet, index) => {
      const row = document.createElement('tr');
      
      // Format balance with 6 decimal places
      const balance = typeof wallet.balance === 'number' ? wallet.balance.toFixed(6) : '0.000000';
      
      row.innerHTML = `
        <td><input type="checkbox" class="wallet-checkbox" data-index="${index}"></td>
        <td>${index + 1}</td>
        <td class="key-cell">${wallet.publicKey}</td>
        <td class="balance-cell">${balance} SOL</td>
        <td>
          <button class="copy-btn" data-key="public" data-index="${index}">Copy Public</button>
          <button class="refresh-balance-btn" data-index="${index}">↻ Refresh</button>
        </td>
      `;
      
      this.walletsTableBody.appendChild(row);
    });
    
    // Add event listeners for copy buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        const keyType = e.target.getAttribute('data-key');
        const keyValue = this.wallets[index].publicKey;
        
        navigator.clipboard.writeText(keyValue)
          .then(() => {
            const originalText = e.target.textContent;
            e.target.textContent = 'Copied!';
            setTimeout(() => {
              e.target.textContent = originalText;
            }, 1000);
          })
          .catch(err => {
            alert('Failed to copy to clipboard');
            console.error('Copy failed:', err);
          });
      });
    });
    
    // Add event listeners for refresh balance buttons
    document.querySelectorAll('.refresh-balance-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        await this.refreshWalletBalance(index);
      });
    });
    
    // Add event listeners for checkboxes
    document.querySelectorAll('.wallet-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        this.toggleWalletSelection(index, e.target.checked);
      });
    });
  }
  
  /**
   * Get all wallets
   * @returns {Array} - Array of wallet objects
   */
  getAllWallets() {
    return this.wallets;
  }
  
  /**
   * Get selected wallets
   * @returns {Array} - Array of selected wallet objects
   */
  getSelectedWallets() {
    return Array.from(this.selectedWallets).map(index => this.wallets[index]);
  }
  
  /**
   * Refresh wallet balance
   * @param {number} index - Index of the wallet to refresh
   */
  async refreshWalletBalance(index) {
    if (index < 0 || index >= this.wallets.length) {
      console.error('Invalid wallet index');
      return;
    }
    
    const wallet = this.wallets[index];
    const button = document.querySelector(`.refresh-balance-btn[data-index="${index}"]`);
    const balanceCell = button.parentElement.previousElementSibling;
    
    // Show loading indicator
    const originalText = button.textContent;
    button.textContent = '⟳';
    button.disabled = true;
    balanceCell.textContent = 'Loading...';
    
    try {
      // Call API to get updated balance
      // Determine if we're in production (Vercel) or local environment
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
      
      // Use appropriate URL format based on environment
      const apiUrl = isProduction
        ? `${window.location.origin}/api/wallet-balance/${wallet.publicKey}`
        : `/api/wallet-balance/${wallet.publicKey}`;
      
      console.log('Fetching wallet balance from:', apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update wallet balance
      wallet.balance = data.balance;
      
      // Update display
      balanceCell.textContent = `${wallet.balance.toFixed(6)} SOL`;
      
      // Save updated wallets to storage
      this.saveWalletsToStorage();
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
      balanceCell.textContent = 'Error';
    } finally {
      // Restore button
      button.textContent = originalText;
      button.disabled = false;
    }
  }
  
  /**
   * Refresh all wallet balances
   */
  async refreshAllBalances() {
    if (this.wallets.length === 0) {
      alert('No wallets to refresh');
      return;
    }
    
    // Disable refresh all button
    this.refreshAllBtn.disabled = true;
    this.refreshAllBtn.textContent = 'Refreshing...';
    
    const refreshButtons = document.querySelectorAll('.refresh-balance-btn');
    
    try {
      for (let i = 0; i < refreshButtons.length; i++) {
        const button = refreshButtons[i];
        const index = parseInt(button.getAttribute('data-index'));
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await this.refreshWalletBalance(index);
      }
    } finally {
      // Re-enable refresh all button
      this.refreshAllBtn.disabled = false;
      this.refreshAllBtn.textContent = 'Refresh All Balances';
    }
  }
}

// Initialize wallet manager
window.walletManager = new WalletManager();
