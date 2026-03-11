import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
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

  test("clearTokens removes items and signs out of Google", async () => {
    await clearTokens();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("@auth_tokens");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("@user_info");
    expect(GoogleSignin.signOut).toHaveBeenCalled();
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
