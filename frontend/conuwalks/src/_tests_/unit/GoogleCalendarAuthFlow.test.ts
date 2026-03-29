import { GoogleCalendarAuthFlow } from "../../Auth/GoogleCalendarAuthFlow";
import {
  getTokens,
  isTokenValid,
  clearTokens,
  saveTokens,
  saveUserInfo,
} from "../../utils/tokenStorage";

jest.mock("../../utils/tokenStorage", () => ({
  getTokens: jest.fn(),
  isTokenValid: jest.fn(),
  clearTokens: jest.fn(),
  saveTokens: jest.fn(),
  saveUserInfo: jest.fn(),
}));

const mockGetTokens = getTokens as jest.MockedFunction<typeof getTokens>;
const mockIsTokenValid = isTokenValid as jest.MockedFunction<typeof isTokenValid>;
const mockClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockSaveTokens = saveTokens as jest.MockedFunction<typeof saveTokens>;
const mockSaveUserInfo = saveUserInfo as jest.MockedFunction<typeof saveUserInfo>;

// --- Fixtures ---

const mockAuthResult = {
  type: "success",
  authentication: {
    accessToken: "google-access-token",
    idToken: "google-id-token",
  },
};

const mockUserApiResponse = {
  id: "google-user-1",
  name: "Jane Doe",
  email: "jane@gmail.com",
  picture: "https://example.com/photo.jpg",
};

// Helper to build a flow with controllable promptAsync and successCallback
function buildFlow(
  promptResult: any = mockAuthResult,
  onSuccess: () => void = jest.fn()
) {
  const promptAsync = jest.fn().mockResolvedValue(promptResult);
  const flow = new GoogleCalendarAuthFlow(promptAsync, onSuccess);
  return { flow, promptAsync, onSuccess };
}

