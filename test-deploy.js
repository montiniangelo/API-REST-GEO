#!/usr/bin/env node

/**
 * Script per testare l'API deployata su Cloudflare
 * Usage: node test-deploy.js [YOUR-API-URL]
 */

const https = require('https');

// URL della tua API (modifica questo dopo il deployment)
const BASE_URL = process.argv[2] || 'https://api-coordinate.YOUR-SUBDOMAIN.workers.dev';

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = BASE_URL + path;
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 URL: ${url}`);
    
    const start = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - start;
        
        try {
          const json = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`⏱️  Duration: ${duration}ms`);
          console.log(`📄 Content-Type: ${res.headers['content-type']}`);
          console.log(`📊 Response:`, JSON.stringify(json, null, 2).substring(0, 200) + '...');
          resolve({ success: true, status: res.statusCode, data: json });
        } catch (error) {
          console.log(`❌ Invalid JSON response`);
          console.log(`📄 Raw response:`, data.substring(0, 200) + '...');
          resolve({ success: false, status: res.statusCode, error: error.message });
        }
      });
      
    }).on('error', (err) => {
      console.log(`❌ Request failed: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

async function runTests() {
  console.log('🚀 Testing API REST su Cloudflare');
  console.log('=' .repeat(50));
  
  const tests = [
    { path: '/api/', description: 'API Documentation' },
    { path: '/api/health', description: 'Health Check' },
    { path: '/api/coordinates/search?q=Roma', description: 'Search Roma' },
    { path: '/api/coordinates/Milano', description: 'Direct Milano coordinates' },
    { path: '/api/coordinates/reverse?lat=41.9028&lng=12.4964', description: 'Reverse Geocoding Roma' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.description);
    
    if (result.success && result.status === 200) {
      passed++;
    } else {
      failed++;
    }
    
    // Pausa tra i test per evitare rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! Your API is working correctly on Cloudflare!');
    console.log('✅ JSON responses are working properly');
  } else {
    console.log('⚠️  Some tests failed. Check the deployment configuration.');
  }
}

runTests().catch(console.error);