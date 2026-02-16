import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import SegmentedToggle from '../../components/SegmentedToggle';

describe('SegmentedToggle Component', () => {
  // Mock function to track campus changes
  let mockSetCampus: jest.Mock;

  beforeEach(() => {
    // Create a fresh mock function before each test
    mockSetCampus = jest.fn();
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render with SGW selected', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      // Component should render without crashing
      expect(screen.getByText('Sir George Williams')).toBeTruthy();
      expect(screen.getByText('Loyola')).toBeTruthy();
    });

    it('should render with Loyola selected', () => {
      render(
        <SegmentedToggle 
          campus="Loyola" 
          setCampus={mockSetCampus} 
        />
      );

      // Both options should be visible
      expect(screen.getByText('Sir George Williams')).toBeTruthy();
      expect(screen.getByText('Loyola')).toBeTruthy();
    });
  });

  describe('iOS Platform', () => {
    beforeEach(() => {
      // Mock Platform.OS to be 'ios'
      Platform.OS = 'ios';
    });

    it('should render iOS segmented control', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      // Check that iOS-specific component renders
      const segmentedControl = screen.getByTestId('segmented-control');
      expect(segmentedControl).toBeTruthy();
    });

    it('should have SGW selected initially (index 0)', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      const firstSegment = screen.getByTestId('segment-0');
      expect(firstSegment.props.accessibilityState.selected).toBe(true);
    });

    it('should have Loyola selected initially (index 1)', () => {
      render(
        <SegmentedToggle 
          campus="Loyola" 
          setCampus={mockSetCampus} 
        />
      );

      const secondSegment = screen.getByTestId('segment-1');
      expect(secondSegment.props.accessibilityState.selected).toBe(true);
    });

    it('should call setCampus with "SGW" when first segment is pressed', () => {
      render(
        <SegmentedToggle 
          campus="Loyola" 
          setCampus={mockSetCampus} 
        />
      );

      const firstSegment = screen.getByTestId('segment-0');
      fireEvent.press(firstSegment);

      // Check that setCampus was called with "SGW"
      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith('SGW');
    });

    it('should call setCampus with "Loyola" when second segment is pressed', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      const secondSegment = screen.getByTestId('segment-1');
      fireEvent.press(secondSegment);

      // Check that setCampus was called with "Loyola"
      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith('Loyola');
    });

    it('should render with BlurView for glass effect', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      const blurView = screen.getByTestId('blur-view');
      expect(blurView).toBeTruthy();
    });
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      // Mock Platform.OS to be 'android'
      Platform.OS = 'android';
    });

    it('should render Android segmented buttons', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      // Check that Android-specific component renders
      const segmentedButtons = screen.getByTestId('segmented-buttons');
      expect(segmentedButtons).toBeTruthy();
    });

    it('should have SGW button with correct accessibility label', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      const sgwButton = screen.getByLabelText('Switch to Sir George Williams Campus');
      expect(sgwButton).toBeTruthy();
    });

    it('should have Loyola button with correct accessibility label', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      const loyolaButton = screen.getByLabelText('Switch to Loyola Campus');
      expect(loyolaButton).toBeTruthy();
    });

    it('should have SGW button selected when campus is SGW', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      const sgwButton = screen.getByTestId('segment-button-SGW');
      expect(sgwButton.props.accessibilityState.selected).toBe(true);
    });

    it('should have Loyola button selected when campus is Loyola', () => {
      render(
        <SegmentedToggle 
          campus="Loyola" 
          setCampus={mockSetCampus} 
        />
      );

      const loyolaButton = screen.getByTestId('segment-button-Loyola');
      expect(loyolaButton.props.accessibilityState.selected).toBe(true);
    });

    it('should call setCampus with "SGW" when SGW button is pressed', () => {
      render(
        <SegmentedToggle 
          campus="Loyola" 
          setCampus={mockSetCampus} 
        />
      );

      const sgwButton = screen.getByTestId('segment-button-SGW');
      fireEvent.press(sgwButton);

      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith('SGW');
    });

    it('should call setCampus with "Loyola" when Loyola button is pressed', () => {
      render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      const loyolaButton = screen.getByTestId('segment-button-Loyola');
      fireEvent.press(loyolaButton);

      expect(mockSetCampus).toHaveBeenCalledTimes(1);
      expect(mockSetCampus).toHaveBeenCalledWith('Loyola');
    });
  });

  describe('User Interaction Flow', () => {
    beforeEach(() => {
      Platform.OS = 'ios'; // Can test with either platform
    });

    it('should allow switching from SGW to Loyola', () => {
      const { rerender } = render(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      // User clicks Loyola
      const loyolaSegment = screen.getByTestId('segment-1');
      fireEvent.press(loyolaSegment);

      // Verify setCampus was called
      expect(mockSetCampus).toHaveBeenCalledWith('Loyola');

      // Simulate parent component updating the campus prop
      rerender(
        <SegmentedToggle 
          campus="Loyola" 
          setCampus={mockSetCampus} 
        />
      );

      // Verify Loyola is now selected
      const loyolaSegmentAfter = screen.getByTestId('segment-1');
      expect(loyolaSegmentAfter.props.accessibilityState.selected).toBe(true);
    });

    it('should allow switching from Loyola to SGW', () => {
      const { rerender } = render(
        <SegmentedToggle 
          campus="Loyola" 
          setCampus={mockSetCampus} 
        />
      );

      // User clicks SGW
      const sgwSegment = screen.getByTestId('segment-0');
      fireEvent.press(sgwSegment);

      // Verify setCampus was called
      expect(mockSetCampus).toHaveBeenCalledWith('SGW');

      // Simulate parent component updating the campus prop
      rerender(
        <SegmentedToggle 
          campus="SGW" 
          setCampus={mockSetCampus} 
        />
      );

      // Verify SGW is now selected
      const sgwSegmentAfter = screen.getByTestId('segment-0');
      expect(sgwSegmentAfter.props.accessibilityState.selected).toBe(true);
    });
  });
});