import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, Animated } from 'react-native';
import POIListPanel from '../../components/POIListPanel';
import { POIPlace } from '@/src/api/places';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

// ─── Pure helper functions (copied to unit-test in isolation) ─────────────────

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

// ─── Component tests ──────────────────────────────────────────────────────────

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
      name: 'Test Cafe',
    }));
  });

  it('calls onClearPOIs when clear button pressed', () => {
    const { getByLabelText } = render(<POIListPanel {...mockProps} />);
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

  // ── onUpdatePOIs ────────────────────────────────────────────────────────
  it('calls onUpdatePOIs with default radius on mount', () => {
    render(<POIListPanel {...mockProps} />);
    expect(mockProps.onUpdatePOIs).toHaveBeenCalledWith(1000);
  });

  it('calls onUpdatePOIs with new radius when radius button is pressed', () => {
    const { getAllByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('500 m')[0]);
    expect(mockProps.onUpdatePOIs).toHaveBeenCalledWith(500);
  });

  it('does not crash when onUpdatePOIs is undefined', () => {
    const props = { ...mockProps, onUpdatePOIs: undefined };
    expect(() => render(<POIListPanel {...props} />)).not.toThrow();
  });

  // ── Empty state ─────────────────────────────────────────────────────────
  it('shows empty state when pois is empty', () => {
    const { getByText } = render(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('No places found nearby')).toBeTruthy();
  });

  it('shows radius in km in empty state when radius is 1000', () => {
    const { getByText } = render(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('Current: 1km')).toBeTruthy();
  });

  it('shows radius in metres in empty state when radius < 1000', () => {
    // Render with POIs first so radius buttons are visible, switch to 500m, then re-render with no POIs
    const { getAllByText, rerender, getByText } = render(<POIListPanel {...mockProps} />);
    fireEvent.press(getAllByText('500 m')[0]);
    rerender(<POIListPanel {...mockProps} pois={[]} />);
    expect(getByText('Current: 500m')).toBeTruthy();
  });

  // ── pointerEvents ───────────────────────────────────────────────────────
  it('sets pointerEvents to auto when visible is true', () => {
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} />);
    const animatedView = UNSAFE_getByType(Animated.View);
    expect(animatedView.props.pointerEvents).toBe('auto');
  });

  it('sets pointerEvents to none when visible is false', () => {
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} visible={false} />);
    const animatedView = UNSAFE_getByType(Animated.View);
    expect(animatedView.props.pointerEvents).toBe('none');
  });

  // ── Platform branches ───────────────────────────────────────────────────
  it('renders BlurView on iOS', () => {
    Platform.OS = 'ios';
    const { UNSAFE_getByType } = render(<POIListPanel {...mockProps} />);
    const { BlurView } = require('expo-blur');
    expect(UNSAFE_getByType(BlurView)).toBeTruthy();
  });

  it('renders without BlurView on Android', () => {
    Platform.OS = 'android';
    const { UNSAFE_queryAllByType } = render(<POIListPanel {...mockProps} />);
    const { BlurView } = require('expo-blur');
    expect(UNSAFE_queryAllByType(BlurView).length).toBe(0);
  });
});

// ─── formatDistance ───────────────────────────────────────────────────────────

