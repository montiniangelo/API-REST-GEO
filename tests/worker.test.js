/**
 * Test per Cloudflare Worker
 * Questi test verificano il comportamento dell'API implementata nel worker.js
 */

// Mock dell'oggetto Request e Response per Cloudflare Workers
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.status = init.status || 200;
    this.headers = new Map();
    this.bodyText = body;
    
    // Aggiungi headers
    if (init.headers) {
      for (const [key, value] of Object.entries(init.headers)) {
        this.headers.set(key, value);
      }
    }
  }
  
  async json() {
    return JSON.parse(this.bodyText);
  }
  
  async text() {
    return this.bodyText;
  }
};

global.URL = URL;

// Import del worker (versione CommonJS per i test)
const worker = require('./worker-cjs.js');

describe('Cloudflare Worker API Tests', () => {
  let env;
  
  beforeEach(() => {
    env = {};
  });

  describe('Basic Routes', () => {
    it('should return API info on root path', async () => {
      const request = new Request('https://example.com/');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'API Coordinate Comuni della Provincia di Rieti');
      expect(data).toHaveProperty('version', '1.0.0');
      expect(data).toHaveProperty('examples');
    });

    it('should return health status', async () => {
      const request = new Request('https://example.com/api/health');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('version', '1.0.0');
      expect(data).toHaveProperty('environment', 'production');
    });

    it('should handle CORS preflight requests', async () => {
      const request = new Request('https://example.com/api/coordinates/search', {
        method: 'OPTIONS'
      });
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Coordinates Search - BUG TESTS', () => {
    it('should search for Roma and return correct coordinates', async () => {
      const request = new Request('https://example.com/api/coordinates/search?q=Roma');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('query', 'Roma');
      expect(data).toHaveProperty('results');
      expect(data.results[0]).toHaveProperty('name', 'Roma');
      expect(data.results[0]).toHaveProperty('latitude', 41.9028);
      expect(data.results[0]).toHaveProperty('longitude', 12.4964);
    });

    it('🐛 BUG: should search for Milano but returns Roma coordinates (FAILS)', async () => {
      const request = new Request('https://example.com/api/coordinates/search?q=Milano');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('query', 'Milano');
      expect(data).toHaveProperty('results');
      
      // ❌ BUG: Il worker restituisce sempre Roma indipendentemente dalla query
      // Questo test FALLISCE perché il worker ha dati hardcodati
      expect(data.results[0].name).toBe('Milano'); // Questo fallisce!
      expect(data.results[0].latitude).not.toBe(41.9028); // Questo fallisce!
      expect(data.results[0].longitude).not.toBe(12.4964); // Questo fallisce!
    });

    it('🐛 BUG: should search for Napoli but returns Roma coordinates (FAILS)', async () => {
      const request = new Request('https://example.com/api/coordinates/search?q=Napoli');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('query', 'Napoli');
      expect(data).toHaveProperty('results');
      
      // ❌ BUG: Anche cercando Napoli, restituisce Roma
      expect(data.results[0].name).toBe('Napoli'); // Questo fallisce!
      expect(data.results[0].latitude).not.toBe(41.9028); // Questo fallisce!
    });

    it('should return 400 for missing query parameter', async () => {
      const request = new Request('https://example.com/api/coordinates/search');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Missing required parameter: q');
    });
  });

  describe('Direct City Lookup - BUG TESTS', () => {
    it('🐛 BUG: should lookup Milano directly but returns Roma coordinates (FAILS)', async () => {
      const request = new Request('https://example.com/api/coordinates/Milano');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('city', 'Milano');
      expect(data).toHaveProperty('result');
      
      // ❌ BUG: Anche con lookup diretto, restituisce sempre Roma
      expect(data.result.name).toBe('Milano'); // Questo fallisce!
      expect(data.result.latitude).not.toBe(41.9028); // Questo fallisce!
      expect(data.result.longitude).not.toBe(12.4964); // Questo fallisce!
    });

    it('🐛 BUG: should lookup Torino directly but returns Roma coordinates (FAILS)', async () => {
      const request = new Request('https://example.com/api/coordinates/Torino');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('city', 'Torino');
      
      // ❌ BUG: Coordinate hardcodate di Roma
      expect(data.result.latitude).not.toBe(41.9028); // Questo fallisce!
      expect(data.result.longitude).not.toBe(12.4964); // Questo fallisce!
    });
  });

  describe('Reverse Geocoding - BUG TESTS', () => {
    it('should do reverse geocoding with Roma coordinates', async () => {
      const request = new Request('https://example.com/api/coordinates/reverse?lat=41.9028&lng=12.4964');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('coordinates');
      expect(data.coordinates.lat).toBe(41.9028);
      expect(data.coordinates.lng).toBe(12.4964);
      expect(data.result.name).toBe('Roma');
    });

    it('🐛 BUG: should do reverse geocoding with Milano coordinates but returns Roma (FAILS)', async () => {
      const milanLat = 45.4642;
      const milanLng = 9.1900;
      
      const request = new Request(`https://example.com/api/coordinates/reverse?lat=${milanLat}&lng=${milanLng}`);
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.coordinates.lat).toBe(milanLat);
      expect(data.coordinates.lng).toBe(milanLng);
      
      // ❌ BUG: Con coordinate di Milano dovrebbe restituire Milano, non Roma
      expect(data.result.name).toBe('Milano'); // Questo fallisce!
      expect(data.result.name).not.toBe('Roma'); // Questo fallisce!
    });

    it('should return 400 for missing lat parameter', async () => {
      const request = new Request('https://example.com/api/coordinates/reverse?lng=12.4964');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Missing required parameters: lat and lng');
    });

    it('should return 400 for missing lng parameter', async () => {
      const request = new Request('https://example.com/api/coordinates/reverse?lat=41.9028');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Missing required parameters: lat and lng');
    });
  });

  describe('Suggestions', () => {
    it('should return suggestions for "Rom"', async () => {
      const request = new Request('https://example.com/api/coordinates/suggestions?q=Rom');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('query', 'Rom');
      expect(data).toHaveProperty('suggestions');
      expect(Array.isArray(data.suggestions)).toBe(true);
      expect(data.suggestions).toContain('Roma');
    });

    it('should return suggestions for "Mil"', async () => {
      const request = new Request('https://example.com/api/coordinates/suggestions?q=Mil');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('suggestions');
      
      // Le suggestions funzionano correttamente perché filtrano un array statico
      expect(data.suggestions.length).toBe(0); // Non ci sono città che iniziano con "Mil" nel mock
    });

    it('should respect limit parameter', async () => {
      const request = new Request('https://example.com/api/coordinates/suggestions?q=Rom&limit=2');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.suggestions.length).toBeLessThanOrEqual(2);
    });

    it('should return 400 for missing query parameter', async () => {
      const request = new Request('https://example.com/api/coordinates/suggestions');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Missing required parameter: q');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const request = new Request('https://example.com/api/nonexistent');
      const response = await worker.fetch(request, env);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Endpoint not found');
      expect(data).toHaveProperty('availableEndpoints');
    });
  });
});

