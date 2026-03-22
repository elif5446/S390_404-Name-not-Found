import {
  calculatePolygonCenter,
  distanceMetersBetween,
  toRadians,
} from "../../utils/geometry";

describe("geometry utils", () => {
  const coord1 = { latitude: 45.495, longitude: -73.578 };
  const coord2 = { latitude: 45.496, longitude: -73.579 };

  test("toRadians converts degrees to radians", () => {
    expect(toRadians(180)).toBe(Math.PI);
    expect(toRadians(0)).toBe(0);
  });

  test("calculatePolygonCenter finds the average of coordinates", () => {
    const coords = [
      { latitude: 10, longitude: 10 },
      { latitude: 20, longitude: 20 },
    ];
    const center = calculatePolygonCenter(coords);
    expect(center).toEqual({ latitude: 15, longitude: 15 });
  });

  test("distanceMetersBetween calculates correct distance", () => {
    const dist = distanceMetersBetween(coord1, coord2);
    // around 135 meters between these points
    expect(dist).toBeGreaterThan(130);
    expect(dist).toBeLessThan(140);
  });
});
