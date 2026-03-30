import { getDirections } from "@/src/outdoorDirections/directionsService";
import { getStrategy } from "@/src/outdoorDirections/travelModeStrategyFactory";

jest.mock("@/src/outdoorDirections/travelModeStrategyFactory", () => ({
  getStrategy: jest.fn(),
}));

const mockFetchRoutes = jest.fn();

const START = { latitude: 45.5017, longitude: -73.5673 };
const DESTINATION = { latitude: 45.5088, longitude: -73.5878 };
const FUTURE_DATE = new Date("2030-01-01T12:00:00.000Z");
const MOCK_ROUTES = [{ id: "route-1" }] as any;

describe("getDirections", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getStrategy as jest.Mock).mockReturnValue({
      fetchRoutes: mockFetchRoutes,
    });
    mockFetchRoutes.mockReset();
  });

  it("throws when start is null", async () => {
    await expect(
      getDirections(null, DESTINATION, "driving")
    ).rejects.toThrow("Start location is required");
  });

  it("throws when destination is null", async () => {
    await expect(
      getDirections(START, null, "driving")
    ).rejects.toThrow("Destination location is required");
  });

  it("uses default targetTime and timeMode when not provided", async () => {
    mockFetchRoutes.mockResolvedValueOnce(MOCK_ROUTES);

    const result = await getDirections(START, DESTINATION, "driving");

    expect(getStrategy).toHaveBeenCalledWith("driving");
    expect(mockFetchRoutes).toHaveBeenCalledWith(
      START,
      DESTINATION,
      null,
      "leave"
    );
    expect(result).toBe(MOCK_ROUTES);
  });

  it("delegates to the selected strategy with provided arguments", async () => {
    mockFetchRoutes.mockResolvedValueOnce(MOCK_ROUTES);

    const result = await getDirections(
      START,
      DESTINATION,
      "transit",
      FUTURE_DATE,
      "arrive"
    );

    expect(getStrategy).toHaveBeenCalledWith("transit");
    expect(mockFetchRoutes).toHaveBeenCalledWith(
      START,
      DESTINATION,
      FUTURE_DATE,
      "arrive"
    );
    expect(result).toBe(MOCK_ROUTES);
  });
});