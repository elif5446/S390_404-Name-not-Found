from pydantic import BaseModel
from typing import Literal, List


class Building(BaseModel):
    """Building model with campus information"""
    id: str
    name: str
    campus: Literal["SGW", "Loyola"]
    address: str
    latitude: float
    longitude: float


class DirectionsRequest(BaseModel):
    """Request model for directions"""
    start_building_id: str
    destination_building_id: str


class DirectionsResponse(BaseModel):
    """Response model for directions"""
    start: Building
    destination: Building
    distance_km: float
    estimated_time_minutes: int
    instructions: List[str]
    requires_shuttle: bool
