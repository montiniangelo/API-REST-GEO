const express = require('express');
const GeocodingService = require('../services/GeocodingService');
const { ApiError } = require('../models/Coordinate');
const {
  searchRateLimit,
  validateCoordinates,
  validateCityName,
  validateLimit,
  handleValidationErrors
} = require('../middleware');

const router = express.Router();
const geocodingService = new GeocodingService();

/**
 * GET /api/coordinates/
 * Endpoint per ottenere la documentazione delle coordinate
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API per le coordinate dei comuni italiani',
    version: '1.0.0',
    endpoints: {
      'GET /api/coordinates/search': {
        description: 'Cerca le coordinate di un comune',
        parameters: {
          q: 'Nome del comune (richiesto)',
          limit: 'Numero massimo di risultati (opzionale, 1-10, default: 1)'
        },
        example: '/api/coordinates/search?q=Roma&limit=1'
      },
      'GET /api/coordinates/{city}': {
        description: 'Ottieni le coordinate di un comune specifico',
        parameters: {
          city: 'Nome del comune (nel path)'
        },
        example: '/api/coordinates/Milano'
      },
      'GET /api/coordinates/reverse': {
        description: 'Reverse geocoding: ottieni informazioni dalla posizione',
        parameters: {
          lat: 'Latitudine (richiesta)',
          lng: 'Longitudine (richiesta)'
        },
        example: '/api/coordinates/reverse?lat=41.9028&lng=12.4964'
      },
      'GET /api/coordinates/suggestions': {
        description: 'Ottieni suggerimenti per i nomi dei comuni',
        parameters: {
          q: 'Nome parziale del comune (richiesto, minimo 2 caratteri)',
          limit: 'Numero massimo di suggerimenti (opzionale, 1-10, default: 5)'
        },
        example: '/api/coordinates/suggestions?q=Rom&limit=5'
      }
    }
  });
});

/**
 * GET /api/coordinates/search?q={city}&limit={limit}
 * Endpoint per cercare le coordinate di un comune
 */
router.get('/search',
  searchRateLimit,
  validateCityName,
  validateLimit,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { q: cityName, limit = 1 } = req.query;
      
      if (!cityName) {
        throw new ApiError('Parametro "q" richiesto (nome del comune)', 400);
      }

      const coordinates = await geocodingService.searchCoordinates(
        cityName,
        parseInt(limit)
      );

      res.json({
        success: true,
        count: coordinates.length,
        query: cityName,
        results: coordinates.map(coord => coord.toJSON())
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/coordinates/{city}
 * Endpoint per ottenere le coordinate di un comune specifico
 */
router.get('/:city',
  searchRateLimit,
  validateCityName,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { city } = req.params;
      
      if (!city || city.trim().length === 0) {
        throw new ApiError('Nome del comune richiesto', 400);
      }

      const coordinate = await geocodingService.findCoordinate(city);
      
      if (!coordinate) {
        throw new ApiError(`Comune "${city}" non trovato`, 404);
      }

      res.json({
        success: true,
        city: city,
        coordinate: coordinate.toJSON()
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/coordinates/reverse?lat={lat}&lng={lng}
 * Endpoint per reverse geocoding
 */
router.get('/reverse',
  searchRateLimit,
  validateCoordinates,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        throw new ApiError('Parametri "lat" e "lng" richiesti', 400);
      }

      const result = await geocodingService.reverseGeocode(
        parseFloat(lat),
        parseFloat(lng)
      );

      res.json({
        success: true,
        coordinates: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        },
        location: result.toJSON()
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/coordinates/suggestions?q={partialName}&limit={limit}
 * Endpoint per ottenere suggerimenti di comuni
 */
router.get('/suggestions',
  searchRateLimit,
  [
    ...validateCityName,
    ...validateLimit
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { q: partialName, limit = 5 } = req.query;
      
      if (!partialName) {
        throw new ApiError('Parametro "q" richiesto (nome parziale del comune)', 400);
      }

      if (partialName.length < 2) {
        throw new ApiError('Il nome parziale deve avere almeno 2 caratteri', 400);
      }

      const suggestions = await geocodingService.getSuggestions(
        partialName,
        parseInt(limit)
      );

      res.json({
        success: true,
        query: partialName,
        count: suggestions.length,
        suggestions: suggestions
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;