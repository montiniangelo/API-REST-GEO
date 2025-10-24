const { Coordinate, ReverseGeocodeResponse, ApiError } = require('../../src/models/Coordinate');

describe('Coordinate Model Tests', () => {
  
  describe('Valid coordinate creation', () => {
    it('should create a valid coordinate with all properties', () => {
      const coordinateData = {
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: 'Roma, RM, Lazio, Italia',
        city: 'Roma',
        province: 'RM',
        region: 'Lazio',
        country: 'Italia'
      };

      const coordinate = new Coordinate(coordinateData);

      expect(coordinate.latitude).toBe(41.9028);
      expect(coordinate.longitude).toBe(12.4964);
      expect(coordinate.displayName).toBe('Roma, RM, Lazio, Italia');
      expect(coordinate.city).toBe('Roma');
      expect(coordinate.province).toBe('RM');
      expect(coordinate.region).toBe('Lazio');
      expect(coordinate.country).toBe('Italia');
    });

    it('should create coordinate with minimal properties', () => {
      const coordinate = new Coordinate({
        latitude: '45.4642',
        longitude: '9.1900',
        displayName: 'Milano, Italia'
      });

      expect(coordinate.latitude).toBe(45.4642);
      expect(coordinate.longitude).toBe(9.1900);
      expect(coordinate.city).toBeNull();
      expect(coordinate.province).toBeNull();
      expect(coordinate.region).toBeNull();
      expect(coordinate.country).toBe('Italia');
    });
  });

  describe('fromNominatimData static method', () => {
    it('should correctly parse Nominatim data with complete address', () => {
      const nominatimData = {
        lat: '41.9028',
        lon: '12.4964',
        display_name: 'Roma, RM, Lazio, Italia',
        address: {
          city: 'Roma',
          province: 'RM',
          region: 'Lazio',
          country: 'Italia'
        }
      };

      const coordinate = Coordinate.fromNominatimData(nominatimData);

      expect(coordinate.latitude).toBe(41.9028);
      expect(coordinate.longitude).toBe(12.4964);
      expect(coordinate.city).toBe('Roma');
      expect(coordinate.province).toBe('RM');
      expect(coordinate.region).toBe('Lazio');
      expect(coordinate.country).toBe('Italia');
    });

    it('should handle missing address data gracefully', () => {
      const nominatimData = {
        lat: '45.4642',
        lon: '9.1900',
        display_name: 'Milano, Italia'
      };

      const coordinate = Coordinate.fromNominatimData(nominatimData);

      expect(coordinate.latitude).toBe(45.4642);
      expect(coordinate.longitude).toBe(9.1900);
      expect(coordinate.city).toBeNull();
      expect(coordinate.province).toBeNull();
      expect(coordinate.region).toBeNull();
      expect(coordinate.country).toBe('Italia');
    });

    it('should extract city from different address keys', () => {
      const testCases = [
        { addressKey: 'city', value: 'Roma' },
        { addressKey: 'town', value: 'Tivoli' },
        { addressKey: 'village', value: 'Castelnuovo' },
        { addressKey: 'hamlet', value: 'Borgata' }
      ];

      testCases.forEach(({ addressKey, value }) => {
        const nominatimData = {
          lat: '41.9028',
          lon: '12.4964',
          display_name: `${value}, Italia`,
          address: {
            [addressKey]: value,
            country: 'Italia'
          }
        };

        const coordinate = Coordinate.fromNominatimData(nominatimData);
        expect(coordinate.city).toBe(value);
      });
    });
  });

  describe('Invalid latitude validation', () => {
    it('should identify invalid coordinates with latitude out of range', () => {
      const invalidCoords = [
        new Coordinate({ latitude: 91, longitude: 0, displayName: 'Test' }),
        new Coordinate({ latitude: -91, longitude: 0, displayName: 'Test' }),
        new Coordinate({ latitude: 200, longitude: 0, displayName: 'Test' })
      ];

      invalidCoords.forEach(coord => {
        expect(coord.isValid()).toBe(false);
      });
    });

    it('should identify valid coordinates with latitude in range', () => {
      const validCoords = [
        new Coordinate({ latitude: 90, longitude: 0, displayName: 'Test' }),
        new Coordinate({ latitude: -90, longitude: 0, displayName: 'Test' }),
        new Coordinate({ latitude: 0, longitude: 0, displayName: 'Test' }),
        new Coordinate({ latitude: 41.9028, longitude: 12.4964, displayName: 'Test' })
      ];

      validCoords.forEach(coord => {
        expect(coord.isValid()).toBe(true);
      });
    });
  });

  describe('Invalid longitude validation', () => {
    it('should identify invalid coordinates with longitude out of range', () => {
      const invalidCoords = [
        new Coordinate({ latitude: 0, longitude: 181, displayName: 'Test' }),
        new Coordinate({ latitude: 0, longitude: -181, displayName: 'Test' }),
        new Coordinate({ latitude: 0, longitude: 360, displayName: 'Test' })
      ];

      invalidCoords.forEach(coord => {
        expect(coord.isValid()).toBe(false);
      });
    });

    it('should identify valid coordinates with longitude in range', () => {
      const validCoords = [
        new Coordinate({ latitude: 0, longitude: 180, displayName: 'Test' }),
        new Coordinate({ latitude: 0, longitude: -180, displayName: 'Test' }),
        new Coordinate({ latitude: 0, longitude: 0, displayName: 'Test' }),
        new Coordinate({ latitude: 41.9028, longitude: 12.4964, displayName: 'Test' })
      ];

      validCoords.forEach(coord => {
        expect(coord.isValid()).toBe(true);
      });
    });
  });

  describe('Empty city name extraction', () => {
    it('should return city name when available', () => {
      const coordinate = new Coordinate({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: 'Roma, RM, Lazio, Italia',
        city: 'Roma'
      });

      expect(coordinate.getCityName()).toBe('Roma');
    });

    it('should extract city from display name when city is null', () => {
      const coordinate = new Coordinate({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: 'Roma, RM, Lazio, Italia',
        city: null
      });

      expect(coordinate.getCityName()).toBe('Roma');
    });

    it('should return fallback when both city and displayName are empty', () => {
      const coordinate = new Coordinate({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: '',
        city: null
      });

      expect(coordinate.getCityName()).toBe('Comune trovato');
    });

    it('should handle displayName with extra spaces', () => {
      const coordinate = new Coordinate({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: '  Milano  , Lombardia, Italia',
        city: null
      });

      expect(coordinate.getCityName()).toBe('Milano');
    });
  });

  describe('Google Maps URL generation', () => {
    it('should generate correct Google Maps URL', () => {
      const coordinate = new Coordinate({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: 'Roma, Italia'
      });

      const expectedUrl = 'https://www.google.com/maps?q=41.9028,12.4964';
      expect(coordinate.toGoogleMapsUrl()).toBe(expectedUrl);
    });

    it('should handle negative coordinates', () => {
      const coordinate = new Coordinate({
        latitude: -33.8568,
        longitude: 151.2153,
        displayName: 'Sydney, Australia'
      });

      const expectedUrl = 'https://www.google.com/maps?q=-33.8568,151.2153';
      expect(coordinate.toGoogleMapsUrl()).toBe(expectedUrl);
    });
  });

  describe('JSON serialization', () => {
    it('should serialize to JSON correctly', () => {
      const coordinate = new Coordinate({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: 'Roma, RM, Lazio, Italia',
        city: 'Roma',
        province: 'RM',
        region: 'Lazio'
      });

      const json = coordinate.toJSON();

      expect(json).toEqual({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: 'Roma, RM, Lazio, Italia',
        city: 'Roma',
        province: 'RM',
        region: 'Lazio',
        country: 'Italia'
      });
    });
  });

  describe('toString method', () => {
    it('should return formatted string representation', () => {
      const coordinate = new Coordinate({
        latitude: 41.9028,
        longitude: 12.4964,
        displayName: 'Roma, RM, Lazio, Italia',
        city: 'Roma'
      });

      expect(coordinate.toString()).toBe('Roma (41.9028, 12.4964)');
    });
  });
});

