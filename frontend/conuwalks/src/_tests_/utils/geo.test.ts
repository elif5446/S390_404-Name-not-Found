jest.unmock("../../utils/geo");
describe("geo utils", () => {
  const { isPointInPolygon, polygonFromGeoJSON } = require("../../utils/geo");
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
    expect(isPointInPolygon(point, squarePolygon)).toBe(true);
  });

  test("isPointInPolygon identifies point outside", () => {
    const point = { latitude: 15, longitude: 15 };
    expect(isPointInPolygon(point, squarePolygon)).toBe(false);
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
    expect(isPointInPolygon({ latitude: 9, longitude: 5 }, uShape)).toBe(true);
    expect(isPointInPolygon({ latitude: 5, longitude: 5 }, uShape)).toBe(false);
  });
});
