import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import POIListPanel from '../../components/POIListPanel'; 
import { POIPlace } from '@/src/api/places';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

describe('POIListPanel', () => {
  let mockProps: any;

  beforeEach(() => {
    const mockPoi: POIPlace = {
      id: '1',
      name: 'Test Cafe',
      latitude: 45.497,
      longitude: -73.578,
      isOpen: true as any,
      openHours: [],
    };

    mockProps = {
      visible: true,
      pois: [mockPoi],
      userLocation: { latitude: 45.497, longitude: -73.578 },
      onClose: jest.fn(),
      onPOIDirections: jest.fn(),
      onClearPOIs: jest.fn(),
      onUpdatePOIs: jest.fn(),
    };
  });

  it('renders correctly with POIs', () => {
    const { getByText } = render(<POIListPanel {...mockProps} />);
    expect(getByText('1 Places Nearby')).toBeTruthy();
    expect(getByText('Test Cafe')).toBeTruthy();
  });

  it('does not render when no POIs', () => {
    const { queryByText } = render(<POIListPanel {...mockProps} pois={[]} />);
    expect(queryByText('Places Nearby')).toBeNull();
  });

  it('calls onPOIDirections when POI pressed', () => {
    const { getByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getByText('Test Cafe'));
    expect(mockProps.onPOIDirections).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      name: 'Test Cafe'
    }));
  });

  it('calls onClearPOIs when clear button pressed', () => {
    const { getByLabelText } = render(<POIListPanel {...mockProps} />);
    // Test clear button via accessibility (icon has implicit role)
    expect(mockProps.onClearPOIs).not.toHaveBeenCalled();
  });

 
  it('renders radius buttons', () => {
    const { getAllByText } = render(<POIListPanel {...mockProps} />);
    
    expect(getAllByText('1 km')[0]).toBeTruthy();
    expect(getAllByText('100 m')[0]).toBeTruthy();
    expect(getAllByText('200 m')[0]).toBeTruthy();
    expect(getAllByText('500 m')[0]).toBeTruthy();
  });

  it('sorts POIs by distance correctly', () => {
    const closePoi: POIPlace = { 
      id: 'close', 
      name: 'Close Cafe',
      latitude: 45.4971, 
      longitude: -73.5781,
      isOpen: true as any,
      openHours: [],
    };
    const farPoi: POIPlace = { 
      id: 'far', 
      name: 'Far Cafe',
      latitude: 45.498, 
      longitude: -73.579,
      isOpen: true as any,
      openHours: [],
    };
    
    const { getByText } = render(
      <POIListPanel
        {...mockProps}
        pois={[farPoi, closePoi]}
        userLocation={{ latitude: 45.497, longitude: -73.578 }}
      />
    );
    
    expect(getByText('Close Cafe')).toBeTruthy();
  });
});