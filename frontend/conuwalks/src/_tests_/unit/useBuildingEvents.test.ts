import { renderHook, waitFor } from '@testing-library/react';
import { useBuildingEvents } from '../../hooks/useBuildingEvents';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

// Mock useGoogleCalendar
jest.mock('../../hooks/useGoogleCalendar');

const mockFetchUpcomingEvents = jest.fn();

const mockEvent = (overrides = {}) => ({
  id: '1',
  summary: 'COMP 346',
  location: 'H 820',
  start: { dateTime: new Date().toISOString() },
  end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
  ...overrides,
});

const setupMock = (events: any[], loading = false, error: Error | null = null) => {
  (useGoogleCalendar as jest.Mock).mockReturnValue({
    events,
    fetchUpcomingEvents: mockFetchUpcomingEvents,
    loading,
    error,
  });
};

// ─────────────────────────────────────────────
// 1. LOCATION PARSING
// ─────────────────────────────────────────────
describe('Location Parsing', () => {
  it('parses location with space separator', async () => {
    setupMock([mockEvent({ location: 'H 820' })]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.buildingEvents[0].buildingCode).toBe('H');
    expect(result.current.buildingEvents[0].roomNumber).toBe('820');
  });

  it('parses location with dash separator', async () => {
    setupMock([mockEvent({ location: 'H-820' })]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.buildingEvents[0].buildingCode).toBe('H');
    expect(result.current.buildingEvents[0].roomNumber).toBe('820');
  });

  it('matches building codes case-insensitively', async () => {
    setupMock([mockEvent({ location: 'h 820' })]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.buildingEvents[0].buildingCode).toBe('H');
  });

  it('returns empty array for invalid location format', async () => {
    setupMock([mockEvent({ location: '820' })]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(0));
  });
});

// ─────────────────────────────────────────────
// 2. EVENT FILTERING
// ─────────────────────────────────────────────
describe('Event Filtering', () => {
  it('filters events by exact building code match', async () => {
    setupMock([
      mockEvent({ id: '1', location: 'H 820' }),
      mockEvent({ id: '2', location: 'MB 3.255' }),
    ]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.buildingEvents[0].id).toBe('1');
  });

  it('returns empty results when no events match building', async () => {
    setupMock([mockEvent({ location: 'MB 3.255' })]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(0));
  });

  it('handles empty buildingId parameter', async () => {
    setupMock([mockEvent({ location: 'H 820' })]);
    const { result } = renderHook(() => useBuildingEvents('', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(0));
  });

  it('correctly populates buildingCode and roomNumber', async () => {
    setupMock([mockEvent({ location: 'MB 3.255' })]);
    const { result } = renderHook(() => useBuildingEvents('MB', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.buildingEvents[0].buildingCode).toBe('MB');
    expect(result.current.buildingEvents[0].roomNumber).toBe('3.255');
  });
});

// ─────────────────────────────────────────────
// 4. TODAY'S EVENTS
// ─────────────────────────────────────────────
describe("Today's Events", () => {
  it('filters only today events', async () => {
    const todayEvent = mockEvent({
      id: '1',
      location: 'H 820',
      start: { dateTime: new Date().toISOString() },
      end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
    });

    const futureEvent = mockEvent({
      id: '2',
      location: 'H 820',
      start: { dateTime: new Date(Date.now() + 86400000 * 2).toISOString() },
      end: { dateTime: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString() },
    });

    setupMock([todayEvent, futureEvent]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.todayEvents).toHaveLength(1));
    expect(result.current.todayEvents[0].id).toBe('1');
  });

  it('sorts today events by start time', async () => {
    const laterToday = mockEvent({
      id: '2',
      location: 'H 820',
      start: { dateTime: new Date(Date.now() + 7200000).toISOString() },
      end: { dateTime: new Date(Date.now() + 10800000).toISOString() },
    });

    const earlierToday = mockEvent({
      id: '1',
      location: 'H 820',
      start: { dateTime: new Date(Date.now() + 1800000).toISOString() },
      end: { dateTime: new Date(Date.now() + 5400000).toISOString() },
    });

    setupMock([laterToday, earlierToday]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.todayEvents).toHaveLength(2));
    expect(result.current.todayEvents[0].id).toBe('1');
    expect(result.current.todayEvents[1].id).toBe('2');
  });

  it('returns empty array when no today events exist', async () => {
    const futureEvent = mockEvent({
      location: 'H 820',
      start: { dateTime: new Date(Date.now() + 86400000 * 2).toISOString() },
      end: { dateTime: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString() },
    });
    setupMock([futureEvent]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.todayEvents).toHaveLength(0));
  });
});

