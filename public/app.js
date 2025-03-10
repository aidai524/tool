document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const generateBtn = document.getElementById('generateBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const downloadBtn = document.getElementById('downloadBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const clearBtn = document.getElementById('clearBtn');
  const walletsContainer = document.getElementById('walletsContainer');
  const walletsTableBody = document.getElementById('walletsTableBody');
  const walletCountInput = document.getElementById('walletCount');
  const walletCountDisplay = document.getElementById('walletCountDisplay');
  
  // Store wallets in memory
  let wallets = [];
  
  // Generate wallets
  generateBtn.addEventListener('click', async () => {
    const count = walletCountInput.value;
    
    if (count <= 0 || count > 100) {
      alert('Please enter a number between 1 and 100');
      return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
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
      
      wallets = data.wallets;
      displayWallets();
      
      walletsContainer.style.display = 'block';
      walletCountDisplay.textContent = `(${wallets.length})`;
    } catch (error) {
      alert(`Error generating wallets: ${error.message}`);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Wallets';
    }
  });
  
  // Import wallets
  importBtn.addEventListener('click', () => {
    if (!importFile.files.length) {
      alert('Please select a file to import');
      return;
    }
    
    const file = importFile.files[0];
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
        
        wallets = data.wallets;
        displayWallets();
        
        walletsContainer.style.display = 'block';
        walletCountDisplay.textContent = `(${wallets.length})`;
        
        alert(`Successfully imported ${data.imported} wallets`);
      } catch (error) {
        alert(`Error importing wallets: ${error.message}`);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file');
    };
    
    reader.readAsText(file);
  });
  
  // Download wallets as JSON
  downloadBtn.addEventListener('click', () => {
    if (wallets.length === 0) {
      alert('No wallets to download');
      return;
    }
    
    const dataStr = JSON.stringify({ wallets }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `solana-wallets-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  });
  
  // Copy all wallets to clipboard
  copyAllBtn.addEventListener('click', () => {
    if (wallets.length === 0) {
      alert('No wallets to copy');
      return;
    }
    
    const walletsText = wallets.map((wallet, index) => 
      `Wallet ${index + 1}:\nPublic Key: ${wallet.publicKey}\nPrivate Key: ${wallet.privateKey}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(walletsText)
      .then(() => {
        alert('All wallets copied to clipboard');
      })
      .catch(err => {
        alert('Failed to copy wallets to clipboard');
        console.error('Copy failed:', err);
      });
  });
  
  // Clear wallets
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all wallets?')) {
      wallets = [];
      walletsTableBody.innerHTML = '';
      walletsContainer.style.display = 'none';
    }
  });
  
  // Display wallets in table
  function displayWallets() {
    walletsTableBody.innerHTML = '';
    
    wallets.forEach((wallet, index) => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td class="key-cell">${wallet.publicKey}</td>
        <td class="key-cell">${wallet.privateKey}</td>
        <td>
          <button class="copy-btn" data-key="public" data-index="${index}">Copy Public</button>
          <button class="copy-btn" data-key="private" data-index="${index}">Copy Private</button>
        </td>
      `;
      
      walletsTableBody.appendChild(row);
    });
    
    // Add event listeners for copy buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        const keyType = e.target.getAttribute('data-key');
        const keyValue = keyType === 'public' ? wallets[index].publicKey : wallets[index].privateKey;
        
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
  }
});
