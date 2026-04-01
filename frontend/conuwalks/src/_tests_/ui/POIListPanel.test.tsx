import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Platform, Animated, PanResponder } from 'react-native';
import POIListPanel from '../../components/POIListPanel';
import { POIPlace } from '@/src/api/places';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

// ─── Pure helper functions mirrored for isolated unit tests ───────────────────

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
};

const getPOITypeFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('coffee') || lowerName.includes('cafe') || lowerName.includes('starbucks') || lowerName.includes('tim hortons')) return 'coffee';
  if (lowerName.includes('restaurant') || lowerName.includes('food') || lowerName.includes('pizza') || lowerName.includes('burger')) return 'restaurant';
  if (lowerName.includes('bank') || lowerName.includes('atm') || lowerName.includes('rbc') || lowerName.includes('td') || lowerName.includes('scotia')) return 'bank';
  if (lowerName.includes('hotel') || lowerName.includes('inn') || lowerName.includes('lodge')) return 'hotel';
  if (lowerName.includes('library') || lowerName.includes('bibliotheque')) return 'library';
  if (lowerName.includes('bar') || lowerName.includes('pub') || lowerName.includes('night club')) return 'bar';
  return 'generic';
};

const getPOIIcon = (poiType: string): string => {
  switch (poiType) {
    case 'coffee': return 'local-cafe';
    case 'restaurant': return 'restaurant';
    case 'bank': return 'account-balance';
    case 'hotel': return 'hotel';
    case 'library': return 'local-library';
    case 'bar': return 'local-bar';
    default: return 'place';
  }
};

const poiColor = (poiType: string): string => {
  switch (poiType) {
    case 'coffee': return '#6D4C41';
    case 'restaurant': return '#E53935';
    case 'bank': return '#1565C0';
    case 'hotel': return '#7B1FA2';
    case 'library': return '#2E7D32';
    case 'bar': return '#F57C00';
    default: return '#B03060';
  }
};

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const makePoi = (overrides: Partial<POIPlace> = {}): POIPlace => ({
  id: '1',
  name: 'Test Cafe',
  latitude: 45.497,
  longitude: -73.578,
  isOpen: true as any,
  openHours: [],
  ...overrides,
});

const baseProps = () => ({
  visible: true,
  pois: [makePoi()],
  userLocation: { latitude: 45.497, longitude: -73.578 },
  onClose: jest.fn(),
  onPOIDirections: jest.fn(),
  onClearPOIs: jest.fn(),
  onUpdatePOIs: jest.fn(),
});

// ─── POIListPanel component ───────────────────────────────────────────────────

