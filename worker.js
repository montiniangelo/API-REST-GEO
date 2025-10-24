// Export per Cloudflare Workers
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
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
          apiEndpoint: '/api/',
          documentation: '/api/',
          health: '/api/health',
          examples: {
            search: '/api/coordinates/search?q=Roma',
            direct: '/api/coordinates/Milano',
            reverse: '/api/coordinates/reverse?lat=41.9028&lng=12.4964',
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
          environment: 'production'
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
            }
          ]
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Coordinates search
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

        // Simuliamo la ricerca (qui dovresti usare il tuo GeocodingService)
        const mockResults = [
          {
            name: 'Roma',
            province: 'RM',
            region: 'Lazio',
            latitude: 41.9028,
            longitude: 12.4964,
            accuracy: 'high'
          }
        ];

        return new Response(JSON.stringify({
          query: query,
          results: mockResults,
          total: mockResults.length,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Direct city lookup
      if (url.pathname.startsWith('/api/coordinates/') && url.pathname !== '/api/coordinates/search' && url.pathname !== '/api/coordinates/reverse' && url.pathname !== '/api/coordinates/suggestions') {
        const cityName = url.pathname.split('/').pop();
        
        // Simuliamo la ricerca diretta
        const mockResult = {
          name: cityName,
          province: 'XX',
          region: 'Region',
          latitude: 41.9028,
          longitude: 12.4964,
          accuracy: 'high'
        };

        return new Response(JSON.stringify({
          city: cityName,
          result: mockResult,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Reverse geocoding
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

        // Simuliamo il reverse geocoding
        const mockResult = {
          name: 'Roma',
          province: 'RM',
          region: 'Lazio',
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          accuracy: 'high'
        };

        return new Response(JSON.stringify({
          coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
          result: mockResult,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Suggestions
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

        // Simuliamo i suggerimenti
        const mockSuggestions = [
          'Roma', 'Romano di Lombardia', 'Romano d\'Ezzelino', 'Romano Canavese'
        ].filter(city => city.toLowerCase().startsWith(query.toLowerCase()))
         .slice(0, limit);

        return new Response(JSON.stringify({
          query: query,
          suggestions: mockSuggestions,
          total: mockSuggestions.length,
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
        availableEndpoints: ['/api/', '/api/health', '/api/coordinates/search', '/api/coordinates/reverse', '/api/coordinates/suggestions']
      }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};