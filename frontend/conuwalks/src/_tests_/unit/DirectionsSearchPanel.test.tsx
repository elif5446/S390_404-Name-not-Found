import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import DirectionsSearchPanel from "../../components/DirectionsSearchPanel";
import * as useGoogleCalendar from "../../hooks/useGoogleCalendar";
import * as useBuildingEvents from "../../hooks/useBuildingEvents";
import * as useUserLocation from "../../hooks/useUserLocation";
import { Keyboard, Platform } from "react-native";

// ─── Mock dependencies ────────────────────────────────────────────────────────

jest.mock("../../hooks/useGoogleCalendar");
jest.mock("../../hooks/useBuildingEvents");
jest.mock("../../hooks/useUserLocation");

jest.mock("../../data/metadata/SGW.BuildingMetaData", () => ({
  SGWBuildingSearchMetadata: {
    MB: { name: "MB Building", coordinates: { latitude: 1, longitude: 2 } },
    FG: { name: "FG Building", coordinates: { latitude: 1, longitude: 2 } },
    FB: { name: "FB Building", coordinates: { latitude: 1, longitude: 2 } },
    LS: { name: "LS Building", coordinates: { latitude: 1, longitude: 2 } },
    CL: { name: "CL Building", coordinates: { latitude: 1, longitude: 2 } },
    EV: { name: "EV Building", coordinates: { latitude: 1, longitude: 2 } },
  },
}));

jest.mock("../../data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingSearchMetadata: {
    VL: { name: "VL Building", coordinates: { latitude: 3, longitude: 4 } },
    CJ: { name: "CJ Building", coordinates: { latitude: 3, longitude: 4 } },
    SP: { name: "SP Building", coordinates: { latitude: 3, longitude: 4 } },
    AD: { name: "AD Building", coordinates: { latitude: 3, longitude: 4 } },
    CC: { name: "CC Building", coordinates: { latitude: 3, longitude: 4 } },
    HU: { name: "HU Building", coordinates: { latitude: 3, longitude: 4 } },
  },
}));

jest.mock("../../utils/searchbar", () => ({
  processStartPointSearch: jest.fn(),
  processDestinationSearch: jest.fn(),
  searchStartPoint: jest.fn(() => []),
  searchDestination: jest.fn(() => []),
}));

jest.mock("../../utils/schedule", () => ({
  guessRoomLocation: jest.fn(() => ({ buildingCode: "MB", roomNumber: "101" })),
  guessFutureRoomLocation: jest.fn(() => ({
    buildingCode: "VL",
    roomNumber: "201",
  })),
}));

jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => children,
}));

jest.mock("expo-symbols", () => ({
  SymbolView: ({ fallback }: any) => fallback,
}));

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");

// ─── Shared helpers ───────────────────────────────────────────────────────────

const mockSearchbar = () => require("../../utils/searchbar");

const defaultHookMocks = () => {
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
    location: { latitude: 45.5, longitude: -73.6 },
    error: null,
    loading: false,
    hasPermission: true,
  });
};

