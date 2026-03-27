export interface POIPlace {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isOpen?: boolean | null;
  }
  
  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
  
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
  
  export const fetchPOIs = async (
    campus: "SGW" | "LOY",
    poiType: string
  ): Promise<POIPlace[]> => {
    const { latitude, longitude } = CAMPUS_COORDS[campus];
    const includedTypes = POI_TYPE_MAP[poiType] || ["restaurant"];
    const radius = 800;
  
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
              circle: { center: { latitude, longitude }, radius },
            },
          }),
        }
      );
  
      const data = await response.json();
      if (!data.places) {
        console.error("Places API error:", JSON.stringify(data));
        return [];
      }
  
      return data.places.map((p: any) => ({
        id: p.id,
        name: p.displayName?.text ?? "Unknown",
        latitude: p.location.latitude,
        longitude: p.location.longitude,
      }));
    } catch (err) {
      console.error(`Failed to fetch ${poiType}:`, err);
      return [];
    }
  };
  
  // Keep backward compat
  export const fetchRestaurants = (campus: "SGW" | "LOY") => fetchPOIs(campus, "Restaurants");
  