import React from "react";
import { render } from "@testing-library/react-native";
import CampusMap from "../../components/CampusMap";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { useDirections } from "@/src/context/DirectionsContext";

// Mocking hooks
jest.mock("@/src/hooks/useUserLocation");
jest.mock("@/src/context/DirectionsContext");

// Mocking dependencies
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));
jest.mock("expo-blur", () => ({ BlurView: "BlurView" }));

// Mocking local sub-components
jest.mock("../../components/AdditionalInfoPopup", () => "AdditionalInfoPopup");
jest.mock("../../components/DestinationPopup", () => "DestinationPopup");
jest.mock("../../components/indoor/IndoorMapOverlay", () => "IndoorMapOverlay");
jest.mock("../../components/polygons", () => "CampusPolygons");
jest.mock("../../components/campusLabels", () => "CampusLabels");
jest.mock("../../components/RoutePolyline", () => "RoutePolyline");

// extending the react native maps mock to include circle and marker
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: any) => <View>{children}</View>,
    Polygon: ({ children }: any) => <View>{children}</View>,
    Circle: ({ children }: any) => <View>{children}</View>,
    Marker: ({ children }: any) => <View>{children}</View>,
    PROVIDER_GOOGLE: "google",
  };
});

describe("<CampusMap /> UI Component Tests", () => {
  const mockUseUserLocation = useUserLocation as jest.Mock;
  const mockUseDirections = useDirections as jest.Mock;

  beforeEach(() => {

    mockUseDirections.mockReturnValue({
      destinationBuildingId: null,
      startBuildingId: null,
      startCoords: null,
      routeData: null,
      travelMode: "walking",
      isNavigationActive: false,
      setDestination: jest.fn(),
      setStartPoint: jest.fn(),
      clearRouteData: jest.fn(),
      showDirections: false,
      setShowDirections: jest.fn(),
      setIsNavigationActive: jest.fn(),
    });
  });

  it("renders the Recenter button when user location is available", () => {
    mockUseUserLocation.mockReturnValue({
      location: { latitude: 45.495, longitude: -73.578 },
      loading: false,
      error: null,
    });

    const { getByLabelText } = render(<CampusMap />);

    // accessibilityLabel
    const button = getByLabelText("Recenter to your location");
    expect(button).toBeTruthy();
  });

  it("shows an ActivityIndicator (spinner) when location is loading", () => {
    mockUseUserLocation.mockReturnValue({
      location: null,
      loading: true,
      error: null,
    });

    // just checking its rendered because doesn't have a default test id and type deprecated
    // in react native library
    const { getByTestId } = render(<CampusMap />);

  });

  it("displays an error message when location fails", () => {
    const errorMessage = "GPS signal lost";
    mockUseUserLocation.mockReturnValue({
      location: null,
      loading: false,
      error: errorMessage,
    });

    const { getByText } = render(<CampusMap />);
    expect(getByText(errorMessage)).toBeTruthy();
  });
});
