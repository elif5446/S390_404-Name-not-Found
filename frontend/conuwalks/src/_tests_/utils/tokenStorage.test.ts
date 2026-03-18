import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveTokens,
  saveUserInfo,
  getUserInfo,
  getTokens,
  clearTokens,
  isTokenValid,
} from "../../utils/tokenStorage";

describe("tokenStorage utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("saveTokens saves valid tokens", async () => {
    const tokens = { accessToken: "abc", expiryDate: Date.now() + 10000 };
    const result = await saveTokens(tokens);
    expect(result).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@auth_tokens",
      JSON.stringify(tokens),
    );
  });

  test("saveTokens fails with invalid tokens", async () => {
    const result = await saveTokens(null as any);
    expect(result).toBe(false);
  });

  test("saveUserInfo saves valid user info", async () => {
    const user = { id: "1", name: "John", email: "j@j.com", photo: "p" };
    const result = await saveUserInfo(user);
    expect(result).toBe(true);
  });

  test("saveUserInfo skips placeholder user info", async () => {
    const user = { id: "1", name: "User", email: "j@j.com", photo: "p" };
    const result = await saveUserInfo(user);
    expect(result).toBe(false);
  });

  test("getTokens and getUserInfo retrieve data", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ test: "data" }),
    );
    const tokens = await getTokens();
    const user = await getUserInfo();
    expect(tokens).not.toBeNull();
    expect(user).not.toBeNull();
  });

  test("clearTokens removes items and revokes Google token", async () => {
    const mockTokenString = JSON.stringify({
      accessToken: "mock-access-token",
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockTokenString);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });

    await clearTokens();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("@auth_tokens");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("@user_info");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "@class_reminder_lead_time",
    );
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "@dismissed_class_event_ids",
    );

    // 4. Verify the fetch call was made to Google's revoke endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/revoke?token=mock-access-token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );
  });

  test("isTokenValid validates expiry and presence", () => {
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid({ accessToken: "abc" })).toBe(true);

    const validToken = { accessToken: "abc", expiryDate: Date.now() + 600000 };
    expect(isTokenValid(validToken)).toBe(true);

    const expiredToken = { accessToken: "abc", expiryDate: Date.now() - 1000 };
    expect(isTokenValid(expiredToken)).toBe(false);
  });
});