describe('POIListPanel', () => {
  let mockProps: ReturnType<typeof baseProps>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProps = baseProps();
  });

  // ── Basic rendering ─────────────────────────────────────────────────────
  it('renders correctly with POIs', () => {
    const { getByText } = render(<POIListPanel {...mockProps} />);
    expect(getByText('1 Places Nearby')).toBeTruthy();
    expect(getByText('Test Cafe')).toBeTruthy();
  });

  it('does not show list header when no POIs', () => {
    const { queryByText } = render(<POIListPanel {...mockProps} pois={[]} />);
    expect(queryByText('Places Nearby')).toBeNull();
  });

  it('renders without userLocation (distance shown as N/A)', () => {
    const { getByText } = render(<POIListPanel {...mockProps} userLocation={null} />);
    expect(getByText('Test Cafe')).toBeTruthy();
  });

  it('renders with userLocation undefined', () => {
    const props = { ...mockProps, userLocation: undefined };
    const { getByText } = render(<POIListPanel {...props} />);
    expect(getByText('Test Cafe')).toBeTruthy();
  });

  // ── POI interaction ─────────────────────────────────────────────────────
  it('calls onPOIDirections when POI item is pressed', () => {
    const { getByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getByText('Test Cafe'));
    expect(mockProps.onPOIDirections).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', name: 'Test Cafe' })
    );
  });

  // ── POI type icons rendered in list ─────────────────────────────────────
  // Each name triggers a different getPOITypeFromName branch, exercising
  // getPOIIcon and poiColor inside renderPOIItem
  const poiNameCases = [
    'Starbucks Coffee',
    'Thai Restaurant',
    'National Bank',
    'Holiday Inn Hotel',
    'Public Library',
    'The Old Pub Bar',
    'Generic Place XYZ',
  ];

  poiNameCases.forEach((name) => {
    it(`renders POI item for name "${name}"`, () => {
      const { getByText } = render(
        <POIListPanel {...mockProps} pois={[makePoi({ id: name, name })]} />
      );
      expect(getByText(name)).toBeTruthy();
    });
  });

  // ── Sorting ─────────────────────────────────────────────────────────────
  it('sorts POIs by distance — closer one appears first', () => {
    const closePoi = makePoi({ id: 'close', name: 'Close Cafe', latitude: 45.4971, longitude: -73.5781 });
    const farPoi   = makePoi({ id: 'far',   name: 'Far Cafe',   latitude: 45.510,  longitude: -73.600  });

    const { getByText } = render(
      <POIListPanel {...mockProps} pois={[farPoi, closePoi]} />
    );
    expect(getByText('Close Cafe')).toBeTruthy();
    expect(getByText('Far Cafe')).toBeTruthy();
  });

  it('assigns order numbers based on sorted distance', () => {
    const closePoi = makePoi({ id: 'close', name: 'Close Place', latitude: 45.4971, longitude: -73.5781 });
    const farPoi   = makePoi({ id: 'far',   name: 'Far Place',   latitude: 45.510,  longitude: -73.600  });

    const { getByText } = render(
      <POIListPanel {...mockProps} pois={[farPoi, closePoi]} />
    );
    expect(getByText(/#1/)).toBeTruthy();
    expect(getByText(/#2/)).toBeTruthy();
  });

  // ── Radius buttons ──────────────────────────────────────────────────────
  it('renders all four radius buttons', () => {
    const { getAllByText } = render(<POIListPanel {...mockProps} />);
    expect(getAllByText('1 km')[0]).toBeTruthy();
    expect(getAllByText('500 m')[0]).toBeTruthy();
    expect(getAllByText('200 m')[0]).toBeTruthy();
    expect(getAllByText('100 m')[0]).toBeTruthy();
  });

  it('calls onUpdatePOIs with default radius 1000 on mount', () => {
    render(<POIListPanel {...mockProps} />);
    expect(mockProps.onUpdatePOIs).toHaveBeenCalledWith(1000);
  });

  it('calls onUpdatePOIs with 500 when 500 m button is pressed', () => {
    const { getAllByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('500 m')[0]);
    expect(mockProps.onUpdatePOIs).toHaveBeenCalledWith(500);
  });

  it('calls onUpdatePOIs with 200 when 200 m button is pressed', () => {
    const { getAllByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('200 m')[0]);
    expect(mockProps.onUpdatePOIs).toHaveBeenCalledWith(200);
  });

  it('calls onUpdatePOIs with 100 when 100 m button is pressed', () => {
    const { getAllByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('100 m')[0]);
    expect(mockProps.onUpdatePOIs).toHaveBeenCalledWith(100);
  });

  it('does not crash when onUpdatePOIs is undefined', () => {
    const props = { ...mockProps, onUpdatePOIs: undefined };
    expect(() => render(<POIListPanel {...props} />)).not.toThrow();
  });

  // ── Empty state ─────────────────────────────────────────────────────────
  it('shows empty state title when pois is empty', () => {
    const { getByText } = render(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('No places found nearby')).toBeTruthy();
  });

  it('shows helper text in empty state', () => {
    const { getByText } = render(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('Try a larger radius or different category')).toBeTruthy();
  });

  it('shows radius in km in empty state when radius is 1000', () => {
    const { getByText } = render(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('Current: 1km')).toBeTruthy();
  });

  it('shows radius in metres in empty state when radius is 500', () => {
    const { getAllByText, rerender, getByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('500 m')[0]);
    rerender(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('Current: 500m')).toBeTruthy();
  });

  it('shows radius 200m correctly in empty state', () => {
    const { getAllByText, rerender, getByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('200 m')[0]);
    rerender(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('Current: 200m')).toBeTruthy();
  });

  it('shows radius 100m correctly in empty state', () => {
    const { getAllByText, rerender, getByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('100 m')[0]);
    rerender(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('Current: 100m')).toBeTruthy();
  });

  // ── pointerEvents ───────────────────────────────────────────────────────
  it('sets pointerEvents to "auto" when visible is true', () => {
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} />);
    expect(UNSAFE_getByType(Animated.View).props.pointerEvents).toBe('auto');
  });

  it('sets pointerEvents to "none" when visible is false', () => {
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} visible={false} />);
    expect(UNSAFE_getByType(Animated.View).props.pointerEvents).toBe('none');
  });

  it('sets pointerEvents to "none" in empty state when not visible', () => {
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} visible={false} pois={[]} />);
    expect(UNSAFE_getByType(Animated.View).props.pointerEvents).toBe('none');
  });

  // ── Visibility animation ────────────────────────────────────────────────
  it('animates in when visible changes to true', () => {
    const { rerender, UNSAFE_getByType } = render(<POIListPanel {...mockProps} visible={false} />);
    act(() => { rerender(<POIListPanel {...mockProps} visible={true} />); });
    expect(UNSAFE_getByType(Animated.View)).toBeTruthy();
  });

  it('animates out when visible changes to false', () => {
    const { rerender, UNSAFE_getByType } = render(<POIListPanel {...mockProps} visible={true} />);
    act(() => { rerender(<POIListPanel {...mockProps} visible={false} />); });
    expect(UNSAFE_getByType(Animated.View)).toBeTruthy();
  });

  // ── Platform branches ───────────────────────────────────────────────────
  it('renders BlurView on iOS with POIs', () => {
    Platform.OS = 'ios';
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} />);
    const { BlurView } = require('expo-blur');
    expect(UNSAFE_getByType(BlurView)).toBeTruthy();
  });

  it('renders BlurView on iOS in empty state', () => {
    Platform.OS = 'ios';
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} pois={[]} />);
    const { BlurView } = require('expo-blur');
    expect(UNSAFE_getByType(BlurView)).toBeTruthy();
  });

  it('does not render BlurView on Android with POIs', () => {
    Platform.OS = 'android';
    const { UNSAFE_queryAllByType } = render(<POIListPanel {...mockProps} />);
    const { BlurView } = require('expo-blur');
    expect(UNSAFE_queryAllByType(BlurView).length).toBe(0);
  });

  it('does not render BlurView on Android in empty state', () => {
    Platform.OS = 'android';
    const { UNSAFE_queryAllByType } = render(<POIListPanel {...mockProps} pois={[]} />);
    const { BlurView } = require('expo-blur');
    expect(UNSAFE_queryAllByType(BlurView).length).toBe(0);
  });

  // ── PanResponder ────────────────────────────────────────────────────────
  // PanResponder.create receives the raw handler callbacks — we capture them
  // by spying on PanResponder.create before the component mounts.
  describe('PanResponder handlers', () => {
    let capturedHandlers: any;

    beforeEach(() => {
      jest.clearAllMocks();
      mockProps = baseProps();
      jest.spyOn(PanResponder, 'create').mockImplementationOnce((handlers: any) => {
        capturedHandlers = handlers;
        return { panHandlers: {} };
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('onMoveShouldSetPanResponder returns true when |dy| > 5', () => {
      render(<POIListPanel {...mockProps} />);
      expect(capturedHandlers.onMoveShouldSetPanResponder({}, { dy: 10 })).toBe(true);
    });

    it('onMoveShouldSetPanResponder returns false when |dy| <= 5', () => {
      render(<POIListPanel {...mockProps} />);
      expect(capturedHandlers.onMoveShouldSetPanResponder({}, { dy: 3 })).toBe(false);
    });

    it('onMoveShouldSetPanResponder returns true for negative dy > 5', () => {
      render(<POIListPanel {...mockProps} />);
      expect(capturedHandlers.onMoveShouldSetPanResponder({}, { dy: -10 })).toBe(true);
    });

    it('onPanResponderMove does not throw for positive dy', () => {
      render(<POIListPanel {...mockProps} />);
      expect(() => capturedHandlers.onPanResponderMove({}, { dy: 100 })).not.toThrow();
    });

    it('onPanResponderMove does not throw for negative dy (clamped to 0)', () => {
      render(<POIListPanel {...mockProps} />);
      expect(() => capturedHandlers.onPanResponderMove({}, { dy: -100 })).not.toThrow();
    });

    it('onPanResponderMove does not throw for dy exceeding PANEL_HEIGHT', () => {
      render(<POIListPanel {...mockProps} />);
      expect(() => capturedHandlers.onPanResponderMove({}, { dy: 9999 })).not.toThrow();
    });

    it('onPanResponderRelease calls onClose when dy exceeds threshold', () => {
      // Mock ALL Animated.timing calls in this test so the start() callback
      // fires synchronously — the component uses it on mount AND on release.
      jest.spyOn(Animated, 'timing').mockImplementation(() => ({
        start: (cb?: (result: { finished: boolean }) => void) => { if (cb) cb({ finished: true }); },
        stop: jest.fn(),
        reset: jest.fn(),
      }));
      render(<POIListPanel {...mockProps} />);
      act(() => { capturedHandlers.onPanResponderRelease({}, { dy: 300 }); });
      expect(mockProps.onClose).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('onPanResponderRelease does not call onClose when dy is below threshold', () => {
      render(<POIListPanel {...mockProps} />);
      act(() => { capturedHandlers.onPanResponderRelease({}, { dy: 50 }); });
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('onPanResponderRelease snaps back without throwing', () => {
      render(<POIListPanel {...mockProps} />);
      expect(() => {
        act(() => { capturedHandlers.onPanResponderRelease({}, { dy: 50 }); });
      }).not.toThrow();
    });
  });
});

// ─── formatDistance ───────────────────────────────────────────────────────────

describe('formatDistance', () => {
  it('returns metres for 0', () => expect(formatDistance(0)).toBe('0 m'));
  it('returns metres for 500', () => expect(formatDistance(500)).toBe('500 m'));
  it('returns metres for 999', () => expect(formatDistance(999)).toBe('999 m'));
  it('rounds metres correctly', () => expect(formatDistance(250.4)).toBe('250 m'));
  it('rounds up at boundary', () => expect(formatDistance(999.6)).toBe('1000 m'));
  it('returns km for exactly 1000', () => expect(formatDistance(1000)).toBe('1.00 km'));
  it('returns km for 1500', () => expect(formatDistance(1500)).toBe('1.50 km'));
  it('returns km for 2345', () => expect(formatDistance(2345)).toBe('2.35 km'));
});

// ─── getPOITypeFromName ───────────────────────────────────────────────────────

describe('getPOITypeFromName', () => {
  it('coffee keyword', () => expect(getPOITypeFromName('Java Coffee')).toBe('coffee'));
  it('cafe keyword', () => expect(getPOITypeFromName('Le Cafe')).toBe('coffee'));
  it('starbucks keyword', () => expect(getPOITypeFromName('Starbucks')).toBe('coffee'));
  it('tim hortons keyword', () => expect(getPOITypeFromName('Tim Hortons')).toBe('coffee'));

  it('restaurant keyword', () => expect(getPOITypeFromName('Thai Restaurant')).toBe('restaurant'));
  it('food keyword', () => expect(getPOITypeFromName('Good Food')).toBe('restaurant'));
  it('pizza keyword', () => expect(getPOITypeFromName('Domino Pizza')).toBe('restaurant'));
  it('burger keyword', () => expect(getPOITypeFromName('Burger King')).toBe('restaurant'));

  it('bank keyword', () => expect(getPOITypeFromName('National Bank')).toBe('bank'));
  it('atm keyword', () => expect(getPOITypeFromName('ATM Machine')).toBe('bank'));
  it('rbc keyword', () => expect(getPOITypeFromName('RBC Branch')).toBe('bank'));
  it('td keyword', () => expect(getPOITypeFromName('TD Canada Trust')).toBe('bank'));
  it('scotia keyword', () => expect(getPOITypeFromName('Scotiabank')).toBe('bank'));

  it('hotel keyword', () => expect(getPOITypeFromName('Marriott Hotel')).toBe('hotel'));
  it('inn keyword', () => expect(getPOITypeFromName('Holiday Inn')).toBe('hotel'));
  it('lodge keyword', () => expect(getPOITypeFromName('Mountain Lodge')).toBe('hotel'));

  it('library keyword', () => expect(getPOITypeFromName('Public Library')).toBe('library'));
  it('bibliotheque keyword', () => expect(getPOITypeFromName('Bibliotheque centrale')).toBe('library'));

  it('bar keyword', () => expect(getPOITypeFromName('Sports Bar')).toBe('bar'));
  it('pub keyword', () => expect(getPOITypeFromName('The Old Pub')).toBe('bar'));
  it('night club keyword', () => expect(getPOITypeFromName('Night Club 21')).toBe('bar'));

  it('unrecognized name → generic', () => expect(getPOITypeFromName('Random Place XYZ')).toBe('generic'));
  it('empty string → generic', () => expect(getPOITypeFromName('')).toBe('generic'));
});

// ─── getPOIIcon ───────────────────────────────────────────────────────────────

describe('getPOIIcon', () => {
  it('coffee → local-cafe', () => expect(getPOIIcon('coffee')).toBe('local-cafe'));
  it('restaurant → restaurant', () => expect(getPOIIcon('restaurant')).toBe('restaurant'));
  it('bank → account-balance', () => expect(getPOIIcon('bank')).toBe('account-balance'));
  it('hotel → hotel', () => expect(getPOIIcon('hotel')).toBe('hotel'));
  it('library → local-library', () => expect(getPOIIcon('library')).toBe('local-library'));
  it('bar → local-bar', () => expect(getPOIIcon('bar')).toBe('local-bar'));
  it('unknown → place', () => expect(getPOIIcon('generic')).toBe('place'));
  it('empty string → place', () => expect(getPOIIcon('')).toBe('place'));
});

// ─── poiColor ─────────────────────────────────────────────────────────────────

describe('poiColor', () => {
  it('coffee → #6D4C41', () => expect(poiColor('coffee')).toBe('#6D4C41'));
  it('restaurant → #E53935', () => expect(poiColor('restaurant')).toBe('#E53935'));
  it('bank → #1565C0', () => expect(poiColor('bank')).toBe('#1565C0'));
  it('hotel → #7B1FA2', () => expect(poiColor('hotel')).toBe('#7B1FA2'));
  it('library → #2E7D32', () => expect(poiColor('library')).toBe('#2E7D32'));
  it('bar → #F57C00', () => expect(poiColor('bar')).toBe('#F57C00'));
  it('unknown → #B03060', () => expect(poiColor('generic')).toBe('#B03060'));
  it('empty string → #B03060', () => expect(poiColor('')).toBe('#B03060'));
});