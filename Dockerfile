# Usa l'immagine ufficiale di Node.js
FROM node:18-alpine AS build

# Installa dipendenze di sistema necessarie
RUN apk add --no-cache curl

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione delle dipendenze
COPY package*.json ./

# Installa le dipendenze di produzione
RUN npm ci --only=production && npm cache clean --force

# Copia il codice sorgente
COPY . .

# Crea un utente non-root per la sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambia proprietà dei file all'utente nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Espone la porta 8080
EXPOSE 8080

# Imposta le variabili di ambiente
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Comando di avvio
CMD ["node", "server.js"]