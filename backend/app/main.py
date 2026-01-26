from fastapi import FastAPI, Query
from enum import Enum
from typing import Optional

class TransportMode(str, Enum):
    walk = "walk"
    car = "car"
    public_transportation = "public_transportation"
    bike = "bike"

app = FastAPI(title="Backend API")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/route")
def get_route(
    start_lat: float = Query(..., description="Starting latitude"),
    start_lng: float = Query(..., description="Starting longitude"),
    end_lat: float = Query(..., description="Ending latitude"),
    end_lng: float = Query(..., description="Ending longitude"),
    mode: TransportMode = Query(TransportMode.walk, description="Transportation mode")
):
    """
    Calculate route between two points based on transportation mode.
    Returns a mock route with mode-specific characteristics.
    """
    # Mock route data - in a real application, this would call a routing API
    route_data = {
        "start": {"lat": start_lat, "lng": start_lng},
        "end": {"lat": end_lat, "lng": end_lng},
        "mode": mode.value,
        "distance_km": 5.2,
        "duration_min": 0,
        "route_points": [
            {"lat": start_lat, "lng": start_lng},
            {"lat": (start_lat + end_lat) / 2, "lng": (start_lng + end_lng) / 2},
            {"lat": end_lat, "lng": end_lng}
        ]
    }
    
    # Adjust duration based on transportation mode
    base_distance = route_data["distance_km"]
    if mode == TransportMode.walk:
        route_data["duration_min"] = int(base_distance * 12)  # ~5 km/h
    elif mode == TransportMode.bike:
        route_data["duration_min"] = int(base_distance * 4)   # ~15 km/h
    elif mode == TransportMode.car:
        route_data["duration_min"] = int(base_distance * 2)   # ~40 km/h
    elif mode == TransportMode.public_transportation:
        route_data["duration_min"] = int(base_distance * 3)   # ~20 km/h (includes waiting)
    
    return route_data