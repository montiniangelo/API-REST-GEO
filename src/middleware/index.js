const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const { ApiError } = require('../models/Coordinate');

/**
 * Middleware per il logging delle richieste
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} => ${res.statusCode} (${duration}ms)`
    );
  });
  
  next();
};

/**
 * Middleware per gestire gli errori
 */
const errorHandler = (error, req, res, next) => {
  console.error('Errore API:', error);

  // Se è un errore personalizzato dell'API
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Errori di validazione di express-validator
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'JSON non valido nel body della richiesta',
      statusCode: 400,
      timestamp: new Date().toISOString()
    });
  }

  // Errore generico del server
  const apiError = new ApiError('Errore interno del server', 500);
  res.status(500).json(apiError.toJSON());
};

/**
 * Middleware per gestire rotte non trovate
 */
const notFoundHandler = (req, res) => {
  const error = new ApiError(
    `Endpoint non trovato: ${req.method} ${req.originalUrl}`,
    404
  );
  
  res.status(404).json({
    ...error.toJSON(),
    suggestion: 'Consulta GET /api/ per l\'elenco degli endpoint disponibili'
  });
};

/**
 * Rate limiting configurabile
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Troppi tentativi, riprova più tardi') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message,
      statusCode: 429,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

/**
 * Rate limit specifico per ricerche
 */
const searchRateLimit = createRateLimit(
  60 * 1000, // 1 minuto
  30, // 30 richieste per minuto
  'Troppe ricerche, riprova tra un minuto'
);

/**
 * Rate limit generale per l'API
 */
const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minuti
  1000, // 1000 richieste per 15 minuti
  'Troppi tentativi, riprova più tardi'
);

/**
 * Middleware per validare i parametri delle coordinate
 */
const validateCoordinates = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('La latitudine deve essere un numero tra -90 e 90'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('La longitudine deve essere un numero tra -180 e 180'),
];

/**
 * Middleware per validare il nome del comune
 */
const validateCityName = [
  query('q')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Il nome del comune deve essere una stringa tra 1 e 100 caratteri'),
  param('city')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Il nome del comune deve essere una stringa tra 1 e 100 caratteri'),
];

/**
 * Middleware per validare il parametro limit
 */
const validateLimit = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Il parametro limit deve essere un numero intero tra 1 e 10'),
];

/**
 * Middleware per gestire i risultati della validazione
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    const apiError = new ApiError(
      `Errori di validazione: ${errorMessages.join(', ')}`,
      400
    );
    
    return res.status(400).json({
      ...apiError.toJSON(),
      validationErrors: errors.array()
    });
  }
  
  next();
};

/**
 * Middleware per aggiungere headers CORS personalizzati
 */
const corsHeaders = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Middleware per aggiungere headers di sicurezza personalizzati
 */
const securityHeaders = (req, res, next) => {
  res.header('X-API-Version', '1.0.0');
  res.header('X-Powered-By', 'Node.js/Express');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * Middleware per compressione condizionale
 */
const shouldCompress = (req, res) => {
  // Non comprimere se la richiesta include 'x-no-compression'
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  // Comprimi sempre le risposte JSON
  return true;
};

module.exports = {
  requestLogger,
  errorHandler,
  notFoundHandler,
  generalRateLimit,
  searchRateLimit,
  validateCoordinates,
  validateCityName,
  validateLimit,
  handleValidationErrors,
  corsHeaders,
  securityHeaders,
  shouldCompress
};