import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearTokens,
  DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES,
  getClassReminderLeadTime,
  getDismissedClassEventIds,
  getTokens,
  getUserInfo,
  getWheelchairAccessibilityPreference,
  isTokenValid,
  MAX_CLASS_REMINDER_LEAD_TIME_MINUTES,
  saveClassReminderLeadTime,
  saveDismissedClassEventIds,
  saveTokens,
  saveUserInfo,
  saveWheelchairAccessibilityPreference,
} from "../../utils/tokenStorage";

describe("tokenStorage utils", () => {
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    globalThis.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("saves valid tokens", async () => {
    const tokens = { accessToken: "abc", expiryDate: Date.now() + 10000 };
    const result = await saveTokens(tokens);

    expect(result).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@auth_tokens",
      JSON.stringify(tokens),
    );
  });

  it("fails to save invalid tokens", async () => {
    const result = await saveTokens(null as any);

    expect(result).toBe(false);
  });

  it("returns false when token storage throws", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    await expect(saveTokens({ accessToken: "abc" })).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "Error saving tokens:",
      expect.any(Error),
    );
  });

  it("saves valid user info", async () => {
    const user = { id: "1", name: "John", email: "j@j.com", photo: "p" };
    const result = await saveUserInfo(user);

    expect(result).toBe(true);
  });

  it("skips placeholder user info", async () => {
    const user = { id: "1", name: "User", email: "j@j.com", photo: "p" };
    const result = await saveUserInfo(user);

    expect(result).toBe(false);
  });

  it("returns false when user info is missing or storage throws", async () => {
    await expect(saveUserInfo(null as any)).resolves.toBe(false);

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("fail"));
    await expect(
      saveUserInfo({ id: "1", name: "John", email: "j@j.com", photo: "p" }),
    ).resolves.toBe(false);
  });

  it("retrieves tokens and user info from storage", async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify({ accessToken: "abc" }))
      .mockResolvedValueOnce(JSON.stringify({ id: "1", name: "John" }));

    const tokens = await getTokens();
    const user = await getUserInfo();

    expect(tokens).toEqual({ accessToken: "abc" });
    expect(user).toEqual({ id: "1", name: "John" });
  });

  it("returns null when reading tokens or user info fails", async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockRejectedValueOnce(new Error("tokens"))
      .mockRejectedValueOnce(new Error("user"));

    await expect(getTokens()).resolves.toBeNull();
    await expect(getUserInfo()).resolves.toBeNull();
  });

  it("returns null when no tokens or user info are stored", async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(getTokens()).resolves.toBeNull();
    await expect(getUserInfo()).resolves.toBeNull();
  });

  it("clears local items and revokes the token when present", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ accessToken: "fake-access-token" }),
    );

    await clearTokens();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      "@auth_tokens",
      "@user_info",
      "@class_reminder_lead_time",
      "@dismissed_class_event_ids",
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/revoke?token=fake-access-token",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("does not revoke remotely when no access token exists or local clear fails", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ idToken: "only-id-token" }),
    );

    await clearTokens();
    expect(fetchMock).not.toHaveBeenCalled();

    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("clear"));
    await clearTokens();
    expect(errorSpy).toHaveBeenCalledWith(
      "Error clearing tokens:",
      expect.any(Error),
    );
  });

  it("skips remote revocation when no token string is stored", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    await clearTokens();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles invalid stored token JSON during clear", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("not-json");

    await clearTokens();

    expect(errorSpy).toHaveBeenCalledWith(
      "Error clearing tokens:",
      expect.any(Error),
    );
  });

  it("swallows remote revoke failures after clearing local data", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ accessToken: "fake-access-token" }),
    );
    fetchMock.mockRejectedValueOnce(new Error("network"));

    await clearTokens();

    expect(errorSpy).toHaveBeenCalledWith(
      "Note: Could not revoke token remotely, but local data is cleared.",
      expect.any(Error),
    );
  });

  it("validates token presence and expiry", () => {
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid({ accessToken: "abc" })).toBe(true);

    const validToken = { accessToken: "abc", expiryDate: Date.now() + 600000 };
    expect(isTokenValid(validToken)).toBe(true);

    const expiredToken = { accessToken: "abc", expiryDate: Date.now() - 1000 };
    expect(isTokenValid(expiredToken)).toBe(false);
  });

  it("saves normalized reminder lead times and rejects invalid values", async () => {
    await expect(saveClassReminderLeadTime(10.4)).resolves.toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@class_reminder_lead_time",
      "10",
    );

    await expect(saveClassReminderLeadTime(-1)).resolves.toBe(false);
    await expect(
      saveClassReminderLeadTime(MAX_CLASS_REMINDER_LEAD_TIME_MINUTES + 1),
    ).resolves.toBe(false);

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("save"));
    await expect(saveClassReminderLeadTime(15)).resolves.toBe(false);
  });

  it("reads reminder lead times with default fallbacks", async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("12.6")
      .mockResolvedValueOnce("bad")
      .mockRejectedValueOnce(new Error("read"));

    await expect(getClassReminderLeadTime()).resolves.toBe(
      DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES,
    );
    await expect(getClassReminderLeadTime()).resolves.toBe(13);
    await expect(getClassReminderLeadTime()).resolves.toBe(
      DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES,
    );
    await expect(getClassReminderLeadTime()).resolves.toBe(
      DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES,
    );
  });

  it("reads dismissed class ids and filters invalid values", async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(["evt-1", 2, "evt-3"]))
      .mockResolvedValueOnce(JSON.stringify({ nope: true }))
      .mockResolvedValueOnce("not-json")
      .mockRejectedValueOnce(new Error("read"));

    await expect(getDismissedClassEventIds()).resolves.toEqual([]);
    await expect(getDismissedClassEventIds()).resolves.toEqual([
      "evt-1",
      "evt-3",
    ]);
    await expect(getDismissedClassEventIds()).resolves.toEqual([]);
    await expect(getDismissedClassEventIds()).resolves.toEqual([]);
    await expect(getDismissedClassEventIds()).resolves.toEqual([]);
  });

  it("deduplicates dismissed class ids and handles save failures", async () => {
    await expect(
      saveDismissedClassEventIds(["evt-1", "evt-1", 3 as any, "evt-2"]),
    ).resolves.toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@dismissed_class_event_ids",
      JSON.stringify(["evt-1", "evt-2"]),
    );

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("save"));
    await expect(saveDismissedClassEventIds(["evt-3"])).resolves.toBe(false);
  });

  it("saves and reads wheelchair accessibility preference", async () => {
    await expect(saveWheelchairAccessibilityPreference(true)).resolves.toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@wheelchair_accessible_directions_and_navigation",
      "true",
    );

    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce("true")
      .mockResolvedValueOnce("false")
      .mockRejectedValueOnce(new Error("read"));

    await expect(getWheelchairAccessibilityPreference()).resolves.toBe(true);
    await expect(getWheelchairAccessibilityPreference()).resolves.toBe(false);
    await expect(getWheelchairAccessibilityPreference()).resolves.toBe(false);
  });

  it("returns false when saving wheelchair accessibility preference fails", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("save"));

    await expect(saveWheelchairAccessibilityPreference(false)).resolves.toBe(
      false,
    );
  });
});
