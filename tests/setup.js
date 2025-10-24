// Test setup file for Jest
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Let the system assign a free port for tests

// Global test timeout
jest.setTimeout(10000);

// Suppress console.log during tests (optional - can be removed if you want to see logs)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Keep error logs for debugging
};

// Mock external dependencies globally if needed
// For example, if you want to mock all axios calls by default:
// jest.mock('axios');