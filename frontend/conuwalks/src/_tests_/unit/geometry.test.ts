import { calculatePolygonCenter } from "../../utils/geometry";

 describe("Geometry Utilities - Unit Tests", () => {

    describe("calculatePolygonCenter", () => {
      it("should calculate the correct center for a simple square polygon", () => {
        const square = [
          [0, 0],
          [0, 10],
          [10, 10],
          [10, 0],
        ];
        const result = calculatePolygonCenter(square);
        expect(result).toEqual({ latitude: 5, longitude: 5 });
      });

      it("should calculate the center for an irregular L-shaped building", () => {
        const lShape = [
          [0, 0], [0, 4], [2, 4], [2, 2], [4, 2], [4, 0]
        ];
        const result = calculatePolygonCenter(lShape);
        // Average of X: (0+0+2+2+4+4)/6 = 2
        // Average of Y: (0+4+4+2+2+0)/6 = 2
        expect(result).toEqual({ latitude: 2, longitude: 2 });
      });

      it("should handle high-precision GPS coordinates without losing accuracy", () => {
        const concordiaBuilding = [
          [-73.57854, 45.49599],
          [-73.57800, 45.49500],
          [-73.57700, 45.49600]
        ];
        const result = calculatePolygonCenter(concordiaBuilding);
        expect(result.latitude).toBeCloseTo(45.49566, 5);
        expect(result.longitude).toBeCloseTo(-73.57785, 5);
      });

      it("should work correctly for coordinates in the Southern/Western hemispheres", () => {
        const southernHemi = [
          [-10, -10],
          [-10, -20],
          [-20, -20],
          [-20, -10]
        ];
        const result = calculatePolygonCenter(southernHemi);
        expect(result).toEqual({ latitude: -15, longitude: -15 });
      });
    });
 });