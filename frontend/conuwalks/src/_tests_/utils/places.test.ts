import { fetchPOIs, fetchRestaurants } from '../../api/places';

// Mock fetch
global.fetch = jest.fn();

describe('places API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchPOIs returns correct structure', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        places: [
          {
            id: 'place1',
            displayName: { text: 'Test Cafe' },
            location: { latitude: 45.497, longitude: -73.578 },
          },
        ],
      }),
    } as Response);

    const pois = await fetchPOIs('SGW', 'Coffee shops', 500);
    
    expect(pois).toHaveLength(1);
    expect(pois[0]).toMatchObject({
      id: 'place1',
      name: 'Test Cafe',
      latitude: 45.497,
      longitude: -73.578,
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error('Network error')
    );

    const pois = await fetchPOIs('SGW', 'Restaurants');
    expect(pois).toEqual([]);
  });

  it('uses correct campus coordinates', async () => {
    const mockFetch = (global.fetch as jest.MockedFunction<typeof fetch>);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ places: [] }),
    } as Response);

    await fetchPOIs('LOY', 'Banks');
    
    expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('places:searchNearby'),
        expect.objectContaining({
          body: expect.stringContaining('"latitude":45.458') &&
                expect.stringContaining('"longitude":-73.639'),
        })
      );
  });

  it('fetchRestaurants is backward compatible', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ places: [] }),
    } as Response);

    await fetchRestaurants('SGW');
    expect(global.fetch).toHaveBeenCalled();
  });
});