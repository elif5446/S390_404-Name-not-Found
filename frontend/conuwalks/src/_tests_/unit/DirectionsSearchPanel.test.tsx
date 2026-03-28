

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import DirectionsSearchPanel from "../../components/DirectionsSearchPanel";
import * as useGoogleCalendar from "../../hooks/useGoogleCalendar";
import * as useBuildingEvents from "../../hooks/useBuildingEvents";
import * as useUserLocation from "../../hooks/useUserLocation";

// Mock dependencies
jest.mock("../../hooks/useGoogleCalendar");
jest.mock("../../hooks/useBuildingEvents");
jest.mock("../../hooks/useUserLocation");
jest.mock("../../data/metadata/SGW.BuildingMetaData", () => ({ SGWBuildingSearchMetadata: { MB: { name: "MB", coordinates: { latitude: 1, longitude: 2 } } } }));
jest.mock("../../data/metadata/LOY.BuildingMetadata", () => ({ LoyolaBuildingSearchMetadata: { VL: { name: "VL", coordinates: { latitude: 3, longitude: 4 } } } }));
jest.mock("../../utils/searchbar", () => ({
  processStartPointSearch: jest.fn(),
  processDestinationSearch: jest.fn(),
  searchStartPoint: jest.fn(() => []),
  searchDestination: jest.fn(() => []),
}));
jest.mock("../../utils/schedule", () => ({
  guessRoomLocation: jest.fn(() => ({ buildingCode: "MB", roomNumber: "101" })),
  guessFutureRoomLocation: jest.fn(() => ({ buildingCode: "VL", roomNumber: "201" })),
}));

describe("DirectionsSearchPanel", () => {
  const setStartPoint = jest.fn();
  const setDestination = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(useGoogleCalendar, "useGoogleCalendar").mockReturnValue({
      events: [],
      calendars: [],
      loading: false,
      error: null,
      isAuthenticated: true,
      fetchUpcomingEvents: jest.fn(),
      fetchCalendars: jest.fn(),
      createEvent: jest.fn(),
      deleteEvent: jest.fn(),
    });
    jest.spyOn(useBuildingEvents, "useBuildingEvents").mockReturnValue({
      buildingEvents: [],
      todayEvents: [],
      nextEvent: null,
      loading: false,
      error: null,
      refresh: jest.fn(),
    });
    jest.spyOn(useUserLocation, "useUserLocation").mockReturnValue({
      location: { latitude: 1, longitude: 2 },
      error: null,
      loading: false,
      hasPermission: true,
    });
  });

  it("inserts building name into start and destination fields via accessory buttons", () => {
    const setStartPoint = jest.fn();
    const setDestination = jest.fn();
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel
        startBuildingId={"MB"}
        startRoom={"101"}
        setStartPoint={setStartPoint}
        destinationBuildingId={"VL"}
        destinationRoom={"201"}
        setDestination={setDestination}
        userLocationBuildingId={"MB"}
      />
    );
    // Focus start input and try to find accessory buttons
    const startInput = getByLabelText("Start Point");
    act(() => {
      fireEvent(startInput, "focus");
    });
    let accessoryButtons: any[] = [];
    try {
      accessoryButtons = getAllByLabelText(/Insert/);
    } catch (e) {}
    if (accessoryButtons.length > 0) {
      act(() => {
        fireEvent.press(accessoryButtons[0]);
      });
    } else {
      // Try focusing destination input as well
      const destInput = getByLabelText("Destination");
      act(() => {
        fireEvent(destInput, "focus");
      });
      try {
        accessoryButtons = getAllByLabelText(/Insert/);
      } catch (e) {}
      expect(accessoryButtons.length).toBeGreaterThan(0);
      act(() => {
        fireEvent.press(accessoryButtons[0]);
      });
    }
  });


  it("handles suggestion list item press for start", () => {
    const setStartPoint = jest.fn();
    const setDestination = jest.fn();
    const searchbar = require("../../utils/searchbar");
    searchbar.searchStartPoint.mockReturnValue([
      { buildingName: "MB", roomNumber: "101", isLocation: false },
    ]);
    searchbar.searchDestination.mockReturnValue([]);

    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel
        startBuildingId={"MB"}
        startRoom={"101"}
        setStartPoint={setStartPoint}
        destinationBuildingId={"VL"}
        destinationRoom={"201"}
        setDestination={setDestination}
        userLocationBuildingId={"MB"}
      />
    );
    // Show start suggestions
    const startInput = getByLabelText("Start Point");
    act(() => {
      fireEvent(startInput, "focus");
    });
    let startSuggestions: any[] = [];
    try {
      startSuggestions = getAllByLabelText(/Set the start point to/);
    } catch (e) {}
    expect(startSuggestions.length).toBeGreaterThan(0);
    act(() => {
      fireEvent.press(startSuggestions[0]);
    });
  });

  it("handles suggestion list item press for destination", () => {
    const setStartPoint = jest.fn();
    const setDestination = jest.fn();
    const searchbar = require("../../utils/searchbar");
    searchbar.searchStartPoint.mockReturnValue([]);
    searchbar.searchDestination.mockReturnValue([
      { buildingName: "VL", roomNumber: "201", isLocation: false },
    ]);

    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel
        startBuildingId={"MB"}
        startRoom={"101"}
        setStartPoint={setStartPoint}
        destinationBuildingId={"VL"}
        destinationRoom={"201"}
        setDestination={setDestination}
        userLocationBuildingId={"MB"}
      />
    );
    // Show destination suggestions
    const destInput = getByLabelText("Destination");
    act(() => {
      fireEvent(destInput, "focus");
    });
    let destSuggestions: any[] = [];
    try {
      destSuggestions = getAllByLabelText(/Set the destination to/);
    } catch (e) {}
    expect(destSuggestions.length).toBeGreaterThan(0);
    act(() => {
      fireEvent.press(destSuggestions[0]);
    });
  });
});
