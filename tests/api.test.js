const request = require('supertest');
const app = require('../server');

describe('API Coordinate Tests', () => {
  
  // Test dell'endpoint principale
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body.status).toBe('running');
    });
  });

  // Test dell'endpoint API info
  describe('GET /api/', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api/')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.success).toBe(true);
    });
  });

  // Test dell'endpoint health
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  // Test ricerca coordinate
  describe('GET /api/coordinates/search', () => {
    it('should find coordinates for Roma', async () => {
      const response = await request(app)
        .get('/api/coordinates/search?q=Roma')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(response.body.results[0]).toHaveProperty('latitude');
      expect(response.body.results[0]).toHaveProperty('longitude');
    });

    it('should return error for empty query', async () => {
      const response = await request(app)
        .get('/api/coordinates/search')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should return 404 for non-existent city', async () => {
      const response = await request(app)
        .get('/api/coordinates/search?q=CittaInesistente123')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(404);
    });
  });

  // Test coordinate dirette
  describe('GET /api/coordinates/:city', () => {
    it('should find coordinates for Milano', async () => {
      const response = await request(app)
        .get('/api/coordinates/Milano')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('coordinate');
      expect(response.body.coordinate).toHaveProperty('latitude');
      expect(response.body.coordinate).toHaveProperty('longitude');
    });

    it('should return 404 for non-existent city', async () => {
      const response = await request(app)
        .get('/api/coordinates/CittaInesistente123')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(404);
    });
  });

  // Test reverse geocoding
  describe('GET /api/coordinates/reverse', () => {
    it('should do reverse geocoding for Roma coordinates', async () => {
      const response = await request(app)
        .get('/api/coordinates/reverse?lat=41.9028&lng=12.4964')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('location');
      expect(response.body.location).toHaveProperty('locationName');
    });

    it('should return error for invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/coordinates/reverse?lat=invalid&lng=12.4964')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should return error for missing coordinates', async () => {
      const response = await request(app)
        .get('/api/coordinates/reverse?lat=41.9028')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(400);
    });
  });

  // Test suggerimenti
  describe('GET /api/coordinates/suggestions', () => {
    it('should return suggestions for "Rom"', async () => {
      const response = await request(app)
        .get('/api/coordinates/suggestions?q=Rom')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it('should return error for short query', async () => {
      const response = await request(app)
        .get('/api/coordinates/suggestions?q=R')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(400);
    });
  });

  // Test endpoint non esistente
  describe('GET /api/nonexistent', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(404);
    });
  });
});

// Chiude il server dopo i test
afterAll((done) => {
  done();
});