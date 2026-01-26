from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import DirectionsRequest, DirectionsResponse, Building
from app.data import get_all_buildings, get_building_by_id, get_buildings_by_campus
from app.routes import generate_directions

app = FastAPI(title="ConuWalks API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/buildings", response_model=list[Building])
def get_buildings(campus: str | None = None):
    """Get all buildings, optionally filtered by campus"""
    if campus:
        if campus not in ["SGW", "Loyola"]:
            raise HTTPException(status_code=400, detail="Campus must be 'SGW' or 'Loyola'")
        return get_buildings_by_campus(campus)
    return get_all_buildings()


@app.get("/buildings/{building_id}", response_model=Building)
def get_building(building_id: str):
    """Get a specific building by ID"""
    building = get_building_by_id(building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    return building


@app.post("/directions", response_model=DirectionsResponse)
def get_directions(request: DirectionsRequest):
    """Get directions between two buildings"""
    start = get_building_by_id(request.start_building_id)
    if not start:
        raise HTTPException(status_code=404, detail="Start building not found")
    
    destination = get_building_by_id(request.destination_building_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination building not found")
    
    return generate_directions(start, destination)