describe('ReverseGeocodeResponse Model Tests', () => {
  
  describe('Construction and JSON serialization', () => {
    it('should create ReverseGeocodeResponse with all properties', () => {
      const response = new ReverseGeocodeResponse({
        latitude: 41.9028,
        longitude: 12.4964,
        locationName: 'Roma, RM, Lazio',
        accuracy: 10
      });

      expect(response.latitude).toBe(41.9028);
      expect(response.longitude).toBe(12.4964);
      expect(response.locationName).toBe('Roma, RM, Lazio');
      expect(response.accuracy).toBe(10);
    });

    it('should handle null accuracy', () => {
      const response = new ReverseGeocodeResponse({
        latitude: 41.9028,
        longitude: 12.4964,
        locationName: 'Roma, RM, Lazio'
      });

      const json = response.toJSON();
      expect(json).toEqual({
        latitude: 41.9028,
        longitude: 12.4964,
        locationName: 'Roma, RM, Lazio'
      });
      expect(json).not.toHaveProperty('accuracy');
    });

    it('should include accuracy in JSON when provided', () => {
      const response = new ReverseGeocodeResponse({
        latitude: 41.9028,
        longitude: 12.4964,
        locationName: 'Roma, RM, Lazio',
        accuracy: 15
      });

      const json = response.toJSON();
      expect(json).toEqual({
        latitude: 41.9028,
        longitude: 12.4964,
        locationName: 'Roma, RM, Lazio',
        accuracy: 15
      });
    });
  });
});

describe('ApiError Model Tests', () => {
  
  describe('ApiError JSON serialization', () => {
    it('should create ApiError with default values', () => {
      const error = new ApiError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBeNull();
      expect(error.name).toBe('ApiError');
      expect(error.timestamp).toBeDefined();
    });

    it('should create ApiError with custom status code', () => {
      const error = new ApiError('Not found', 404, 'CITY_NOT_FOUND');

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('CITY_NOT_FOUND');
    });

    it('should serialize to JSON correctly', () => {
      const error = new ApiError('Test error', 400, 'VALIDATION_ERROR');
      const json = error.toJSON();

      expect(json).toHaveProperty('error', 'Bad Request');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('statusCode', 400);
      expect(json).toHaveProperty('errorCode', 'VALIDATION_ERROR');
      expect(json).toHaveProperty('timestamp');
    });

    it('should return correct error types for different status codes', () => {
      const testCases = [
        { statusCode: 400, expected: 'Bad Request' },
        { statusCode: 401, expected: 'Unauthorized' },
        { statusCode: 403, expected: 'Forbidden' },
        { statusCode: 404, expected: 'Not Found' },
        { statusCode: 429, expected: 'Too Many Requests' },
        { statusCode: 500, expected: 'Internal Server Error' },
        { statusCode: 502, expected: 'Bad Gateway' },
        { statusCode: 503, expected: 'Service Unavailable' },
        { statusCode: 999, expected: 'Error' }
      ];

      testCases.forEach(({ statusCode, expected }) => {
        const error = new ApiError('Test', statusCode);
        expect(error.getErrorType()).toBe(expected);
      });
    });
  });
});