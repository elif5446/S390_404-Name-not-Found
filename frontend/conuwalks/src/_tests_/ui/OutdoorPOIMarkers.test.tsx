import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native'; // ✅ Only import render
import OutdoorPOIMarkers from '../../components/OutdoorPOIMarkers';
import { POIPlace } from '@/src/api/places';

// Mock react-native-maps so we can render markers
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    Marker: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Callout: ({ children }: any) => <View>{children}</View>,
  };
});

// Mock MaterialIcons
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
    const { getAllByTestId } = render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[mockPoi, { ...mockPoi, id: '2' }]}
        radiusMeters={1000}
      />
    );

    expect(getAllByTestId('marker-1')).toHaveLength(1);
    expect(getAllByTestId('marker-2')).toHaveLength(1);
  });

  it('filters POIs by radius correctly', () => {
    const campusLat = 45.497;
    const campusLon = -73.578;
    
    const closePoi: POIPlace = { 
      id: 'close', 
      name: 'Close', 
      latitude: campusLat + 0.001,
      longitude: campusLon,
      isOpen: true as any,
      openHours: [],
    };
    
    const farPoi: POIPlace = { 
      id: 'far', 
      name: 'Far', 
      latitude: campusLat + 0.018,
      longitude: campusLon,
      isOpen: true as any,
      openHours: [],
    };

    const { queryByTestId } = render( // ✅ Destructure here
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Restaurants"
        pois={[closePoi, farPoi]}
        radiusMeters={1000}
      />
    );

    expect(queryByTestId('marker-close')).toBeTruthy();
    expect(queryByTestId('marker-far')).toBeNull();
  });

  it('renders container with correct testID', () => {
    const { getByTestId } = render(
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Coffee shops"
        pois={[mockPoi]}
      />
    );

    expect(getByTestId('poi-coffee-shops')).toBeTruthy();
  });

  it('filters out POIs beyond radius', () => {
    const poiWithinRadius: POIPlace = {
      id: 'within',
      name: 'Within',
      latitude: 45.497,
      longitude: -73.578,
      isOpen: true as any,
      openHours: [],
    };

    const poiBeyondRadius: POIPlace = {
      id: 'beyond',
      name: 'Beyond',
      latitude: 45.520,
      longitude: -73.600,
      isOpen: true as any,
      openHours: [],
    };

    const { queryByTestId } = render( // ✅ Destructure here
      <OutdoorPOIMarkers
        campus="SGW"
        poiType="Banks"
        pois={[poiWithinRadius, poiBeyondRadius]}
        radiusMeters={500}
      />
    );

    expect(queryByTestId('marker-within')).toBeTruthy();
    expect(queryByTestId('marker-beyond')).toBeNull();
  });
});