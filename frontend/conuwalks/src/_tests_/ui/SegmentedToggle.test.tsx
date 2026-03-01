import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import SegmentedToggle from "../../components/SegmentedToggle";
import { DirectionsProvider } from "../../context/DirectionsContext";

jest.mock("../../context/DirectionsContext", () => ({
  useDirections: jest.fn(() => ({
    // If toggle calls any specific functions like clearRouteData() when switching campuses,
    // add them here as jest mock functions so the component doesn't crash when it tries to call them.
    clearDestination: jest.fn(),
    resetDirections: jest.fn(),
  })),
  // dummy provider so the import is not undefined
  DirectionsProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("SegmentedToggle Component", () => {
  let mockSetCampus: jest.Mock;

  const renderSegmentedToggle = (campus: "SGW" | "Loyola" = "SGW") => {
    return render(
      <DirectionsProvider>
        <SegmentedToggle campus={campus} setCampus={mockSetCampus} />
      </DirectionsProvider>,
    );
  };

  beforeEach(() => {
    mockSetCampus = jest.fn();
    jest.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render with SGW selected", () => {
      renderSegmentedToggle("SGW");

      expect(screen.getByText("Sir George Williams")).toBeTruthy();
      expect(screen.getByText("Loyola")).toBeTruthy();
    });

    it("should render with Loyola selected", () => {
      renderSegmentedToggle("Loyola");

      expect(screen.getByText("Sir George Williams")).toBeTruthy();
      expect(screen.getByText("Loyola")).toBeTruthy();
    });
  });

  describe("iOS Platform", () => {
    beforeEach(() => {
      Platform.OS = "ios";
    });

    it("should render iOS segmented control", () => {
      renderSegmentedToggle("SGW");

      const segmentedControl = screen.getByTestId("segmented-control");
      expect(segmentedControl).toBeTruthy();
    });

    it("should have SGW selected initially (index 0)", () => {
      renderSegmentedToggle("SGW");

      const firstSegment = screen.getByTestId("segment-0");
      expect(firstSegment.props.accessibilityState.selected).toBe(true);
    });

    it("should have Loyola selected initially (index 1)", () => {
      renderSegmentedToggle("Loyola");

      const secondSegment = screen.getByTestId("segment-1");
      expect(secondSegment.props.accessibilityState.selected).toBe(true);
    });

    it('should call setCampus with "SGW" when first segment is pressed', () => {
      renderSegmentedToggle("Loyola");

      const firstSegment = screen.getByTestId("segment-0");
      fireEvent.press(firstSegment);

      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith("SGW");
    });

    it('should call setCampus with "Loyola" when second segment is pressed', () => {
      renderSegmentedToggle("SGW");

      const secondSegment = screen.getByTestId("segment-1");
      fireEvent.press(secondSegment);

      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith("Loyola");
    });

    it("should render with BlurView for glass effect", () => {
      renderSegmentedToggle("SGW");

      const blurView = screen.getByTestId("blur-view");
      expect(blurView).toBeTruthy();
    });
  });

  describe("Android Platform", () => {
    beforeEach(() => {
      Platform.OS = "android";
    });

    it("should render Android segmented buttons", () => {
      renderSegmentedToggle("SGW");

      const segmentedButtons = screen.getByTestId("segmented-buttons");
      expect(segmentedButtons).toBeTruthy();
    });

    it("should have SGW button with correct accessibility label", () => {
      renderSegmentedToggle("SGW");

      const sgwButton = screen.getByLabelText(
        "Go to Sir George Williams Campus",
      );
      expect(sgwButton).toBeTruthy();
    });

    it("should have Loyola button with correct accessibility label", () => {
      renderSegmentedToggle("SGW");

      const loyolaButton = screen.getByLabelText("Go to Loyola Campus");
      expect(loyolaButton).toBeTruthy();
    });

    it("should have SGW button selected when campus is SGW", () => {
      renderSegmentedToggle("SGW");

      const sgwButton = screen.getByTestId("segment-button-SGW");
      expect(sgwButton.props.accessibilityState.selected).toBe(true);
    });

    it("should have Loyola button selected when campus is Loyola", () => {
      renderSegmentedToggle("Loyola");

      const loyolaButton = screen.getByTestId("segment-button-Loyola");
      expect(loyolaButton.props.accessibilityState.selected).toBe(true);
    });

    it('should call setCampus with "SGW" when SGW button is pressed', () => {
      renderSegmentedToggle("Loyola");

      const sgwButton = screen.getByTestId("segment-button-SGW");
      fireEvent.press(sgwButton);

      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith("SGW");
    });

    it('should call setCampus with "Loyola" when Loyola button is pressed', () => {
      renderSegmentedToggle("SGW");

      const loyolaButton = screen.getByTestId("segment-button-Loyola");
      fireEvent.press(loyolaButton);

      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith("Loyola");
    });
  });

  describe("User Interaction Flow", () => {
    beforeEach(() => {
      Platform.OS = "ios";
    });

    it("should allow switching from SGW to Loyola", () => {
      const { rerender } = renderSegmentedToggle("SGW");

      const loyolaSegment = screen.getByTestId("segment-1");
      fireEvent.press(loyolaSegment);

      expect(mockSetCampus).toHaveBeenCalledWith("Loyola");

      rerender(
        <DirectionsProvider>
          <SegmentedToggle campus="Loyola" setCampus={mockSetCampus} />
        </DirectionsProvider>,
      );

      const loyolaSegmentAfter = screen.getByTestId("segment-1");
      expect(loyolaSegmentAfter.props.accessibilityState.selected).toBe(true);
    });

    it("should allow switching from Loyola to SGW", () => {
      const { rerender } = renderSegmentedToggle("Loyola");

      const sgwSegment = screen.getByTestId("segment-0");
      fireEvent.press(sgwSegment);

      expect(mockSetCampus).toHaveBeenCalledWith("SGW");

      rerender(
        <DirectionsProvider>
          <SegmentedToggle campus="SGW" setCampus={mockSetCampus} />
        </DirectionsProvider>,
      );

      const sgwSegmentAfter = screen.getByTestId("segment-0");
      expect(sgwSegmentAfter.props.accessibilityState.selected).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      Platform.OS = "ios";
    });

    it("should handle rapid successive clicks", () => {
      renderSegmentedToggle("SGW");

      const loyolaSegment = screen.getByTestId("segment-1");

      fireEvent.press(loyolaSegment);
      fireEvent.press(loyolaSegment);
      fireEvent.press(loyolaSegment);

      expect(mockSetCampus).toHaveBeenCalledTimes(3);
      expect(mockSetCampus).toHaveBeenCalledWith("Loyola");
    });

    it("should not break when clicking already selected segment", () => {
      renderSegmentedToggle("SGW");

      const sgwSegment = screen.getByTestId("segment-0");
      fireEvent.press(sgwSegment);

      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith("SGW");
    });
  });
});
