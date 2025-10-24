const express = require('express');
const coordinatesRoutes = require('./coordinates');
const { generalRateLimit } = require('../middleware');

const router = express.Router();

/**
 * GET /api/
 * Endpoint principale dell'API
 */
router.get('/', generalRateLimit, (req, res) => {
  res.json({
    name: 'API Coordinate Comuni della Provincia di Rieti',
    version: '1.0.0',
    description: 'API REST per ottenere le coordinate geografiche dei Comuni della Provincia di Rieti',
    author: 'API Coordinate Team',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/': 'Informazioni sull\'API',
      'GET /api/health': 'Status dell\'API',
      'GET /api/coordinates/': 'Documentazione degli endpoint coordinate',
      'GET /api/coordinates/search': 'Cerca coordinate per nome comune',
      'GET /api/coordinates/{city}': 'Ottieni coordinate di un comune',
      'GET /api/coordinates/reverse': 'Reverse geocoding',
      'GET /api/coordinates/suggestions': 'Suggerimenti per nomi di comuni'
    },
    documentation: {
      baseUrl: `${req.protocol}://${req.get('host')}`,
      contentType: 'application/json',
      cors: 'Abilitato per tutti i domini',
      rateLimit: {
        general: '1000 richieste per 15 minuti',
        search: '30 richieste per minuto'
      }
    },
    examples: [
      {
        name: 'Cerca Roma',
        url: '/api/coordinates/search?q=Roma',
        description: 'Trova le coordinate di Roma'
      },
      {
        name: 'Coordinate Milano',
        url: '/api/coordinates/Milano',
        description: 'Ottieni direttamente le coordinate di Milano'
      },
      {
        name: 'Reverse geocoding',
        url: '/api/coordinates/reverse?lat=41.9028&lng=12.4964',
        description: 'Trova la località dalle coordinate di Roma'
      },
      {
        name: 'Suggerimenti',
        url: '/api/coordinates/suggestions?q=Rom&limit=5',
        description: 'Ottieni suggerimenti per comuni che iniziano con "Rom"'
      }
    ]
  });
});

/**
 * GET /api/health
 * Endpoint per il controllo di salute
 */
router.get('/health', (req, res) => {
  const uptime = process.uptime();
  const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8);

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptimeFormatted,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    node: process.version,
    pid: process.pid
  });
});

// Monta le rotte per le coordinate
router.use('/coordinates', coordinatesRoutes);

module.exports = router;