/**
 * Modello per rappresentare le coordinate di un comune
 */
class Coordinate {
  constructor({
    latitude,
    longitude,
    displayName,
    city = null,
    province = null,
    region = null,
    country = 'Italia'
  }) {
    this.latitude = parseFloat(latitude);
    this.longitude = parseFloat(longitude);
    this.displayName = displayName;
    this.city = city;
    this.province = province;
    this.region = region;
    this.country = country;
  }

  /**
   * Crea un oggetto Coordinate da dati JSON di Nominatim
   * @param {Object} nominatimData - Dati restituiti da Nominatim API
   * @returns {Coordinate}
   */
  static fromNominatimData(nominatimData) {
    const address = nominatimData.address || {};
    
    return new Coordinate({
      latitude: nominatimData.lat,
      longitude: nominatimData.lon,
      displayName: nominatimData.display_name || '',
      city: Coordinate._extractCity(address),
      province: address.province || null,
      region: address.region || null,
      country: address.country || 'Italia'
    });
  }

  /**
   * Estrae il nome della città dall'indirizzo di Nominatim
   * @param {Object} address - Oggetto address da Nominatim
   * @returns {string|null}
   */
  static _extractCity(address) {
    const cityKeys = ['city', 'town', 'village', 'hamlet'];
    for (const key of cityKeys) {
      if (address[key]) {
        return address[key];
      }
    }
    return null;
  }

  /**
   * Converte in oggetto per serializzazione JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      displayName: this.displayName,
      city: this.city,
      province: this.province,
      region: this.region,
      country: this.country
    };
  }

  /**
   * Estrae solo il nome della città dal display_name
   * @returns {string}
   */
  getCityName() {
    if (this.city) {
      return this.city;
    }
    
    // Fallback: estrae il primo elemento dal display_name
    if (this.displayName) {
      return this.displayName.split(',')[0].trim();
    }
    
    return 'Comune trovato';
  }

  /**
   * Valida le coordinate
   * @returns {boolean}
   */
  isValid() {
    return (
      this.latitude >= -90 && this.latitude <= 90 &&
      this.longitude >= -180 && this.longitude <= 180
    );
  }

  /**
   * Restituisce le coordinate formattate per Google Maps
   * @returns {string}
   */
  toGoogleMapsUrl() {
    return `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
  }

  toString() {
    return `${this.getCityName()} (${this.latitude}, ${this.longitude})`;
  }
}

/**
 * Classe per rappresentare una risposta di reverse geocoding
 */
class ReverseGeocodeResponse {
  constructor({
    latitude,
    longitude,
    locationName,
    accuracy = null
  }) {
    this.latitude = parseFloat(latitude);
    this.longitude = parseFloat(longitude);
    this.locationName = locationName;
    this.accuracy = accuracy;
  }

  toJSON() {
    const result = {
      latitude: this.latitude,
      longitude: this.longitude,
      locationName: this.locationName
    };

    if (this.accuracy !== null) {
      result.accuracy = this.accuracy;
    }

    return result;
  }
}

/**
 * Classe per rappresentare errori dell'API
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: this.getErrorType(),
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp
    };
  }

  getErrorType() {
    switch (this.statusCode) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 429: return 'Too Many Requests';
      case 500: return 'Internal Server Error';
      case 502: return 'Bad Gateway';
      case 503: return 'Service Unavailable';
      default: return 'Error';
    }
  }
}

module.exports = {
  Coordinate,
  ReverseGeocodeResponse,
  ApiError
};