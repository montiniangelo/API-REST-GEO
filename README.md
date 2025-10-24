# 🌍 Coordinate Comuni Italiani - Web App

Una web app semplice e moderna per ottenere le coordinate geografiche (latitudine e longitudine) dei comuni italiani.

## 🚀 Caratteristiche

- **Interfaccia moderna**: Design responsive e user-friendly
- **Ricerca rapida**: Inserisci il nome del comune e ottieni immediatamente le coordinate
- **📍 Geolocalizzazione GPS**: Ottieni le coordinate della tua posizione attuale con un click
- **Reverse geocoding**: Mostra il nome del luogo corrispondente alle coordinate GPS
- **Precisione GPS**: Visualizza l'accuratezza della posizione rilevata
- **Copia negli appunti**: Copia facilmente le coordinate con un click
- **Google Maps integration**: Apri direttamente la posizione su Google Maps
- **API affidabile**: Utilizza OpenStreetMap Nominatim per dati accurati
- **Mobile-first**: Ottimizzata per dispositivi mobili

## 🛠️ Tecnologie utilizzate

- **HTML5** - Struttura semantica
- **CSS3** - Design moderno con gradiente e animazioni
- **Vanilla JavaScript** - Logica dell'applicazione senza dipendenze
- **OpenStreetMap Nominatim API** - Servizio di geocodifica

## 📱 Come utilizzare

### 🔍 Ricerca per nome comune:
1. Inserisci il nome di un comune italiano nel campo di ricerca
2. Clicca "Cerca" o premi Enter

### 📍 Usa la tua posizione GPS:
1. Clicca il bottone "La mia posizione" 
2. Autorizza l'accesso alla posizione quando richiesto
3. Attendi che il GPS rilevi la tua posizione

### 📋 Gestione risultati:
- Visualizza le coordinate precise
- Vedi il nome del luogo e la precisione GPS
- Utilizza i pulsanti per:
  - Copiare singole coordinate
  - Copiare entrambe le coordinate
  - Aprire la posizione su Google Maps

## 🚀 Deploy su Cloudflare Pages

### Opzione 1: Deploy diretto da GitHub

1. Crea un repository su GitHub
2. Carica tutti i file della web app
3. Vai su [Cloudflare Pages](https://pages.cloudflare.com/)
4. Clicca "Create a project"
5. Connetti il tuo repository GitHub
6. Configura il build:
   - **Framework preset**: None
   - **Build command**: (lascia vuoto)
   - **Build output directory**: /
7. Clicca "Save and Deploy"

### Opzione 2: Upload diretto

1. Vai su [Cloudflare Pages](https://pages.cloudflare.com/)
2. Clicca "Upload assets"
3. Trascina tutti i file della web app (escludendo README.md)
4. La tua app sarà disponibile immediatamente

## 📁 Struttura del progetto

```
coordinate/
├── index.html          # Pagina principale
├── styles.css          # Stili CSS
├── script.js           # Logica JavaScript
├── _headers            # Headers di sicurezza per Cloudflare
├── _redirects          # Configurazione redirects
└── README.md           # Documentazione
```

## 🔧 Configurazione Headers di Sicurezza

Il file `_headers` include:
- **CSP**: Content Security Policy per la sicurezza
- **X-Frame-Options**: Protezione contro clickjacking
- **Cache-Control**: Ottimizzazione della cache
- **CORS**: Configurato per l'API Nominatim

## 🌐 API utilizzata

La web app utilizza l'API gratuita di **OpenStreetMap Nominatim**:
- Endpoint: `https://nominatim.openstreetmap.org/search`
- Formato: JSON
- Rate limit: Rispettato con un User-Agent appropriato
- Dati: Open source e aggiornati dalla community OSM

## 📊 Esempi di utilizzo

### Ricerche supportate:
- **Comuni**: "Roma", "Milano", "Napoli"
- **Con provincia**: "Monza, MB", "Como, CO"
- **Frazioni**: "Portofino", "Bellagio"

### Output formato:
```
Latitudine: 41.902783
Longitudine: 12.496366
```

## 🔄 Aggiornamenti futuri possibili

- [ ] Autocompletamento dei comuni
- [ ] Storico delle ricerche
- [ ] Export in formato CSV/JSON
- [ ] Integrazione con altre mappe
- [ ] Modalità dark/light
- [ ] PWA (Progressive Web App)

## 📝 Note tecniche

- **Performance**: Ottimizzata per Cloudflare CDN
- **SEO**: Meta tag appropriati per la ricerca
- **Accessibility**: Supporto per screen reader
- **Browser support**: Moderni browser (ES6+)

## 📄 Licenza

Questo progetto è open source. I dati geografici sono forniti da OpenStreetMap sotto licenza ODbL.

---

Made with ❤️ for Italian municipalities