describe('🚨 BUG SUMMARY', () => {
  it('should document all identified bugs', () => {
    const bugs = [
      {
        endpoint: '/api/coordinates/search',
        problem: 'Restituisce sempre coordinate di Roma indipendentemente dalla query',
        location: 'worker.js linee 111-120',
        impact: 'Alto - Funzione principale non funziona'
      },
      {
        endpoint: '/api/coordinates/{city}',
        problem: 'Lookup diretto restituisce sempre coordinate di Roma',
        location: 'worker.js linee 138-145',
        impact: 'Alto - Lookup diretto inutile'
      },
      {
        endpoint: '/api/coordinates/reverse',
        problem: 'Reverse geocoding restituisce sempre Roma',
        location: 'worker.js linee 173-180',
        impact: 'Alto - Reverse geocoding non funziona'
      }
    ];

    console.log('\n🐛 BUGS IDENTIFICATI:');
    bugs.forEach((bug, index) => {
      console.log(`${index + 1}. ${bug.endpoint}:`);
      console.log(`   Problema: ${bug.problem}`);
      console.log(`   Posizione: ${bug.location}`);
      console.log(`   Impatto: ${bug.impact}\n`);
    });

    expect(bugs.length).toBe(3); // Documenta che ci sono 3 bug principali
  });
});