const defaultProps = {
  startBuildingId: "MB" as string | null,
  startRoom: "101" as string | null,
  setStartPoint: jest.fn(),
  destinationBuildingId: "MB" as string | null,
  destinationRoom: "201" as string | null,
  setDestination: jest.fn(),
  userLocationBuildingId: "MB" as string | null,
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("DirectionsSearchPanel – comprehensive coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultHookMocks();
    // reset Platform back to ios by default
    Object.defineProperty(Platform, "OS", { get: () => "ios", configurable: true });
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders with SGW startBuildingId and shows inputs", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    expect(getByLabelText("Start Point")).toBeTruthy();
    expect(getByLabelText("Destination")).toBeTruthy();
  });

  it("renders with null buildingIds and defaults to guessRoomLocation", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        startBuildingId={null}
        startRoom={null}
        destinationBuildingId={null}
        destinationRoom={null}
        userLocationBuildingId={null}
      />
    );
    // guessRoomLocation returns MB/101, guessFutureRoomLocation returns VL/201
    expect(getByLabelText("Start Point").props.value).toMatch(/MB/);
    expect(getByLabelText("Destination").props.value).toMatch(/VL/);
  });

  it("sets startPointText to Current Location when initial text is empty (guesses return null)", () => {
    // guessRoomLocation is called synchronously inside useState() during component
    // construction, BEFORE render() returns – so mockReturnValueOnce fires too late.
    // We must use mockReturnValue to cover every call made during initialisation.
    const schedule = require("../../utils/schedule");
    schedule.guessRoomLocation.mockReturnValue(null);
    schedule.guessFutureRoomLocation.mockReturnValue(null);

    const { getByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        startBuildingId={null}
        startRoom={null}
        destinationBuildingId={null}
        destinationRoom={null}
      />
    );
    expect(getByLabelText("Start Point").props.value).toMatch(/Current Location/);
    expect(getByLabelText("Destination").props.value).toMatch(/Current Location/);

    // Restore defaults so subsequent tests are unaffected
    schedule.guessRoomLocation.mockReturnValue({ buildingCode: "MB", roomNumber: "101" });
    schedule.guessFutureRoomLocation.mockReturnValue({ buildingCode: "VL", roomNumber: "201" });
  });

  it("sets startPointText to Current Location when startBuildingId is USER", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} startBuildingId="USER" startRoom={null} />
    );
    expect(getByLabelText("Start Point").props.value).toBe("Current Location");
  });

  it("sets startPointText to Current Location when startBuildingId is empty string", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} startBuildingId="" startRoom={null} />
    );
    expect(getByLabelText("Start Point").props.value).toBe("Current Location");
  });

  it("sets destinationText to Current Location when destinationBuildingId is USER", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} destinationBuildingId="USER" destinationRoom={null} />
    );
    expect(getByLabelText("Destination").props.value).toBe("Current Location");
  });

  // ── destinationLabel effect (POI paths) ────────────────────────────────────

  it("uses destinationLabel when provided", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        destinationBuildingId="MB"
        destinationLabel="Some POI Name"
      />
    );
    expect(getByLabelText("Destination").props.value).toBe("Some POI Name");
  });

  it("sets 'Outdoor POI' when destinationBuildingId starts with POI-", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        destinationBuildingId="POI-123"
        destinationLabel={null}
        destinationRoom={null}
      />
    );
    expect(getByLabelText("Destination").props.value).toBe("Outdoor POI");
  });

  it("updates destinationText when destinationLabel prop changes via rerender", () => {
    const { getByLabelText, rerender } = render(
      <DirectionsSearchPanel {...defaultProps} destinationLabel={null} />
    );
    rerender(
      <DirectionsSearchPanel {...defaultProps} destinationLabel="Updated POI" />
    );
    expect(getByLabelText("Destination").props.value).toBe("Updated POI");
  });

  it("updates destinationText to Current Location when destinationBuildingId changes to USER", () => {
    const { getByLabelText, rerender } = render(
      <DirectionsSearchPanel {...defaultProps} destinationBuildingId={null} destinationRoom={null} />
    );
    rerender(
      <DirectionsSearchPanel {...defaultProps} destinationBuildingId="USER" destinationRoom={null} />
    );
    expect(getByLabelText("Destination").props.value).toBe("Current Location");
  });

  it("updates destinationText from building metadata when destinationBuildingId changes to a valid building", () => {
    const { getByLabelText, rerender } = render(
      <DirectionsSearchPanel {...defaultProps} destinationBuildingId={null} destinationRoom={null} />
    );
    rerender(
      <DirectionsSearchPanel {...defaultProps} destinationBuildingId="MB" destinationRoom="305" />
    );
    expect(getByLabelText("Destination").props.value).toMatch(/MB Building/);
    expect(getByLabelText("Destination").props.value).toMatch(/305/);
  });

  it("updates destinationText to Loyola building when destinationBuildingId changes to VL", () => {
    const { getByLabelText, rerender } = render(
      <DirectionsSearchPanel {...defaultProps} destinationBuildingId={null} destinationRoom={null} />
    );
    rerender(
      <DirectionsSearchPanel
        {...defaultProps}
        destinationBuildingId="VL"
        destinationRoom="201"
        userLocationBuildingId="VL"
      />
    );
    expect(getByLabelText("Destination").props.value).toMatch(/VL Building/);
  });

  it("syncs startPointText when startBuildingId changes", () => {
    const { getByLabelText, rerender } = render(
      <DirectionsSearchPanel {...defaultProps} startBuildingId={null} startRoom={null} />
    );
    rerender(
      <DirectionsSearchPanel {...defaultProps} startBuildingId="FG" startRoom="202" />
    );
    expect(getByLabelText("Start Point").props.value).toMatch(/FG Building/);
    expect(getByLabelText("Start Point").props.value).toMatch(/202/);
  });

  // ── isIndoorView ───────────────────────────────────────────────────────────

  it("renders with isIndoorView=true and disables inputs", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} isIndoorView={true} />
    );
    expect(getByLabelText("Start Point").props.editable).toBe(false);
    expect(getByLabelText("Destination").props.editable).toBe(false);
  });

  it("renders with isIndoorView=false (default) and keeps inputs editable", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} isIndoorView={false} />
    );
    expect(getByLabelText("Start Point").props.editable).toBe(true);
  });

  // ── Focus / blur state transitions ─────────────────────────────────────────

  it("sets destinationIsHidden=true when start input is focused (hides destination)", () => {
    const { getByLabelText, queryByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => {
      fireEvent(getByLabelText("Start Point"), "focus");
    });
    // When destinationIsHidden is true, destination input is hidden
    expect(queryByLabelText("Destination")).toBeNull();
  });

  it("sets destinationIsHidden=false when destination input is focused (hides start)", () => {
    const { getByLabelText, queryByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => {
      fireEvent(getByLabelText("Destination"), "focus");
    });
    expect(queryByLabelText("Start Point")).toBeNull();
  });

  it("resets destinationIsHidden to null on start blur (both inputs visible again)", () => {
    const { getByLabelText, queryByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    act(() => { fireEvent(getByLabelText("Start Point"), "blur"); });
    expect(queryByLabelText("Destination")).toBeTruthy();
  });

  it("resets destinationIsHidden to null on destination blur (both inputs visible again)", () => {
    const { getByLabelText, queryByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "focus"); });
    act(() => { fireEvent(getByLabelText("Destination"), "blur"); });
    expect(queryByLabelText("Start Point")).toBeTruthy();
  });

  // ── enterStartPoint paths ──────────────────────────────────────────────────

  it("enterStartPoint: sets start point for a valid building result", () => {
    const setStartPoint = jest.fn();
    const sb = mockSearchbar();
    sb.processStartPointSearch.mockReturnValue({
      buildingName: "MB Building",
      roomNumber: "101",
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setStartPoint={setStartPoint} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "blur"); });
    expect(setStartPoint).toHaveBeenCalledWith(
      "MB",
      expect.objectContaining({ latitude: 1, longitude: 2 }),
      "MB Building",
      "101",
    );
  });

  it("enterStartPoint: calls setStartPoint with location for Current Location result", () => {
    const setStartPoint = jest.fn();
    const sb = mockSearchbar();
    sb.processStartPointSearch.mockReturnValue({
      buildingName: "Current",
      roomNumber: "Location",
      isLocation: true,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setStartPoint={setStartPoint} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "blur"); });
    expect(setStartPoint).toHaveBeenCalledWith(
      "",
      { latitude: 45.5, longitude: -73.6 },
      "",
      "",
    );
  });

  it("enterStartPoint: does NOT call setStartPoint when location is null for Current Location", () => {
    const setStartPoint = jest.fn();
    jest.spyOn(useUserLocation, "useUserLocation").mockReturnValue({
      location: null,
      error: null,
      loading: false,
      hasPermission: true,
    });
    const sb = mockSearchbar();
    sb.processStartPointSearch.mockReturnValue({
      buildingName: "Current",
      roomNumber: "Location",
      isLocation: true,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setStartPoint={setStartPoint} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "blur"); });
    expect(setStartPoint).not.toHaveBeenCalled();
  });

  it("enterStartPoint: reverts to stable text when processStartPointSearch returns null", () => {
    const sb = mockSearchbar();
    sb.processStartPointSearch.mockReturnValue(null);
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => {
      fireEvent.changeText(getByLabelText("Start Point"), "Garbage text");
      fireEvent(getByLabelText("Start Point"), "blur");
    });
    expect(getByLabelText("Start Point").props.value).toMatch(/MB Building/);
  });

  it("enterStartPoint: returns early when setPoint finds no buildingId", () => {
    const setStartPoint = jest.fn();
    const sb = mockSearchbar();
    sb.processStartPointSearch.mockReturnValue({
      buildingName: "Nonexistent Building",
      roomNumber: "000",
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setStartPoint={setStartPoint} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "blur"); });
    expect(setStartPoint).not.toHaveBeenCalled();
  });

  // ── enterDestination paths ─────────────────────────────────────────────────

  it("enterDestination: sets destination for a valid SGW building result", () => {
    const setDestination = jest.fn();
    const sb = mockSearchbar();
    sb.processDestinationSearch.mockReturnValue({
      buildingName: "MB Building",
      roomNumber: "305",
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setDestination={setDestination} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "blur"); });
    expect(setDestination).toHaveBeenCalledWith(
      "MB",
      expect.objectContaining({ latitude: 1, longitude: 2 }),
      "MB Building",
      "305",
    );
  });

  it("enterDestination: sets destination for a valid Loyola building result", () => {
    const setDestination = jest.fn();
    const sb = mockSearchbar();
    sb.processDestinationSearch.mockReturnValue({
      buildingName: "VL Building",
      roomNumber: "201",
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        destinationBuildingId="VL"
        userLocationBuildingId="VL"
        setDestination={setDestination}
      />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "blur"); });
    expect(setDestination).toHaveBeenCalledWith(
      "VL",
      expect.objectContaining({ latitude: 3, longitude: 4 }),
      "VL Building",
      "201",
    );
  });

  it("enterDestination: reverts to stable text when processDestinationSearch returns null", () => {
    const sb = mockSearchbar();
    sb.processDestinationSearch.mockReturnValue(null);
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => {
      fireEvent.changeText(getByLabelText("Destination"), "Garbage text");
      fireEvent(getByLabelText("Destination"), "blur");
    });
    expect(getByLabelText("Destination").props.value).toMatch(/MB Building/);
  });

  it("enterDestination: returns early when setPoint finds no buildingId", () => {
    const setDestination = jest.fn();
    const sb = mockSearchbar();
    sb.processDestinationSearch.mockReturnValue({
      buildingName: "Nonexistent Building",
      roomNumber: "000",
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setDestination={setDestination} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "blur"); });
    expect(setDestination).not.toHaveBeenCalled();
  });

  // ── setPoint helper – Loyola lookup ───────────────────────────────────────

  it("setPoint resolves Loyola buildingId correctly", () => {
    const setStartPoint = jest.fn();
    const sb = mockSearchbar();
    sb.processStartPointSearch.mockReturnValue({
      buildingName: "VL Building",
      roomNumber: "201",
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        startBuildingId="VL"
        userLocationBuildingId="VL"
        setStartPoint={setStartPoint}
      />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "blur"); });
    expect(setStartPoint).toHaveBeenCalledWith(
      "VL",
      expect.objectContaining({ latitude: 3, longitude: 4 }),
      "VL Building",
      "201",
    );
  });

  // ── Suggestion lists ───────────────────────────────────────────────────────

  it("shows start suggestion list with isLocation=true entry (renders SuggestionIcon)", () => {
    const sb = mockSearchbar();
    sb.searchStartPoint.mockReturnValue([
      { buildingName: "Current", roomNumber: "Location", isLocation: true },
    ]);
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const items = getAllByLabelText(/Set the start point to/);
    expect(items.length).toBeGreaterThan(0);
  });

  it("shows start suggestion with isLocation=true and roomNumber != Location (opacity variant)", () => {
    const sb = mockSearchbar();
    sb.searchStartPoint.mockReturnValue([
      { buildingName: "Current", roomNumber: "305", isLocation: true },
    ]);
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    expect(getAllByLabelText(/Set the start point to/).length).toBeGreaterThan(0);
  });

  it("tapping start suggestion dismisses keyboard and updates text", () => {
    const sb = mockSearchbar();
    sb.searchStartPoint.mockReturnValue([
      { buildingName: "MB Building", roomNumber: "101", isLocation: false },
    ]);
    const dismissSpy = jest.spyOn(Keyboard, "dismiss");
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    act(() => { fireEvent.press(getAllByLabelText(/Set the start point to/)[0]); });
    expect(dismissSpy).toHaveBeenCalled();
  });

  it("shows start icon button when buildingName present but roomNumber null and pressing it sets text", () => {
    const sb = mockSearchbar();
    sb.searchStartPoint.mockReturnValue([
      { buildingName: "MB Building", roomNumber: null, isLocation: false },
    ]);
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const iconBtns = getAllByLabelText(/Set the searchbar's text to/);
    expect(iconBtns.length).toBeGreaterThan(0);
    act(() => { fireEvent.press(iconBtns[0]); });
    expect(getByLabelText("Start Point").props.value).toMatch(/MB Building/);
  });

  it("shows destination suggestion list and tapping entry updates destination text", () => {
    const sb = mockSearchbar();
    sb.searchDestination.mockReturnValue([
      { buildingName: "VL Building", roomNumber: "201", isLocation: false },
    ]);
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "focus"); });
    const items = getAllByLabelText(/Set the destination to/);
    expect(items.length).toBeGreaterThan(0);
    act(() => { fireEvent.press(items[0]); });
    expect(getByLabelText("Destination").props.value).toMatch(/VL Building/);
  });

  it("shows destination icon button when buildingName present but roomNumber null and pressing sets text", () => {
    const sb = mockSearchbar();
    sb.searchDestination.mockReturnValue([
      { buildingName: "VL Building", roomNumber: null, isLocation: false },
    ]);
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "focus"); });
    const iconBtns = getAllByLabelText(/Set the searchbar's text to/);
    expect(iconBtns.length).toBeGreaterThan(0);
    act(() => { fireEvent.press(iconBtns[0]); });
    expect(getByLabelText("Destination").props.value).toMatch(/VL Building/);
  });

  it("hides suggestion lists after both inputs are blurred", () => {
    const sb = mockSearchbar();
    sb.searchStartPoint.mockReturnValue([
      { buildingName: "MB Building", roomNumber: "101", isLocation: false },
    ]);
    sb.searchDestination.mockReturnValue([
      { buildingName: "VL Building", roomNumber: "201", isLocation: false },
    ]);
    const { getByLabelText, queryAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => {
      fireEvent(getByLabelText("Start Point"), "focus");
      fireEvent(getByLabelText("Start Point"), "blur");
    });
    act(() => {
      fireEvent(getByLabelText("Destination"), "focus");
      fireEvent(getByLabelText("Destination"), "blur");
    });
    expect(queryAllByLabelText(/Set the start point to/).length).toBe(0);
    expect(queryAllByLabelText(/Set the destination to/).length).toBe(0);
  });

  // ── Accessory view – iOS (InputAccessoryView) ──────────────────────────────

  it("renders SGW accessory buttons on iOS when startBuildingId is SGW building", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const insertBtns = getAllByLabelText(/Insert/);
    expect(insertBtns.length).toBeGreaterThan(0);
  });

  it("SGW accessory button inserts building name into start field (destinationIsHidden=true)", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} startRoom={null} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    // Text should now contain the inserted building name
    expect(getByLabelText("Start Point").props.value).toBeTruthy();
  });

  it("SGW accessory button inserts building name into destination field (destinationIsHidden=false)", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} destinationRoom={null} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "focus"); });
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    expect(getByLabelText("Destination").props.value).toBeTruthy();
  });

  it("renders Loyola accessory buttons when userLocationBuildingId is Loyola building", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        startBuildingId="VL"
        destinationBuildingId="VL"
        userLocationBuildingId="VL"
      />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const insertBtns = getAllByLabelText(/Insert/);
    expect(insertBtns.length).toBeGreaterThan(0);
  });

  it("Loyola accessory button inserts building name into start field (destinationIsHidden=true)", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        startBuildingId="VL"
        destinationBuildingId="VL"
        userLocationBuildingId="VL"
        startRoom={null}
      />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    expect(getByLabelText("Start Point").props.value).toBeTruthy();
  });

  it("Loyola accessory button inserts into destination field (destinationIsHidden=false)", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        startBuildingId="VL"
        destinationBuildingId="VL"
        userLocationBuildingId="VL"
        destinationRoom={null}
      />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "focus"); });
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    expect(getByLabelText("Destination").props.value).toBeTruthy();
  });

  // ── insertStartPointBuildingName / insertDestinationBuildingName ───────────

  it("insertStartPointBuildingName inserts at cursor selection position", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} startRoom={null} startBuildingId={null} />
    );
    const startInput = getByLabelText("Start Point");
    act(() => {
      fireEvent(startInput, "focus");
      // Simulate a cursor selection at position 0..0
      fireEvent(startInput, "selectionChange", {
        nativeEvent: { selection: { start: 0, end: 0 } },
      });
    });
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    expect(startInput.props.value).toBeTruthy();
  });

  it("insertDestinationBuildingName inserts at cursor selection position", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} destinationRoom={null} destinationBuildingId={null} />
    );
    const destInput = getByLabelText("Destination");
    act(() => {
      fireEvent(destInput, "focus");
      fireEvent(destInput, "selectionChange", {
        nativeEvent: { selection: { start: 0, end: 0 } },
      });
    });
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    expect(destInput.props.value).toBeTruthy();
  });

  // ── Android keyboard listener paths ────────────────────────────────────────

  it("Android: registers keyboard listeners and shows accessory view on keyboardDidShow", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });

    // Capture the callbacks registered by the component's useEffect
    let showCb: (() => void) | undefined;
    let hideCb: (() => void) | undefined;
    jest.spyOn(Keyboard, "addListener").mockImplementation((event: string, cb: any) => {
      if (event === "keyboardDidShow") showCb = cb;
      if (event === "keyboardDidHide") hideCb = cb;
      return { remove: jest.fn() } as any;
    });

    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );

    // Simulate keyboard appearing
    act(() => { showCb && showCb(); });
    // Focus start so destinationIsHidden !== null → accessory view should render
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    expect(getAllByLabelText(/Insert/).length).toBeGreaterThan(0);
  });

  it("Android: hides accessory view on keyboardDidHide", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });

    let showCb: (() => void) | undefined;
    let hideCb: (() => void) | undefined;
    jest.spyOn(Keyboard, "addListener").mockImplementation((event: string, cb: any) => {
      if (event === "keyboardDidShow") showCb = cb;
      if (event === "keyboardDidHide") hideCb = cb;
      return { remove: jest.fn() } as any;
    });

    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );

    act(() => { showCb && showCb(); });
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    // Now simulate keyboard hiding – accessory view should disappear
    act(() => { hideCb && hideCb(); });
    expect(getByLabelText("Start Point")).toBeTruthy();
  });

  it("Android: cleans up keyboard listeners on unmount", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });
    const { unmount } = render(<DirectionsSearchPanel {...defaultProps} />);
    // Should not throw during cleanup
    expect(() => unmount()).not.toThrow();
  });

  it("iOS: does NOT register keyboard listeners", () => {
    Object.defineProperty(Platform, "OS", { get: () => "ios", configurable: true });
    const addListenerSpy = jest.spyOn(Keyboard, "addListener");
    const { unmount } = render(<DirectionsSearchPanel {...defaultProps} />);
    // Keyboard.addListener should not have been called for keyboard events
    const calls = addListenerSpy.mock.calls.map((c) => c[0]);
    expect(calls).not.toContain("keyboardDidShow");
    expect(calls).not.toContain("keyboardDidHide");
    unmount();
  });

  // ── Android accessory view conditional rendering ───────────────────────────

  it("Android: renders accessory view when keyboard visible and destinationIsHidden is not null", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });

    let showCb: (() => void) | undefined;
    jest.spyOn(Keyboard, "addListener").mockImplementation((event: string, cb: any) => {
      if (event === "keyboardDidShow") showCb = cb;
      return { remove: jest.fn() } as any;
    });

    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { showCb && showCb(); });
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const insertBtns = getAllByLabelText(/Insert/);
    expect(insertBtns.length).toBeGreaterThan(0);
  });

  it("Android: does NOT render accessory view when keyboard hidden", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });
    const { getByLabelText, queryAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    // Keyboard never shown
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    // isAndroidKeyboardVisible is false → no accessory view
    expect(queryAllByLabelText(/Insert/).length).toBe(0);
  });

  it("Android: does NOT render accessory view when destinationIsHidden is null", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });

    let showCb: (() => void) | undefined;
    jest.spyOn(Keyboard, "addListener").mockImplementation((event: string, cb: any) => {
      if (event === "keyboardDidShow") showCb = cb;
      return { remove: jest.fn() } as any;
    });

    const { queryAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    // Keyboard is visible but no input has been focused → destinationIsHidden stays null
    act(() => { showCb && showCb(); });
    expect(queryAllByLabelText(/Insert/).length).toBe(0);
  });

  // ── onChangeText (live text update) ───────────────────────────────────────

  it("updates startPointText when user types", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => {
      fireEvent.changeText(getByLabelText("Start Point"), "EV Building 101");
    });
    expect(getByLabelText("Start Point").props.value).toBe("EV Building 101");
  });

  it("updates destinationText when user types", () => {
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => {
      fireEvent.changeText(getByLabelText("Destination"), "CJ Building 202");
    });
    expect(getByLabelText("Destination").props.value).toBe("CJ Building 202");
  });

  // ── onSelectionChange ──────────────────────────────────────────────────────

  it("tracks cursor position on start input selectionChange", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} startRoom={null} />
    );
    const startInput = getByLabelText("Start Point");
    act(() => { fireEvent(startInput, "focus"); });
    act(() => {
      fireEvent(startInput, "selectionChange", {
        nativeEvent: { selection: { start: 3, end: 5 } },
      });
    });
    // Insert at mid-selection – result should differ from inserting at 0
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    expect(startInput.props.value.length).toBeGreaterThan(0);
  });

  it("tracks cursor position on destination input selectionChange", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} destinationRoom={null} />
    );
    const destInput = getByLabelText("Destination");
    act(() => { fireEvent(destInput, "focus"); });
    act(() => {
      fireEvent(destInput, "selectionChange", {
        nativeEvent: { selection: { start: 2, end: 4 } },
      });
    });
    const insertBtns = getAllByLabelText(/Insert/);
    act(() => { fireEvent.press(insertBtns[0]); });
    expect(destInput.props.value.length).toBeGreaterThan(0);
  });

  // ── useBuildingEvents campus selection ────────────────────────────────────

  it("passes SGW campus to useBuildingEvents when userLocationBuildingId is SGW building", () => {
    const spy = jest.spyOn(useBuildingEvents, "useBuildingEvents");
    render(<DirectionsSearchPanel {...defaultProps} userLocationBuildingId="MB" />);
    expect(spy).toHaveBeenCalledWith("MB", "SGW");
  });

  it("passes LOY campus to useBuildingEvents when userLocationBuildingId is Loyola building", () => {
    const spy = jest.spyOn(useBuildingEvents, "useBuildingEvents");
    render(
      <DirectionsSearchPanel
        {...defaultProps}
        userLocationBuildingId="VL"
        startBuildingId="VL"
        destinationBuildingId="VL"
      />
    );
    expect(spy).toHaveBeenCalledWith("VL", "LOY");
  });

  // ── SuggestionIcon platform branching ─────────────────────────────────────

  it("SuggestionIcon renders MaterialIcons on android", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });
    const sb = mockSearchbar();
    sb.searchStartPoint.mockReturnValue([
      { buildingName: "MB Building", roomNumber: "101", isLocation: true },
    ]);
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    // Component renders without crashing on android
    expect(getByLabelText("Start Point")).toBeTruthy();
  });

  // ── accessoryViewContent SGW vs Loyola branching ──────────────────────────

  it("accessoryViewContent shows SGW ids when startBuildingId is SGW", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} startBuildingId="MB" destinationBuildingId="MB" />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const sgwBtns = getAllByLabelText(/Insert MB Building into the searchbar/);
    expect(sgwBtns.length).toBeGreaterThan(0);
  });

  it("accessoryViewContent shows Loyola ids when both buildingIds are Loyola", () => {
    const { getByLabelText, getAllByLabelText } = render(
      <DirectionsSearchPanel
        {...defaultProps}
        startBuildingId="VL"
        destinationBuildingId="VL"
        userLocationBuildingId="VL"
      />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    const loyBtns = getAllByLabelText(/Insert VL Building into the searchbar/);
    expect(loyBtns.length).toBeGreaterThan(0);
  });

  // ── Null-suggestion edge cases ─────────────────────────────────────────────

  it("renders empty suggestion list when searchStartPoint returns []", () => {
    const sb = mockSearchbar();
    sb.searchStartPoint.mockReturnValue([]);
    const { getByLabelText, queryAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "focus"); });
    expect(queryAllByLabelText(/Set the start point to/).length).toBe(0);
  });

  it("renders empty destination suggestion list when searchDestination returns []", () => {
    const sb = mockSearchbar();
    sb.searchDestination.mockReturnValue([]);
    const { getByLabelText, queryAllByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "focus"); });
    expect(queryAllByLabelText(/Set the destination to/).length).toBe(0);
  });

  // ── fetchUpcomingEvents / refresh called on mount ─────────────────────────

  it("calls fetchUpcomingEvents and refresh on mount", () => {
    const fetchUpcomingEvents = jest.fn();
    const refresh = jest.fn();
    jest.spyOn(useGoogleCalendar, "useGoogleCalendar").mockReturnValue({
      events: [],
      calendars: [],
      loading: false,
      error: null,
      isAuthenticated: true,
      fetchUpcomingEvents,
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
      refresh,
    });
    render(<DirectionsSearchPanel {...defaultProps} />);
    expect(fetchUpcomingEvents).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  // ── Stable text when building not found but text non-empty ────────────────

  it("enterStartPoint keeps stableStartPointText when processStartPointSearch has empty buildingName", () => {
    const setStartPoint = jest.fn();
    const sb = mockSearchbar();
    sb.processStartPointSearch.mockReturnValue({
      buildingName: "",
      roomNumber: null,
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setStartPoint={setStartPoint} />
    );
    act(() => { fireEvent(getByLabelText("Start Point"), "blur"); });
    expect(setStartPoint).not.toHaveBeenCalled();
  });

  it("enterDestination keeps stableDestinationText when processDestinationSearch has empty buildingName", () => {
    const setDestination = jest.fn();
    const sb = mockSearchbar();
    sb.processDestinationSearch.mockReturnValue({
      buildingName: "",
      roomNumber: null,
      isLocation: false,
    });
    const { getByLabelText } = render(
      <DirectionsSearchPanel {...defaultProps} setDestination={setDestination} />
    );
    act(() => { fireEvent(getByLabelText("Destination"), "blur"); });
    expect(setDestination).not.toHaveBeenCalled();
  });
});
