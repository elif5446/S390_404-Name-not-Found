import React from "react";
import { render, fireEvent, act, screen } from "@testing-library/react-native";
import IndoorMapOverlay from "../components/indoor/IndoorMapOverlay";
import { BuildingIndoorConfig } from '@/src/types/indoor'; 
import { SvgProps } from 'react-native-svg';


// mock SafeAreaView to pass children through
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Ionicons: () => <Text>Icon</Text>,
  };
});

jest.mock('@/src/components/indoor/IndoorMap', () => {
  const { View, Text } = require('react-native');
  const MockIndoorMap = (props: any) => (
    <View testID="map-content">
      <Text>Map for Floor Level {props.floor.level}</Text>
      <Text>Type: {props.floor.type}</Text>
    </View>
  );
  return MockIndoorMap;
});

jest.mock('@/src/components/indoor/FloorPicker', () => {
  const { View, Text, Button } = require('react-native');
  const MockFloorPicker = ({ onFloorSelect, currentFloor }: any) => (
    <View testID="floor-picker">
      <Text>Current Picker Floor: {currentFloor}</Text>
      <Button
        testID="change-floor-btn"
        title="Change Floor"
        onPress={() => onFloorSelect(9)} // Hardcoded to 9 for test
      />
    </View>
  );
  return MockFloorPicker;
});


jest.mock('@/src/styles/IndoorMap.styles', () => ({
  styles: {
    container: {},
    mapContainer: {},
    headerWrapper: {},
    buildingTitle: {},
    exitButton: {},
    floorBadge: {},
    floorTitle: {},
    footerContainer: {},
    iconCircle: {},
    exitText: {},
    mapCanvas: {},
    headerContent: {},
  },
}));

/// Test Data
const MockSvgImage: React.FC<SvgProps> = (props) => {
  const { View } = require('react-native');
  return <View testID="mock-svg-image" {...props} />;
};

const mockBuildingData: BuildingIndoorConfig = {
  id: 'hall-building',
  name: 'Hall Building',
  defaultFloor: 8,
  floors: [
    {
      id: 'h-8',
      level: 8,
      label: '8',
      type: 'svg',
      image: MockSvgImage,
      bounds: {
        northEast: { latitude: 45.4973, longitude: -73.5785 },
        southWest: { latitude: 45.4968, longitude: -73.5790 },
      },
    },
    {
      id: 'h-9',
      level: 9,
      label: '9',
      type: 'svg',
      image: MockSvgImage,
      bounds: {
        northEast: { latitude: 45.4973, longitude: -73.5785 },
        southWest: { latitude: 45.4968, longitude: -73.5790 },
      },
    },
  ],
};

describe("IndoorMapOverlay", () => {
  const mockOnExit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // important for Animated and requestAnimationFrame
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with initial floor data (Level 8)', () => {
    render(
      <IndoorMapOverlay 
        buildingData={mockBuildingData} 
        onExit={mockOnExit} 
      />
    );

    expect(screen.getByText('Hall Building')).toBeTruthy();
    expect(screen.getByText('Floor 8')).toBeTruthy();
    expect(screen.getByText('Map for Floor Level 8')).toBeTruthy();
  });

  it('switches from Level 8 to Level 9 correctly', () => {
    render(
      <IndoorMapOverlay 
        buildingData={mockBuildingData} 
        onExit={mockOnExit} 
      />
    );

    expect(screen.getByText('Map for Floor Level 8')).toBeTruthy();
    const changeFloorBtn = screen.getByTestId('change-floor-btn');
    fireEvent.press(changeFloorBtn);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Map for Floor Level 9')).toBeTruthy();
    expect(screen.getByText('Floor 9')).toBeTruthy();
  });
});
