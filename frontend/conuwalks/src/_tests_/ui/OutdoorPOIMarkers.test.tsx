import React from 'react';
import { render, screen } from '@testing-library/react-native';
import OutdoorPOIMarkers from '../../components/OutdoorPOIMarkers';
import { POIPlace } from '@/src/api/places';

// Mock react-native-maps (no testID needed)
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    Marker: ({ children }: any) => <View testID="mock-marker">{children}</View>,
    Callout: ({ children }: any) => <View testID="mock-callout">{children}</View>,
  };
});

// Mock icons
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

describe('OutdoorPOIMarkers', () => {
  const mockPoi: POIPlace = {
    id: '1',
    name: 'Test Cafe',
    latitude: 45.497,
    longitude: -73.578,
    isOpen: true as any,
    openHours: [],
  };

  it('renders correct number of markers', () => {
    const pois = [mockPoi, { ...mockPoi, id: '2', name: 'Test Cafe 2' }];
    
    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={pois}
        radiusMeters={1000}
      />
    );

    // Test structure: 2 markers rendered
    expect(screen.getAllByTestId('mock-marker')).toHaveLength(2);
    expect(screen.getAllByText(/Test Cafe/)).toHaveLength(2); // Name appears twice
  });

  it('renders POI names and open status in callouts', () => {
    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[mockPoi]}
      />
    );

    expect(screen.getByText('Test Cafe')).toBeTruthy();
    expect(screen.getByText('Open')).toBeTruthy();
  });

  it('filters POIs by radius correctly', () => {
    const closePoi: POIPlace = { 
      id: 'close', 
      name: 'Close Cafe', 
      latitude: 45.498,  // ~111m from campus
      longitude: -73.578,
      isOpen: true as any,
      openHours: [],
    };
    
    const farPoi: POIPlace = { 
      id: 'far', 
      name: 'Far Cafe', 
      latitude: 45.520,  // ~2.5km from campus
      longitude: -73.578,
      isOpen: true as any,
      openHours: [],
    };

    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Restaurants"
        pois={[closePoi, farPoi]}
        radiusMeters={1000}  // 1km
      />
    );

    // Close POI should render, far should not
    expect(screen.getByText('Close Cafe')).toBeTruthy();
    expect(screen.queryByText('Far Cafe')).toBeNull();
    expect(screen.getAllByTestId('mock-marker')).toHaveLength(1);
  });

  it('handles empty pois list', () => {
    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Banks"
        pois={[]}
      />
    );

    // No markers rendered
    expect(screen.queryAllByTestId('mock-marker')).toHaveLength(0);
  });

  it('shows correct open status', () => {
    const openPoi: POIPlace = { ...mockPoi, isOpen: true as any };
    const closedPoi: POIPlace = { ...mockPoi, id: '2', isOpen: false as any };

    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[openPoi, closedPoi]}
        radiusMeters={1000}
      />
    );

    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Closed')).toBeTruthy();
  });

  it('renders "Hours unknown" and gray color when isOpen is null', () => {
    const mysteryPoi: POIPlace = {
      ...mockPoi,
      isOpen: null as any,
    };

    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[mysteryPoi]}
      />
    );

    const statusText = screen.getByText('Hours unknown');
    expect(statusText).toBeTruthy();
    expect(statusText.props.style.color).toBe('gray');
  });

  it('renders the list of open hours when provided', () => {
    const hours = ['Mon: 8am-5pm', 'Tue: 8am-5pm'];
    const poiWithHours: POIPlace = {
      ...mockPoi,
      openHours: hours,
    };

    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[poiWithHours]}
      />
    );

    expect(screen.getByText('Mon: 8am-5pm')).toBeTruthy();
    expect(screen.getByText('Tue: 8am-5pm')).toBeTruthy();
  });

  it('does not render the ScrollView when openHours is missing or empty', () => {
    const poiNoHours: POIPlace = {
      ...mockPoi,
      openHours: undefined,
    };

    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[poiNoHours]}
      />
    );

    expect(screen.queryByText(/am-pm/)).toBeNull();
  });

  it('applies the correct layout styles to the Callout container', () => {
    render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[mockPoi]}
      />
    );

    const calloutContainer = screen.getByTestId('callout-container');
    
    expect(calloutContainer.props.style).toMatchObject({
      width: 200,
      padding: 8,
    });
  });
});