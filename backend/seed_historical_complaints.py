"""
UrbanCore Synthetic Historical Complaints Seed Script (Test Data Only)
Safely seeds 60 historical synthetic test complaints distributed across 2021-2025.
Targets strictly URB-TEST-2021-0001..0012 through URB-TEST-2025-0001..0012.
Preserves existing records (including URB-TEST-2026-0001..0010 and their current statuses).
"""
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text

# Load backend environment and database engine
backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir / ".env")
sys.path.insert(0, str(backend_dir))

from app.complaints_service import engine

# Exact 10 existing 2026 seed reference numbers that must remain untouched
EXISTING_2026_REFS = tuple(sorted([f"URB-TEST-2026-{str(i).zfill(4)}" for i in range(1, 11)]))

# 60 Historical test complaints across 2021-2025 (12 per year)
HISTORICAL_COMPLAINTS = [
    # ---------------- 2021 (12 records) ----------------
    {
        "reference_number": "URB-TEST-2021-0001",
        "citizen_name": "[TEST] Ramesh Thorat",
        "title": "[TEST] Unauthorized Plinth Construction",
        "description": "Excavation and foundation laid without building permission or setback compliance.",
        "status": "Closed",
        "latitude": 20.0071,
        "longitude": 73.7632,
        "location_name": "College Road, Nashik",
        "created_at": datetime(2021, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0002",
        "citizen_name": "[TEST] Sunita Bhalerao",
        "title": "[TEST] Stormwater Drain Blockage by Construction Wall",
        "description": "Compound wall blocking natural drainage channel leading to monsoon waterlogging.",
        "status": "Closed",
        "latitude": 20.0234,
        "longitude": 73.7412,
        "location_name": "Gangapur Road, Anandwalli",
        "created_at": datetime(2021, 2, 20, 14, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0003",
        "citizen_name": "[TEST] Deepak Deshmukh",
        "title": "[TEST] Encroachment on Public Footpath",
        "description": "Commercial display and permanent tin shed erected on pedestrian footpath.",
        "status": "Closed",
        "latitude": 19.9672,
        "longitude": 73.7791,
        "location_name": "Indira Nagar, Nashik",
        "created_at": datetime(2021, 3, 10, 9, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0004",
        "citizen_name": "[TEST] Anjali Kulkarni",
        "title": "[TEST] Illegal Structural Alteration of Heritage Structure",
        "description": "Unauthorized addition of RCC beams onto old wada structure near river ghats.",
        "status": "Closed",
        "latitude": 20.0115,
        "longitude": 73.7942,
        "location_name": "Panchavati, near Ramkund",
        "created_at": datetime(2021, 4, 18, 16, 45, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0005",
        "citizen_name": "[TEST] Sanjay Wagh",
        "title": "[TEST] Unapproved Quarrying and Road Encroachment",
        "description": "Illegal stone crushing shed encroaching on service road margin.",
        "status": "Closed",
        "latitude": 19.9465,
        "longitude": 73.7592,
        "location_name": "Pathardi Phata, Nashik",
        "created_at": datetime(2021, 5, 22, 11, 20, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0006",
        "citizen_name": "[TEST] Vandana Hiray",
        "title": "[TEST] Residential Setback Violation in Row Houses",
        "description": "Rear margin completely covered with two-story permanent brick extension.",
        "status": "Closed",
        "latitude": 19.9745,
        "longitude": 73.7468,
        "location_name": "CIDCO Sector 4, Nashik",
        "created_at": datetime(2021, 6, 14, 15, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0007",
        "citizen_name": "[TEST] Nitin Pawar",
        "title": "[TEST] Industrial Waste and Rubble Dumping",
        "description": "Construction debris dumped on vacant municipal plot near MIDC line.",
        "status": "Closed",
        "latitude": 19.9968,
        "longitude": 73.7334,
        "location_name": "Satpur MIDC Link Rd",
        "created_at": datetime(2021, 7, 28, 8, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0008",
        "citizen_name": "[TEST] Meena Gangurde",
        "title": "[TEST] Unauthorized Second Floor Addition",
        "description": "Extra residential floor constructed with no sanctioned architectural drawing.",
        "status": "Closed",
        "latitude": 19.9525,
        "longitude": 73.8362,
        "location_name": "Nashik Road, near Station",
        "created_at": datetime(2021, 8, 19, 13, 50, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0009",
        "citizen_name": "[TEST] Rahul Sanap",
        "title": "[TEST] Commercial Activity in Designated Green Belt",
        "description": "Auto repair workshop operating inside reserved open green space.",
        "status": "Closed",
        "latitude": 20.0298,
        "longitude": 73.7275,
        "location_name": "Someshwar, Riverbank Zone",
        "created_at": datetime(2021, 9, 25, 12, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0010",
        "citizen_name": "[TEST] Swati Khairnar",
        "title": "[TEST] Road Obstruction by Heavy Construction Material",
        "description": "Steel rebars and gravel blocking 9-meter internal colony road.",
        "status": "Closed",
        "latitude": 19.9825,
        "longitude": 73.7668,
        "location_name": "Govind Nagar, Nashik",
        "created_at": datetime(2021, 10, 11, 17, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0011",
        "citizen_name": "[TEST] Ashok Gaikwad",
        "title": "[TEST] Demolition Without Dust Screen & Safety Netting",
        "description": "Demolition of old bungalow without dust control causing severe particulate pollution.",
        "status": "Action Taken",
        "latitude": 20.0042,
        "longitude": 73.7715,
        "location_name": "College Road, Thatte Nagar",
        "created_at": datetime(2021, 11, 8, 10, 40, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2021-0012",
        "citizen_name": "[TEST] Kavita Dhumal",
        "title": "[TEST] Boundary Wall Encroachment on DP Road",
        "description": "Builder extended compound wall into planned Development Plan road corridor.",
        "status": "Action Taken",
        "latitude": 19.9421,
        "longitude": 73.7225,
        "location_name": "Ambad MIDC, Nashik",
        "created_at": datetime(2021, 12, 17, 14, 25, 0, tzinfo=timezone.utc),
    },

    # ---------------- 2022 (12 records) ----------------
    {
        "reference_number": "URB-TEST-2022-0001",
        "citizen_name": "[TEST] Pramod Mahajan",
        "title": "[TEST] Unauthorized Cellphone Tower on Weak Terrace",
        "description": "Heavy telecommunication mast installed on uncertified old building roof.",
        "status": "Closed",
        "latitude": 19.9610,
        "longitude": 73.7820,
        "location_name": "Indira Nagar, Rajwada",
        "created_at": datetime(2022, 1, 12, 11, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0002",
        "citizen_name": "[TEST] Shalini Borse",
        "title": "[TEST] Natural Stream Filling and Leveling",
        "description": "Filling seasonal nullah with debris to create unauthorized parking lot.",
        "status": "Closed",
        "latitude": 20.0189,
        "longitude": 73.7485,
        "location_name": "Gangapur Road, Serene Meadows",
        "created_at": datetime(2022, 2, 18, 9, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0003",
        "citizen_name": "[TEST] Mahesh Chitnis",
        "title": "[TEST] Road Obstruction by Commercial Display Ramps",
        "description": "Permanent cement ramps built into vehicular carriageway by shopkeepers.",
        "status": "Closed",
        "latitude": 20.0085,
        "longitude": 73.7660,
        "location_name": "College Road, Model Colony",
        "created_at": datetime(2022, 3, 25, 16, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0004",
        "citizen_name": "[TEST] Rekha Sonawane",
        "title": "[TEST] Building Safety Hazard - Cracked Balconies",
        "description": "Crumbling concrete cantilever over busy pedestrian street requiring urgent inspection.",
        "status": "Closed",
        "latitude": 20.0130,
        "longitude": 73.7910,
        "location_name": "Panchavati, Karanja",
        "created_at": datetime(2022, 4, 5, 14, 50, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0005",
        "citizen_name": "[TEST] Vijay Aher",
        "title": "[TEST] Unauthorized Basement Commercial Use",
        "description": "Basement sanctioned exclusively for parking converted into commercial banquet hall.",
        "status": "Closed",
        "latitude": 19.9850,
        "longitude": 73.7640,
        "location_name": "Govind Nagar, City Center Mall Area",
        "created_at": datetime(2022, 5, 17, 10, 20, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0006",
        "citizen_name": "[TEST] Rohini Moghe",
        "title": "[TEST] Encroachment on Natural Drainage in Low-Lying Area",
        "description": "RCC culvert narrowed with private brickwork, creating upstream flooding risk.",
        "status": "Closed",
        "latitude": 19.9450,
        "longitude": 73.7630,
        "location_name": "Pathardi Phata, Ambad Link",
        "created_at": datetime(2022, 6, 22, 13, 40, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0007",
        "citizen_name": "[TEST] Anonymous Citizen",
        "title": "[TEST] Phone Report - Night Earthmoving (Missing GPS Coordinates)",
        "description": "Telephonic complaint reporting illegal earth-moving after dark. Exact coordinates unavailable.",
        "status": "Closed",
        "latitude": None,
        "longitude": None,
        "location_name": "Upnagar, Nashik",
        "created_at": datetime(2022, 7, 9, 21, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0008",
        "citizen_name": "[TEST] Harish Shinde",
        "title": "[TEST] Unauthorized Shed in Common Open Space",
        "description": "Society promoter erected private storage godown in mandatory open amenity space.",
        "status": "Closed",
        "latitude": 19.9705,
        "longitude": 73.7510,
        "location_name": "CIDCO Sector 6, Nashik",
        "created_at": datetime(2022, 8, 30, 15, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0009",
        "citizen_name": "[TEST] Archana Lonari",
        "title": "[TEST] Road Widening Obstruction by Encroached Boundary",
        "description": "Refusal to yield setback margin earmarked for 18-meter municipal arterial widening.",
        "status": "Action Taken",
        "latitude": 19.9510,
        "longitude": 73.8310,
        "location_name": "Nashik Road, Bitco Point",
        "created_at": datetime(2022, 9, 14, 11, 45, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0010",
        "citizen_name": "[TEST] Anand Joshi",
        "title": "[TEST] Demolition Rubble Left on Highway Service Road",
        "description": "Uncollected demolition debris obstructing two lanes of service road.",
        "status": "Action Taken",
        "latitude": 19.9920,
        "longitude": 73.7290,
        "location_name": "Satpur MIDC, Trimbak Road",
        "created_at": datetime(2022, 10, 27, 8, 50, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0011",
        "citizen_name": "[TEST] Pallavi Kale",
        "title": "[TEST] High-Rise Crane Operating Without Perimeter Barrier",
        "description": "Tower crane operating over adjoining residential dwellings without safety perimeter.",
        "status": "Action Taken",
        "latitude": 20.0260,
        "longitude": 73.7380,
        "location_name": "Gangapur Road, Pipeline Rd",
        "created_at": datetime(2022, 11, 15, 14, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2022-0012",
        "citizen_name": "[TEST] Tanaji Nikam",
        "title": "[TEST] Illegal Mezzanine Construction in Commercial Complex",
        "description": "Unauthorized steel structural mezzanine floor added inside retail shop.",
        "status": "Under Review",
        "latitude": 19.9780,
        "longitude": 73.8050,
        "location_name": "Dwarka Circle, Nashik",
        "created_at": datetime(2022, 12, 20, 16, 20, 0, tzinfo=timezone.utc),
    },

    # ---------------- 2023 (12 records) ----------------
    {
        "reference_number": "URB-TEST-2023-0001",
        "citizen_name": "[TEST] Sagar Bagul",
        "title": "[TEST] Unauthorized Construction of Third Floor",
        "description": "RCC roof slab poured for unauthorized third floor exceeding sanctioned height limit.",
        "status": "Closed",
        "latitude": 20.0055,
        "longitude": 73.7620,
        "location_name": "College Road, D Souza Colony",
        "created_at": datetime(2023, 1, 20, 10, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0002",
        "citizen_name": "[TEST] Neha Badgujar",
        "title": "[TEST] Diversion of Natural Monsoon Stream",
        "description": "Natural nullah course diverted with concrete pipes of insufficient diameter.",
        "status": "Closed",
        "latitude": 20.0245,
        "longitude": 73.7450,
        "location_name": "Gangapur Road, Navshya Ganapati",
        "created_at": datetime(2023, 2, 11, 12, 40, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0003",
        "citizen_name": "[TEST] Sandeep Ghuge",
        "title": "[TEST] Public Walkway Blocked by Generator Enclosure",
        "description": "Commercial diesel generator installed permanently on public footpath.",
        "status": "Closed",
        "latitude": 19.9635,
        "longitude": 73.7760,
        "location_name": "Indira Nagar, Jogging Track Area",
        "created_at": datetime(2023, 3, 16, 9, 50, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0004",
        "citizen_name": "[TEST] Urmila Pote",
        "title": "[TEST] Illegal Demolition Threatening Adjoining Structure",
        "description": "Demolition of shared party wall without structural shoring causing cracks in neighbor unit.",
        "status": "Closed",
        "latitude": 20.0100,
        "longitude": 73.7930,
        "location_name": "Panchavati, Ganeshwadi",
        "created_at": datetime(2023, 4, 29, 15, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0005",
        "citizen_name": "[TEST] Arvind Tambe",
        "title": "[TEST] Industrial Effluent Trench Near Residential Colony",
        "description": "Unauthorized open trench dug to bypass sewage treatment plant.",
        "status": "Closed",
        "latitude": 19.9430,
        "longitude": 73.7250,
        "location_name": "Ambad MIDC, Sector A",
        "created_at": datetime(2023, 5, 8, 14, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0006",
        "citizen_name": "[TEST] Shweta Kapse",
        "title": "[TEST] Commercial Godown in Residential Zone",
        "description": "Large steel truss storage warehouse built on plot zoned purely for residential use.",
        "status": "Action Taken",
        "latitude": 19.9690,
        "longitude": 73.7480,
        "location_name": "CIDCO Sector 2, Nashik",
        "created_at": datetime(2023, 6, 19, 11, 20, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0007",
        "citizen_name": "[TEST] Chetan Kasliwal",
        "title": "[TEST] Unsecured Deep Excavation Adjacent to Public School",
        "description": "12-meter excavation pit left unfenced and filling with rainwater near school boundary.",
        "status": "Action Taken",
        "latitude": 19.9865,
        "longitude": 73.7675,
        "location_name": "Govind Nagar, Sharanpur Link",
        "created_at": datetime(2023, 7, 24, 16, 45, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0008",
        "citizen_name": "[TEST] Jyoti Garje",
        "title": "[TEST] Road Obstruction by Unauthorized Security Cabin",
        "description": "Security gatehouse constructed 3 meters into the public right-of-way.",
        "status": "Action Taken",
        "latitude": 19.9475,
        "longitude": 73.7580,
        "location_name": "Pathardi Phata, Damodar Nagar",
        "created_at": datetime(2023, 8, 15, 10, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0009",
        "citizen_name": "[TEST] Kiran Gite",
        "title": "[TEST] Encroachment into Godavari Flood Plain",
        "description": "Terraced concrete garden and gazebo constructed within prohibited blue flood line.",
        "status": "Action Taken",
        "latitude": 20.0310,
        "longitude": 73.7260,
        "location_name": "Someshwar, Gangapur Dam Catchment",
        "created_at": datetime(2023, 9, 7, 13, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0010",
        "citizen_name": "[TEST] Hemant Raundal",
        "title": "[TEST] Illegal Hoarding Structure on Building Roof",
        "description": "40-foot advertising billboard structure mounted without structural stability certificate.",
        "status": "Under Review",
        "latitude": 19.9765,
        "longitude": 73.8030,
        "location_name": "Dwarka Circle, Pune Highway Junction",
        "created_at": datetime(2023, 10, 19, 15, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0011",
        "citizen_name": "[TEST] Manisha Ahire",
        "title": "[TEST] Setback Encroachment for Commercial Kitchen",
        "description": "Rear marginal space enclosed with corrugated iron sheets for commercial cooking.",
        "status": "Under Review",
        "latitude": 19.9530,
        "longitude": 73.8330,
        "location_name": "Nashik Road, Jail Road Area",
        "created_at": datetime(2023, 11, 23, 17, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2023-0012",
        "citizen_name": "[TEST] Bhushan Avhad",
        "title": "[TEST] Unauthorized Mobile Tower Battery Room",
        "description": "Rooftop common water tank area enclosed for heavy telecommunication battery bank.",
        "status": "New",
        "latitude": 19.9980,
        "longitude": 73.7310,
        "location_name": "Satpur MIDC, Ashok Nagar",
        "created_at": datetime(2023, 12, 12, 11, 50, 0, tzinfo=timezone.utc),
    },

    # ---------------- 2024 (12 records) ----------------
    {
        "reference_number": "URB-TEST-2024-0001",
        "citizen_name": "[TEST] Sunil Shelke",
        "title": "[TEST] Encroachment on Natural Waterway with Gabion Wall",
        "description": "Private developer constructing stone gabions inside seasonal stream bed.",
        "status": "Closed",
        "latitude": 20.0220,
        "longitude": 73.7420,
        "location_name": "Gangapur Road, Anandwalli",
        "created_at": datetime(2024, 1, 18, 14, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0002",
        "citizen_name": "[TEST] Madhuri Kakad",
        "title": "[TEST] Unauthorized Penthouse on Terrace Floor",
        "description": "Covered residential duplex constructed on designated common refuge terrace.",
        "status": "Closed",
        "latitude": 20.0090,
        "longitude": 73.7650,
        "location_name": "College Road, Krishi Nagar",
        "created_at": datetime(2024, 2, 24, 10, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0003",
        "citizen_name": "[TEST] Dilip Pagare",
        "title": "[TEST] Unsafe Demolition of Heritage Wada Wall",
        "description": "Old stone masonry wall being pulled down manually without perimeter protection.",
        "status": "Closed",
        "latitude": 20.0080,
        "longitude": 73.7890,
        "location_name": "Panchavati, Sardar Chowk",
        "created_at": datetime(2024, 3, 8, 11, 45, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0004",
        "citizen_name": "[TEST] Varsha Suryawanshi",
        "title": "[TEST] Road Obstruction by Commercial Car Washing Ramp",
        "description": "Permanent vehicle wash platform draining soapy sludge across municipal road.",
        "status": "Action Taken",
        "latitude": 19.9660,
        "longitude": 73.7770,
        "location_name": "Indira Nagar, Lekha Nagar",
        "created_at": datetime(2024, 4, 14, 15, 20, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0005",
        "citizen_name": "[TEST] Nilesh Shirore",
        "title": "[TEST] Hazardous Chemical Storage in Non-Conforming Zone",
        "description": "Storage shed storing solvent drums located 15 meters from residential boundary.",
        "status": "Action Taken",
        "latitude": 19.9940,
        "longitude": 73.7350,
        "location_name": "Satpur MIDC, Industrial Area",
        "created_at": datetime(2024, 5, 29, 9, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0006",
        "citizen_name": "[TEST] Archana Mandlik",
        "title": "[TEST] Natural Drainage Silt Dumping and Clogging",
        "description": "Excavated yellow soil dumped directly into municipal storm culvert.",
        "status": "Action Taken",
        "latitude": 19.9490,
        "longitude": 73.7620,
        "location_name": "Pathardi Phata, Guru Gobind Singh College Rd",
        "created_at": datetime(2024, 6, 11, 16, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0007",
        "citizen_name": "[TEST] Anonymous Citizen",
        "title": "[TEST] Citizen Verbal Report (Missing GPS Coordinates)",
        "description": "Caller reports severe ground cracking near unpermitted foundation excavation.",
        "status": "Action Taken",
        "latitude": None,
        "longitude": None,
        "location_name": "Deolali Camp, Nashik",
        "created_at": datetime(2024, 7, 5, 12, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0008",
        "citizen_name": "[TEST] Tushar Bhamare",
        "title": "[TEST] Encroachment on Municipal Amenity Space",
        "description": "Private sports turf constructed over civic reserved playground parcel.",
        "status": "Under Review",
        "latitude": 19.9730,
        "longitude": 73.7470,
        "location_name": "CIDCO Sector 5, Nashik",
        "created_at": datetime(2024, 8, 22, 13, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0009",
        "citizen_name": "[TEST] Poonam Datar",
        "title": "[TEST] Unauthorized Basement Restaurant Kitchen",
        "description": "Commercial kitchen operating in basement with inadequate ventilation and fire egress.",
        "status": "Under Review",
        "latitude": 19.9840,
        "longitude": 73.7655,
        "location_name": "Govind Nagar, Near City Center",
        "created_at": datetime(2024, 9, 18, 17, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0010",
        "citizen_name": "[TEST] Girish Kulkarni",
        "title": "[TEST] Structural Damage to Adjacent Property During Piling",
        "description": "Vibration from unapproved rotary piling causing cracked lintels in neighboring apartment.",
        "status": "Under Review",
        "latitude": 19.9550,
        "longitude": 73.8350,
        "location_name": "Nashik Road, Datta Mandir",
        "created_at": datetime(2024, 10, 4, 10, 50, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0011",
        "citizen_name": "[TEST] Jayshree Wani",
        "title": "[TEST] Illegal Boundary Wall in River Flood Plain",
        "description": "Reinforced concrete boundary wall encroaching onto Godavari river bed buffer.",
        "status": "New",
        "latitude": 20.0275,
        "longitude": 73.7320,
        "location_name": "Someshwar, River Vista",
        "created_at": datetime(2024, 11, 29, 11, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2024-0012",
        "citizen_name": "[TEST] Eknath Saner",
        "title": "[TEST] Setback Space Converted to Commercial Scrap Yard",
        "description": "Side marginal open space stacked with compressed scrap metal bales.",
        "status": "New",
        "latitude": 19.9410,
        "longitude": 73.7230,
        "location_name": "Ambad MIDC, Garware Point",
        "created_at": datetime(2024, 12, 15, 14, 40, 0, tzinfo=timezone.utc),
    },

    # ---------------- 2025 (12 records) ----------------
    {
        "reference_number": "URB-TEST-2025-0001",
        "citizen_name": "[TEST] Yogesh Khairnar",
        "title": "[TEST] Unauthorized Additional Commercial Floors",
        "description": "Structural steel framework being erected for 4th and 5th floors without revised sanction.",
        "status": "Closed",
        "latitude": 20.0075,
        "longitude": 73.7640,
        "location_name": "College Road, Near BYK College",
        "created_at": datetime(2025, 1, 9, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0002",
        "citizen_name": "[TEST] Dipali Thete",
        "title": "[TEST] Excavation Collapsing Road Shoulder",
        "description": "Deep trenching along road edge causing asphalt shoulder collapse.",
        "status": "Closed",
        "latitude": 19.9640,
        "longitude": 73.7750,
        "location_name": "Indira Nagar, Wadala Road",
        "created_at": datetime(2025, 2, 14, 15, 15, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0003",
        "citizen_name": "[TEST] Sachin Pingle",
        "title": "[TEST] Obstruction of DP Road by Cement Batching Plant",
        "description": "Mobile RMC batching plant parked permanently inside proposed municipal 24m DP road.",
        "status": "Action Taken",
        "latitude": 20.0210,
        "longitude": 73.7460,
        "location_name": "Gangapur Road, Pipeline Junction",
        "created_at": datetime(2025, 3, 22, 11, 30, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0004",
        "citizen_name": "[TEST] Sarika Jadhav",
        "title": "[TEST] Unauthorized Compound Wall Over Storm Drainage",
        "description": "Heavy brick masonry boundary wall built directly over major city drainage line.",
        "status": "Action Taken",
        "latitude": 19.9470,
        "longitude": 73.7600,
        "location_name": "Pathardi Phata, Express Highway",
        "created_at": datetime(2025, 4, 10, 16, 20, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0005",
        "citizen_name": "[TEST] Mangesh Kute",
        "title": "[TEST] Building Safety - Unpropped Cantilever Slab",
        "description": "Freshly cast 3-meter overhang showing deflection without adequate shuttering props.",
        "status": "Action Taken",
        "latitude": 20.0120,
        "longitude": 73.7920,
        "location_name": "Panchavati, Malegaon Stand",
        "created_at": datetime(2025, 5, 19, 13, 45, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0006",
        "citizen_name": "[TEST] Pratibha Sonaje",
        "title": "[TEST] Encroachment on Common Walkway by Eatery",
        "description": "Outdoor permanent seating and kitchen exhaust duct encroaching onto shared civic lane.",
        "status": "Under Review",
        "latitude": 19.9710,
        "longitude": 73.7495,
        "location_name": "CIDCO Sector 3, Trimurti Chowk",
        "created_at": datetime(2025, 6, 28, 12, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0007",
        "citizen_name": "[TEST] Dhananjay Borde",
        "title": "[TEST] Unapproved Hill Cutting for Villa Project",
        "description": "Excavator reshaping steep natural ridge without environmental slope NOC.",
        "status": "Under Review",
        "latitude": 20.0330,
        "longitude": 73.7240,
        "location_name": "Someshwar Hills, Gangapur Dam",
        "created_at": datetime(2025, 7, 17, 9, 40, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0008",
        "citizen_name": "[TEST] Pallavi Bhamre",
        "title": "[TEST] Construction Rubble Obstructing Fire Hydrant",
        "description": "Hardened concrete spill and broken tiles buried municipal emergency fire hydrant.",
        "status": "Under Review",
        "latitude": 19.9970,
        "longitude": 73.7320,
        "location_name": "Satpur MIDC, ITI Signal",
        "created_at": datetime(2025, 8, 12, 14, 50, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0009",
        "citizen_name": "[TEST] Kishor Jagtap",
        "title": "[TEST] Illegal Storage Shed in Front Margin",
        "description": "Front mandatory 6-meter road setback enclosed with tin sheet roof and rolling shutter.",
        "status": "Under Review",
        "latitude": 19.9520,
        "longitude": 73.8320,
        "location_name": "Nashik Road, Subhash Road",
        "created_at": datetime(2025, 9, 29, 17, 0, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0010",
        "citizen_name": "[TEST] Rupali Deore",
        "title": "[TEST] Unsanctioned Commercial Basement Excavation",
        "description": "Night excavation underway without retaining diaphragm wall or municipal engineer board.",
        "status": "New",
        "latitude": 19.9830,
        "longitude": 73.7670,
        "location_name": "Govind Nagar, Symbiosis Triangle",
        "created_at": datetime(2025, 10, 15, 22, 10, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0011",
        "citizen_name": "[TEST] Vikas Shirode",
        "title": "[TEST] Road Obstruction by Heavy Steel Beams",
        "description": "Structural I-beams unloaded across entire municipal footpath and half of roadway.",
        "status": "New",
        "latitude": 19.9750,
        "longitude": 73.8040,
        "location_name": "Dwarka Circle, Mumbai Naka Link",
        "created_at": datetime(2025, 11, 20, 10, 25, 0, tzinfo=timezone.utc),
    },
    {
        "reference_number": "URB-TEST-2025-0012",
        "citizen_name": "[TEST] Sandhya Gaikar",
        "title": "[TEST] Unauthorized Boundary Construction Near Natural Stream",
        "description": "Stone masonry wall constructed within 9-meter statutory buffer of natural stream.",
        "status": "SUBMITTED",
        "latitude": 19.9440,
        "longitude": 73.7240,
        "location_name": "Ambad MIDC, Carbon Naka",
        "created_at": datetime(2025, 12, 8, 15, 35, 0, tzinfo=timezone.utc),
    },
]

HISTORICAL_REFS = tuple(sorted([c["reference_number"] for c in HISTORICAL_COMPLAINTS]))

INSERT_SQL = text("""
    INSERT INTO complaints (
        reference_number, citizen_name, title, description,
        status, latitude, longitude, location_name,
        geometry, created_at, updated_at
    ) VALUES (
        :reference_number, :citizen_name, :title, :description,
        :status, :latitude, :longitude, :location_name,
        CASE 
            WHEN :latitude IS NOT NULL AND :longitude IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
            ELSE NULL 
        END,
        :created_at, :created_at
    )
    ON CONFLICT (reference_number) DO UPDATE SET
        citizen_name = EXCLUDED.citizen_name,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location_name = EXCLUDED.location_name,
        geometry = EXCLUDED.geometry,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;
""")

def validate_historical_dataset():
    if len(HISTORICAL_COMPLAINTS) != 60:
        raise ValueError(f"Expected exactly 60 records, got {len(HISTORICAL_COMPLAINTS)}")
    
    years = {}
    statuses = {}
    for item in HISTORICAL_COMPLAINTS:
        yr = item["created_at"].year
        years[yr] = years.get(yr, 0) + 1
        st = item["status"]
        statuses[st] = statuses.get(st, 0) + 1
        
        # Verify title has [TEST] prefix
        if not item["title"].startswith("[TEST]"):
            raise ValueError(f"Title missing [TEST] prefix: {item['title']}")
        # Verify reference number pattern
        if not item["reference_number"].startswith("URB-TEST-"):
            raise ValueError(f"Reference missing URB-TEST- prefix: {item['reference_number']}")
        # Verify coordinate logic
        if item["latitude"] is not None:
            if not (19.90 <= item["latitude"] <= 20.10):
                raise ValueError(f"Latitude out of Nashik range: {item['latitude']} in {item['reference_number']}")
            if not (73.70 <= item["longitude"] <= 73.90):
                raise ValueError(f"Longitude out of Nashik range: {item['longitude']} in {item['reference_number']}")

    for yr in [2021, 2022, 2023, 2024, 2025]:
        if years.get(yr, 0) != 12:
            raise ValueError(f"Year {yr} has {years.get(yr, 0)} records (expected 12)")
            
    print("Dataset validation passed:")
    print(f"  Records by Year   : {dict(sorted(years.items()))}")
    print(f"  Records by Status : {statuses}")

def run(dry_run: bool = False):
    print("=" * 70)
    print("URBANCORE SYNTHETIC HISTORICAL COMPLAINTS SEEDER")
    print(f"Mode: {'DRY RUN (no database changes)' if dry_run else 'LIVE SEED'}")
    print("=" * 70)

    validate_historical_dataset()

    db_url = engine.url
    print("\nDatabase Target:")
    print(f"  Database : {db_url.database}")
    print(f"  Host     : {db_url.host}:{db_url.port or 5432}")
    print(f"  Dialect  : {db_url.drivername}")

    with engine.connect() as conn:
        pre_total = conn.execute(text("SELECT COUNT(*) FROM complaints")).scalar()
        pre_existing_2026 = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number IN :refs"),
            {"refs": EXISTING_2026_REFS}
        ).scalar()
        pre_historical = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number IN :refs"),
            {"refs": HISTORICAL_REFS}
        ).scalar()
        other_records = pre_total - pre_existing_2026 - pre_historical

        # Check existing 2026 records statuses for baseline verification
        existing_rows = conn.execute(
            text("SELECT reference_number, status, created_at FROM complaints WHERE reference_number IN :refs ORDER BY reference_number"),
            {"refs": EXISTING_2026_REFS}
        ).fetchall()
        baseline_existing_state = {r.reference_number: (r.status, str(r.created_at)) for r in existing_rows}

    print("\nPre-seed Inspection:")
    print(f"  Total records in database           : {pre_total}")
    print(f"  Existing 2026 test records (1..10)  : {pre_existing_2026}")
    print(f"  Already-seeded historical records   : {pre_historical}")
    print(f"  Other records                       : {other_records}")

    if dry_run:
        print("\n[DRY RUN] Plan summary:")
        print(f"  Would insert/upsert {len(HISTORICAL_COMPLAINTS)} historical records across 2021-2025.")
        print(f"  Existing records will remain completely untouched.")
        print("  Dry run complete. Run without --dry-run to commit.")
        return

    # Execute insert/upsert within a single atomic transaction
    print(f"\nExecuting upsert for {len(HISTORICAL_COMPLAINTS)} records...")
    with engine.begin() as conn:
        for item in HISTORICAL_COMPLAINTS:
            conn.execute(INSERT_SQL, {
                "reference_number": item["reference_number"],
                "citizen_name": item["citizen_name"],
                "title": item["title"],
                "description": item["description"],
                "status": item["status"],
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "location_name": item["location_name"],
                "created_at": item["created_at"],
            })

    # Post-seed verification
    with engine.connect() as conn:
        post_total = conn.execute(text("SELECT COUNT(*) FROM complaints")).scalar()
        post_historical = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number IN :refs"),
            {"refs": HISTORICAL_REFS}
        ).scalar()
        post_2026 = conn.execute(
            text("SELECT COUNT(*) FROM complaints WHERE reference_number IN :refs"),
            {"refs": EXISTING_2026_REFS}
        ).scalar()

        # Verify existing 2026 records state remained completely untouched
        post_existing_rows = conn.execute(
            text("SELECT reference_number, status, created_at FROM complaints WHERE reference_number IN :refs ORDER BY reference_number"),
            {"refs": EXISTING_2026_REFS}
        ).fetchall()
        for r in post_existing_rows:
            orig_status, orig_created = baseline_existing_state.get(r.reference_number, (None, None))
            assert r.status == orig_status, f"Existing record {r.reference_number} status changed!"
            assert str(r.created_at) == orig_created, f"Existing record {r.reference_number} created_at changed!"

        assert post_2026 == pre_existing_2026, "Existing 2026 count changed!"
        assert post_historical == 60, f"Expected 60 historical records, found {post_historical}"

        # Check geometry validity
        geom_stats = conn.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as has_coords,
                COUNT(CASE WHEN latitude IS NULL AND longitude IS NULL THEN 1 END) as missing_coords,
                COUNT(CASE WHEN geometry IS NOT NULL AND ST_IsValid(geometry) AND ST_SRID(geometry) = 4326 THEN 1 END) as valid_postgis_geom,
                COUNT(CASE WHEN geometry IS NULL THEN 1 END) as null_geom
            FROM complaints
            WHERE reference_number IN :refs
        """), {"refs": HISTORICAL_REFS}).fetchone()

        assert geom_stats.has_coords == 58, f"Expected 58 records with coords, got {geom_stats.has_coords}"
        assert geom_stats.missing_coords == 2, f"Expected 2 records with missing coords, got {geom_stats.missing_coords}"
        assert geom_stats.valid_postgis_geom == 58, f"Expected 58 valid PostGIS geoms, got {geom_stats.valid_postgis_geom}"
        assert geom_stats.null_geom == 2, f"Expected 2 null geoms, got {geom_stats.null_geom}"

        print("\n" + "=" * 70)
        print("POST-SEED INTEGRITY REPORT")
        print("=" * 70)
        print(f"Total records before seeding : {pre_total}")
        print(f"Total records after seeding  : {post_total}")
        print(f"New historical test records  : {post_historical}")
        print(f"Existing 2026 records        : {post_2026} (100% verified untouched)")
        print(f"Valid PostGIS SRID 4326 Geoms: {geom_stats.valid_postgis_geom}")
        print(f"Missing Coordinate Records   : {geom_stats.null_geom} (intentional synthetic edge-cases)")

        # Query counts grouped by submission year and status
        breakdown = conn.execute(text("""
            SELECT 
                EXTRACT(YEAR FROM created_at)::INTEGER as yr,
                status,
                COUNT(*) as cnt
            FROM complaints
            GROUP BY yr, status
            ORDER BY yr ASC, status ASC
        """)).fetchall()

        print("\nAll Complaints in Database by Year & Status:")
        print(f"{'Year':<8} {'Status':<16} {'Count':<6}")
        print("-" * 32)
        total_sum = 0
        for b in breakdown:
            print(f"{b[0]:<8} {b[1]:<16} {b[2]:<6}")
            total_sum += b[2]
        print("-" * 32)
        print(f"{'Total':<25} {total_sum:<6}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed historical synthetic complaints")
    parser.add_argument("--dry-run", action="store_true", help="Preflight check without modifying the database")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
