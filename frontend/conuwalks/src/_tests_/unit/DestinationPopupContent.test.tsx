import React from "react";
import { ScrollView } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import DestinationContent from "../../components/DestinationPopupContent";
import { DirectionStep } from "@/src/context/DirectionsContext";

jest.mock("../../components/ui/PlatformIcon", () => {
  const { View } = require("react-native");
  const MockPlatformIcon = (props: any) => (
    <View
      testID={`platform-icon-${props.materialName || props.iosName}`}
      {...props}
    />
  );
  MockPlatformIcon.displayName = "MockPlatformIcon";
  return MockPlatformIcon;
});

// mock styles to prevent undefined object errors during rendering
jest.mock("../../styles/DestinationPopup", () => ({
  styles: {
    routeList: {},
    centerInline: {},
    routeCard: {},
    durationText: {},
    etaText: {},
    routeTransitSummary: {},
    distanceText: {},
    startButton: {},
    transitSection: {},
    transitSectionTitle: {},
    transitCard: {},
    transitCardHeader: {},
    transitLineName: {},
    transitTypeBadge: {},
    transitTypeBadgeText: {},
    transitHeadsign: {},
    transitStops: {},
  },
}));

describe("DestinationContent Component", () => {
  const mockHandleSelectRoute = jest.fn();
  const mockHandleStartNavigation = jest.fn();
  const mockOnScroll = jest.fn();
  const mockGetRouteTransitSummary = jest.fn();
  const mockGetTransitBadgeLabel = jest.fn();

  const mockScrollViewRef = { current: null };

  const mockRoutes = [
    {
      id: "route-1",
      duration: "15 min",
      eta: "10:15 AM",
      distance: "1.2 km",
      steps: [],
    },
    {
      id: "route-2",
      duration: "20 min",
      eta: "10:20 AM",
      distance: "1.5 km",
      steps: [],
    },
  ];

  const defaultProps = {
    isDark: false,
    loading: false,
    error: null,
    routes: mockRoutes,
    selectedRouteIndex: 0,
    travelMode: "walking",
    navigationRouteId: null,
    transitSteps: [],
    getRouteTransitSummary: mockGetRouteTransitSummary,
    getTransitBadgeLabel: mockGetTransitBadgeLabel,
    handleSelectRoute: mockHandleSelectRoute,
    handleStartNavigation: mockHandleStartNavigation,
    scrollViewRef: mockScrollViewRef,
    onScroll: mockOnScroll,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Conditional Rendering States", () => {
    it("renders the loading state correctly", () => {
      render(
        <DestinationContent {...defaultProps} loading={true} routes={[]} />,
      );
      expect(screen.getByText("Loading routes...")).toBeTruthy();
      expect(screen.queryByText("15 min")).toBeNull();
    });

    it("renders the error state correctly", () => {
      render(
        <DestinationContent
          {...defaultProps}
          error="Network failed to fetch routes."
          routes={[]}
        />,
      );
      expect(screen.getByText("Network failed to fetch routes.")).toBeTruthy();
    });

    it("renders the empty state when no routes are available", () => {
      render(<DestinationContent {...defaultProps} routes={[]} />);
      expect(
        screen.getByText("Select a destination to see available routes."),
      ).toBeTruthy();
    });
  });

  describe("Populated Routes & Interactions", () => {
    it("renders route cards with correct data", () => {
      render(<DestinationContent {...defaultProps} />);
      expect(screen.getByText("15 min")).toBeTruthy();
      expect(screen.getByText("10:15 AM")).toBeTruthy();
      expect(screen.getByText("1.2 km")).toBeTruthy();

      expect(screen.getByText("20 min")).toBeTruthy();
      expect(screen.getByText("1.5 km")).toBeTruthy();
    });

    it("calls handleSelectRoute when a route card is pressed", () => {
      render(<DestinationContent {...defaultProps} />);

      // pressing the text inside the touchableopacity bubbles up
      fireEvent.press(screen.getByText("20 min"));

      expect(mockHandleSelectRoute).toHaveBeenCalledWith(1);
    });

    it("calls handleStartNavigation when the start button is pressed", () => {
      render(<DestinationContent {...defaultProps} />);

      // the start button has a specific accessibility label mapping to index + 1
      const startButton = screen.getByLabelText("Start navigation for route 2");
      fireEvent.press(startButton);

      expect(mockHandleStartNavigation).toHaveBeenCalledWith("route-2", 1);
    });

    it("passes scroll events to the onScroll handler", () => {
      render(<DestinationContent {...defaultProps} />);

      const scrollView = screen.UNSAFE_getByType(ScrollView);
      fireEvent.scroll(scrollView, {
        nativeEvent: { contentOffset: { y: 250 } },
      });

      expect(mockOnScroll).toHaveBeenCalledTimes(1);
      expect(mockOnScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          nativeEvent: { contentOffset: { y: 250 } },
        }),
      );
    });
  });

  describe("Transit Specific Logic", () => {
    const mockTransitSteps: DirectionStep[] = [
      {
        instruction: "Take the Green Line",
        distance: "5 km",
        duration: "10 min",
        transitLineName: "Green Line",
        transitLineShortName: "1",
        transitDepartureStop: "Angrignon",
        transitArrivalStop: "Guy-Concordia",
        transitHeadsign: "Honoré-Beaugrand",
      },
    ];

    beforeEach(() => {
      mockGetRouteTransitSummary.mockReturnValue("Metro 1");
      mockGetTransitBadgeLabel.mockReturnValue("Metro");
    });

    it("renders route transit summary on the card when in transit mode", () => {
      render(<DestinationContent {...defaultProps} travelMode="transit" />);

      // ensure the summary gets pulled and displayed
      expect(mockGetRouteTransitSummary).toHaveBeenCalled();

      // since there are 2 routes in our mock, the summary should appear twice
      const summaries = screen.getAllByText("Metro 1");
      expect(summaries.length).toBe(2);
    });

    it("renders the Transit details section with active steps", () => {
      render(
        <DestinationContent
          {...defaultProps}
          travelMode="transit"
          transitSteps={mockTransitSteps}
        />,
      );

      expect(screen.getByText("Transit details")).toBeTruthy();

      // verifies step data maps correctly
      expect(screen.getByText("1")).toBeTruthy(); // line short name
      expect(screen.getByText("Metro")).toBeTruthy(); // badge label
      expect(screen.getByText("Toward Honoré-Beaugrand")).toBeTruthy(); // headsign
      expect(screen.getByText("Angrignon → Guy-Concordia")).toBeTruthy(); // stops
    });

    it("renders fallback text in Transit details section if no detailed steps exist", () => {
      render(
        <DestinationContent
          {...defaultProps}
          travelMode="transit"
          transitSteps={[]}
        />,
      );

      expect(screen.getByText("Transit details")).toBeTruthy();
      expect(
        screen.getByText(
          "Detailed transit lines are not available for this route yet.",
        ),
      ).toBeTruthy();
    });

    it("does not render Transit details section if mode is walking", () => {
      render(
        <DestinationContent
          {...defaultProps}
          travelMode="walking"
          transitSteps={mockTransitSteps}
        />,
      );

      expect(screen.queryByText("Transit details")).toBeNull();
    });
  });
});
