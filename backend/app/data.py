from app.models import Building

# Sample buildings for both SGW and Loyola campuses
BUILDINGS = {
    # SGW Campus Buildings
    "H": Building(
        id="H",
        name="Henry F. Hall Building",
        campus="SGW",
        address="1455 De Maisonneuve Blvd. W.",
        latitude=45.4972,
        longitude=-73.5790
    ),
    "MB": Building(
        id="MB",
        name="J.W. McConnell Building",
        campus="SGW",
        address="1400 De Maisonneuve Blvd. W.",
        latitude=45.4959,
        longitude=-73.5789
    ),
    "EV": Building(
        id="EV",
        name="Engineering, Computer Science and Visual Arts Integrated Complex",
        campus="SGW",
        address="1515 St. Catherine St. W.",
        latitude=45.4952,
        longitude=-73.5779
    ),
    "LB": Building(
        id="LB",
        name="J.A. De Sève Cinema",
        campus="SGW",
        address="1400 De Maisonneuve Blvd. W.",
        latitude=45.4960,
        longitude=-73.5788
    ),
    
    # Loyola Campus Buildings
    "CC": Building(
        id="CC",
        name="Central Building",
        campus="Loyola",
        address="7141 Sherbrooke St. W.",
        latitude=45.4582,
        longitude=-73.6404
    ),
    "AD": Building(
        id="AD",
        name="Administration Building",
        campus="Loyola",
        address="7141 Sherbrooke St. W.",
        latitude=45.4587,
        longitude=-73.6401
    ),
    "SP": Building(
        id="SP",
        name="Richard J. Renaud Science Complex",
        campus="Loyola",
        address="7141 Sherbrooke St. W.",
        latitude=45.4577,
        longitude=-73.6407
    ),
    "PS": Building(
        id="PS",
        name="Physical Services Building",
        campus="Loyola",
        address="7141 Sherbrooke St. W.",
        latitude=45.4585,
        longitude=-73.6412
    ),
}


def get_all_buildings() -> list[Building]:
    """Get all buildings"""
    return list(BUILDINGS.values())


def get_building_by_id(building_id: str) -> Building | None:
    """Get a building by its ID"""
    return BUILDINGS.get(building_id)


def get_buildings_by_campus(campus: str) -> list[Building]:
    """Get all buildings for a specific campus"""
    return [b for b in BUILDINGS.values() if b.campus == campus]
