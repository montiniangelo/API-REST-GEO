const GeocodingService = require('../../src/services/GeocodingService');
const { ApiError } = require('../../src/models/Coordinate');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('GeocodingService Tests', () => {
  let geocodingService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance for each test
    geocodingService = new GeocodingService();
    
    // Mock axios.create to return our mocked axios instance
    mockedAxios.create.mockReturnValue(mockedAxios);
    
    // Setup default interceptors mock
    mockedAxios.interceptors = {
      response: {
        use: jest.fn()
      }
    };
  });

  describe('Constructor and initialization', () => {
    it('should initialize with correct default values', () => {
      const service = new GeocodingService();
      
      expect(service.baseUrl).toBe('https://nominatim.openstreetmap.org');
      expect(service.userAgent).toBe('api-coordinate/1.0');
      expect(service.timeout).toBe(10000);
    });

    it('should create axios client with correct configuration', () => {
      new GeocodingService();
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://nominatim.openstreetmap.org',
        timeout: 10000,
        headers: {
          'User-Agent': 'api-coordinate/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
        }
      });
    });
  });

  describe('searchCoordinates - Happy Path', () => {
    it('should successfully search coordinates for Roma', async () => {
      const mockResponse = {
        data: [
          {
            lat: '41.9028',
            lon: '12.4964',
            display_name: 'Roma, RM, Lazio, Italia',
            address: {
              city: 'Roma',
              province: 'RM',
              region: 'Lazio',
              country: 'Italia'
            }
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const results = await geocodingService.searchCoordinates('Roma');

      expect(results).toHaveLength(1);
      expect(results[0].latitude).toBe(41.9028);
      expect(results[0].longitude).toBe(12.4964);
      expect(results[0].city).toBe('Roma');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/search', {
        params: {
          q: 'Roma, Italia',
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'it',
          'accept-language': 'it'
        }
      });
    });

    it('should search with custom limit', async () => {
      const mockResponse = {
        data: [
          {
            lat: '45.4642',
            lon: '9.1900',
            display_name: 'Milano, Lombardia, Italia',
            address: { city: 'Milano', country: 'Italia' }
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await geocodingService.searchCoordinates('Milano', 5);

      expect(mockedAxios.get).toHaveBeenCalledWith('/search', 
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 5
          })
        })
      );
    });
  });

  describe('searchCoordinates - Input Validation', () => {
    it('should throw error for empty city name', async () => {
      await expect(geocodingService.searchCoordinates('')).rejects.toThrow(ApiError);
      await expect(geocodingService.searchCoordinates('')).rejects.toThrow('Il nome del comune non può essere vuoto');
    });

    it('should throw error for null city name', async () => {
      await expect(geocodingService.searchCoordinates(null)).rejects.toThrow(ApiError);
    });

    it('should throw error for invalid limit values', async () => {
      await expect(geocodingService.searchCoordinates('Roma', 0)).rejects.toThrow(ApiError);
      await expect(geocodingService.searchCoordinates('Roma', 11)).rejects.toThrow(ApiError);
      await expect(geocodingService.searchCoordinates('Roma', -1)).rejects.toThrow(ApiError);
    });

    it('should accept valid limit values', async () => {
      const mockResponse = { data: [] };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(geocodingService.searchCoordinates('Roma', 1)).rejects.toThrow('Nessun risultato trovato');
      await expect(geocodingService.searchCoordinates('Roma', 10)).rejects.toThrow('Nessun risultato trovato');
    });
  });

  describe('searchCoordinates - Error Handling', () => {
    it('should throw error when no results found', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      await expect(geocodingService.searchCoordinates('CittaInesistente123')).rejects.toThrow(ApiError);
      await expect(geocodingService.searchCoordinates('CittaInesistente123')).rejects.toThrow('Nessun risultato trovato per "CittaInesistente123"');
    });

    it('should filter out non-Italian results', async () => {
      const mockResponse = {
        data: [
          {
            lat: '40.7128',
            lon: '-74.0060',
            display_name: 'New York, NY, USA',
            address: { city: 'New York', country: 'United States' }
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(geocodingService.searchCoordinates('New York')).rejects.toThrow('Nessun comune italiano trovato');
    });

    it('should handle mixed results and return only Italian ones', async () => {
      const mockResponse = {
        data: [
          {
            lat: '40.7128',
            lon: '-74.0060',
            display_name: 'New York, NY, USA',
            address: { city: 'New York', country: 'United States' }
          },
          {
            lat: '41.9028',
            lon: '12.4964',
            display_name: 'Roma, RM, Lazio, Italia',
            address: { city: 'Roma', country: 'Italia' }
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const results = await geocodingService.searchCoordinates('Roma');
      
      expect(results).toHaveLength(1);
      expect(results[0].city).toBe('Roma');
    });
  });

  describe('findCoordinate method', () => {
    it('should return first coordinate when found', async () => {
      const mockResponse = {
        data: [
          {
            lat: '41.9028',
            lon: '12.4964',
            display_name: 'Roma, RM, Lazio, Italia',
            address: { city: 'Roma', country: 'Italia' }
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await geocodingService.findCoordinate('Roma');
      
      expect(result).not.toBeNull();
      expect(result.city).toBe('Roma');
    });

    it('should return null when no coordinate found', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await geocodingService.findCoordinate('CittaInesistente123');
      
      expect(result).toBeNull();
    });

    it('should rethrow non-404 errors', async () => {
      const mockError = new ApiError('Server error', 500);
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(geocodingService.findCoordinate('Roma')).rejects.toThrow('Server error');
    });
  });

  describe('reverseGeocode - Happy Path', () => {
    it('should successfully reverse geocode coordinates', async () => {
      const mockResponse = {
        data: {
          display_name: 'Roma, RM, Lazio, Italia',
          address: {
            city: 'Roma',
            province: 'RM',
            region: 'Lazio'
          }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await geocodingService.reverseGeocode(41.9028, 12.4964);
      
      expect(result.latitude).toBe(41.9028);
      expect(result.longitude).toBe(12.4964);
      expect(result.locationName).toBe('Roma, RM, Lazio');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/reverse', {
        params: {
          lat: 41.9028,
          lon: 12.4964,
          format: 'json',
          addressdetails: 1,
          'accept-language': 'it'
        }
      });
    });

    it('should handle different location types', async () => {
      const testCases = [
        { key: 'town', value: 'Tivoli' },
        { key: 'village', value: 'Castelnuovo' },
        { key: 'hamlet', value: 'Borgata' }
      ];

      for (const { key, value } of testCases) {
        const mockResponse = {
          data: {
            display_name: `${value}, Italia`,
            address: {
              [key]: value,
              region: 'Lazio'
            }
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await geocodingService.reverseGeocode(41.9, 12.5);
        expect(result.locationName).toBe(`${value}, Lazio`);
      }
    });
  });

  describe('reverseGeocode - Input Validation', () => {
    it('should validate latitude range', async () => {
      await expect(geocodingService.reverseGeocode(91, 12.4964)).rejects.toThrow('Latitudine non valida');
      await expect(geocodingService.reverseGeocode(-91, 12.4964)).rejects.toThrow('Latitudine non valida');
      await expect(geocodingService.reverseGeocode('invalid', 12.4964)).rejects.toThrow('Latitudine non valida');
    });

    it('should validate longitude range', async () => {
      await expect(geocodingService.reverseGeocode(41.9028, 181)).rejects.toThrow('Longitudine non valida');
      await expect(geocodingService.reverseGeocode(41.9028, -181)).rejects.toThrow('Longitudine non valida');
      await expect(geocodingService.reverseGeocode(41.9028, 'invalid')).rejects.toThrow('Longitudine non valida');
    });

    it('should accept valid coordinate ranges', async () => {
      const mockResponse = {
        data: {
          display_name: 'Test Location',
          address: { city: 'Test' }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(geocodingService.reverseGeocode(90, 180)).resolves.not.toThrow();
      await expect(geocodingService.reverseGeocode(-90, -180)).resolves.not.toThrow();
      await expect(geocodingService.reverseGeocode(0, 0)).resolves.not.toThrow();
    });
  });

  describe('reverseGeocode - Error Handling', () => {
    it('should handle API error responses', async () => {
      const mockResponse = {
        data: {
          error: 'Unable to geocode'
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(geocodingService.reverseGeocode(41.9, 12.5)).rejects.toThrow('Coordinate non trovate: Unable to geocode');
    });

    it('should handle missing display_name', async () => {
      const mockResponse = {
        data: {
          address: {}
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(geocodingService.reverseGeocode(41.9, 12.5)).rejects.toThrow('Nessuna località trovata');
    });
  });

  describe('cityExists method', () => {
    it('should return true for existing city', async () => {
      const mockResponse = {
        data: [
          {
            lat: '41.9028',
            lon: '12.4964',
            display_name: 'Roma, Italia',
            address: { city: 'Roma', country: 'Italia' }
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const exists = await geocodingService.cityExists('Roma');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing city', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const exists = await geocodingService.cityExists('CittaInesistente123');
      expect(exists).toBe(false);
    });

    it('should return false on API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const exists = await geocodingService.cityExists('Roma');
      expect(exists).toBe(false);
    });
  });

  describe('getSuggestions method', () => {
    it('should return empty array for short queries', async () => {
      const suggestions = await geocodingService.getSuggestions('R');
      expect(suggestions).toEqual([]);
    });

    it('should return city names from search results', async () => {
      const mockResponse = {
        data: [
          {
            lat: '41.9028',
            lon: '12.4964',
            display_name: 'Roma, RM, Lazio, Italia',
            address: { city: 'Roma', country: 'Italia' }
          },
          {
            lat: '41.8919',
            lon: '12.5113',
            display_name: 'Romolo, Roma, RM, Lazio, Italia',
            address: { city: 'Romolo', country: 'Italia' }
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const suggestions = await geocodingService.getSuggestions('Rom', 5);
      
      expect(suggestions).toHaveLength(2);
      expect(suggestions).toContain('Roma');
      expect(suggestions).toContain('Romolo');
    });

    it('should return empty array on API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const suggestions = await geocodingService.getSuggestions('Roma');
      expect(suggestions).toEqual([]);
    });

    it('should limit suggestions count', async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        lat: '41.9',
        lon: '12.5',
        display_name: `Roma${i}, Italia`,
        address: { city: `Roma${i}`, country: 'Italia' }
      }));

      mockedAxios.get.mockResolvedValue({ data: mockData });

      const suggestions = await geocodingService.getSuggestions('Roma', 3);
      expect(suggestions).toHaveLength(3);
    });
  });

  describe('GeocodingService timeout handling', () => {
    it('should handle timeout errors correctly', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';
      
      // Mock the interceptor behavior
      const service = new GeocodingService();
      
      // Simulate the interceptor throwing an ApiError for timeout
      mockedAxios.get.mockRejectedValue(new ApiError('Timeout nella richiesta al servizio di geocodifica', 408));

      await expect(service.searchCoordinates('Roma')).rejects.toThrow(ApiError);
      await expect(service.searchCoordinates('Roma')).rejects.toThrow('Timeout nella richiesta al servizio di geocodifica');
    });

    it('should handle network errors correctly', async () => {
      const networkError = new Error('Network Error');
      networkError.request = {};
      
      mockedAxios.get.mockRejectedValue(new ApiError('Impossibile raggiungere il servizio di geocodifica', 503));

      await expect(geocodingService.searchCoordinates('Roma')).rejects.toThrow('Impossibile raggiungere il servizio di geocodifica');
    });

    it('should handle HTTP response errors correctly', async () => {
      const httpError = new Error('Request failed');
      httpError.response = { status: 429 };
      
      mockedAxios.get.mockRejectedValue(new ApiError('Errore del servizio di geocodifica: 429', 429));

      await expect(geocodingService.searchCoordinates('Roma')).rejects.toThrow('Errore del servizio di geocodifica: 429');
    });

    it('should handle generic errors correctly', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Generic error'));

      await expect(geocodingService.searchCoordinates('Roma')).rejects.toThrow('Errore nella ricerca delle coordinate');
    });
  });
});