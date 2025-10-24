// Test specifici per i comuni del Lazio - CommonJS version
// Questa versione testa il supporto esteso per tutti i comuni del Lazio

const workerHandler = require('./worker-lazio-cjs.cjs');

describe('API Coordinate Comuni del Lazio - Test Completi', () => {
  
  describe('🏛️ PROVINCIA DI ROMA - Test sui principali comuni', () => {
    
    test('Cerca Roma - capitale', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Roma');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Roma');
      expect(data.results[0].province).toBe('Roma');
      expect(data.results[0].region).toBe('Lazio');
      expect(data.results[0].latitude).toBe(41.9028);
      expect(data.results[0].longitude).toBe(12.4964);
      expect(data.results[0].population).toBe(2844395);
    });

    test('Cerca Tivoli - comune storico', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Tivoli');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Tivoli');
      expect(data.results[0].province).toBe('Roma');
      expect(data.results[0].latitude).toBe(41.9630);
      expect(data.results[0].longitude).toBe(12.7973);
    });

    test('Accesso diretto Frascati', async () => {
      const request = new Request('https://test.com/api/coordinates/frascati');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Frascati');
      expect(data.result.province).toBe('Roma');
      expect(data.result.latitude).toBe(41.8081);
      expect(data.result.longitude).toBe(12.6803);
    });

    test('Cerca nome composto: "Guidonia Montecelio"', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Guidonia Montecelio');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Guidonia Montecelio');
      expect(data.results[0].province).toBe('Roma');
      expect(data.results[0].population).toBe(88679);
    });

    test('Ricerca parziale: "Guidonia"', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Guidonia');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0].name).toBe('Guidonia Montecelio');
    });
  });

  describe('🏖️ PROVINCIA DI LATINA - Test comuni costieri', () => {
    
    test('Cerca Latina - capoluogo', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Latina');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].name).toBe('Latina');
      expect(data.results[0].province).toBe('Latina');
      expect(data.results[0].region).toBe('Lazio');
      expect(data.results[0].latitude).toBe(41.4677);
      expect(data.results[0].longitude).toBe(12.9037);
      expect(data.results[0].population).toBe(127368);
    });

    test('Cerca Terracina - località costiera', async () => {
      const request = new Request('https://test.com/api/coordinates/terracina');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Terracina');
      expect(data.result.province).toBe('Latina');
      expect(data.result.latitude).toBe(41.2906);
      expect(data.result.longitude).toBe(13.2436);
    });

    test('Cerca Gaeta', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Gaeta');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].name).toBe('Gaeta');
      expect(data.results[0].province).toBe('Latina');
      expect(data.results[0].latitude).toBe(41.2136);
      expect(data.results[0].longitude).toBe(13.5681);
    });
  });

  describe('🏛️ PROVINCIA DI FROSINONE - Test comuni della Ciociaria', () => {
    
    test('Cerca Frosinone - capoluogo', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Frosinone');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].name).toBe('Frosinone');
      expect(data.results[0].province).toBe('Frosinone');
      expect(data.results[0].latitude).toBe(41.6401);
      expect(data.results[0].longitude).toBe(13.3511);
      expect(data.results[0].population).toBe(46286);
    });

    test('Cerca Cassino - città storica', async () => {
      const request = new Request('https://test.com/api/coordinates/cassino');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Cassino');
      expect(data.result.province).toBe('Frosinone');
      expect(data.result.latitude).toBe(41.4908);
      expect(data.result.longitude).toBe(13.8328);
    });

    test('Cerca Anagni', async () => {
      const request = new Request('https://test.com/api/coordinates/anagni');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Anagni');
      expect(data.result.province).toBe('Frosinone');
      expect(data.result.latitude).toBe(41.7469);
      expect(data.result.longitude).toBe(13.1533);
    });
  });

  describe('🏰 PROVINCIA DI VITERBO - Test città etrusche', () => {
    
    test('Cerca Viterbo - capoluogo', async () => {
      const request = new Request('https://test.com/api/coordinates/viterbo');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Viterbo');
      expect(data.result.province).toBe('Viterbo');
      expect(data.result.latitude).toBe(42.4175);
      expect(data.result.longitude).toBe(12.1058);
      expect(data.result.population).toBe(67846);
    });

    test('Cerca Tarquinia', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Tarquinia');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].name).toBe('Tarquinia');
      expect(data.results[0].province).toBe('Viterbo');
      expect(data.results[0].latitude).toBe(42.2492);
      expect(data.results[0].longitude).toBe(11.7583);
    });
  });

  describe('🏔️ PROVINCIA DI RIETI - Test comuni della Sabina', () => {
    
    test('Cerca Rieti - capoluogo', async () => {
      const request = new Request('https://test.com/api/coordinates/rieti');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Rieti');
      expect(data.result.province).toBe('Rieti');
      expect(data.result.latitude).toBe(42.4040);
      expect(data.result.longitude).toBe(12.8628);
      expect(data.result.population).toBe(47700);
    });

    test('Cerca nome composto: "Fara in Sabina"', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=Fara in Sabina');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].name).toBe('Fara in Sabina');
      expect(data.results[0].province).toBe('Rieti');
      expect(data.results[0].latitude).toBe(42.2181);
      expect(data.results[0].longitude).toBe(12.7211);
    });
  });

  describe('🔍 Test Ricerca Avanzata e Funzionalità', () => {
    
    test('Ricerca case-insensitive', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=TIVOLI');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].name).toBe('Tivoli');
    });

    test('Reverse geocoding - coordinate di Roma', async () => {
      const request = new Request('https://test.com/api/coordinates/reverse?lat=41.9028&lng=12.4964');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Roma');
      expect(data.coordinates.lat).toBe(41.9028);
      expect(data.coordinates.lng).toBe(12.4964);
    });

    test('Reverse geocoding - coordinate di Latina', async () => {
      const request = new Request('https://test.com/api/coordinates/reverse?lat=41.4677&lng=12.9037');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Latina');
    });

    test('Conteggio comuni disponibili', async () => {
      const request = new Request('https://test.com/api/');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.availableCities).toBeGreaterThan(30); // Abbiamo aggiunto molti comuni del Lazio
      expect(data.supportedCities).toContain('roma');
      expect(data.supportedCities).toContain('latina');
      expect(data.supportedCities).toContain('frosinone');
      expect(data.supportedCities).toContain('viterbo');
      expect(data.supportedCities).toContain('rieti');
    });
  });

  describe('❌ Test Errori e Casi Limite', () => {
    
    test('Comune non esistente nel Lazio', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=ComuneChiaramenteInesistenteXYZ123');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.results).toHaveLength(0);
      expect(data.message).toContain('No cities found');
    });

    test('Accesso diretto a comune non esistente', async () => {
      const request = new Request('https://test.com/api/coordinates/ComuneInesistente');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('City not found');
      expect(data.availableCities).toContain('roma');
    });

    test('Reverse geocoding coordinate non valide', async () => {
      const request = new Request('https://test.com/api/coordinates/reverse?lat=invalid&lng=invalid');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid coordinates');
    });

    test('Query vuota', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter');
    });

    test('Verifica risoluzione bug falsi positivi - nessun match per "in"', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=comunechiaramenteinesistentexyz123');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.results).toHaveLength(0);
      expect(data.message).toContain('No cities found');
      // Verifichiamo che "Fara in Sabina" non sia più matchata per questa query
    });

    test('Verifica che "Fara in Sabina" funzioni correttamente con query valide', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=fara');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Fara in Sabina');
    });
  });
});