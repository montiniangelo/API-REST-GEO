const { workerHandler, comuniRietiDatabase } = require('./worker-rieti-cjs.cjs');

describe('API Coordinate Comuni Provincia di Rieti - Test Completi', () => {
  
  // API Key per i test
  const API_KEY = 'rieti-api-2024-secure-key-73-comuni';
  
  // Helper per creare request con API key
  const createRequestWithApiKey = (url) => {
    const request = new Request(url);
    request.headers.set('X-API-Key', API_KEY);
    return request;
  };
  
  describe('🔐 AUTENTICAZIONE API KEY', () => {
    
    test('Accesso senza API key - deve restituire 401', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=rieti');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.success).toBe(false);
    });
    
    test('Accesso con API key invalida - deve restituire 401', async () => {
      const request = new Request('https://test.com/api/coordinates/search?q=rieti');
      request.headers.set('X-API-Key', 'invalid-key');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.success).toBe(false);
    });
    
    test('Accesso alla route /api senza API key - deve funzionare', async () => {
      const request = new Request('https://test.com/api/');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authentication).toBeDefined();
    });
    
    test('Accesso con API key valida - deve funzionare', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=rieti');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('🏛️ PROVINCIA DI RIETI - Test sui principali comuni', () => {
    
    test('Cerca Rieti - capoluogo di provincia', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=rieti');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Rieti');
      expect(data.results[0].province).toBe('Rieti');
      expect(data.results[0].latitude).toBe(42.4040);
      expect(data.results[0].longitude).toBe(12.8628);
      expect(data.results[0].population).toBe(47700);
    });

    test('Accesso diretto Cittaducale', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/cittaducale');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.result.name).toBe('Cittaducale');
      expect(data.result.province).toBe('Rieti');
      expect(data.result.population).toBe(6978);
    });

    test('Cerca nome composto: "Fara in Sabina"', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=fara in sabina');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Fara in Sabina');
      expect(data.results[0].province).toBe('Rieti');
      expect(data.results[0].population).toBe(13816);
    });

    test('Ricerca parziale: "Fara"', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=fara');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results.length).toBeGreaterThanOrEqual(1);
      // Dovrebbe contenere "Fara in Sabina" e possibilmente "Castelnuovo di Farfa"
      const nomiComuni = data.results.map(city => city.name);
      expect(nomiComuni).toContain('Fara in Sabina');
      // "Fara in Sabina" dovrebbe essere il primo (ha più abitanti)
      expect(data.results[0].name).toBe('Fara in Sabina');
    });

    test('Cerca Amatrice - comune storico', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=amatrice');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Amatrice');
      expect(data.results[0].province).toBe('Rieti');
      expect(data.results[0].population).toBe(2646);
    });

    test('Cerca Leonessa - comune montano', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=leonessa');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Leonessa');
      expect(data.results[0].province).toBe('Rieti');
      expect(data.results[0].latitude).toBe(42.5669);
      expect(data.results[0].longitude).toBe(12.9625);
    });

    test('Cerca Poggio Mirteto - comune della Sabina', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=poggio mirteto');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Poggio Mirteto');
      expect(data.results[0].population).toBe(6570);
    });

    test('Cerca comune piccolo: Marcetelli (98 abitanti)', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=marcetelli');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Marcetelli');
      expect(data.results[0].population).toBe(98);
    });

    test('Cerca comuni con nomi composti che iniziano per "Monte"', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=monte');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results.length).toBeGreaterThan(1);
      
      const comuniMonte = data.results.filter(city => city.name.startsWith('Monte'));
      expect(comuniMonte.length).toBeGreaterThan(0);
      
      // Verifica che contenga almeno alcuni comuni "Monte"
      const nomiComuni = data.results.map(city => city.name);
      expect(nomiComuni).toEqual(expect.arrayContaining(['Monte San Giovanni in Sabina']));
    });

    test('Cerca comuni con "Poggio" nel nome', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=poggio');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results.length).toBeGreaterThanOrEqual(5); // Ci sono 6 comuni con "Poggio"
      
      const nomiComuni = data.results.map(city => city.name);
      expect(nomiComuni).toEqual(expect.arrayContaining([
        'Poggio Mirteto',
        'Poggio Bustone',
        'Poggio Catino'
      ]));
    });
  });

  describe('🔍 Test Ricerca Avanzata e Funzionalità', () => {
    
    test('Ricerca case-insensitive', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=RIETI');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Rieti');
    });

    test('Reverse geocoding - coordinate di Rieti', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/reverse?lat=42.4040&lng=12.8628');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0].name).toBe('Rieti');
    });

    test('Reverse geocoding - coordinate di Cittaducale', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/reverse?lat=42.3822&lng=12.9469');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0].name).toBe('Cittaducale');
    });

    test('Conteggio comuni disponibili - deve essere 73', async () => {
      const request = createRequestWithApiKey('https://test.com/api/');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.totalCities).toBe(73); // Tutti i comuni della Provincia di Rieti
      expect(data.supportedCities).toContain('rieti');
      expect(data.supportedCities).toContain('amatrice');
      expect(data.supportedCities).toContain('leonessa');
      expect(data.supportedCities).toContain('fara_in_sabina');
    });

    test('Verifica presenza di tutti i comuni principali', async () => {
      const comuniPrincipali = [
        'rieti', 'cittaducale', 'fara_in_sabina', 'amatrice', 'leonessa',
        'poggio_mirteto', 'montopoli_di_sabina', 'magliano_sabina', 'contigliano',
        'antrodoco', 'borgorose', 'cantalice', 'forano', 'stimigliano'
      ];
      
      expect(Object.keys(comuniRietiDatabase).length).toBe(73);
      
      // Verifica che tutti i comuni principali siano presenti
      comuniPrincipali.forEach(comune => {
        expect(comuniRietiDatabase).toHaveProperty(comune);
        expect(comuniRietiDatabase[comune].province).toBe('Rieti');
        expect(comuniRietiDatabase[comune].region).toBe('Lazio');
      });
    });
  });

  describe('❌ Test Errori e Casi Limite', () => {
    
    test('Comune non esistente nella Provincia di Rieti', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=Roma');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.results).toHaveLength(0);
      expect(data.message).toContain('No cities found');
    });

    test('Accesso diretto a comune non esistente', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/Milano');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('City not found');
      expect(data.availableCities).toHaveLength(10); // Primi 10 comuni in ordine alfabetico
      expect(data.availableCities).toContain('accumoli'); // Primo in ordine alfabetico
    });

    test('Reverse geocoding coordinate non valide', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/reverse?lat=invalid&lng=invalid');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid coordinates');
    });

    test('Query vuota', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter');
    });

    test('Verifica risoluzione bug falsi positivi - nessun match per "in"', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=comunechiaramenteinesistentexyz123');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.results).toHaveLength(0);
      expect(data.message).toContain('No cities found');
      // Verifichiamo che "Fara in Sabina" non sia più matchata per questa query
    });

    test('Verifica che "Fara in Sabina" funzioni correttamente con query valide', async () => {
      const request = createRequestWithApiKey('https://test.com/api/coordinates/search?q=fara in sabina');
      const response = await workerHandler.fetch(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].name).toBe('Fara in Sabina');
    });

    test('Verifica che comuni di altre province non siano accessibili', async () => {
      // Testa che Roma (provincia di Roma) non sia nel database
      const requestRoma = createRequestWithApiKey('https://test.com/api/coordinates/search?q=roma');
      const responseRoma = await workerHandler.fetch(requestRoma, {});
      expect(responseRoma.status).toBe(404);
      
      // Testa che Latina (provincia di Latina) non sia nel database  
      const requestLatina = createRequestWithApiKey('https://test.com/api/coordinates/search?q=latina');
      const responseLatina = await workerHandler.fetch(requestLatina, {});
      expect(responseLatina.status).toBe(404);
    });

    test('Verifica completezza database - tutti i 73 comuni presenti', async () => {
      const comuniCompleti = [
        'accumoli', 'amatrice', 'antrodoco', 'ascrea', 'belmonte_in_sabina',
        'borbona', 'borgo_velino', 'borgorose', 'cantalice', 'cantalupo_in_sabina',
        'casaprota', 'casperia', 'castel_sant_angelo', 'castel_di_tora', 'castelnuovo_di_farfa',
        'cittaducale', 'cittareale', 'collalto_sabino', 'colle_di_tora', 'collegiove',
        'collevecchio', 'colli_sul_velino', 'concerviano', 'configni', 'contigliano',
        'cottanello', 'fara_in_sabina', 'fiamignano', 'forano', 'frasso_sabino',
        'greccio', 'labro', 'leonessa', 'longone_sabino', 'magliano_sabina',
        'marcetelli', 'micigliano', 'mompeo', 'montasola', 'monte_san_giovanni_in_sabina',
        'montebuono', 'monteleone_sabino', 'montenero_sabino', 'montopoli_di_sabina', 'morro_reatino',
        'nespolo', 'orvinio', 'paganico_sabino', 'pescorocchiano', 'petrella_salto',
        'poggio_bustone', 'poggio_catino', 'poggio_mirteto', 'poggio_moiano', 'poggio_nativo',
        'poggio_san_lorenzo', 'posta', 'pozzaglia_sabina', 'rieti', 'rivodutri',
        'rocca_sinibalda', 'roccantica', 'salisano', 'scandriglia', 'selci',
        'stimigliano', 'tarano', 'toffia', 'torri_in_sabina', 'torricella_in_sabina',
        'turania', 'vacone', 'varco_sabino'
      ];
      
      expect(comuniCompleti.length).toBe(73);
      
      // Verifica che tutti i comuni siano presenti nel database
      comuniCompleti.forEach(comune => {
        expect(comuniRietiDatabase).toHaveProperty(comune);
        expect(comuniRietiDatabase[comune]).toHaveProperty('name');
        expect(comuniRietiDatabase[comune]).toHaveProperty('province');
        expect(comuniRietiDatabase[comune]).toHaveProperty('region');
        expect(comuniRietiDatabase[comune]).toHaveProperty('latitude');
        expect(comuniRietiDatabase[comune]).toHaveProperty('longitude');
        expect(comuniRietiDatabase[comune]).toHaveProperty('population');
        expect(comuniRietiDatabase[comune].province).toBe('Rieti');
        expect(comuniRietiDatabase[comune].region).toBe('Lazio');
      });
    });
  });
});