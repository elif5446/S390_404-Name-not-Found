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

describe("IndoorTopPanel", () => {
  it("calls onClearDestination if destination input is whitespace only (edge case)", () => {
    const { getByPlaceholderText } = render(
      <IndoorTopPanel {...defaultProps} activeField="destination" searchQuery="H820" />
    );
    const destInput = getByPlaceholderText("Destination");
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

  it("does not call onClearDestination if destination input is not whitespace (branch 122, false path)", () => {
    const props = {
      ...defaultProps,
      activeField: "destination" as const,
      searchQuery: "H820",
    };
    const { getByPlaceholderText } = render(
      <IndoorTopPanel {...props} />
    );
    const destInput = getByPlaceholderText("Destination");
    fireEvent.changeText(destInput, "H825");
    expect(props.onClearDestination).not.toHaveBeenCalled();
  });

  it("does not clear destination if activeField is not destination (branch 132, false path)", () => {
    const props = {
      ...defaultProps,
      activeField: "start" as const,
      searchQuery: "something",
      destinationLabel: "", // ensure destValue.length === 0
    };
    const { getByTestId } = render(
      <IndoorTopPanel {...props} />
    );
    expect(() => getByTestId("icon-close-circle")).toThrow();
  });

  it("presses clear button when activeField is not destination (branch 132, else path)", () => {
    const props = {
      ...defaultProps,
      activeField: "start" as const,
      searchQuery: "something",
      destinationLabel: "not empty", // ensures clear button is present
    };
    const { getByTestId } = render(
      <IndoorTopPanel {...props} />
    );
    const clearButton = getByTestId("icon-close-circle");
    fireEvent.press(clearButton);
    expect(props.setSearchQuery).not.toHaveBeenCalled();
    expect(props.setShowSearchResults).toHaveBeenCalledWith(false);
    expect(props.onClearDestination).toHaveBeenCalled();
  });

  it("does not show empty state when searchResults is not empty (branch 243, else path)", () => {
    const props = {
      ...defaultProps,
      showSearchResults: true,
      searchResults: [
        { id: "1", label: "Room 101", type: "room" as const, floorLevel: 1 },
      ],
    };
    const { queryByText } = render(
      <IndoorTopPanel {...props} />
    );
    expect(queryByText("No matching results found")).toBeNull();
  });

  it("does not show empty state when showSearchResults is false (branch 243, else path)", () => {
    const props = {
      ...defaultProps,
      showSearchResults: false,
      searchResults: [],
    };
    const { queryByText } = render(
      <IndoorTopPanel {...props} />
    );
    expect(queryByText("No matching results found")).toBeNull();
  });

  it("does not show empty state when showSearchResults is false and searchResults is not empty (branch 243, else path)", () => {
    const props = {
      ...defaultProps,
      showSearchResults: false,
      searchResults: [
        { id: "1", label: "Room 101", type: "room" as const, floorLevel: 1 },
      ],
    };
    const { queryByText } = render(
      <IndoorTopPanel {...props} />
    );
    expect(queryByText("No matching results found")).toBeNull();
  });

  // Uncomment the following test if you want to check undefined searchResults, but note it will throw a TypeError
  /*
  it("does not show empty state when showSearchResults is true and searchResults is undefined (branch 243, else path)", () => {
    const props = {
      ...defaultProps,
      showSearchResults: true,
    };
    // @ts-expect-error: intentionally omit searchResults to test undefined case
    delete props.searchResults;
    const { queryByText } = render(
      <IndoorTopPanel {...props as any} />
    );
    expect(queryByText("No matching results found")).toBeNull();
  });
  */

  it("renders correctly with default labels", () => {
    const { getByPlaceholderText, getByText } = render(<IndoorTopPanel {...defaultProps} />);
    const startInput = getByPlaceholderText("Start");
    const destInput = getByPlaceholderText("Destination");
    expect(startInput.props.value).toBe("Current Location");
    expect(destInput.props.value).toBe("");
    expect(getByText("Men's Washroom")).toBeTruthy();
    expect(getByText("Women's Washroom")).toBeTruthy();
  });

  it("handles input focus and typing for the Start field", () => {
    const { getByPlaceholderText } = render(<IndoorTopPanel {...defaultProps} activeField="start" searchQuery="Current Loc" />);
    const startInput = getByPlaceholderText("Start");
    fireEvent(startInput, "focus");
    expect(defaultProps.onFocusField).toHaveBeenCalledWith("start");
    expect(defaultProps.setShowSearchResults).toHaveBeenCalledWith(true);
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
    const navIcon = getByTestId("icon-return-up-forward");
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
    expect(getByText("H-820")).toBeTruthy();
    expect(getByText("Main Men's Washroom")).toBeTruthy();
    fireEvent.press(getByText("H-820"));
    expect(defaultProps.onSelectResult).toHaveBeenCalledWith(mockResults[0]);
    expect(defaultProps.setShowSearchResults).toHaveBeenCalledWith(false);
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  });
});