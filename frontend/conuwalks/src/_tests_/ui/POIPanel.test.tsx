import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import POIPanel from '../../components/POIPanel'; // Adjust path as needed

// Mock dependencies
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

describe('POIPanel', () => {
  let mockOnClose: jest.Mock;
  let mockOnPOISelect: jest.Mock;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnPOISelect = jest.fn();
  });

  const renderPanel = (visible = true) =>
    render(
      <POIPanel
        visible={visible}
        onClose={mockOnClose}
        onPOISelect={mockOnPOISelect}
      />
    );

  it('renders correctly when visible', () => {
    const { getByText } = renderPanel(true);
    expect(getByText('Outdoor POIs')).toBeTruthy();
    expect(getByText('Restaurants')).toBeTruthy();
  });

  it('renders content when invisible (off-screen)', () => {
    const { getByText } = renderPanel(false);
    expect(getByText('Outdoor POIs')).toBeTruthy();
  });

  it('calls onClose when close button pressed', () => {
    const { getByLabelText } = renderPanel(true);
    fireEvent.press(getByLabelText('Close POI panel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onPOISelect and onClose when POI item pressed', () => {
    const { getByText } = renderPanel(true);
    fireEvent.press(getByText('Restaurants'));
    expect(mockOnPOISelect).toHaveBeenCalledWith('Restaurants');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // ✅ FIXED: Create SEPARATE mock for this test
  it('does not crash when onPOISelect is not provided', () => {
    const closeMock = jest.fn(); // Fresh mock just for this test
    
    const { getByText } = render(
      <POIPanel 
        visible={true} 
        onClose={closeMock}
        // ✅ NO onPOISelect passed - tests optional chaining
      />
    );
    
    fireEvent.press(getByText('Restaurants'));
    
    expect(closeMock).toHaveBeenCalledTimes(1);
    // Component uses onPOISelect?.(item) so no crash!
  });

  it('renders all POI types', () => {
    const { getAllByText } = renderPanel(true);
    const poiItems = ['Restaurants', 'Coffee shops', 'Banks', 'Hotels', 'Libraries', 'Bars'];
    
    poiItems.forEach(item => {
      expect(getAllByText(item)).toHaveLength(1);
    });
  });
});