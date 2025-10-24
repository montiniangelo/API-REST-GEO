// Cloudflare Worker per API Coordinate Comuni della Provincia di Rieti
// Questa versione include tutti i 73 comuni della Provincia di Rieti

import { comuniRietiDatabase } from './comuni-rieti-completi.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Configurazione API Key
    const VALID_API_KEY = env?.API_KEY || 'rieti-api-2024-secure-key-73-comuni';
    
    // Database completo dei 73 comuni della Provincia di Rieti
    const citiesDatabase = comuniRietiDatabase;

    // Funzione per normalizzare i nomi dei comuni (gestisce spazi, accenti, caratteri speciali)
    const normalizeNome = (nome) => {
      return nome.toLowerCase()
        .replace(/[\s\-']/g, '_')
        .replace(/[àáâã]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõ]/g, 'o')
        .replace(/[ùúûü]/g, 'u');
    };

    // Funzione di ricerca città per nome (migliorata per comuni di Rieti)
    const searchCities = (query) => {
      const normalizedQuery = normalizeNome(query);
      const results = [];

      // Ricerca esatta per chiave
      if (citiesDatabase[normalizedQuery]) {
        results.push(citiesDatabase[normalizedQuery]);
      } else {
        // Ricerca avanzata per nome
        Object.entries(citiesDatabase).forEach(([key, city]) => {
          const normalizedCityName = normalizeNome(city.name);
          
          // Ricerca esatta sul nome normalizzato
          if (normalizedCityName === normalizedQuery) {
            results.push(city);
          }
          // Ricerca parziale (contiene la query)
          else if (normalizedCityName.includes(normalizedQuery) || normalizedQuery.includes(normalizedCityName)) {
            results.push(city);
          }
          // Ricerca per parole singole nei nomi composti
          else if (normalizedQuery.includes('_') || normalizedCityName.includes('_')) {
            const queryParts = normalizedQuery.split('_').filter(part => part.length > 2);
            const cityParts = normalizedCityName.split('_').filter(part => part.length > 2);
            
            // Match solo se una parte del nome inizia con la query o è uguale
            if (queryParts.some(qPart => cityParts.some(cPart => 
              cPart === qPart || cPart.startsWith(qPart) || 
              (qPart.length > 3 && cPart.startsWith(qPart.substring(0, Math.max(3, qPart.length - 1))))
            ))) {
              results.push(city);
            }
          }
        });
      }

      // Rimuovi duplicati e ordina per rilevanza
      const uniqueResults = Array.from(new Set(results.map(r => r.name)))
        .map(name => results.find(r => r.name === name))
        .sort((a, b) => {
          // Ordina per popolazione (città più grandi prima)
          return (b.population || 0) - (a.population || 0);
        });

      return uniqueResults;
    };

    // Funzione per reverse geocoding
    const reverseGeocode = (lat, lng, radius = 0.1) => {
      const results = [];
      
      Object.values(citiesDatabase).forEach(city => {
        const distance = Math.sqrt(
          Math.pow(lat - city.latitude, 2) + 
          Math.pow(lng - city.longitude, 2)
        );
        
        if (distance <= radius) {
          results.push({
            ...city,
            distance: distance
          });
        }
      });
      
      return results.sort((a, b) => a.distance - b.distance);
    };

    // Funzione per validare API key
    const validateApiKey = () => {
      const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
      return apiKey === VALID_API_KEY;
    };

    // Headers per CORS e sicurezza
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      'Cache-Control': 'public, max-age=3600',
      'X-Powered-By': 'API-Coordinate-Rieti-v1.0'
    };

    // Gestione preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }

    try {
      // Controllo API Key per tutte le route (eccetto la route informazioni)
      if (url.pathname !== '/api' && url.pathname !== '/api/' && !validateApiKey()) {
        return new Response(JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid API key. Please provide a valid X-API-Key header.',
          statusCode: 401,
          success: false
        }), { 
          status: 401, 
          headers: {
            ...headers,
            'WWW-Authenticate': 'ApiKey realm="API Coordinate Rieti"'
          }
        });
      }
      // Route principale - informazioni API
      if (url.pathname === '/api' || url.pathname === '/api/') {
        const apiInfo = {
          name: "API Coordinate Comuni Provincia di Rieti",
          version: "1.0.0",
          description: "API REST per ottenere coordinate dei 73 comuni della Provincia di Rieti",
          totalCities: Object.keys(citiesDatabase).length,
          supportedCities: Object.keys(citiesDatabase),
          authentication: {
            type: "API Key",
            header: "X-API-Key",
            required: "All endpoints except /api/ require valid API key",
            example: "X-API-Key: your-api-key-here"
          },
          endpoints: {
            search: "/api/coordinates/search?q={query}",
            direct: "/api/coordinates/{cityname}",
            reverse: "/api/coordinates/reverse?lat={latitude}&lng={longitude}",
            list: "/api/coordinates/list"
          },
          examples: {
            search: "/api/coordinates/search?q=rieti",
            direct: "/api/coordinates/rieti",
            reverse: "/api/coordinates/reverse?lat=42.4040&lng=12.8628"
          },
          success: true
        };
        
        return new Response(JSON.stringify(apiInfo), { status: 200, headers });
      }

      // Route ricerca per query
      if (url.pathname === '/api/coordinates/search') {
        const query = url.searchParams.get('q');
        
        if (!query || query.trim().length < 1) {
          return new Response(JSON.stringify({
            error: "Missing required parameter 'q' (query)",
            statusCode: 400,
            success: false
          }), { status: 400, headers });
        }

        const results = searchCities(query.trim());
        
        if (results.length === 0) {
          return new Response(JSON.stringify({
            query: query,
            results: [],
            count: 0,
            message: "No cities found matching your query in Provincia di Rieti",
            statusCode: 404,
            success: false
          }), { status: 404, headers });
        }

        return new Response(JSON.stringify({
          query: query,
          results: results,
          count: results.length,
          statusCode: 200,
          success: true
        }), { status: 200, headers });
      }

      // Route accesso diretto per nome città
      if (url.pathname.startsWith('/api/coordinates/') && !url.pathname.includes('/search') && !url.pathname.includes('/reverse') && !url.pathname.includes('/list')) {
        const cityName = url.pathname.split('/api/coordinates/')[1];
        
        if (!cityName) {
          return new Response(JSON.stringify({
            error: "City name is required",
            statusCode: 400,
            success: false
          }), { status: 400, headers });
        }

        const normalizedCity = normalizeNome(cityName);
        const city = citiesDatabase[normalizedCity];

        if (!city) {
          return new Response(JSON.stringify({
            error: "City not found",
            city: cityName,
            statusCode: 404,
            availableCities: Object.keys(citiesDatabase).slice(0, 10),
            totalAvailable: Object.keys(citiesDatabase).length,
            success: false
          }), { status: 404, headers });
        }

        return new Response(JSON.stringify({
          city: cityName,
          result: city,
          statusCode: 200,
          success: true
        }), { status: 200, headers });
      }

      // Route reverse geocoding
      if (url.pathname === '/api/coordinates/reverse') {
        const lat = parseFloat(url.searchParams.get('lat'));
        const lng = parseFloat(url.searchParams.get('lng'));
        const radius = parseFloat(url.searchParams.get('radius')) || 0.1;

        if (isNaN(lat) || isNaN(lng)) {
          return new Response(JSON.stringify({
            error: "Invalid coordinates",
            statusCode: 400,
            success: false
          }), { status: 400, headers });
        }

        const results = reverseGeocode(lat, lng, radius);
        
        if (results.length === 0) {
          return new Response(JSON.stringify({
            lat: lat,
            lng: lng,
            radius: radius,
            results: [],
            message: "No cities found within the specified radius in Provincia di Rieti",
            statusCode: 404,
            success: false
          }), { status: 404, headers });
        }

        return new Response(JSON.stringify({
          lat: lat,
          lng: lng,
          radius: radius,
          results: results,
          count: results.length,
          statusCode: 200,
          success: true
        }), { status: 200, headers });
      }

      // Route lista completa comuni
      if (url.pathname === '/api/coordinates/list') {
        const cities = Object.values(citiesDatabase).sort((a, b) => 
          (b.population || 0) - (a.population || 0)
        );
        
        return new Response(JSON.stringify({
          totalCities: cities.length,
          province: "Rieti",
          region: "Lazio",
          cities: cities,
          statusCode: 200,
          success: true
        }), { status: 200, headers });
      }

      // Route non trovata
      return new Response(JSON.stringify({
        error: "Endpoint not found",
        statusCode: 404,
        availableEndpoints: [
          "/api/",
          "/api/coordinates/search?q={query}",
          "/api/coordinates/{cityname}",
          "/api/coordinates/reverse?lat={lat}&lng={lng}",
          "/api/coordinates/list"
        ],
        success: false
      }), { status: 404, headers });

    } catch (error) {
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error.message,
        statusCode: 500,
        success: false
      }), { status: 500, headers });
    }
  }
};