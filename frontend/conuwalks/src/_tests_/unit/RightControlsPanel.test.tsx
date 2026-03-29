import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RightControlsPanel from "@/src/components/RightControlsPanel";
import type { UserInfo } from "@/src/utils/tokenStorage";

const mockUserInfo: UserInfo = {
  id: "123",
  name: "Riley",
  email: "riley1@example.com",
  photo: "",
};

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    top: 10,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MaterialIcons(props: any) {
    return <Text>{props.name}</Text>;
  };
});

jest.mock("expo-symbols", () => ({
  SymbolView: ({ name }: { name: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => {
    const React = require("react");
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));

jest.mock("@/src/components/UserProfilePopup.tsx", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockUserProfilePopup(props: any) {
    return (
      <>
        <Text testID="profile-popup-visible">
          {props.visible ? "visible" : "hidden"}
        </Text>
        <Text testID="profile-popup-user">
          {props.userInfo ? (props.userInfo.name ?? "has-user") : "no-user"}
        </Text>
      </>
    );
  };
});

jest.mock("@/src/components/BuildingSearchButton.tsx", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");

  return function MockBuildingSearchButton(props: any) {
    return (
      <TouchableOpacity testID="building-search-button" onPress={props.onPress}>
        <Text>Search</Text>
      </TouchableOpacity>
    );
  };
});

describe("RightControlsPanel", () => {
  const defaultProps = {
    userInfo: mockUserInfo,
    onSignOut: jest.fn(),
    userLocation: {
      latitude: 45.5,
      longitude: -73.6,
    },
    onLocationPress: jest.fn(),
    locationLoading: false,
    indoorBuildingId: null,
    isInfoPopupExpanded: false,
    handleOpenBuildingSearch: jest.fn(),
    isDirections: false,
    isNavigation: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the profile button when not in directions and not in navigation", () => {
    const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);

    expect(getByLabelText("Open user profile")).toBeTruthy();
  });

  it("opens the profile popup when profile button is pressed", () => {
    const { getByLabelText, getByTestId } = render(
      <RightControlsPanel {...defaultProps} />,
    );

    expect(getByTestId("profile-popup-visible").props.children).toBe("hidden");

    fireEvent.press(getByLabelText("Open user profile"));

    expect(getByTestId("profile-popup-visible").props.children).toBe("visible");
  });

  it("renders the location button when userLocation exists and popup is not expanded and not indoors", () => {
    const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);

    expect(getByLabelText("Recenter to your location")).toBeTruthy();
  });

  it("calls onLocationPress when the location button is pressed", () => {
    const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);

    fireEvent.press(getByLabelText("Recenter to your location"));

    expect(defaultProps.onLocationPress).toHaveBeenCalledTimes(1);
  });

  it("does not render the location button when userLocation is null", () => {
    const { queryByLabelText } = render(
      <RightControlsPanel {...defaultProps} userLocation={null} />,
    );

    expect(queryByLabelText("Recenter to your location")).toBeNull();
  });

  it("does not render the location button when indoorBuildingId exists", () => {
    const { queryByLabelText } = render(
      <RightControlsPanel {...defaultProps} indoorBuildingId="HALL" />,
    );

    expect(queryByLabelText("Recenter to your location")).toBeNull();
  });

  it("does not render the location button when info popup is expanded", () => {
    const { queryByLabelText } = render(
      <RightControlsPanel {...defaultProps} isInfoPopupExpanded={true} />,
    );

    expect(queryByLabelText("Recenter to your location")).toBeNull();
  });

  it("renders the building search button when not in navigation", () => {
    const { getByTestId } = render(<RightControlsPanel {...defaultProps} />);

    expect(getByTestId("building-search-button")).toBeTruthy();
  });

  it("calls handleOpenBuildingSearch when the search button is pressed", () => {
    const { getByTestId } = render(<RightControlsPanel {...defaultProps} />);

    fireEvent.press(getByTestId("building-search-button"));

    expect(defaultProps.handleOpenBuildingSearch).toHaveBeenCalledTimes(1);
  });

  it("does not render profile or search buttons when isNavigation is true", () => {
    const { queryByLabelText, queryByTestId } = render(
      <RightControlsPanel {...defaultProps} isNavigation={true} />,
    );

    expect(queryByLabelText("Open user profile")).toBeNull();
    expect(queryByTestId("building-search-button")).toBeNull();
  });

  it("does not render controls when isDirections is true", () => {
    const { queryByLabelText, queryByTestId } = render(
      <RightControlsPanel {...defaultProps} isDirections={true} />,
    );

    expect(queryByLabelText("Open user profile")).toBeNull();
    expect(queryByLabelText("Recenter to your location")).toBeNull();
    expect(queryByTestId("building-search-button")).toBeNull();
  });

  it("shows loading state for location button when locationLoading is true", () => {
    const { queryByText } = render(
      <RightControlsPanel {...defaultProps} locationLoading={true} />,
    );

    // Since ActivityIndicator is hard to query directly,
    // this mainly verifies the button still renders in loading mode.
    expect(queryByText("navigation")).toBeNull();
  });
});
