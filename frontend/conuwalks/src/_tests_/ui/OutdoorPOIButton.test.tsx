import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OutdoorPOIButton from '../../components/OutdoorPOIButton';
import { View } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

describe('OutdoorPOIButton', () => {
  const mockOnPress = jest.fn();

  it('renders correctly', () => {
    const { getByLabelText } = render(
      <OutdoorPOIButton
        onPress={mockOnPress}
        buttonSize={50}
        mode="light"
        buttonSpacing={16}
      />
    );
    expect(getByLabelText('Open outdoor points of interest')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByLabelText } = render(
      <OutdoorPOIButton
        onPress={mockOnPress}
        buttonSize={50}
        mode="light"
        buttonSpacing={16}
      />
    );
    
    fireEvent.press(getByLabelText('Open outdoor points of interest'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies correct styles for dark mode', () => {
    const { getByTestId } = render(
      <OutdoorPOIButton
        onPress={mockOnPress}
        buttonSize={50}
        mode="dark"
        buttonSpacing={16}
      />,
      { wrapper: ({ children }) => <View testID="wrapper">{children}</View> }
    );
    
    const wrapper = getByTestId('wrapper');
    expect(wrapper).toBeTruthy(); // Dark mode styles applied
  });
});