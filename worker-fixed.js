// Cloudflare Worker CORRETTO per API Coordinate Comuni Italiani
// Questa versione include dati reali per le principali città italiane

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Database delle città italiane (implementazione semplificata)
    const citiesDatabase = {
      'roma': {
        name: 'Roma',
        province: 'RM',
        region: 'Lazio',
        latitude: 41.9028,
        longitude: 12.4964,
        accuracy: 'high'
      },
      'milano': {
        name: 'Milano',
        province: 'MI',
        region: 'Lombardia',
        latitude: 45.4642,
        longitude: 9.1900,
        accuracy: 'high'
      },
      'napoli': {
        name: 'Napoli',
        province: 'NA',
        region: 'Campania',
        latitude: 40.8518,
        longitude: 14.2681,
        accuracy: 'high'
      },
      'torino': {
        name: 'Torino',
        province: 'TO',
        region: 'Piemonte',
        latitude: 45.0703,
        longitude: 7.6869,
        accuracy: 'high'
      },
      'palermo': {
        name: 'Palermo',
        province: 'PA',
        region: 'Sicilia',
        latitude: 38.1157,
        longitude: 13.3615,
        accuracy: 'high'
      },
      'genova': {
        name: 'Genova',
        province: 'GE',
        region: 'Liguria',
        latitude: 44.4056,
        longitude: 8.9463,
        accuracy: 'high'
      },
      'bologna': {
        name: 'Bologna',
        province: 'BO',
        region: 'Emilia-Romagna',
        latitude: 44.4949,
        longitude: 11.3426,
        accuracy: 'high'
      },
      'firenze': {
        name: 'Firenze',
        province: 'FI',
        region: 'Toscana',
        latitude: 43.7696,
        longitude: 11.2558,
        accuracy: 'high'
      },
      'bari': {
        name: 'Bari',
        province: 'BA',
        region: 'Puglia',
        latitude: 41.1171,
        longitude: 16.8719,
        accuracy: 'high'
      },
      'catania': {
        name: 'Catania',
        province: 'CT',
        region: 'Sicilia',
        latitude: 37.5079,
        longitude: 15.0830,
        accuracy: 'high'
      },
      'venezia': {
        name: 'Venezia',
        province: 'VE',
        region: 'Veneto',
        latitude: 45.4408,
        longitude: 12.3155,
        accuracy: 'high'
      },
      'verona': {
        name: 'Verona',
        province: 'VR',
        region: 'Veneto',
        latitude: 45.4384,
        longitude: 10.9916,
        accuracy: 'high'
      }
    };

    // Funzione di ricerca città per nome
    const searchCities = (query) => {
      const normalizedQuery = query.toLowerCase().trim();
      const results = [];

      // Ricerca esatta
      if (citiesDatabase[normalizedQuery]) {
        results.push(citiesDatabase[normalizedQuery]);
      } else {
        // Ricerca parziale
        Object.values(citiesDatabase).forEach(city => {
          if (city.name.toLowerCase().includes(normalizedQuery)) {
            results.push(city);
          }
        });
      }

      return results;
    };

    // Funzione di reverse geocoding semplificata
    const reverseGeocode = (lat, lng) => {
      const inputLat = parseFloat(lat);
      const inputLng = parseFloat(lng);
      let closestCity = null;
      let minDistance = Infinity;

      // Trova la città più vicina alle coordinate
      Object.values(citiesDatabase).forEach(city => {
        const distance = Math.sqrt(
          Math.pow(city.latitude - inputLat, 2) + 
          Math.pow(city.longitude - inputLng, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = { ...city };
        }
      });

      // Se la distanza è troppo grande, restituisci le coordinate originali
      if (minDistance > 1.0) { // Soglia arbitraria
        return {
          name: 'Località non identificata',
          province: 'N/A',
          region: 'N/A',
          latitude: inputLat,
          longitude: inputLng,
          accuracy: 'low'
        };
      }

      return {
        ...closestCity,
        latitude: inputLat,
        longitude: inputLng,
        accuracy: minDistance < 0.1 ? 'high' : 'medium'
      };
    };

    // Gestisci CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Gestisci preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // Route principale
      if (url.pathname === '/') {
        return new Response(JSON.stringify({
          message: 'API Coordinate Comuni Italiani',
          version: '1.0.0',
          status: 'running',
          timestamp: new Date().toISOString(),
          availableCities: Object.keys(citiesDatabase).length,
          apiEndpoint: '/api/',
          documentation: '/api/',
          health: '/api/health',
          examples: {
            search: '/api/coordinates/search?q=Milano',
            direct: '/api/coordinates/Milano',
            reverse: '/api/coordinates/reverse?lat=45.4642&lng=9.1900',
            suggestions: '/api/coordinates/suggestions?q=Rom'
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Health check
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: 'production',
          availableCities: Object.keys(citiesDatabase).length
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // API Info
      if (url.pathname === '/api' || url.pathname === '/api/') {
        return new Response(JSON.stringify({
          name: 'API Coordinate Comuni Italiani',
          version: '1.0.0',
          description: 'API REST per ottenere le coordinate geografiche dei comuni italiani',
          status: 'running',
          timestamp: new Date().toISOString(),
          availableCities: Object.keys(citiesDatabase).length,
          supportedCities: Object.keys(citiesDatabase),
          endpoints: {
            'GET /api/': 'Informazioni sull\'API',
            'GET /api/health': 'Status dell\'API',
            'GET /api/coordinates/search': 'Cerca coordinate per nome comune',
            'GET /api/coordinates/{city}': 'Ottieni coordinate di un comune',
            'GET /api/coordinates/reverse': 'Reverse geocoding',
            'GET /api/coordinates/suggestions': 'Suggerimenti per nomi di comuni'
          },
          examples: [
            {
              name: 'Cerca Milano',
              url: '/api/coordinates/search?q=Milano',
              description: 'Trova le coordinate di Milano'
            },
            {
              name: 'Coordinate Napoli',
              url: '/api/coordinates/Napoli',
              description: 'Ottieni direttamente le coordinate di Napoli'
            },
            {
              name: 'Reverse geocoding Milano',
              url: '/api/coordinates/reverse?lat=45.4642&lng=9.1900',
              description: 'Trova la località dalle coordinate di Milano'
            }
          ]
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Coordinates search - ✅ CORRETTO
      if (url.pathname === '/api/coordinates/search') {
        const query = url.searchParams.get('q');
        if (!query) {
          return new Response(JSON.stringify({
            error: 'Missing required parameter: q',
            message: 'Please provide a city name to search for'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const results = searchCities(query);

        if (results.length === 0) {
          return new Response(JSON.stringify({
            query: query,
            results: [],
            total: 0,
            timestamp: new Date().toISOString(),
            message: 'No cities found matching your query',
            availableCities: Object.keys(citiesDatabase)
          }), {
            status: 404,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({
          query: query,
          results: results,
          total: results.length,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Direct city lookup - ✅ CORRETTO
      if (url.pathname.startsWith('/api/coordinates/') && 
          url.pathname !== '/api/coordinates/search' && 
          url.pathname !== '/api/coordinates/reverse' && 
          url.pathname !== '/api/coordinates/suggestions') {
        const cityName = url.pathname.split('/').pop();
        const normalizedCityName = cityName.toLowerCase();
        
        const cityData = citiesDatabase[normalizedCityName];
        
        if (!cityData) {
          return new Response(JSON.stringify({
            error: 'City not found',
            city: cityName,
            message: `City "${cityName}" not found in database`,
            availableCities: Object.keys(citiesDatabase),
            timestamp: new Date().toISOString()
          }), {
            status: 404,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({
          city: cityName,
          result: cityData,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Reverse geocoding - ✅ CORRETTO
      if (url.pathname === '/api/coordinates/reverse') {
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');
        
        if (!lat || !lng) {
          return new Response(JSON.stringify({
            error: 'Missing required parameters: lat and lng',
            message: 'Please provide latitude and longitude for reverse geocoding'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Validate coordinates
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
          return new Response(JSON.stringify({
            error: 'Invalid coordinates',
            message: 'Latitude and longitude must be valid numbers'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const result = reverseGeocode(lat, lng);

        return new Response(JSON.stringify({
          coordinates: { lat: latitude, lng: longitude },
          result: result,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Suggestions - ✅ GIÀ FUNZIONANTE
      if (url.pathname === '/api/coordinates/suggestions') {
        const query = url.searchParams.get('q');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        if (!query) {
          return new Response(JSON.stringify({
            error: 'Missing required parameter: q',
            message: 'Please provide a query string for suggestions'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Genera suggerimenti dalle città disponibili
        const suggestions = Object.values(citiesDatabase)
          .map(city => city.name)
          .filter(name => name.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, limit);

        return new Response(JSON.stringify({
          query: query,
          suggestions: suggestions,
          total: suggestions.length,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // 404 per altre rotte
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist',
        availableEndpoints: [
          '/api/', 
          '/api/health', 
          '/api/coordinates/search', 
          '/api/coordinates/{city}',
          '/api/coordinates/reverse', 
          '/api/coordinates/suggestions'
        ]
      }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};