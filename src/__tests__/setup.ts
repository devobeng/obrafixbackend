// Test setup file for Jest
import dotenv from "dotenv";

// Load environment variables for testing
dotenv.config({ path: ".env.test" });

// Set test environment
process.env["NODE_ENV"] = "test";

// Mock console methods in tests to reduce noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console output during tests
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test timeout
jest.setTimeout(10000);

// Mock MongoDB connection for tests
jest.mock("../config/database", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));
