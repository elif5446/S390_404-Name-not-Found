import { AuthFlow, Tokens, UserInfo } from "../../Auth/AuthFlow";
import {
  getTokens,
  isTokenValid,
  clearTokens,
  saveTokens,
  saveUserInfo,
} from "../../utils/tokenStorage";

// Mock token storage utilities
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

// Concrete implementation of the abstract AuthFlow for testing
class TestAuthFlow extends AuthFlow {
  mockPerformAuth = jest.fn<Promise<Tokens>, []>();
  mockFetchUserInfo = jest.fn<Promise<UserInfo>, [string]>();
  mockOnAuthSuccess = jest.fn<Promise<void>, []>();

  protected performAuth(): Promise<Tokens> {
    return this.mockPerformAuth();
  }

  protected fetchUserInfo(accessToken: string): Promise<UserInfo> {
    return this.mockFetchUserInfo(accessToken);
  }

  protected onAuthSuccess(): Promise<void> {
    return this.mockOnAuthSuccess();
  }
}

// Fixtures
const mockTokens: Tokens = {
  accessToken: "access-token-123",
  idToken: "id-token-456",
  expiryDate: Date.now() + 3600 * 1000,
};

const mockUser: UserInfo = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
  photo: "https://example.com/photo.jpg",
};

describe("AuthFlow", () => {
  let flow: TestAuthFlow;

  beforeEach(() => {
    jest.clearAllMocks();
    flow = new TestAuthFlow();
    flow.mockOnAuthSuccess.mockResolvedValue(undefined);
  });

  describe("execute() — existing valid session", () => {
    it("calls onAuthSuccess and returns early when a valid session exists", async () => {
      mockGetTokens.mockResolvedValue(mockTokens);
      mockIsTokenValid.mockReturnValue(true);

      await flow.execute();

      expect(mockGetTokens).toHaveBeenCalledTimes(1);
      expect(mockIsTokenValid).toHaveBeenCalledWith(mockTokens);
      expect(flow.mockPerformAuth).not.toHaveBeenCalled();
      expect(flow.mockFetchUserInfo).not.toHaveBeenCalled();
      expect(mockSaveTokens).not.toHaveBeenCalled();
      expect(mockSaveUserInfo).not.toHaveBeenCalled();
      expect(flow.mockOnAuthSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe("execute() — no existing session", () => {
    beforeEach(() => {
      mockGetTokens.mockResolvedValue(null);
      mockIsTokenValid.mockReturnValue(false);
     mockClearTokens.mockImplementation(() => Promise.resolve());
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockResolvedValue(mockUser);
      mockSaveTokens.mockResolvedValue(true);
      mockSaveUserInfo.mockResolvedValue(true);
    });

    it("runs the full auth flow in the correct order", async () => {
      const callOrder: string[] = [];

      flow.mockPerformAuth.mockImplementation(async () => {
        callOrder.push("performAuth");
        return mockTokens;
      });
      flow.mockFetchUserInfo.mockImplementation(async () => {
        callOrder.push("fetchUserInfo");
        return mockUser;
      });
      mockSaveTokens.mockImplementation(async () => {
        callOrder.push("saveTokens");
        return true;
      });
      mockSaveUserInfo.mockImplementation(async () => {
        callOrder.push("saveUserInfo");
        return true;
      });
      flow.mockOnAuthSuccess.mockImplementation(async () => {
        callOrder.push("onAuthSuccess");
      });

      await flow.execute();

      expect(callOrder).toEqual([
        "performAuth",
        "fetchUserInfo",
        "saveTokens",
        "saveUserInfo",
        "onAuthSuccess",
      ]);
    });

    it("passes the accessToken from performAuth to fetchUserInfo", async () => {
      await flow.execute();

      expect(flow.mockFetchUserInfo).toHaveBeenCalledWith(mockTokens.accessToken);
    });

    it("saves the tokens returned by performAuth", async () => {
      await flow.execute();

      expect(mockSaveTokens).toHaveBeenCalledWith(mockTokens);
    });

    it("saves the user info returned by fetchUserInfo", async () => {
      await flow.execute();

      expect(mockSaveUserInfo).toHaveBeenCalledWith({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        photo: mockUser.photo,
      });
    });

    it("calls onAuthSuccess after saving the session", async () => {
      await flow.execute();

      expect(flow.mockOnAuthSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe("checkExistingSession()", () => {
    it("returns true when tokens exist and are valid", async () => {
      mockGetTokens.mockResolvedValue(mockTokens);
      mockIsTokenValid.mockReturnValue(true);

      await flow.execute();

      expect(flow.mockPerformAuth).not.toHaveBeenCalled();
    });

    it("clears tokens and returns false when tokens exist but are invalid", async () => {
      mockGetTokens.mockResolvedValue(mockTokens);
      mockIsTokenValid.mockReturnValue(false);
      mockClearTokens.mockImplementation(() => Promise.resolve());
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockResolvedValue(mockUser);
      mockSaveTokens.mockResolvedValue(true);
      mockSaveUserInfo.mockResolvedValue(true);

      await flow.execute();

      expect(mockClearTokens).toHaveBeenCalledTimes(1);
      expect(flow.mockPerformAuth).toHaveBeenCalledTimes(1);
    });

    it("returns false and continues auth flow when getTokens returns null", async () => {
      mockGetTokens.mockResolvedValue(null);
      mockClearTokens.mockImplementation(() => Promise.resolve());
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockResolvedValue(mockUser);
      mockSaveTokens.mockResolvedValue(true);
      mockSaveUserInfo.mockResolvedValue(true);

      await flow.execute();

      expect(flow.mockPerformAuth).toHaveBeenCalledTimes(1);
    });

    it("returns false (and does not throw) when getTokens rejects", async () => {
      mockGetTokens.mockRejectedValue(new Error("storage error"));
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockResolvedValue(mockUser);
      mockSaveTokens.mockResolvedValue(true);
      mockSaveUserInfo.mockResolvedValue(true);

      await expect(flow.execute()).resolves.toBeUndefined();
      expect(flow.mockPerformAuth).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveSession()", () => {
    it("saves both tokens and full user info", async () => {
      mockGetTokens.mockResolvedValue(null);
      mockClearTokens.mockImplementation(() => Promise.resolve());
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockResolvedValue(mockUser);
      mockSaveTokens.mockResolvedValue(true);
      mockSaveUserInfo.mockResolvedValue(true);

      await flow.execute();

      expect(mockSaveTokens).toHaveBeenCalledWith(mockTokens);
      expect(mockSaveUserInfo).toHaveBeenCalledWith({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        photo: mockUser.photo,
      });
    });

    it("only saves whitelisted user fields (id, name, email, photo)", async () => {
      const userWithExtras = { ...mockUser, extraField: "should-not-be-saved" } as UserInfo & {
        extraField: string;
      };

      mockGetTokens.mockResolvedValue(null);
      mockClearTokens.mockImplementation(() => Promise.resolve());
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockResolvedValue(userWithExtras);
      mockSaveTokens.mockResolvedValue(true);
      mockSaveUserInfo.mockResolvedValue(true);

      await flow.execute();

      expect(mockSaveUserInfo).toHaveBeenCalledWith({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        photo: mockUser.photo,
      });
      expect(mockSaveUserInfo).not.toHaveBeenCalledWith(
        expect.objectContaining({ extraField: expect.anything() })
      );
    });
  });

  describe("error propagation", () => {
    beforeEach(() => {
      mockGetTokens.mockResolvedValue(null);
      mockClearTokens.mockImplementation(() => Promise.resolve());
    });

    it("propagates errors thrown by performAuth", async () => {
      flow.mockPerformAuth.mockRejectedValue(new Error("auth failed"));

      await expect(flow.execute()).rejects.toThrow("auth failed");
    });

    it("propagates errors thrown by fetchUserInfo", async () => {
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockRejectedValue(new Error("user fetch failed"));

      await expect(flow.execute()).rejects.toThrow("user fetch failed");
    });

    it("propagates errors thrown by onAuthSuccess", async () => {
      flow.mockPerformAuth.mockResolvedValue(mockTokens);
      flow.mockFetchUserInfo.mockResolvedValue(mockUser);
      mockSaveTokens.mockResolvedValue(true);
      mockSaveUserInfo.mockResolvedValue(true);
      flow.mockOnAuthSuccess.mockRejectedValue(new Error("success handler failed"));

      await expect(flow.execute()).rejects.toThrow("success handler failed");
    });
  });
});