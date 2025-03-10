const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Import API handlers
const generateWalletsHandler = require('./api/generate-wallets');
const validateWalletsHandler = require('./api/validate-wallets');
const importWalletsHandler = require('./api/import-wallets');
const projectsListHandler = require('./api/projects/list');
const projectsHandler = require('./api/projects/index');
const likeProjectsHandler = require('./api/like-projects');
const buyTokensHandler = require('./api/buy-tokens');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// API Routes
app.all('/api/generate-wallets', (req, res) => generateWalletsHandler(req, res));
app.all('/api/validate-wallets', (req, res) => validateWalletsHandler(req, res));
app.all('/api/import-wallets', (req, res) => importWalletsHandler(req, res));
app.all('/api/projects/list', (req, res) => projectsListHandler(req, res));
app.all('/api/projects', (req, res) => projectsHandler(req, res));
app.all('/api/like-projects', (req, res) => likeProjectsHandler(req, res));
app.all('/api/buy-tokens', (req, res) => buyTokensHandler(req, res));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});
