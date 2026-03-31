
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import IndoorTopPanel, { IndoorSearchResult } from "@/src/components/indoor/IndoorTopPanel";
import { POICategory } from "@/src/types/poi";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name, testID }: any) => <Text testID={testID || `icon-${name}`}>{name}</Text>,
  };
});

// mock the category labels to avoid undefined errors
jest.mock("@/src/data/poiData", () => ({
  CATEGORY_LABELS: {
    WC_M: "Men's Washroom",
    WC_F: "Women's Washroom",
    LAB: "Computer Lab",
  },
}));

// spy on react native's keyboard module
jest.spyOn(Keyboard, "dismiss");

describe("IndoorTopPanel", () => {
      it("calls onClearDestination if destination input is whitespace only (edge case)", () => {
        const { getByPlaceholderText } = render(
          <IndoorTopPanel {...defaultProps} activeField="destination" searchQuery="H820" />
        );
        const destInput = getByPlaceholderText("Destination");
        // simulate user deleting all text to whitespace
        fireEvent.changeText(destInput, "   ");
        expect(defaultProps.onClearDestination).toHaveBeenCalled();
      });

      it("clears destination only if activeField is destination (branch 132)", () => {
        const { getByTestId } = render(
          <IndoorTopPanel {...defaultProps} activeField="destination" searchQuery="something" />
        );
        const clearButton = getByTestId("icon-close-circle");
        fireEvent.press(clearButton);
        expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("");
        expect(defaultProps.setShowSearchResults).toHaveBeenCalledWith(false);
        expect(defaultProps.onClearDestination).toHaveBeenCalled();
      });

      it("shows empty state when searchResults is empty (branch 243)", () => {
        const { getByText } = render(
          <IndoorTopPanel {...defaultProps} showSearchResults={true} searchResults={[]} />
        );
        expect(getByText("No matching results found")).toBeTruthy();
      });
    it("calls onClearDestination if destination input is whitespace only", () => {
      const { getByPlaceholderText } = render(
        <IndoorTopPanel {...defaultProps} activeField="destination" searchQuery="H820" />
      );
      const destInput = getByPlaceholderText("Destination");
      // simulate user deleting all text to whitespace
      fireEvent.changeText(destInput, "   ");
      expect(defaultProps.onClearDestination).toHaveBeenCalled();
    });
  const defaultProps = {
    searchQuery: "",
    setSearchQuery: jest.fn(),
    showSearchResults: false,
    setShowSearchResults: jest.fn(),
    searchResults: [],
    onSelectResult: jest.fn(),
    onClearDestination: jest.fn(),
    startLabel: "Current Location",
    destinationLabel: "Room 101",
    activeField: "destination" as const,
    onFocusField: jest.fn(),
    onStartNavigation: jest.fn(),
    canStartNavigation: false,
    categories: ["WC_M", "WC_F"] as POICategory[],
    activeCategories: new Set(["WC_M"] as POICategory[]),
    onToggleCategory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default labels", () => {
    const { getByPlaceholderText, getByText } = render(<IndoorTopPanel {...defaultProps} />);

    const startInput = getByPlaceholderText("Start");
    const destInput = getByPlaceholderText("Destination");

    // since activefield is 'destination', start should show startlabel, dest should show searchquery
    expect(startInput.props.value).toBe("Current Location");
    expect(destInput.props.value).toBe("");

    // renders categories
    expect(getByText("Men's Washroom")).toBeTruthy();
    expect(getByText("Women's Washroom")).toBeTruthy();
  });

  it("handles input focus and typing for the Start field", () => {
    const { getByPlaceholderText } = render(<IndoorTopPanel {...defaultProps} activeField="start" searchQuery="Current Loc" />);

    const startInput = getByPlaceholderText("Start");

    // focus
    fireEvent(startInput, "focus");
    expect(defaultProps.onFocusField).toHaveBeenCalledWith("start");
    expect(defaultProps.setShowSearchResults).toHaveBeenCalledWith(true);

    // type
    fireEvent.changeText(startInput, "Hall Building");
    expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("Hall Building");
  });

  it("handles input focus for the Destination field", () => {
    const { getByPlaceholderText } = render(
      <IndoorTopPanel {...defaultProps} activeField="start" />
    );
    const destInput = getByPlaceholderText("Destination");
    fireEvent(destInput, "focus");
    expect(defaultProps.onFocusField).toHaveBeenCalledWith("destination");
    expect(defaultProps.setShowSearchResults).toHaveBeenCalledWith(true);
  });

  it("handles clearing the destination input", () => {
    // we pass a searchquery length > 0 so the clear button (close-circle) appears
    const { getByTestId } = render(<IndoorTopPanel {...defaultProps} activeField="destination" searchQuery="H820" />);

    const clearButton = getByTestId("icon-close-circle");
    fireEvent.press(clearButton);

    expect(defaultProps.setSearchQuery).toHaveBeenCalledWith("");
    expect(defaultProps.setShowSearchResults).toHaveBeenCalledWith(false);
    expect(defaultProps.onClearDestination).toHaveBeenCalled();
  });

  it("automatically calls onClearDestination if text is completely deleted", () => {
    const { getByPlaceholderText } = render(<IndoorTopPanel {...defaultProps} activeField="destination" searchQuery="H820" />);

    const destInput = getByPlaceholderText("Destination");

    // simulate user deleting all text
    fireEvent.changeText(destInput, "");

    expect(defaultProps.onClearDestination).toHaveBeenCalled();
  });

  it("toggles categories when pressed", () => {
    const { getByText } = render(<IndoorTopPanel {...defaultProps} />);

    const filterButton = getByText("Women's Washroom");
    fireEvent.press(filterButton);

    expect(defaultProps.onToggleCategory).toHaveBeenCalledWith("WC_F");
  });

  it("enables and triggers the navigation button when canStartNavigation is true", () => {
    const { getByTestId } = render(<IndoorTopPanel {...defaultProps} canStartNavigation={true} />);

    // the button wraps the return-up-forward icon
    const navIcon = getByTestId("icon-return-up-forward");

    // in react native, firing press on the child icon often bubbles up,
    // or we can jump to the parent touchableopacity
    fireEvent.press(navIcon.parent!);

    expect(defaultProps.onStartNavigation).toHaveBeenCalledTimes(1);
  });

  it("displays 'No matching results found' when search results are empty", () => {
    const { getByText } = render(<IndoorTopPanel {...defaultProps} showSearchResults={true} searchResults={[]} />);

    expect(getByText("No matching results found")).toBeTruthy();
  });

  it("displays search results and handles selection", () => {
    const mockResults: IndoorSearchResult[] = [
      { id: "1", type: "room", label: "H-820", floorLevel: 8 },
      { id: "2", type: "poi", label: "Main Men's Washroom", floorLevel: 8 },
    ];

    const { getByText } = render(<IndoorTopPanel {...defaultProps} showSearchResults={true} searchResults={mockResults} />);

    // assert results render
    expect(getByText("H-820")).toBeTruthy();
    expect(getByText("Main Men's Washroom")).toBeTruthy();

    // select the first result
    fireEvent.press(getByText("H-820"));

    expect(defaultProps.onSelectResult).toHaveBeenCalledWith(mockResults[0]);
    expect(defaultProps.setShowSearchResults).toHaveBeenCalledWith(false);
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  });
});
