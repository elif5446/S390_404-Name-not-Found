// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
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


// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = ({ children, testID, ...props }) => (
    <View testID={testID || 'map-view'} {...props}>
      {children}
    </View>
  );
  
  const MockPolygon = ({ 
    testID, 
    accessibilityLabel, 
    coordinates,
    fillColor,
    strokeColor,
    strokeWidth,
    ...props 
  }) => (
    <View 
      testID={testID || 'polygon'} 
      accessibilityLabel={accessibilityLabel}
      data-coordinates={JSON.stringify(coordinates)}
      data-fill-color={fillColor}
      data-stroke-color={strokeColor}
      data-stroke-width={strokeWidth}
      {...props} 
    />
  );
  
  return {
    __esModule: true,
    default: MockMapView,
    Polygon: MockPolygon,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock useUserLocation hook
jest.mock('@/src/hooks/useUserLocation', () => ({
  useUserLocation: jest.fn(() => ({
    location: { latitude: 45.49599, longitude: -73.57854 },
    error: null,
    loading: false,
  })),
}));

// Mock useColorScheme
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
  __esModule: true,
}));

// Mock geo utility functions
jest.mock('@/src/utils/geo', () => ({
  polygonFromGeoJSON: jest.fn((coords) =>
    coords.map(([longitude, latitude]) => ({ latitude, longitude }))
  ),
}));



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