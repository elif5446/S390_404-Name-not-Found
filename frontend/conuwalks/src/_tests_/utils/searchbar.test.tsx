import {
  processDestinationSearch,
  processStartPointSearch,
  searchDestination,
  searchStartPoint,
} from "../../utils/searchbar";
import {
  guessFutureRoomLocation,
  guessRoomLocation,
} from "../../utils/schedule";

jest.mock("../../data/metadata/SGW.BuildingMetaData", () => ({
  SGWBuildingSearchMetadata: {
    H: { name: "Henry F. Hall Building", coordinates: { latitude: 0, longitude: 0 } },
    LB: { name: "J.W. McConnell Building (Webster Library)", coordinates: { latitude: 0, longitude: 0 } },
    MB: { name: "John Molson Building", coordinates: { latitude: 0, longitude: 0 } },
    AA: { name: "Alpha AA Building", coordinates: { latitude: 0, longitude: 0 } },
    AB: { name: "Alpha AB Building", coordinates: { latitude: 0, longitude: 0 } },
    AC: { name: "Alpha AC Building", coordinates: { latitude: 0, longitude: 0 } },
    AD: { name: "Alpha AD Building", coordinates: { latitude: 0, longitude: 0 } },
    AE: { name: "Alpha AE Building", coordinates: { latitude: 0, longitude: 0 } },
    AF: { name: "Alpha AF Building", coordinates: { latitude: 0, longitude: 0 } },
    AG: { name: "Alpha AG Building", coordinates: { latitude: 0, longitude: 0 } },
    AH: { name: "Alpha AH Building", coordinates: { latitude: 0, longitude: 0 } },
    AI: { name: "Alpha AI Building", coordinates: { latitude: 0, longitude: 0 } },
    AJ: { name: "Alpha AJ Building", coordinates: { latitude: 0, longitude: 0 } },
    AK: { name: "Alpha AK Building", coordinates: { latitude: 0, longitude: 0 } },
    AL: { name: "Alpha AL Building", coordinates: { latitude: 0, longitude: 0 } },
  },
}));

jest.mock("../../data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingSearchMetadata: {
    HU: { name: "Applied Science Hub", coordinates: { latitude: 0, longitude: 0 } },
    VL: { name: "Vanier Library Building", coordinates: { latitude: 0, longitude: 0 } },
    CJ: { name: "Communication Studies and Journalism Building", coordinates: { latitude: 0, longitude: 0 } },
    CC: { name: "Central Building", coordinates: { latitude: 0, longitude: 0 } },
    FC: { name: "F.C. Smith Building", coordinates: { latitude: 0, longitude: 0 } },
  },
}));

jest.mock("../../utils/schedule", () => ({
  guessRoomLocation: jest.fn(),
  guessFutureRoomLocation: jest.fn(),
}));

describe("searchbar utils", () => {
  const guessRoomLocationMock = guessRoomLocation as jest.Mock;
  const guessFutureRoomLocationMock = guessFutureRoomLocation as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    guessRoomLocationMock.mockReturnValue(null);
    guessFutureRoomLocationMock.mockReturnValue(null);
  });

  it("returns an empty array when no schedule source is available", () => {
    expect(searchStartPoint("H", null as any)).toEqual([]);
    expect(searchDestination("H", null as any)).toEqual([]);
  });

  it("returns the second start-point suggestion when a current-location shortcut is present", () => {
    guessRoomLocationMock.mockReturnValue({
      buildingCode: "H",
      roomNumber: "801",
    });

    const result = processStartPointSearch("Henry", [
      { location: "H 801" },
    ] as any);

    expect(result).toEqual({
      buildingName: "Henry F. Hall Building",
      roomNumber: "801",
      isLocation: true,
    });
  });

  it("falls back to the first start-point suggestion when no building match exists", () => {
    const result = processStartPointSearch("", [] as any);

    expect(result).toEqual({
      buildingName: "Current",
      roomNumber: "Location",
      isLocation: true,
    });
  });

  it("returns the first destination suggestion", () => {
    guessFutureRoomLocationMock.mockReturnValue({
      buildingCode: "MB",
      roomNumber: "1.210",
    });

    const result = processDestinationSearch("MB", [
      { location: "MB 1.210" },
    ] as any);

    expect(result).toEqual({
      buildingName: "John Molson Building",
      roomNumber: "1.210",
      isLocation: true,
    });
  });

