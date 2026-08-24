"""Canonical AquaLux service catalogue.

The public Home page, AI advisor, booking forms, package tables and payments
all use these same starting values. Database edits remain visible everywhere
through the public package API.
"""

PACKAGE_CATALOG = [
    {
        "package_name": "Bike Basic Wash",
        "vehicle_type": "Motorcycle",
        "price": 7500,
        "estimated_minutes": 120,
        "description": "Quick wash for motorcycles.",
        "features": ["Body wash", "Quick dry"],
        "rule_id": "RULE-BIKE-01",
    },
    {
        "package_name": "Car Standard Wash",
        "vehicle_type": "Car",
        "price": 15000,
        "estimated_minutes": 180,
        "description": "Normal wash for cars.",
        "features": ["Exterior wash", "Interior wipe"],
        "rule_id": "RULE-CAR-01",
    },
    {
        "package_name": "Van Full Wash",
        "vehicle_type": "Van",
        "price": 20000,
        "estimated_minutes": 240,
        "description": "Complete exterior and interior cleaning for vans.",
        "features": ["Full body wash", "Interior cleaning"],
        "rule_id": "RULE-VAN-01",
    },
    {
        "package_name": "SUV Full Wash",
        "vehicle_type": "SUV",
        "price": 22500,
        "estimated_minutes": 240,
        "description": "Complete cleaning for large vehicles.",
        "features": ["Full body wash", "Interior cleaning"],
        "rule_id": "RULE-SUV-01",
    },
]

CATALOG_BY_VEHICLE = {item["vehicle_type"]: item for item in PACKAGE_CATALOG}
CATALOG_BY_NAME = {item["package_name"]: item for item in PACKAGE_CATALOG}


def format_duration(minutes):
    """Return a readable duration while keeping minutes as the stored unit."""
    minutes = int(minutes)
    if minutes % 60 == 0:
        hours = minutes // 60
        return f"{hours} hour" if hours == 1 else f"{hours} hours"
    return f"{minutes} minutes"
