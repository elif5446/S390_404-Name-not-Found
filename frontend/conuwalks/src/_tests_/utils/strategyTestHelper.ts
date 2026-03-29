export const FUTURE_DATE = new Date(Date.now() + 60_000);
export const PAST_DATE = new Date(Date.now() - 60_000);
export const BASE_URL = "https://maps.googleapis.com/maps/api/directions/json?key=TEST";

export const START = { latitude: 45.5017, longitude: -73.5673 };
export const DESTINATION = { latitude: 45.5231, longitude: -73.5828 };

export const MOCK_ROUTE = { legs: [], overviewPolyline: "abc" } as any;

export function getApiMocks() {
  const api = require("@/src/api/googleDirectionsAPI");
  return {
    mockClampToFuture: api.clampToFuture as jest.Mock,
    mockFetchRoutesApi: api.fetchRoutesApi as jest.Mock,
    mockFetchLegacyApi: api.fetchLegacyApi as jest.Mock,
    mockMapRoutesApiResponse: api.mapRoutesApiResponse as jest.Mock,
    mockMapLegacyApiResponse: api.mapLegacyApiResponse as jest.Mock,
    mockIsRoutesBlockedError: api.isRoutesBlockedError as jest.Mock,
  };
}

export function resetApiMocks(mocks: ReturnType<typeof getApiMocks>) {
  beforeEach(() => {
    jest.clearAllMocks();

    // Lazily evaluated so PAST_DATE is always in the past relative to when the test runs
    mocks.mockClampToFuture.mockImplementation((date: Date | null) => {
      if (!date) return null;
      return date.getTime() > Date.now() ? date : null;
    });

    mocks.mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [MOCK_ROUTE], safeTargetTime: FUTURE_DATE });
    mocks.mockFetchLegacyApi.mockResolvedValue({ rawRoutes: [MOCK_ROUTE], safeTargetTime: FUTURE_DATE });
    mocks.mockMapRoutesApiResponse.mockReturnValue([MOCK_ROUTE]);
    mocks.mockMapLegacyApiResponse.mockReturnValue([MOCK_ROUTE]);
    mocks.mockIsRoutesBlockedError.mockReturnValue(false);
  });
}