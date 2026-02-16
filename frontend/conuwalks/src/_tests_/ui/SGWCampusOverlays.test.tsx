import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CampusPolygons from '@/src/components/polygons';
import { testData } from '../utils/testDataGenerator';
import BuildingTheme from '@/src/styles/BuildingTheme';
import * as geo from '@/src/utils/geo';

describe('SGW Campus Building Overlays', () => {
  const { geojson, metadata, buildingIds } = testData.SGW;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering All Buildings', () => {
    it('should render one polygon per SGW campus building', () => {
      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      const polygons = screen.getAllByTestId('polygon');
      expect(polygons.length).toBe(buildingIds.length);
    });
  });


describe('Building Colors', () => {
  it('should apply correct colors to all themed buildings', () => {
    render(
      <CampusPolygons campus="SGW" geojson={geojson} metadata={metadata} />
    );

    buildingIds.forEach((buildingId) => {
      const expectedColor = BuildingTheme.SGW[buildingId as keyof typeof BuildingTheme.SGW] ?? '#888888';
      const buildingName = metadata[buildingId]?.name || buildingId;
      const polygon = screen.getByLabelText(buildingName);

      expect(polygon.props['data-stroke-color']).toBe(expectedColor);
      expect(polygon.props['data-fill-color']).toBe(`${expectedColor}75`);
    });
  });
});

  describe('Accessibility', () => {
    it('all buildings should have accessibility labels matching their names', () => {
      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      const polygons = screen.getAllByTestId('polygon');

      // Verify all polygons have accessibility labels
      polygons.forEach((polygon) => {
        expect(polygon.props.accessibilityLabel).toBeTruthy();
      });

      // Verify each building can be found by its name
       buildingIds.forEach((buildingId) => {
        const buildingName = metadata[buildingId]?.name || buildingId;
        try {
          const building = screen.getByLabelText(buildingName);
          expect(building).toBeTruthy();
        } catch (error) {
          console.error(`Failed to find building: ${buildingId} - ${buildingName}`);
          throw error;
        }
      });
    });

  });

  describe('Coordinate Conversion', () => {
    it('should call polygonFromGeoJSON for each building', () => {
      const polygonFromGeoJSONSpy = jest.spyOn(geo, 'polygonFromGeoJSON');

      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      expect(polygonFromGeoJSONSpy).toHaveBeenCalledTimes(buildingIds.length);
      
      polygonFromGeoJSONSpy.mockRestore();
    });
  });
});