import math
from app.models import Building, DirectionsResponse


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def generate_directions(start: Building, destination: Building) -> DirectionsResponse:
    """Generate directions between two buildings"""
    distance = calculate_distance(
        start.latitude, start.longitude,
        destination.latitude, destination.longitude
    )
    
    # Check if cross-campus travel is required
    requires_shuttle = start.campus != destination.campus
    
    # Generate instructions based on whether shuttle is needed
    instructions = []
    
    if requires_shuttle:
        # Cross-campus directions
        instructions.append(f"Start at {start.name} ({start.campus} Campus)")
        instructions.append(f"Walk to the shuttle bus stop on {start.campus} Campus")
        instructions.append("Take the Concordia shuttle bus to the other campus")
        instructions.append("The shuttle runs every 20-30 minutes during peak hours")
        instructions.append(f"Arrive at {destination.campus} Campus shuttle stop")
        instructions.append(f"Walk to {destination.name}")
        instructions.append(f"You have arrived at {destination.name} ({destination.campus} Campus)")
        
        # Estimate time: shuttle ride (~20-30 min) + walking (~10 min)
        estimated_time = 40
    else:
        # Same campus directions
        instructions.append(f"Start at {start.name} ({start.campus} Campus)")
        instructions.append(f"Walk to {destination.name}")
        instructions.append(f"You have arrived at {destination.name} ({destination.campus} Campus)")
        
        # Estimate walking time (assuming 5 km/h walking speed)
        walking_speed = 5  # km/h
        estimated_time = int((distance / walking_speed) * 60)  # convert to minutes
        if estimated_time < 5:
            estimated_time = 5  # minimum 5 minutes
    
    return DirectionsResponse(
        start=start,
        destination=destination,
        distance_km=round(distance, 2),
        estimated_time_minutes=estimated_time,
        instructions=instructions,
        requires_shuttle=requires_shuttle
    )