// Helper to mock a fetch response
function mockFetch(body: object, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

describe("GoogleCalendarAuthFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no existing session
    mockGetTokens.mockResolvedValue(null);
    mockClearTokens.mockImplementation(() => Promise.resolve());
    mockSaveTokens.mockResolvedValue(true);
    mockSaveUserInfo.mockResolvedValue(true);
    mockIsTokenValid.mockReturnValue(false);
  });

    // performAuth
    describe("performAuth()", () => {
    it("calls promptAsync and returns mapped tokens on success", async () => {
      mockFetch(mockUserApiResponse);
      const { flow, promptAsync } = buildFlow();

      await flow.execute();

      expect(promptAsync).toHaveBeenCalledTimes(1);
      expect(mockSaveTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: mockAuthResult.authentication.accessToken,
          idToken: mockAuthResult.authentication.idToken,
          expiryDate: expect.any(Number),
        })
      );
    });

    it("sets expiryDate ~1 hour in the future", async () => {
      mockFetch(mockUserApiResponse);
      const before = Date.now();
      const { flow } = buildFlow();

      await flow.execute();

      const [[savedTokens]] = (mockSaveTokens as jest.Mock).mock.calls;
      const after = Date.now();

      expect(savedTokens.expiryDate).toBeGreaterThanOrEqual(before + 3600000);
      expect(savedTokens.expiryDate).toBeLessThanOrEqual(after + 3600000);
    });

    it("uses empty string for idToken when authentication.idToken is missing", async () => {
      mockFetch(mockUserApiResponse);
      const resultWithoutIdToken = {
        type: "success",
        authentication: { accessToken: "token-no-id" },
      };
      const { flow } = buildFlow(resultWithoutIdToken);

      await flow.execute();

      expect(mockSaveTokens).toHaveBeenCalledWith(
        expect.objectContaining({ idToken: "" })
      );
    });

    it("throws 'Auth cancelled' when result type is 'cancel'", async () => {
      const { flow } = buildFlow({ type: "cancel" });

      await expect(flow.execute()).rejects.toThrow("Auth cancelled");
    });

    it("throws 'Auth failed' when result type is not 'success' or 'cancel'", async () => {
      const { flow } = buildFlow({ type: "error" });

      await expect(flow.execute()).rejects.toThrow("Auth failed");
    });

    it("throws 'No access token received' when accessToken is missing", async () => {
      const { flow } = buildFlow({
        type: "success",
        authentication: { idToken: "some-id-token" },
      });

      await expect(flow.execute()).rejects.toThrow("No access token received");
    });

    it("throws 'No access token received' when authentication is null", async () => {
      const { flow } = buildFlow({ type: "success", authentication: null });

      await expect(flow.execute()).rejects.toThrow("No access token received");
    });
  });

  // fetchUserInfo
  describe("fetchUserInfo()", () => {
    it("calls the Google userinfo endpoint with the Bearer token", async () => {
      mockFetch(mockUserApiResponse);
      const { flow } = buildFlow();

      await flow.execute();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/userinfo/v2/me",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockAuthResult.authentication.accessToken}` },
        })
      );
    });

    it("maps Google API fields to UserInfo correctly", async () => {
      mockFetch(mockUserApiResponse);
      const { flow } = buildFlow();

      await flow.execute();

      expect(mockSaveUserInfo).toHaveBeenCalledWith({
        id: mockUserApiResponse.id,
        name: mockUserApiResponse.name,
        email: mockUserApiResponse.email,
        photo: mockUserApiResponse.picture,
      });
    });

    it("falls back to empty string for missing id and email", async () => {
      mockFetch({ name: "No Id", picture: "" });
      const { flow } = buildFlow();

      await flow.execute();

      expect(mockSaveUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({ id: "", email: "" })
      );
    });

    it("falls back to 'User' for missing name", async () => {
      mockFetch({ id: "1", email: "x@x.com", picture: "" });
      const { flow } = buildFlow();

      await flow.execute();

      expect(mockSaveUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({ name: "User" })
      );
    });

    it("falls back to empty string for missing picture", async () => {
      mockFetch({ id: "1", name: "Jane", email: "jane@gmail.com" });
      const { flow } = buildFlow();

      await flow.execute();

      expect(mockSaveUserInfo).toHaveBeenCalledWith(
        expect.objectContaining({ photo: "" })
      );
    });

    it("throws with status code when the API response is not ok", async () => {
      mockFetch({}, false, 401);
      const { flow } = buildFlow();

      await expect(flow.execute()).rejects.toThrow("Failed to fetch user info: 401");
    });

    it("throws when fetch itself rejects (network error)", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      const { flow } = buildFlow();

      await expect(flow.execute()).rejects.toThrow("Network error");
    });
  });

  // onAuthSuccess
  describe("onAuthSuccess()", () => {
    it("calls the successCallback after a successful auth flow", async () => {
      mockFetch(mockUserApiResponse);
      const onSuccess = jest.fn();
      const { flow } = buildFlow(mockAuthResult, onSuccess);

      await flow.execute();

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("does not call successCallback when performAuth throws", async () => {
      const onSuccess = jest.fn();
      const { flow } = buildFlow({ type: "cancel" }, onSuccess);

      await expect(flow.execute()).rejects.toThrow();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("does not call successCallback when fetchUserInfo throws", async () => {
      mockFetch({}, false, 500);
      const onSuccess = jest.fn();
      const { flow } = buildFlow(mockAuthResult, onSuccess);

      await expect(flow.execute()).rejects.toThrow();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // Inherited session behaviour (from AuthFlow base class)
  describe("existing session (inherited from AuthFlow)", () => {
    it("skips auth entirely and calls successCallback when a valid session exists", async () => {
      mockGetTokens.mockResolvedValue({
        accessToken: "cached-token",
        idToken: "cached-id",
        expiryDate: Date.now() + 3600000,
      });
      mockIsTokenValid.mockReturnValue(true);

      const onSuccess = jest.fn();
      const { flow, promptAsync } = buildFlow(mockAuthResult, onSuccess);

      await flow.execute();

      expect(promptAsync).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});