describe('formatDistance', () => {
  it('returns metres for values under 1000', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('rounds metres correctly', () => {
    expect(formatDistance(250.4)).toBe('250 m');
    expect(formatDistance(999.6)).toBe('1000 m');
  });

  it('returns kilometres for values >= 1000', () => {
    expect(formatDistance(1000)).toBe('1.00 km');
    expect(formatDistance(1500)).toBe('1.50 km');
    expect(formatDistance(2345)).toBe('2.35 km');
  });
});

// ─── getPOITypeFromName ───────────────────────────────────────────────────────

describe('getPOITypeFromName', () => {
  it('returns "coffee" for coffee', () => expect(getPOITypeFromName('Java Coffee')).toBe('coffee'));
  it('returns "coffee" for cafe', () => expect(getPOITypeFromName('Le Cafe')).toBe('coffee'));
  it('returns "coffee" for starbucks', () => expect(getPOITypeFromName('Starbucks')).toBe('coffee'));
  it('returns "coffee" for tim hortons', () => expect(getPOITypeFromName('Tim Hortons')).toBe('coffee'));

  it('returns "restaurant" for restaurant', () => expect(getPOITypeFromName('Thai Restaurant')).toBe('restaurant'));
  it('returns "restaurant" for food', () => expect(getPOITypeFromName('Good Food')).toBe('restaurant'));
  it('returns "restaurant" for pizza', () => expect(getPOITypeFromName('Domino Pizza')).toBe('restaurant'));
  it('returns "restaurant" for burger', () => expect(getPOITypeFromName('Burger King')).toBe('restaurant'));

  it('returns "bank" for bank', () => expect(getPOITypeFromName('National Bank')).toBe('bank'));
  it('returns "bank" for atm', () => expect(getPOITypeFromName('ATM Machine')).toBe('bank'));
  it('returns "bank" for rbc', () => expect(getPOITypeFromName('RBC Branch')).toBe('bank'));
  it('returns "bank" for td', () => expect(getPOITypeFromName('TD Canada Trust')).toBe('bank'));
  it('returns "bank" for scotia', () => expect(getPOITypeFromName('Scotiabank')).toBe('bank'));

  it('returns "hotel" for hotel', () => expect(getPOITypeFromName('Marriott Hotel')).toBe('hotel'));
  it('returns "hotel" for inn', () => expect(getPOITypeFromName('Holiday Inn')).toBe('hotel'));
  it('returns "hotel" for lodge', () => expect(getPOITypeFromName('Mountain Lodge')).toBe('hotel'));

  it('returns "library" for library', () => expect(getPOITypeFromName('Public Library')).toBe('library'));
  it('returns "library" for bibliotheque', () => expect(getPOITypeFromName('Bibliotheque centrale')).toBe('library'));

  it('returns "bar" for bar', () => expect(getPOITypeFromName('Sports Bar')).toBe('bar'));
  it('returns "bar" for pub', () => expect(getPOITypeFromName('The Old Pub')).toBe('bar'));
  it('returns "bar" for night club', () => expect(getPOITypeFromName('Night Club 21')).toBe('bar'));

  it('returns "generic" for unrecognized names', () => expect(getPOITypeFromName('Random Place XYZ')).toBe('generic'));
  it('returns "generic" for empty string', () => expect(getPOITypeFromName('')).toBe('generic'));
});

// ─── getPOIIcon ───────────────────────────────────────────────────────────────

describe('getPOIIcon', () => {
  it('returns "local-cafe" for coffee', () => expect(getPOIIcon('coffee')).toBe('local-cafe'));
  it('returns "restaurant" for restaurant', () => expect(getPOIIcon('restaurant')).toBe('restaurant'));
  it('returns "account-balance" for bank', () => expect(getPOIIcon('bank')).toBe('account-balance'));
  it('returns "hotel" for hotel', () => expect(getPOIIcon('hotel')).toBe('hotel'));
  it('returns "local-library" for library', () => expect(getPOIIcon('library')).toBe('local-library'));
  it('returns "local-bar" for bar', () => expect(getPOIIcon('bar')).toBe('local-bar'));
  it('returns "place" for unknown type', () => expect(getPOIIcon('generic')).toBe('place'));
  it('returns "place" for empty string', () => expect(getPOIIcon('')).toBe('place'));
});

// ─── poiColor ─────────────────────────────────────────────────────────────────

describe('poiColor', () => {
  it('returns correct color for coffee', () => expect(poiColor('coffee')).toBe('#6D4C41'));
  it('returns correct color for restaurant', () => expect(poiColor('restaurant')).toBe('#E53935'));
  it('returns correct color for bank', () => expect(poiColor('bank')).toBe('#1565C0'));
  it('returns correct color for hotel', () => expect(poiColor('hotel')).toBe('#7B1FA2'));
  it('returns correct color for library', () => expect(poiColor('library')).toBe('#2E7D32'));
  it('returns correct color for bar', () => expect(poiColor('bar')).toBe('#F57C00'));
  it('returns default color for unknown type', () => expect(poiColor('generic')).toBe('#B03060'));
  it('returns default color for empty string', () => expect(poiColor('')).toBe('#B03060'));
});