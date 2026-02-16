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

// ... your existing mocks ...

// Mock @react-native-segmented-control/segmented-control (iOS)
jest.mock('@react-native-segmented-control/segmented-control', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  
  return {
    __esModule: true,
    default: ({ values, selectedIndex, onChange, testID, ...props }) => (
      <View testID={testID || 'segmented-control'} {...props}>
        {values.map((value, index) => (
          <TouchableOpacity
            key={value}
            testID={`segment-${index}`}
            onPress={() => {
              if (onChange) {
                onChange({ nativeEvent: { selectedSegmentIndex: index } });
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: index === selectedIndex }}
          >
            <Text>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
  };
});

// Mock react-native-paper (Android)
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  
  return {
    SegmentedButtons: ({ buttons, value, onValueChange, testID }) => (
      <View testID={testID || 'segmented-buttons'}>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button.value}
            testID={`segment-button-${button.value}`}
            onPress={() => onValueChange(button.value)}
            accessibilityLabel={button.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: button.value === value }}
          >
            <Text>{button.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    BlurView: ({ children, testID, ...props }) => (
      <View testID={testID || 'blur-view'} {...props}>
        {children}
      </View>
    ),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
  SafeAreaProvider: ({ children }) => children,
}));