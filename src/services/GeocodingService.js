const axios = require('axios');
const { Coordinate, ReverseGeocodeResponse, ApiError } = require('../models/Coordinate');

/**
 * Servizio per la geocodifica tramite Nominatim OpenStreetMap
 */
class GeocodingService {
  constructor() {
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'api-coordinate/1.0';
    this.timeout = 10000; // 10 secondi
    
    // Configura axios con impostazioni predefinite
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
      }
    });

    // Interceptor per gestire errori HTTP
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNABORTED') {
          throw new ApiError('Timeout nella richiesta al servizio di geocodifica', 408);
        }
        if (error.response) {
          throw new ApiError(
            `Errore del servizio di geocodifica: ${error.response.status}`,
            error.response.status
          );
        }
        if (error.request) {
          throw new ApiError('Impossibile raggiungere il servizio di geocodifica', 503);
        }
        throw new ApiError('Errore nella richiesta di geocodifica', 500);
      }
    );
  }

  /**
   * Cerca le coordinate di un comune italiano
   * @param {string} cityName - Nome del comune da cercare
   * @param {number} limit - Numero massimo di risultati (default: 1)
   * @returns {Promise<Coordinate[]>}
   */
  async searchCoordinates(cityName, limit = 1) {
    if (!cityName || cityName.trim().length === 0) {
      throw new ApiError('Il nome del comune non può essere vuoto', 400);
    }

    if (limit < 1 || limit > 10) {
      throw new ApiError('Il parametro limit deve essere tra 1 e 10', 400);
    }

    try {
      const query = `${cityName.trim()}, Italia`;
      
      const response = await this.client.get('/search', {
        params: {
          q: query,
          format: 'json',
          limit: limit,
          addressdetails: 1,
          countrycodes: 'it', // Limita la ricerca all'Italia
          'accept-language': 'it'
        }
      });

      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) {
        throw new ApiError(`Nessun risultato trovato per "${cityName}"`, 404);
      }

      // Filtra i risultati per assicurarsi che siano in Italia
      const italianResults = data.filter(item => {
        const address = item.address || {};
        return address.country === 'Italia' || address.country === 'Italy';
      });

      if (italianResults.length === 0) {
        throw new ApiError(`Nessun comune italiano trovato per "${cityName}"`, 404);
      }

      return italianResults.map(item => Coordinate.fromNominatimData(item));

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Errore in searchCoordinates:', error);
      throw new ApiError('Errore nella ricerca delle coordinate', 500);
    }
  }

  /**
   * Trova le coordinate del primo risultato per un comune
   * @param {string} cityName - Nome del comune
   * @returns {Promise<Coordinate|null>}
   */
  async findCoordinate(cityName) {
    try {
      const results = await this.searchCoordinates(cityName, 1);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null; // Nessun risultato trovato
      }
      throw error; // Rilancia altri errori
    }
  }

  /**
   * Reverse geocoding: ottiene informazioni sulla località dalle coordinate
   * @param {number} latitude - Latitudine
   * @param {number} longitude - Longitudine
   * @returns {Promise<ReverseGeocodeResponse>}
   */
  async reverseGeocode(latitude, longitude) {
    // Validazione coordinate
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new ApiError('Latitudine non valida (deve essere tra -90 e 90)', 400);
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new ApiError('Longitudine non valida (deve essere tra -180 e 180)', 400);
    }

    try {
      const response = await this.client.get('/reverse', {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          'accept-language': 'it'
        }
      });

      const data = response.data;

      if (data.error) {
        throw new ApiError(`Coordinate non trovate: ${data.error}`, 404);
      }

      if (!data.display_name) {
        throw new ApiError('Nessuna località trovata per le coordinate fornite', 404);
      }

      // Estrae il nome della località
      const address = data.address || {};
      const locationParts = [];

      // Priorità: città, paese, frazione, stato
      const cityKeys = ['city', 'town', 'village', 'hamlet'];
      for (const key of cityKeys) {
        if (address[key]) {
          locationParts.push(address[key]);
          break;
        }
      }

      if (address.province) {
        locationParts.push(address.province);
      }

      if (address.region) {
        locationParts.push(address.region);
      }

      const locationName = locationParts.length > 0 
        ? locationParts.join(', ') 
        : data.display_name.split(',')[0].trim();

      return new ReverseGeocodeResponse({
        latitude: lat,
        longitude: lng,
        locationName: locationName
      });

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Errore in reverseGeocode:', error);
      throw new ApiError('Errore nel reverse geocoding', 500);
    }
  }

  /**
   * Controlla se un comune esiste
   * @param {string} cityName - Nome del comune
   * @returns {Promise<boolean>}
   */
  async cityExists(cityName) {
    try {
      const coordinate = await this.findCoordinate(cityName);
      return coordinate !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cerca comuni simili (per suggerimenti)
   * @param {string} partialName - Nome parziale del comune
   * @param {number} limit - Numero massimo di suggerimenti
   * @returns {Promise<string[]>}
   */
  async getSuggestions(partialName, limit = 5) {
    if (!partialName || partialName.trim().length < 2) {
      return [];
    }

    try {
      const results = await this.searchCoordinates(partialName, Math.min(limit, 10));
      return results.map(coord => coord.getCityName());
    } catch (error) {
      console.warn('Errore nel recupero dei suggerimenti:', error.message);
      return [];
    }
  }
}

module.exports = GeocodingService;