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
    
    // Show loading indicator
    const importStatus = document.createElement('div');
    importStatus.id = 'importStatus';
    importStatus.style.marginTop = '10px';
    importStatus.style.padding = '10px';
    importStatus.style.backgroundColor = '#f8f9fa';
    importStatus.style.borderRadius = '4px';
    importStatus.innerHTML = '<p>Importing wallets... Please wait.</p>';
    
    const importStatusContainer = document.querySelector('#importSection');
    if (importStatusContainer) {
      importStatusContainer.appendChild(importStatus);
    }
    
    reader.onload = async (event) => {
      try {
        console.log('File loaded, parsing JSON...');
        let importedData;
        
        try {
          importedData = JSON.parse(event.target.result);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Invalid JSON format: ${parseError.message}`);
        }
        
        // Log the structure of the imported data (without exposing private keys)
        console.log('Imported data structure:', JSON.stringify({
          hasWallets: !!importedData.wallets,
          isWalletsArray: Array.isArray(importedData.wallets),
          walletsCount: importedData.wallets ? importedData.wallets.length : 0
        }));
        
        // Check if the data has the expected format
        if (!importedData.wallets || !Array.isArray(importedData.wallets)) {
          throw new Error('Invalid wallet data format: The file must contain a "wallets" array');
        }
        
        if (importedData.wallets.length === 0) {
          throw new Error('The wallet file contains an empty wallets array');
        }
        
        // Validate that wallets have the required fields
        const sampleWallet = importedData.wallets[0];
        if (!sampleWallet.publicKey || !sampleWallet.privateKey) {
          console.error('Invalid wallet format:', JSON.stringify({
            hasPublicKey: !!sampleWallet.publicKey,
            hasPrivateKey: !!sampleWallet.privateKey
          }));
          throw new Error('Invalid wallet format: Each wallet must have publicKey and privateKey fields');
        }
        
        // Update status
        importStatus.innerHTML = `<p>Validating ${importedData.wallets.length} wallets...</p>`;
        
        console.log(`Sending ${importedData.wallets.length} wallets to server for validation...`);
        const response = await fetch('/api/import-wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ wallets: importedData.wallets })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response error:', response.status, errorText);
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Server response:', JSON.stringify({
          success: data.success,
          imported: data.imported,
          invalid: data.invalid
        }));
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Check if we have any valid wallets
        if (!data.wallets || !Array.isArray(data.wallets) || data.wallets.length === 0) {
          throw new Error('No valid wallets found in the imported file');
        }
        
        // Append imported wallets to existing ones
        const newWallets = data.wallets.filter(importedWallet => {
          // Avoid duplicates by checking if the public key already exists
          return !this.wallets.some(existingWallet => 
            existingWallet.publicKey === importedWallet.publicKey
          );
        });
        
        console.log(`Adding ${newWallets.length} new wallets (excluding ${data.wallets.length - newWallets.length} duplicates)`);
        
        // Add new wallets to the existing collection
        this.wallets = [...this.wallets, ...newWallets];
        this.displayWallets();
        
        // Save to local storage
        this.saveWalletsToStorage();
        
        this.walletsContainer.style.display = 'block';
        this.walletCountDisplay.textContent = `(${this.wallets.length})`;
        
        // Show success message with details
        let successMessage = `Successfully imported ${newWallets.length} wallets`;
        if (data.invalid > 0) {
          successMessage += ` (${data.invalid} invalid wallets were skipped)`;
        }
        if (data.wallets.length - newWallets.length > 0) {
          successMessage += ` (${data.wallets.length - newWallets.length} duplicate wallets were skipped)`;
        }
        
        // Remove the status indicator
        if (importStatus.parentNode) {
          importStatus.parentNode.removeChild(importStatus);
        }
        
        alert(successMessage);
      } catch (error) {
        console.error('Import error:', error);
        
        // Update status to show error
        if (importStatus.parentNode) {
          importStatus.style.backgroundColor = '#f8d7da';
          importStatus.style.color = '#721c24';
          importStatus.innerHTML = `<p>Error: ${error.message}</p>`;
          
          // Remove the error message after 10 seconds
          setTimeout(() => {
            if (importStatus.parentNode) {
              importStatus.parentNode.removeChild(importStatus);
            }
          }, 10000);
        } else {
          alert(`Error importing wallets: ${error.message}`);
        }
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader error');
      if (importStatus.parentNode) {
        importStatus.parentNode.removeChild(importStatus);
      }
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
    const totalWallets = refreshButtons.length;
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Determine if we're in production (Vercel) or local environment
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
      
      // Use longer delay in production to avoid rate limiting
      const delayBetweenRequests = isProduction ? 1000 : 300; // 1 second in production, 300ms locally
      
      for (let i = 0; i < refreshButtons.length; i++) {
        const button = refreshButtons[i];
        const index = parseInt(button.getAttribute('data-index'));
        const wallet = this.wallets[index];
        const balanceCell = button.parentElement.previousElementSibling;
        
        try {
          // Add a delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
          }
          
          // Update progress in refresh button
          this.refreshAllBtn.textContent = `Refreshing ${i+1}/${totalWallets}...`;
          
          // Instead of calling refreshWalletBalance which has its own UI updates,
          // we'll implement the core functionality here to avoid UI conflicts
          
          // Show loading indicator
          balanceCell.textContent = 'Loading...';
          
          // Determine API URL based on environment
          const apiUrl = isProduction
            ? `${window.location.origin}/api/wallet-balance/${wallet.publicKey}`
            : `/api/wallet-balance/${wallet.publicKey}`;
          
          // Call API to get updated balance
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Update wallet balance
          wallet.balance = data.balance;
          
          // Update display
          balanceCell.textContent = `${wallet.balance.toFixed(6)} SOL`;
          successCount++;
          
        } catch (error) {
          console.error(`Error refreshing wallet ${index}:`, error);
          balanceCell.textContent = 'Error';
          errorCount++;
          
          // Continue with next wallet despite errors
          continue;
        }
      }
      
      // Save updated wallets to storage after all are processed
      this.saveWalletsToStorage();
      
      // Show summary
      if (errorCount > 0) {
        alert(`Refresh complete: ${successCount} succeeded, ${errorCount} failed`);
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
