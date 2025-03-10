/**
 * Projects management functionality
 */
class ProjectManager {
  constructor() {
    // DOM Elements for projects functionality
    this.projectsContainer = document.getElementById('projectsContainer');
    this.projectsList = document.getElementById('projectsList');
    this.loadProjectsBtn = document.getElementById('loadProjectsBtn');
    this.loadMoreProjectsBtn = document.getElementById('loadMoreProjectsBtn');
    this.loadMoreContainer = document.getElementById('loadMoreContainer');
    this.projectsLoading = document.getElementById('projectsLoading');
    
    // Pagination state
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMoreProjects = true;
    this.allProjects = [];
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners for projects functionality
   */
  initEventListeners() {
    // Load projects
    this.loadProjectsBtn.addEventListener('click', () => this.loadProjects());
    
    // Load more projects
    this.loadMoreProjectsBtn.addEventListener('click', () => this.loadMoreProjects());
    
    // Create and add back to top button
    this.createBackToTopButton();
  }
  
  /**
   * Create a back to top button and add it to the page
   */
  createBackToTopButton() {
    // Create button element
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTopBtn';
    backToTopBtn.innerHTML = '🚀';
    backToTopBtn.title = 'Back to Top';
    
    // Add styles
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '20px';
    backToTopBtn.style.right = '20px';
    backToTopBtn.style.zIndex = '99';
    backToTopBtn.style.fontSize = '24px';
    backToTopBtn.style.width = '50px';
    backToTopBtn.style.height = '50px';
    backToTopBtn.style.borderRadius = '50%';
    backToTopBtn.style.backgroundColor = '#4CAF50';
    backToTopBtn.style.color = 'white';
    backToTopBtn.style.border = 'none';
    backToTopBtn.style.cursor = 'pointer';
    backToTopBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    backToTopBtn.style.display = 'none'; // Hidden by default
    
    // Add hover effect
    backToTopBtn.onmouseover = function() {
      this.style.backgroundColor = '#45a049';
      this.style.transform = 'scale(1.1)';
    };
    backToTopBtn.onmouseout = function() {
      this.style.backgroundColor = '#4CAF50';
      this.style.transform = 'scale(1)';
    };
    
    // Add click event listener
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    // Show button when user scrolls down 300px from the top
    window.addEventListener('scroll', () => {
      if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        backToTopBtn.style.display = 'block';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });
    
    // Add button to the body
    document.body.appendChild(backToTopBtn);
  }
  
  /**
   * Load projects from API
   */
  async loadProjects() {
    this.projectsLoading.style.display = 'block';
    this.loadProjectsBtn.disabled = true;
    this.projectsList.innerHTML = '';
    this.loadMoreContainer.style.display = 'none';
    
    // Reset pagination state
    this.currentPage = 1;
    this.isLoading = true;
    this.hasMoreProjects = true;
    this.allProjects = [];
    
    // Scroll to top when loading new projects
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    try {
      const response = await fetch(`/api/projects/list?page=${this.currentPage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update pagination state
      this.allProjects = data.projects || [];
      this.hasMoreProjects = data.pagination?.hasMore || false;
      this.currentPage++;
      
      // Display projects
      this.displayProjects(this.allProjects, true);
      
      // Show/hide load more button based on pagination
      this.loadMoreContainer.style.display = this.hasMoreProjects ? 'block' : 'none';
    } catch (error) {
      console.error('Error loading projects:', error);
      this.projectsList.innerHTML = `<div class="error-message">Error loading projects: ${error.message}</div>`;
    } finally {
      this.projectsLoading.style.display = 'none';
      this.loadProjectsBtn.disabled = false;
      this.isLoading = false;
    }
  }
  
  /**
   * Load more projects when Load More button is clicked
   */
  async loadMoreProjects() {
    if (this.isLoading || !this.hasMoreProjects) return;
    
    this.loadMoreProjectsBtn.disabled = true;
    
    this.isLoading = true;
    this.projectsLoading.style.display = 'block';
    
    try {
      const response = await fetch(`/api/projects/list?page=${this.currentPage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Get new projects
      const newProjects = data.projects || [];
      
      // Update pagination state
      this.allProjects = [...this.allProjects, ...newProjects];
      this.hasMoreProjects = data.pagination?.hasMore || false;
      this.currentPage++;
      
      // Append new projects to existing list
      if (newProjects.length > 0) {
        this.displayProjects(newProjects, false);
      }
      
      // Update load more button visibility
      this.loadMoreContainer.style.display = this.hasMoreProjects ? 'block' : 'none';
    } catch (error) {
      console.error('Error loading more projects:', error);
      // Don't clear the existing projects on error
    } finally {
      this.projectsLoading.style.display = 'none';
      this.isLoading = false;
      this.loadMoreProjectsBtn.disabled = false;
    }
  }
  
  /**
   * Display projects in UI
   * @param {Array} projects - Array of project objects
   * @param {boolean} clearExisting - Whether to clear existing projects
   */
  displayProjects(projects, clearExisting = true) {
    if (!projects || projects.length === 0) {
      if (clearExisting) {
        this.projectsList.innerHTML = '<div class="no-projects">No projects found</div>';
      }
      return;
    }
    
    if (clearExisting) {
      this.projectsList.innerHTML = '';
    }
    
    projects.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'project-card';
      projectCard.setAttribute('data-id', project.id);
      
      // Format date
      const createdDate = new Date(project.created_at);
      const formattedDate = createdDate.toLocaleDateString();
      
      // Format numbers
      const formatNumber = (num) => {
        // Ensure num is a number and has a valid value
        num = parseFloat(num) || 0;
        
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
          return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
      };
      
      // Format currency
      const formatCurrency = (num) => {
        // Ensure num is a number and has a valid value
        num = parseFloat(num) || 0;
        
        if (num >= 1000000) {
          return '$' + (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
          return '$' + (num / 1000).toFixed(2) + 'K';
        }
        return '$' + num.toFixed(2);
      };
      
      // Determine media content (video or image)
      let mediaContent = '';
      if (project.video) {
        mediaContent = `
          <div class="project-video">
            <video controls>
              <source src="${project.video}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>
        `;
      } else if (project.icon) {
        mediaContent = `
          <div class="project-image">
            <img src="${project.icon}" alt="${project.token_name || 'Project'}" />
          </div>
        `;
      }
      
      projectCard.innerHTML = `
        <div class="project-header">
          <h3 class="project-name">${project.token_name || 'Unnamed Project'}</h3>
          <span class="project-symbol">${project.token_symbol || ''}</span>
        </div>
        
        ${mediaContent}
        
        <div class="project-description">
          <p>${project.about_us || 'No description available'}</p>
        </div>
        
        <div class="project-stats">
          <div class="stat">
            <i class="fas fa-heart"></i>
            <span>${formatNumber(project.like || 0)}</span>
          </div>
          <div class="stat">
            <i class="fas fa-rocket"></i>
            <span>${formatNumber(project.launched_like || 0)}</span>
          </div>
          <div class="stat">
            <i class="fas fa-bookmark"></i>
            <span>${formatNumber(project.collect || 0)}</span>
          </div>
          <div class="stat">
            <i class="fas fa-comment"></i>
            <span>${formatNumber(project.comment || 0)}</span>
          </div>
        </div>
        
        <div class="project-metrics">
          <div class="metric">
            <span class="metric-label">Price:</span>
            <span class="metric-value">${formatCurrency(project.price || 0)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">24h Volume:</span>
            <span class="metric-value">${formatCurrency(project.volume_24h_usd || 0)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Market Cap:</span>
            <span class="metric-value">${formatCurrency(project.market_cap || 0)}</span>
          </div>
        </div>
        
        <div class="project-footer">
          <span class="project-date">Created: ${formattedDate}</span>
          <span class="project-id">ID: ${project.id}</span>
        </div>
        
        <div class="project-token-address">
          <span class="token-address-label">Token Address:</span>
          <span class="token-address-value" title="${project.address || ''}">${project.address ? (String(project.address).length > 12 ? `${String(project.address).substring(0, 8)}...${String(project.address).substring(String(project.address).length - 4)}` : String(project.address)) : 'N/A'}</span>
          <button class="copy-address-btn" data-address="${project.address || ''}" title="Copy Address" ${!project.address ? 'disabled' : ''}>
            <i class="fas fa-copy"></i>
          </button>
        </div>
        
        <div class="project-actions">
          <button class="add-to-targets-btn" data-id="${project.id}" data-symbol="${project.token_symbol || ''}">
            Add to Like
          </button>
          <button class="add-to-buy-targets-btn" data-id="${project.id}" data-address="${project.address || ''}" data-symbol="${project.token_symbol || ''}">
            Add to Buy
          </button>
        </div>
      `;
      
      this.projectsList.appendChild(projectCard);
    });
    
    // Add event listeners for project actions
    this.addProjectActionListeners();
  }
  
  /**
   * Add event listeners for project actions
   */
  addProjectActionListeners() {
    // Add to targets buttons
    document.querySelectorAll('.add-to-targets-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const projectId = e.currentTarget.getAttribute('data-id');
        const projectSymbol = e.currentTarget.getAttribute('data-symbol');
        this.addToTargets(projectId, projectSymbol);
      });
    });
    
