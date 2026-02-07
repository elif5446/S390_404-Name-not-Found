// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

// Mock expo core modules
jest.mock('expo', () => ({
  __esModule: true,
}));

// Mock expo module registry
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Mock structuredClone
global.structuredClone = jest.fn((obj) => JSON.parse(JSON.stringify(obj)));

// Suppress act() warnings
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update to') &&
    args[0].includes('was not wrapped in act')
  ) {
    return;
  }
  originalError.call(console, ...args);
};