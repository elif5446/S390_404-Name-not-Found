import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Animated, PanResponder } from 'react-native';
import POIPanel from '../../components/POIPanel';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

describe('POIPanel', () => {
  let mockOnClose: jest.Mock;
  let mockOnPOISelect: jest.Mock;

  // Captured raw handlers from PanResponder.create(...)
  let capturedHandlers: Record<string, Function> = {};

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnPOISelect = jest.fn();
    capturedHandlers = {};
    jest.useFakeTimers();

    // Intercept PanResponder.create to grab the raw callbacks
    // before RN wraps them with TouchHistory machinery
    jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => {
      capturedHandlers = config;
      // Return a minimal panHandlers object so the component doesn't crash
      return { panHandlers: {} };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const renderPanel = (visible = true) =>
    render(
      <POIPanel
        visible={visible}
        onClose={mockOnClose}
        onPOISelect={mockOnPOISelect}
      />
    );

  // ── existing tests ────────────────────────────────────────────────────────

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

  it('does not crash when onPOISelect is not provided', () => {
    const closeMock = jest.fn();
    const { getByText } = render(
      <POIPanel visible={true} onClose={closeMock} />
    );
    fireEvent.press(getByText('Restaurants'));
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('renders all POI types', () => {
    const { getAllByText } = renderPanel(true);
    ['Restaurants', 'Coffee shops', 'Banks', 'Hotels', 'Libraries', 'Bars'].forEach(item => {
      expect(getAllByText(item)).toHaveLength(1);
    });
  });

  // ── PanResponder tests (using captured raw handlers) ──────────────────────

  it('onMoveShouldSetPanResponder returns true when |dy| > 5', () => {
    renderPanel(true);
    const handler = capturedHandlers.onMoveShouldSetPanResponder;
    expect(handler({}, { dx: 0, dy: 10 })).toBe(true);
  });

  it('onMoveShouldSetPanResponder returns false when |dy| <= 5', () => {
    renderPanel(true);
    const handler = capturedHandlers.onMoveShouldSetPanResponder;
    expect(handler({}, { dx: 0, dy: 3 })).toBe(false);
  });

  it('onPanResponderMove clamps translateY between 0 and PANEL_HEIGHT', () => {
    renderPanel(true);
    const moveHandler = capturedHandlers.onPanResponderMove;

    // Should not throw for any dy value
    act(() => {
      moveHandler({}, { dx: 0, dy: -50 });  // clamped to 0
      moveHandler({}, { dx: 0, dy: 150 });  // mid-range
      moveHandler({}, { dx: 0, dy: 999 });  // clamped to 300
    });
  });

  it('onPanResponderRelease snaps closed (dy > threshold) and calls onClose', () => {
    // Spy on Animated.timing BEFORE render so the mock is active during mount
    const spy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: (cb?: () => void) => cb?.(),
    } as any);

    renderPanel(true);
    const releaseHandler = capturedHandlers.onPanResponderRelease;

    act(() => {
      // dy = 200 > PANEL_HEIGHT/2 (150) → should close
      releaseHandler({}, { dx: 0, dy: 200 });
      jest.runAllTimers();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('onPanResponderRelease snaps open (dy <= threshold) and does NOT call onClose', () => {
    const spy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: (cb?: () => void) => cb?.(),
    } as any);

    renderPanel(true);
    const releaseHandler = capturedHandlers.onPanResponderRelease;

    act(() => {
      // dy = 50 < PANEL_HEIGHT/2 (150) → should stay open
      releaseHandler({}, { dx: 0, dy: 50 });
      jest.runAllTimers();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('slide-in animation fires when visible changes to true', () => {
    const spy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
    } as any);

    const { rerender } = render(
      <POIPanel visible={false} onClose={mockOnClose} />
    );
    spy.mockClear();

    act(() => {
      rerender(<POIPanel visible={true} onClose={mockOnClose} />);
    });

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0, duration: 260 })
    );
    spy.mockRestore();
  });

  it('slide-out animation fires when visible changes to false', () => {
    const spy = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
    } as any);

    const { rerender } = render(
      <POIPanel visible={true} onClose={mockOnClose} />
    );
    spy.mockClear();

    act(() => {
      rerender(<POIPanel visible={false} onClose={mockOnClose} />);
    });

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 300, duration: 260 })
    );
    spy.mockRestore();
  });
});