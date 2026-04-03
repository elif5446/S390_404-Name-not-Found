import React from "react";
import { Platform } from "react-native";
import { render, screen } from "@testing-library/react-native";
import PlatformIcon from "@/src/components/ui/PlatformIcon";

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));

process.env.EXPO_OS = "ios";

describe("PlatformIcon", () => {
  const RN = require("react-native");
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(RN.Platform, "OS", {
      get: () => originalOS,
      configurable: true,
    });
  });

  describe("Default Parameters", () => {
    it("applies default size (24) and color (#000000) on Android", () => {
      Object.defineProperty(RN.Platform, "OS", { get: () => "android", configurable: true });

      render(<PlatformIcon materialName="close" iosName="xmark" />);

      const icon = screen.UNSAFE_getByType("MaterialIcons" as any);
      
      expect(icon.props.size).toBe(24);
      expect(icon.props.color).toBe("#000000");
    });

    it("applies default size (24) and tintColor (#000000) on iOS", () => {
      Object.defineProperty(RN.Platform, "OS", { get: () => "ios", configurable: true });

      render(<PlatformIcon materialName="close" iosName="xmark" />);

      const icon = screen.UNSAFE_getByType("SymbolView" as any);
      
      expect(icon.props.size).toBe(24);
      expect(icon.props.tintColor).toBe("#000000");
    });
  });

  describe("Prop Overrides", () => {
    it("overrides defaults when custom props are provided", () => {
      Object.defineProperty(RN.Platform, "OS", { get: () => "android", configurable: true });

      render(
        <PlatformIcon 
          materialName="close" 
          iosName="xmark" 
          size={32} 
          color="#FF0000" 
        />
      );

      const icon = screen.UNSAFE_getByType("MaterialIcons" as any);
      
      expect(icon.props.size).toBe(32);
      expect(icon.props.color).toBe("#FF0000");
    });
  });

  it("applies the default weight 'medium' on iOS", () => {
    Object.defineProperty(RN.Platform, "OS", { get: () => "ios", configurable: true });

    render(<PlatformIcon materialName="close" iosName="xmark" />);

    const icon = screen.UNSAFE_getByType("SymbolView" as any);
    expect(icon.props.weight).toBe("medium");
  });
});