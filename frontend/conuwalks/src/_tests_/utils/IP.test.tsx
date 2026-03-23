import { Platform } from "react-native";

let mockExpoConfig: any = {};

jest.mock("expo-constants", () => ({
  get expoConfig() {
    return mockExpoConfig;
  },
}));

describe("IP Utility", () => {
  beforeEach(() => {
    jest.resetModules();
    mockExpoConfig = {}; // reset mock config
  });

  it("returns android host when platform is android", () => {
    Platform.OS = "android";
    const { API_BASE_URL } = require("../../config/IP");
    expect(API_BASE_URL).toContain("10.0.2.2");
  });

  it("returns hostUri from constants when available on iOS", () => {
    Platform.OS = "ios";
    mockExpoConfig = { hostUri: "192.168.1.50:8081" };

    const { API_BASE_URL } = require("../../config/IP");

    expect(API_BASE_URL).toContain("192.168.1.50");
    expect(API_BASE_URL).not.toContain("8081");
  });

  it("defaults to localhost if no hostUri is present", () => {
    Platform.OS = "ios";
    mockExpoConfig = {};

    const { API_BASE_URL } = require("../../config/IP");
    expect(API_BASE_URL).toContain("localhost");
  });
});
