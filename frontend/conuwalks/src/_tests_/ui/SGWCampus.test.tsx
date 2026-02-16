import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CampusPolygons from '@/src/components/polygons';
import { testData } from '../utils/testDataGenerator';
import BuildingTheme from '@/src/styles/BuildingTheme';

describe('SGW Campus Building Overlays', () => {
  const { geojson, metadata, buildingIds } = testData.SGW;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering All Buildings', () => {
    it('should render all SGW campus buildings from real data', () => {
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

    it('should render correct number of buildings', () => {
      const expectedCount = geojson.features.filter(
        (f) => f.geometry.type === 'Polygon'
      ).length;

      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      const polygons = screen.getAllByTestId('polygon');
      expect(polygons).toHaveLength(expectedCount);
    });
  });

  describe('Individual Building Tests', () => {
    // Dynamically test each building
    buildingIds.forEach((buildingId) => {
      it(`should render ${buildingId} - ${metadata[buildingId]?.name || 'Unknown'}`, () => {
        render(
          <CampusPolygons
            campus="SGW"
            geojson={geojson}
            metadata={metadata}
          />
        );

        const buildingName = metadata[buildingId]?.name || buildingId;
        const building = screen.getByLabelText(buildingName);
        expect(building).toBeTruthy();
      });
    });
  });

  describe('Building Colors', () => {
    it('should apply correct colors to all themed buildings', () => {
      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      const polygons = screen.getAllByTestId('polygon');

      buildingIds.forEach((buildingId, index) => {
        const expectedColor = BuildingTheme.SGW[buildingId as keyof typeof BuildingTheme.SGW] ?? '#888888';
        
        expect(polygons[index].props['data-stroke-color']).toBe(expectedColor);
        expect(polygons[index].props['data-fill-color']).toBe(`${expectedColor}75`);
      });
    });
  });

  describe('Accessibility', () => {
    it('all buildings should have accessibility labels', () => {
      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      const polygons = screen.getAllByTestId('polygon');

      polygons.forEach((polygon) => {
        expect(polygon.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('should use building name as accessibility label when available', () => {
      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      buildingIds.forEach((buildingId) => {
        if (metadata[buildingId]?.name) {
          const building = screen.getByLabelText(metadata[buildingId].name);
          expect(building).toBeTruthy();
        }
      });
    });
  });

  describe('Coordinate Conversion', () => {
    it('should convert GeoJSON coordinates to LatLng format', () => {
      render(
        <CampusPolygons
          campus="SGW"
          geojson={geojson}
          metadata={metadata}
        />
      );

      const polygons = screen.getAllByTestId('polygon');
      
      polygons.forEach((polygon) => {
        const coordinates = JSON.parse(polygon.props['data-coordinates']);
        
        // Each coordinate should have latitude and longitude
        coordinates.forEach((coord: any) => {
          expect(coord).toHaveProperty('latitude');
          expect(coord).toHaveProperty('longitude');
          expect(typeof coord.latitude).toBe('number');
          expect(typeof coord.longitude).toBe('number');
        });
      });
    });
  });
});