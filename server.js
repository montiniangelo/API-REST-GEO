#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const apiRoutes = require('./src/routes');
const {
  requestLogger,
  errorHandler,
  notFoundHandler,
  generalRateLimit,
  securityHeaders,
  shouldCompress
} = require('./src/middleware');

// Configurazione del server
const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware di sicurezza e ottimizzazione
app.use(helmet({
  contentSecurityPolicy: false, // Disabilita CSP per API
  crossOriginEmbedderPolicy: false
}));

// Compressione delle risposte
app.use(compression({ filter: shouldCompress }));

// CORS
app.use(cors({
  origin: NODE_ENV === 'production' ? 
    [
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ] : 
    true, // In sviluppo accetta qualsiasi origine
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// Parsing del body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware personalizzati
app.use(requestLogger);
app.use(securityHeaders);
app.use(generalRateLimit);

// Endpoint root
app.get('/', (req, res) => {
  res.json({
    message: 'API Coordinate Comuni Italiani',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    apiEndpoint: '/api/',
    documentation: '/api/',
    health: '/api/health',
    examples: {
      search: '/api/coordinates/search?q=Roma',
      direct: '/api/coordinates/Milano',
      reverse: '/api/coordinates/reverse?lat=41.9028&lng=12.4964',
      suggestions: '/api/coordinates/suggestions?q=Rom'
    }
  });
});

// Monta le rotte API
app.use('/api', apiRoutes);

// Middleware per gestire rotte non trovate
app.use(notFoundHandler);

// Middleware per gestire gli errori
app.use(errorHandler);

// Avvio del server
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 Server API Coordinate avviato!');
  console.log(`📍 Host: ${HOST}`);
  console.log(`🔌 Porta: ${PORT}`);
  console.log(`🌐 URL: http://${HOST}:${PORT}`);
  console.log(`📖 API: http://${HOST}:${PORT}/api/`);
  console.log(`❤️  Health: http://${HOST}:${PORT}/api/health`);
  console.log(`🔧 Ambiente: ${NODE_ENV}`);
  console.log('');
  console.log('Esempi di utilizzo:');
  console.log(`  Cerca Roma: http://${HOST}:${PORT}/api/coordinates/search?q=Roma`);
  console.log(`  Milano: http://${HOST}:${PORT}/api/coordinates/Milano`);
  console.log(`  Reverse: http://${HOST}:${PORT}/api/coordinates/reverse?lat=41.9028&lng=12.4964`);
  console.log('');
  console.log('Premi Ctrl+C per fermare il server');
});

// Gestione del shutdown graceful
const gracefulShutdown = (signal) => {
  console.log(`\\n⏹️  Ricevuto segnale ${signal}, arresto del server in corso...`);
  
  server.close((err) => {
    console.log('🔌 Server HTTP chiuso');
    
    if (err) {
      console.error('❌ Errore durante la chiusura:', err);
      process.exit(1);
    }
    
    console.log('✅ Server arrestato con successo');
    process.exit(0);
  });
  
  // Forza l'uscita dopo 10 secondi
  setTimeout(() => {
    console.error('⚠️  Forzata chiusura del server dopo 10 secondi');
    process.exit(1);
  }, 10000);
};

// Gestori di segnali per shutdown graceful
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestione degli errori non catturati
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;