    // Add to buy targets buttons
    document.querySelectorAll('.add-to-buy-targets-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const projectId = e.currentTarget.getAttribute('data-id');
        const projectSymbol = e.currentTarget.getAttribute('data-symbol');
        const tokenAddress = e.currentTarget.getAttribute('data-address');
        console.log('Adding to buy targets:', { projectId, projectSymbol, tokenAddress });
        this.addToBuyTargets(projectId, projectSymbol, tokenAddress);
      });
    });
    
    // Copy token address buttons
    document.querySelectorAll('.copy-address-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const address = e.currentTarget.getAttribute('data-address');
        this.copyToClipboard(address, e.currentTarget);
      });
    });
  }
  
  /**
   * Like a project
   * @param {string} projectId - ID of the project to like
   */
  async likeProject(projectId) {
    if (!window.walletManager || window.walletManager.getSelectedWallets().length === 0) {
      alert('Please select at least one wallet to like this project');
      return;
    }
    
    // Switch to like tab
    document.querySelector('.tab-btn[data-tab="like-tab"]').click();
    
    // Update target tokens input
    const targetTokensInput = document.getElementById('targetTokens');
    targetTokensInput.value = projectId;
    
    // Notify user
    alert(`Project ID ${projectId} has been added to the target tokens. You can now start batch liking.`);
  }
  
  /**
   * Add project to like targets
   * @param {string} projectId - ID of the project to add
   * @param {string} projectSymbol - Symbol of the project to add
   */
  addToTargets(projectId, projectSymbol) {
    const targetTokensInput = document.getElementById('targetTokens');
    const currentTargets = targetTokensInput.value.split(',').map(t => t.trim()).filter(t => t);
    
    if (!currentTargets.includes(projectId)) {
      currentTargets.push(projectId);
      targetTokensInput.value = currentTargets.join(', ');
      
      // Notify user
      alert(`Project ${projectSymbol || projectId} has been added to like.`);
    } else {
      alert(`Project ${projectSymbol || projectId} is already in like targets.`);
    }
  }
  
  /**
   * Add project to buy targets
   * @param {string} projectId - ID of the project to add
   * @param {string} projectSymbol - Symbol of the project to add
   * @param {string} tokenAddress - Token address of the project
   */
  addToBuyTargets(projectId, projectSymbol, tokenAddress) {
    // Switch to buy tab
    document.querySelector('.tab-btn[data-tab="buy-tab"]').click();
    
    const buyTargetTokensInput = document.getElementById('buyTargetTokens');
    const currentTargets = buyTargetTokensInput.value.split(',').map(t => t.trim()).filter(t => t);
    
    // Use token address for buy targets if available, otherwise fall back to ID
    const targetValue = tokenAddress || projectId;
    
    if (!currentTargets.includes(targetValue)) {
      currentTargets.push(targetValue);
      buyTargetTokensInput.value = currentTargets.join(', ');
      
      // Notify user
      alert(`Project ${projectSymbol || projectId} has been added to buy.`);
    } else {
      alert(`Project ${projectSymbol || projectId} is already in buy targets.`);
    }
  }
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @param {HTMLElement} button - Button element that was clicked
   */
  copyToClipboard(text, button) {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('copied');
        
        // Reset after 2 seconds
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.classList.remove('copied');
        }, 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy to clipboard');
      });
  }
}

// Initialize project manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.projectManager = new ProjectManager();
});
