# 🚀 Deployment su Cloudflare

## Opzione 1: Cloudflare Workers (Consigliata per API REST)

### Prerequisiti
1. Account Cloudflare (gratuito)
2. Node.js installato
3. API funzionante localmente

### Setup Iniziale

1. **Installa Wrangler CLI**:
```bash
npm install -g wrangler
# oppure usa npx wrangler invece di wrangler negli esempi seguenti
```

2. **Installa le dipendenze del progetto**:
```bash
npm install
```

3. **Login in Cloudflare**:
```bash
wrangler login
```

4. **Configura il progetto**:
   - Modifica `wrangler.toml` con il nome desiderato per la tua API
   - Il file è già configurato per il tuo progetto

### Deployment

1. **Test in sviluppo locale**:
```bash
npm run workers:dev
# La tua API sarà disponibile su http://localhost:8787
```

2. **Deploy in staging**:
```bash
npm run deploy:staging
```

3. **Deploy in production**:
```bash
npm run deploy
```

### URL della tua API
Dopo il deployment, la tua API sarà disponibile a:
```
https://api-coordinate.YOUR-SUBDOMAIN.workers.dev
```

### Endpoint disponibili:
- `GET /api/` - Documentazione
- `GET /api/health` - Status
- `GET /api/coordinates/search?q=Roma` - Ricerca
- `GET /api/coordinates/Milano` - Coordinate dirette
- `GET /api/coordinates/reverse?lat=41.9&lng=12.5` - Reverse geocoding

---

## Opzione 2: Cloudflare Pages + Functions

### Per siti statici con API functions

1. **Connetti repository a Cloudflare Pages**:
   - Vai su https://dash.cloudflare.com
   - Pages > Create a project > Connect to Git
   - Seleziona il tuo repository

2. **Configurazione build**:
   - Framework preset: None
   - Build command: `npm run build` (se hai un build step)
   - Build output directory: `/public` (per file statici)

3. **Deploy automatico**:
   - Ogni push su main branch triggera un deploy automatico

---

## Verifica Deployment

Dopo il deployment, testa la tua API:

```bash
# Test endpoint principale
curl https://api-coordinate.YOUR-SUBDOMAIN.workers.dev/api/

# Test ricerca coordinate
curl "https://api-coordinate.YOUR-SUBDOMAIN.workers.dev/api/coordinates/search?q=Roma"

# Test coordinate dirette
curl https://api-coordinate.YOUR-SUBDOMAIN.workers.dev/api/coordinates/Milano
```

## Monitoring e Logs

1. **Dashboard Cloudflare**: 
   - Vai su https://dash.cloudflare.com
   - Workers & Pages > tua-api > Metrics

2. **Logs in real-time**:
```bash
wrangler tail
```

3. **Analytics**: Disponibili nel dashboard Cloudflare

## Limiti Gratuiti Cloudflare Workers

- **100,000 richieste/giorno** (gratuito)
- **10 ms CPU time** per richiesta
- **128 MB memoria**
- **1 MB response size**

Per maggiori richieste, considera il piano a pagamento ($5/mese per 10M richieste).