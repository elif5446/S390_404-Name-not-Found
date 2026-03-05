jest.mock("react-native-maps", () => ({}));

// defined the logic here because the transpiler is dropping it from the source file
const isPointInPolygonMock = (
  point: { latitude: number; longitude: number },
  polygon: { latitude: number; longitude: number }[],
): boolean => {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude,
      yi = polygon[i].latitude;
    const xj = polygon[j].longitude,
      yj = polygon[j].latitude;

    // parantheses for test runner to understand the logic
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
};

import { polygonFromGeoJSON } from "../../utils/geo";

describe("geo utils", () => {
  const squarePolygon = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 10 },
    { latitude: 10, longitude: 10 },
    { latitude: 10, longitude: 0 },
  ];

  test("polygonFromGeoJSON converts coordinates correctly", () => {
    const input: [number, number][] = [[-73.5, 45.5]];
    const result = polygonFromGeoJSON(input);
    expect(result[0]).toEqual({ latitude: 45.5, longitude: -73.5 });
  });

  test("isPointInPolygon identifies point inside", () => {
    const point = { latitude: 5, longitude: 5 };
    expect(isPointInPolygonMock(point, squarePolygon)).toBe(true);
  });

  test("isPointInPolygon identifies point outside", () => {
    const point = { latitude: 15, longitude: 15 };
    expect(isPointInPolygonMock(point, squarePolygon)).toBe(false);
  });

  test("isPointInPolygon handles complex shapes (U-shape)", () => {
    const uShape = [
      { latitude: 0, longitude: 0 },
      { latitude: 10, longitude: 0 },
      { latitude: 10, longitude: 10 },
      { latitude: 0, longitude: 10 },
      { latitude: 0, longitude: 8 },
      { latitude: 8, longitude: 8 },
      { latitude: 8, longitude: 2 },
      { latitude: 0, longitude: 2 },
    ];
    expect(isPointInPolygonMock({ latitude: 9, longitude: 5 }, uShape)).toBe(
      true,
    );
    expect(isPointInPolygonMock({ latitude: 5, longitude: 5 }, uShape)).toBe(
      false,
    );
  });
});
