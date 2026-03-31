export interface POIPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isOpen?: boolean | null; // true/false if open, null if unknown
  openHours?: string[] | null; // human-readable schedule
}

const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  process.env.GOOGLE_MAPS_API_KEY ??
  "";

const CAMPUS_COORDS = {
  SGW: { latitude: 45.497, longitude: -73.578 },
  LOY: { latitude: 45.458, longitude: -73.639 },
};

const POI_TYPE_MAP: Record<string, string[]> = {
  Restaurants: ["restaurant"],
  "Coffee shops": ["cafe"],
  Banks: ["bank"],
  Hotels: ["hotel", "lodging"],
  Libraries: ["library"],
  Bars: ["bar", "night_club"],
};

// Fetch details (open status + hours)
const fetchPOIDetails = async (
  placeId: string
): Promise<{ isOpen?: boolean; openHours?: string[] }> => {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,currentOpeningHours,regularOpeningHours&key=${GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();

    const isOpen =
    data.currentOpeningHours?.openNow ??
    null;
  
    const openHours =
    data.currentOpeningHours?.weekdayDescriptions ??
    data.regularOpeningHours?.weekdayDescriptions ??
    null;
  
  
    return { isOpen, openHours };
  } catch (err) {
    console.error(`Failed to fetch details for ${placeId}:`, err);
    return {};
  }
};

// Main function: fetch POIs and enrich with open hours
export const fetchPOIs = async (
  campus: "SGW" | "LOY",
  poiType: string,
  radius: number = 1000 // default 1 km
): Promise<POIPlace[]> => {
  const { latitude, longitude } = CAMPUS_COORDS[campus];
  const includedTypes = POI_TYPE_MAP[poiType] || ["restaurant"];
  
  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.location",
        },
        body: JSON.stringify({
          includedTypes,
          maxResultCount: 20,
          locationRestriction: {
            circle: { center: { latitude, longitude }, radius }, // <-- use parameter
          },
        }),
      }
    );

    const data = await response.json();
    if (!data.places || data.places.length === 0) {
      console.log(`No ${poiType} found within ${radius}m`);
      return [];
    }

    // Fetch details for each POI
    return await Promise.all(
      data.places.map(async (p: any) => {
        const details = await fetchPOIDetails(p.id);
        return {
          id: p.id,
          name: p.displayName?.text ?? "Unknown",
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          ...details,
        };
      })
    );
  } catch (err) {
    console.error(`Failed to fetch ${poiType}:`, err);
    return [];
  }
};

// Backward compatibility
export const fetchRestaurants = (campus: "SGW" | "LOY") => fetchPOIs(campus, "Restaurants");