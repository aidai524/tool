/**
 * Main application functionality
 */
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Connect wallet manager to like manager
  if (window.walletManager && window.likeManager) {
    // Set up event listener for wallet selection changes
    document.getElementById('useLikeBtn').addEventListener('click', () => {
      const selectedWallets = window.walletManager.getSelectedWallets();
      window.likeManager.updateSelectedWallets(selectedWallets);
      
      // Also update buy manager if it exists
      if (window.buyManager) {
        window.buyManager.updateSelectedWallets(selectedWallets);
      }
      
      // Switch to like tab
      document.querySelector('.tab-btn[data-tab="like-tab"]').click();
    });
  }
  
  // Initialize components
  console.log('Application initialized');
});
