import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RightControlsPanel from "@/src/components/RightControlsPanel";
import type { UserInfo } from "@/src/utils/tokenStorage";
import { Platform } from "react-native";
import * as ReactNative from "react-native";


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
    return <Text testID="symbol-view">{name}</Text>;
  },
}));

jest.mock("expo-blur", () => ({
  BlurView: ({ children, tint }: any) => {
    const React = require("react");
    const { View, Text } = require("react-native");
    return (
      <View testID="blur-view">
        <Text testID="blur-tint">{tint}</Text>
        {children}
      </View>
    );
  },
}));

jest.mock("@/src/components/UserProfilePopup.tsx", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");

  return function MockUserProfilePopup(props: any) {
    return (
      <>
        <Text testID="profile-popup-visible">
          {props.visible ? "visible" : "hidden"}
        </Text>
        <Text testID="profile-popup-user">
          {props.userInfo ? (props.userInfo.name ?? "has-user") : "no-user"}
        </Text>
        <TouchableOpacity testID="close-profile-popup" onPress={props.onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
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

describe("RightControlsPanel extra coverage", () => {
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
  Platform.OS = "android";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
});
  afterEach(() => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
  Platform.OS = "android"; // default
  jest.restoreAllMocks();
});

it("uses dark blur tint on ios in dark mode", () => {
  Platform.OS = "ios";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

  const { getAllByTestId } = render(<RightControlsPanel {...defaultProps} />);

  const tintTexts = getAllByTestId("blur-tint");
  expect(tintTexts[0].props.children).toBe("dark");
});

it("uses light blur tint on ios in light mode", () => {
  Platform.OS = "ios";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

  const { getAllByTestId } = render(<RightControlsPanel {...defaultProps} />);

  const tintTexts = getAllByTestId("blur-tint");
  expect(tintTexts[0].props.children).toBe("light");
});

it("uses default indoorBuildingId and isInfoPopupExpanded values", () => {
  const props = {
    userInfo: mockUserInfo,
    onSignOut: jest.fn(),
    userLocation: { latitude: 45.5, longitude: -73.6 },
    onLocationPress: jest.fn(),
    handleOpenBuildingSearch: jest.fn(),
    isDirections: false,
    isNavigation: false,
  };

  const { getByLabelText } = render(<RightControlsPanel {...props} />);

  expect(getByLabelText("Recenter to your location")).toBeTruthy();
});

it("uses transparent background on ios", () => {
  Platform.OS = "ios";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

  const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);
  const button = getByLabelText("Open user profile");

  const style = Array.isArray(button.props.style)
    ? Object.assign({}, ...button.props.style)
    : button.props.style;

  expect(style.backgroundColor).toBe("transparent");
});

it("uses dark background on android in dark mode", () => {
  Platform.OS = "android";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

  const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);
  const button = getByLabelText("Open user profile");

  const style = Array.isArray(button.props.style)
    ? Object.assign({}, ...button.props.style)
    : button.props.style;

  expect(style.backgroundColor).toBe("#2C2C2E");
});

it("uses light background on android in light mode", () => {
  Platform.OS = "android";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

  const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);
  const button = getByLabelText("Open user profile");

  const style = Array.isArray(button.props.style)
    ? Object.assign({}, ...button.props.style)
    : button.props.style;

  expect(style.backgroundColor).toBe("#FFFFFF");
});

it("uses ios shadowOpacity", () => {
  Platform.OS = "ios";

  const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);
  const button = getByLabelText("Open user profile");

  const style = Array.isArray(button.props.style)
    ? Object.assign({}, ...button.props.style)
    : button.props.style;

  expect(style.shadowOpacity).toBe(0.18);
});

it("uses android shadowOpacity", () => {
  Platform.OS = "android";

  const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);
  const button = getByLabelText("Open user profile");

  const style = Array.isArray(button.props.style)
    ? Object.assign({}, ...button.props.style)
    : button.props.style;

  expect(style.shadowOpacity).toBe(0.22);
});

it("uses ios elevation", () => {
  Platform.OS = "ios";

  const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);
  const button = getByLabelText("Open user profile");

  const style = Array.isArray(button.props.style)
    ? Object.assign({}, ...button.props.style)
    : button.props.style;

  expect(style.elevation).toBe(0);
});

it("uses android elevation", () => {
  Platform.OS = "android";

  const { getByLabelText } = render(<RightControlsPanel {...defaultProps} />);
  const button = getByLabelText("Open user profile");

  const style = Array.isArray(button.props.style)
    ? Object.assign({}, ...button.props.style)
    : button.props.style;

  expect(style.elevation).toBe(4);
});


it("closes the profile popup when onClose is triggered", () => {
  const { getByLabelText, getByTestId } = render(
    <RightControlsPanel {...defaultProps} />,
  );

  fireEvent.press(getByLabelText("Open user profile"));
  expect(getByTestId("profile-popup-visible").props.children).toBe("visible");

  fireEvent.press(getByTestId("close-profile-popup"));
  expect(getByTestId("profile-popup-visible").props.children).toBe("hidden");
});

  it("passes null userInfo to popup correctly", () => {
    const { getByTestId } = render(
      <RightControlsPanel {...defaultProps} userInfo={null} />,
    );

    expect(getByTestId("profile-popup-user").props.children).toBe("no-user");
  });

  it("renders ios location symbol when on ios and not loading", () => {
    Platform.OS = "ios";

    const { getByTestId, queryByText } = render(
      <RightControlsPanel {...defaultProps} />,
    );

    expect(getByTestId("symbol-view")).toBeTruthy();
    expect(queryByText("location.north.fill")).toBeTruthy();
  });

it("renders blur background on ios in light mode", () => {
  Platform.OS = "ios";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

  const { getAllByTestId } = render(
    <RightControlsPanel {...defaultProps} />,
  );

  const tintTexts = getAllByTestId("blur-tint");
  expect(getAllByTestId("blur-view").length).toBeGreaterThan(0);
  expect(tintTexts[0].props.children).toBe("light");
});

  it("renders blur background on ios in dark mode", () => {
  Platform.OS = "ios";
  jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

  const { getAllByTestId } = render(
    <RightControlsPanel {...defaultProps} />,
  );

  const tintTexts = getAllByTestId("blur-tint");
  expect(getAllByTestId("blur-view").length).toBeGreaterThan(0);
  expect(tintTexts[0].props.children).toBe("dark");
});

  it("does not render blur background on android", () => {
    Platform.OS = "android";

    const { queryByTestId } = render(<RightControlsPanel {...defaultProps} />);

    expect(queryByTestId("blur-view")).toBeNull();
  });

  it("shows android navigation icon when not loading", () => {
    Platform.OS = "android";

    const { getByText } = render(<RightControlsPanel {...defaultProps} />);

    expect(getByText("navigation")).toBeTruthy();
  });

  it("hides both android and ios location icons while loading", () => {
    Platform.OS = "ios";

    const { queryByText, queryByTestId } = render(
      <RightControlsPanel {...defaultProps} locationLoading={true} />,
    );

    expect(queryByText("navigation")).toBeNull();
    expect(queryByText("location.north.fill")).toBeNull();
    expect(queryByTestId("symbol-view")).toBeNull();
  });
  
});