// ─────────────────────────────────────────────
// 5. NEXT EVENT
// ─────────────────────────────────────────────
describe('Next Event', () => {
  it('identifies the next upcoming event correctly', async () => {
    const soonEvent = mockEvent({
      id: '1',
      location: 'H 820',
      start: { dateTime: new Date(Date.now() + 1800000).toISOString() },
      end: { dateTime: new Date(Date.now() + 5400000).toISOString() },
    });

    const laterEvent = mockEvent({
      id: '2',
      location: 'H 820',
      start: { dateTime: new Date(Date.now() + 7200000).toISOString() },
      end: { dateTime: new Date(Date.now() + 10800000).toISOString() },
    });

    setupMock([laterEvent, soonEvent]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.nextEvent).not.toBeNull());
    expect(result.current.nextEvent?.id).toBe('1');
  });

  it('returns null when no upcoming events exist', async () => {
    const pastEvent = mockEvent({
      location: 'H 820',
      start: { dateTime: new Date(Date.now() - 7200000).toISOString() },
      end: { dateTime: new Date(Date.now() - 3600000).toISOString() },
    });
    setupMock([pastEvent]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.nextEvent).toBeNull();
  });

  it('returns null when events array is empty', async () => {
    setupMock([]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    expect(result.current.nextEvent).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 6. STATE MANAGEMENT
// ─────────────────────────────────────────────
describe('State Management', () => {
  it('propagates loading state from useGoogleCalendar', () => {
    setupMock([], true, null);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    expect(result.current.loading).toBe(true);
  });

  it('propagates error state from useGoogleCalendar', () => {
    const mockError = new Error('Calendar fetch failed');
    setupMock([], false, mockError);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    expect(result.current.error).toBe(mockError);
  });
});

// ─────────────────────────────────────────────
// 7. EDGE CASES
// ─────────────────────────────────────────────
describe('Edge Cases', () => {
  it('handles events with date-only format (no dateTime)', async () => {
    const dateOnlyEvent = mockEvent({
      location: 'H 820',
      start: { date: '2026-02-21' },
      end: { date: '2026-02-21' },
    });
    setupMock([dateOnlyEvent]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.buildingEvents[0].start).toBeInstanceOf(Date);
    expect(result.current.buildingEvents[0].end).toBeInstanceOf(Date);
  });

  it('verifies all required BuildingEvent fields are present', async () => {
    setupMock([mockEvent({ id: '1', summary: 'COMP 346', location: 'H 820' })]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));

    const event = result.current.buildingEvents[0];
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('summary');
    expect(event).toHaveProperty('start');
    expect(event).toHaveProperty('end');
    expect(event).toHaveProperty('location');
    expect(event).toHaveProperty('courseName');
  });

  it('ensures start and end are converted to Date objects', async () => {
    setupMock([mockEvent({ location: 'H 820' })]);
    const { result } = renderHook(() => useBuildingEvents('H', 'SGW'));
    await waitFor(() => expect(result.current.buildingEvents).toHaveLength(1));
    expect(result.current.buildingEvents[0].start).toBeInstanceOf(Date);
    expect(result.current.buildingEvents[0].end).toBeInstanceOf(Date);
  });
});