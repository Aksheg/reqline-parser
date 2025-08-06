const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ENDPOINT_CONFIGS = [
  { path: './endpoints/reqline/' }
];

function loadEndpoints() {
  ENDPOINT_CONFIGS.forEach(config => {
    const endpointPath = path.resolve(__dirname, config.path);
    
    if (fs.existsSync(endpointPath)) {
      const files = fs.readdirSync(endpointPath);
      
      files.forEach(file => {
        if (file.endsWith('.js')) {
          const endpoint = require(path.join(endpointPath, file));
          if (endpoint && typeof endpoint.register === 'function') {
            endpoint.register(app);
          }
        }
      });
    }
  });
}

loadEndpoints();

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Reqline Parser API is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: true,
    message: 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Reqline parser server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
