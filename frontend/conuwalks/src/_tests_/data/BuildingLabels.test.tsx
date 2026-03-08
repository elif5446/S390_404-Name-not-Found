import {
  computeCentroid,
  attachCentroids,
  FeatureCollection,
} from "@/src/data/BuildingLabels";

describe("BuildingLabels logic", () => {
  const mockGeoJson: any = {
    features: [
      {
        properties: { id: "TEST" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
            ],
          ],
        },
      },
    ],
  };

  test("computeCentroid calculates correct center for GeoJSON array", () => {
    const coords: [number, number][][] = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ];
    const result = computeCentroid(coords);
    expect(result).toEqual({ latitude: 5, longitude: 5 });
  });

  test("attachCentroids applies overrides correctly", () => {
    const overrides = { TEST: { latitude: 99, longitude: 99 } };
    const result = attachCentroids(mockGeoJson, overrides);
    expect(result.features[0].properties.centroid).toEqual({
      latitude: 99,
      longitude: 99,
    });
  });
});