it("returns undefined when destination search has no matches", () => {
  expect(processDestinationSearch("ZZZ", [] as any)).toBeUndefined();
});


  it("uses the fallback user building when there is no current event", () => {
    const results = searchStartPoint("", [] as any, "MB");

    expect(results).toEqual([
      {
        buildingName: "Current",
        roomNumber: "Location",
        isLocation: true,
      },
      {
        buildingName: "John Molson Building",
        roomNumber: null,
        isLocation: true,
      },
    ]);
  });

  it("matches destination buildings by code and name and sorts the current building later", () => {
    guessFutureRoomLocationMock.mockReturnValue({
      buildingCode: "MB",
      roomNumber: "1.210",
    });

    const results = searchDestination("j", [
      { location: "MB 1.210" },
      { location: "LB 2.500" },
    ] as any);

    expect(results[0]).toEqual({
      buildingName: "J.W. McConnell Building (Webster Library)",
      roomNumber: "2.500",
      isLocation: false,
    });
    expect(results.some((item) => item.buildingName === "John Molson Building")).toBe(
      true,
    );
  });

  it("orders rooms in the current building so the current room appears after the others", () => {
    guessFutureRoomLocationMock.mockReturnValue({
      buildingCode: "MB",
      roomNumber: "1.210",
    });

    const results = searchDestination("John Molson Building", [
      { location: "MB 1.210" },
      { location: "MB 2.300" },
    ] as any);

    expect(results[0]).toEqual({
      buildingName: "John Molson Building",
      roomNumber: "2.300",
      isLocation: false,
    });
    expect(results[1]).toEqual({
      buildingName: "John Molson Building",
      roomNumber: "1.210",
      isLocation: true,
    });
  });

  it("keeps the relative order of non-current rooms in the current building", () => {
    guessFutureRoomLocationMock.mockReturnValue({
      buildingCode: "MB",
      roomNumber: "1.210",
    });

    const results = searchDestination("John Molson Building", [
      { location: "MB 2.300" },
      { location: "MB 3.400" },
      { location: "MB 1.210" },
    ] as any);

    expect(results.slice(0, 3)).toEqual([
      {
        buildingName: "John Molson Building",
        roomNumber: "2.300",
        isLocation: false,
      },
      {
        buildingName: "John Molson Building",
        roomNumber: "3.400",
        isLocation: false,
      },
      {
        buildingName: "John Molson Building",
        roomNumber: "1.210",
        isLocation: true,
      },
    ]);
  });

  it("adds a custom uppercase room suggestion when the room does not already exist", () => {
    const results = searchDestination("MB 9.999", [
      { location: "MB 1.210" },
    ] as any);

    expect(results).toContainEqual({
      buildingName: "John Molson Building",
      roomNumber: "9.999",
      isLocation: false,
    });
  });

  it("adds a custom uppercase start-point room suggestion when the room does not already exist", () => {
    guessRoomLocationMock.mockReturnValue({
      buildingCode: "H",
      roomNumber: "801",
    });

    const results = searchStartPoint("Henry 9.999", [
      { location: "H 801" },
    ] as any);

    expect(results).toContainEqual({
      buildingName: "Henry F. Hall Building",
      roomNumber: "9.999",
      isLocation: true,
    });
  });

  it("does not add a duplicate custom room suggestion when the room already exists", () => {
    const results = searchDestination("MB 1.210", [
      { location: "MB 1.210" },
    ] as any);

    expect(results).toEqual([
      {
        buildingName: "John Molson Building",
        roomNumber: "1.210",
        isLocation: false,
      },
    ]);
  });

  it("keeps non-location building rooms in their original order", () => {
    guessRoomLocationMock.mockReturnValue({
      buildingCode: "H",
      roomNumber: "801",
    });

    const results = searchStartPoint("John Molson Building", [
      { location: "MB 2.300" },
      { location: "MB 3.400" },
    ] as any);

    expect(results.slice(1, 3)).toEqual([
      {
        buildingName: "John Molson Building",
        roomNumber: "2.300",
        isLocation: false,
      },
      {
        buildingName: "John Molson Building",
        roomNumber: "3.400",
        isLocation: false,
      },
    ]);
  });

  it("includes the building-only suggestion when no room input is provided", () => {
    const results = searchDestination("MB", [
      { location: "MB 1.210" },
    ] as any);

    expect(results).toContainEqual({
      buildingName: "John Molson Building",
      roomNumber: 
      
      ,
      isLocation: false,
    });
  });

  it("orders the current building after other matching buildings in destination search", () => {
    guessFutureRoomLocationMock.mockReturnValue({
      buildingCode: "MB",
      roomNumber: "1.210",
    });

    const results = searchDestination("J", [
      { location: "MB 1.210" },
      { location: "LB 100" },
    ] as any);

    const firstJohnMolsonIndex = results.findIndex(
      (item) => item.buildingName === "John Molson Building",
    );
    const firstWebsterIndex = results.findIndex(
      (item) => item.buildingName === "J.W. McConnell Building (Webster Library)",
    );

    expect(firstJohnMolsonIndex).toBeGreaterThan(firstWebsterIndex);
  });

  it("limits the number of suggestions to ten items", () => {
    const results = searchDestination("Alpha", [
      { location: "AA 100" },
      { location: "AB 100" },
      { location: "AC 100" },
      { location: "AD 100" },
      { location: "AE 100" },
      { location: "AF 100" },
      { location: "AG 100" },
      { location: "AH 100" },
      { location: "AI 100" },
      { location: "AJ 100" },
      { location: "AK 100" },
      { location: "AL 100" },
    ] as any);

    expect(results).toHaveLength(10);
  });
});
