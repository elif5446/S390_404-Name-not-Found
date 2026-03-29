import { View, ViewProps } from "react-native";
import { ReactNode } from "react";

interface LatLng {
  latitude: number;
  longitude: number;
}
interface MockPolygonProps extends ViewProps {
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  coordinates?: LatLng[];
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [] }),
  } as Response)
) as jest.Mock;

// Mock expo-location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

// Mock expo core modules
jest.mock("expo", () => ({
  __esModule: true,
}));

(globalThis as any).__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};
interface ExpoImportMetaRegistry {
  register: jest.Mock;
  get: jest.Mock;
}
declare global {
  interface Window {
    __ExpoImportMetaRegistry?: ExpoImportMetaRegistry;
  }
}

// Mock expo module registry
globalThis.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Mock structuredClone
// Fix: for 'Prefer structuredClone over JSON.parse(JSON.stringify)'
// Includes providing a mock implementation that doesn't use the json hack
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = jest.fn((obj) => {
    if (obj === undefined) return undefined;

    // for a mock in test environment, a simple spread or
    // structured copy is preferred over json stringify
    return typeof obj === 'object' ? { ...obj } : obj;
  });
} else {
  // ff it exists, we just make it a mockable spy
  globalThis.structuredClone = jest.fn(globalThis.structuredClone);
}

const originalError = console.error;
console.error = (...args) => {
  const firstArg = args[0];
  let message = "";

  if (typeof firstArg === "string") {
    message = firstArg;
  } else if (firstArg && typeof firstArg.message === "string") {
    message = firstArg.message;
  }

  // Suppress test warnings
  const isActWarning = message.includes("act");
  const isApiWarning = message.includes("Failed to fetch") || 
                      message.includes("Network error") || 
                      message.includes("Cannot read properties");

  if (isActWarning || isApiWarning) {
    return;
  }

  originalError.call(console, ...args);
};
// Mock react-native-maps
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockMapView = ({ children, testID, ...props }: any) => (
    <View testID={testID || "map-view"} {...props}>
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
  } : any) => (
    <View
      testID={testID || "polygon"}
      accessibilityLabel={accessibilityLabel}
      {...({
            "data-coordinates": JSON.stringify(coordinates),
            "data-fill-color": fillColor,
            "data-stroke-color": strokeColor,
            "data-stroke-width": strokeWidth,
      } as any)}
      {...props}
    />
  );

  return {
    __esModule: true,
    default: MockMapView,
    Polygon: MockPolygon,
    Marker: ({ children }: any) => React.createElement("View", {}, children),
    Polyline: () => React.createElement("View"),
    PROVIDER_GOOGLE: "google",
  };
});

// Mock useUserLocation hook
jest.mock("@/src/hooks/useUserLocation", () => ({
  useUserLocation: jest.fn(() => ({
    location: { latitude: 45.49599, longitude: -73.57854 },
    error: null,
    loading: false,
  })),
}));

// Mock useColorScheme
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(() => "light"),
  __esModule: true,
}));

// Mock geo utility functions
jest.mock("@/src/utils/geo", () => ({
  polygonFromGeoJSON: jest.fn((coords) =>
    coords.map(([longitude, latitude]) => ({ latitude, longitude })),
  ),
}));


// Mock @react-native-segmented-control/segmented-control (iOS)
jest.mock("@react-native-segmented-control/segmented-control", () => {
  const { View, TouchableOpacity, Text } = require("react-native");

  return {
    __esModule: true,
    default: ({ values, selectedIndex, onChange, testID, ...props } : any) => (
      <View testID={testID || "segmented-control"} {...props}>
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
jest.mock("react-native-paper", () => {
  const { View, TouchableOpacity, Text } = require("react-native");

  return {
    SegmentedButtons: ({ buttons, value, onValueChange, testID }) => (
      <View testID={testID || "segmented-buttons"}>
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
jest.mock("expo-blur", () => {
  const { View } = require("react-native");

  return {
    BlurView: ({ children, testID, ...props } : any) => (
      <View testID={testID || "blur-view"} {...props}>
        {children}
      </View>
    ),
  };
});

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
  SafeAreaProvider: ({ children }) => children,
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(() => [
    { url: "https://accounts.google.com/o/oauth2/v2/auth" },
    null,
    jest.fn(),
  ]),
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "exp://localhost:19000"),
  dismiss: jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));



