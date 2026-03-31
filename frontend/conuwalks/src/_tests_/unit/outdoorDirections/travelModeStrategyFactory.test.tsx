import { getStrategy } from "@/src/outdoorDirections/travelModeStrategyFactory";
import { WalkingStrategy } from "@/src/outdoorDirections/walkingStrategy";
import { DrivingStrategy } from "@/src/outdoorDirections/drivingStrategy";
import { TransitStrategy } from "@/src/outdoorDirections/transitStrategy";
import { BicyclingStrategy } from "@/src/outdoorDirections/bicyclingStrategy";

describe("travelModeStrategyFactory", () => {
  it("returns a WalkingStrategy for walking mode", () => {
    const strategy = getStrategy("walking");
    expect(strategy).toBeInstanceOf(WalkingStrategy);
  });

  it("returns a DrivingStrategy for driving mode", () => {
    const strategy = getStrategy("driving");
    expect(strategy).toBeInstanceOf(DrivingStrategy);
  });

  it("returns a TransitStrategy for transit mode", () => {
    const strategy = getStrategy("transit");
    expect(strategy).toBeInstanceOf(TransitStrategy);
  });

  it("returns a BicyclingStrategy for bicycling mode", () => {
    const strategy = getStrategy("bicycling");
    expect(strategy).toBeInstanceOf(BicyclingStrategy);
  });

  it("returns the same instance when called more than once for the same mode", () => {
    const first = getStrategy("driving");
    const second = getStrategy("driving");

    expect(first).toBe(second);
  });

  it("throws for an unknown mode", () => {
    expect(() => getStrategy("shuttle" as any)).toThrow(
      'No strategy registered for travel mode: "shuttle"'
    );
  });
});