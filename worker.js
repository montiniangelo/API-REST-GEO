import { app } from './src/app.js';

// Export per Cloudflare Workers
export default {
  async fetch(request, env) {
    // Configura le variabili d'ambiente per l'app Express
    process.env.NODE_ENV = env.NODE_ENV || 'production';
    process.env.PORT = env.PORT || '8080';
    
    // Gestisce la richiesta tramite Express app
    return await handleRequest(request, app);
  }
};

// Adapter per convertire Request/Response di Cloudflare Workers in formato Express
async function handleRequest(request, app) {
  const url = new URL(request.url);
  
  // Crea un oggetto req compatibile con Express
  const req = {
    method: request.method,
    url: url.pathname + url.search,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(request.headers),
    body: request.method !== 'GET' && request.method !== 'HEAD' 
      ? await request.text() 
      : undefined,
    protocol: url.protocol.slice(0, -1),
    get: function(name) { return this.headers[name.toLowerCase()]; }
  };

  // Crea un oggetto res compatibile con Express
  let statusCode = 200;
  let responseHeaders = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  let responseBody = '';

  const res = {
    statusCode: 200,
    headersSent: false,
    locals: {},
    status: function(code) { statusCode = code; return this; },
    json: function(data) { 
      responseBody = JSON.stringify(data);
      return this;
    },
    send: function(data) {
      responseBody = typeof data === 'string' ? data : JSON.stringify(data);
      return this;
    },
    set: function(name, value) {
      responseHeaders.set(name, value);
      return this;
    },
    header: function(name, value) { return this.set(name, value); },
    end: function(data) {
      if (data) responseBody = data;
    }
  };

  try {
    // Simula Express middleware/routing
    if (url.pathname.startsWith('/api/')) {
      // Usa l'app Express esistente
      await new Promise((resolve) => {
        const mockResponse = {
          ...res,
          end: function(data) {
            if (data) responseBody = data;
            resolve();
          }
        };
        app(req, mockResponse);
      });
    } else {
      // Route di default
      res.status(404).json({ error: 'Endpoint not found' });
    }

    return new Response(responseBody, {
      status: statusCode,
      headers: responseHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}