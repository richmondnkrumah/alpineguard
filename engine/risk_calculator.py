import requests
import json
import math
from pyproj import Transformer
import time

CONVEX_INGEST_URL = "https://aware-gerbil-519.convex.site/api/ingest"

# monitored zones
ZONES = [
    {
        "zoneId": "CH-VS-MATTERHORN-01",
        "name": "Matterhorn Hörnli Ridge",
        "canton": "VS",
        "lat": 45.9763,
        "lng": 7.6586
    },
    {
        "zoneId": "CH-UR-GOTTHARD-01",
        "name": "Gotthard Pass North Face",
        "canton": "UR",
        "lat": 46.5593,
        "lng": 8.5510
    }
]

transformer_to_lv95 = Transformer.from_crs("EPSG:4326", "EPSG:2056", always_xy=True)

def get_swiss_elevation_and_slope(lat, lng):
    """Fetches Swisstopo profile to calculate slope and elevation."""
    
    # Convert Lat/Lng to Swiss LV95 Easting/Northing
    easting, northing = transformer_to_lv95.transform(lng, lat)
    
    # using small 100m line segment to calculate the slope
    geom = {
        "type": "LineString",
        "coordinates": [[easting, northing], [easting, northing - 100]]
    }
    url = f"https://api3.geo.admin.ch/rest/services/profile.json?geom={json.dumps(geom)}"
    
    response = requests.get(url)
    if response.status_code != 200:
        return 0, 0
        
    data = response.json()
    if len(data) < 2:
        return 0, 0
        
    # 3. Calculate Slope Math (Rise over Run)
    start_point = data[0]
    end_point = data[-1]
    
    elevation = start_point["alts"]["COMB"]
    elevation_diff = abs(start_point["alts"]["COMB"] - end_point["alts"]["COMB"])
    distance = end_point["dist"]
    
    # Calculate angle in degrees using arctangent
    slope_degrees = math.degrees(math.atan(elevation_diff / distance)) if distance > 0 else 0
    
    return elevation, round(slope_degrees, 2)

def get_weather_data(lat, lng):
    """Fetches MeteoSwiss ICON-CH1 weather data."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        "&current=temperature_2m,precipitation,snowfall,wind_speed_10m"
        "&models=meteoswiss_icon_ch1"
    )
    response = requests.get(url)
    if response.status_code != 200:
        return None
    return response.json().get("current")

def evaluate_risk(slope, weather):
    """Business Logic: Determines risk score and hazard type."""
    risk_score = 0
    hazard = "none"
    status = "stable"
    
    snow = weather.get("snowfall", 0)
    rain = weather.get("precipitation", 0)
    temp = weather.get("temperature_2m", 0)
    
    # Avalanche Logic: Steep slope (30-45 deg) + heavy snow + warming temp
    if 30 <= slope <= 50 and snow > 5.0:
        risk_score += 60
        hazard = "avalanche"
    
    # Landslide Logic: Steep slope + heavy rain
    if slope > 35 and rain > 10.0:
        risk_score += 70
        hazard = "landslide"
        
    if risk_score > 75:
        status = "critical"
    elif risk_score > 40:
        status = "elevated"
        
    return min(risk_score, 100), hazard, status

def run_pipeline():
    print("🏔️ Starting AlpineGuard 3D Risk Pipeline...")
    
    for zone in ZONES:
        print(f"\nAnalyzing Zone: {zone['name']}...")
        
        # 1. Fetch Topography
        elevation, slope = get_swiss_elevation_and_slope(zone["lat"], zone["lng"])
        print(f"   -> Elevation: {elevation}m, Slope: {slope}°")
        
        # 2. Fetch Weather
        weather = get_weather_data(zone["lat"], zone["lng"])
        if not weather:
            print("   -> Failed to fetch weather.")
            continue
            
        print(f"   -> Weather: Temp {weather['temperature_2m']}°C, Snow {weather['snowfall']}cm, Rain {weather['precipitation']}mm")
        
        # 3. Calculate Risk
        risk_score, hazard, status = evaluate_risk(slope, weather)
        print(f"   -> Result: Status [{status.upper()}], Hazard [{hazard}], Score [{risk_score}/100]")
        
        # 4. Construct Payload
        payload = {
            "zone": {
                "zoneId": zone["zoneId"],
                "name": zone["name"],
                "canton": zone["canton"],
                "coordinates": {
                    "lat": zone["lat"],
                    "lng": zone["lng"],
                    "elevationMeters": elevation,
                    "slopeDegrees": slope,
                },
                "currentRiskScore": risk_score,
                "hazardType": hazard,
                "status": status
            },
            "alert": None
        }
        
        # 5. Attach Alert if Critical
        if status == "critical" or status == "elevated":
            payload["alert"] = {
                "zoneId": zone["zoneId"],
                "zoneName": zone["name"],
                "severity": "critical" if status == "critical" else "warning",
                "hazardType": hazard,
                "message": f"{hazard.capitalize()} warning triggered due to steep terrain and active weather.",
                "triggerFactors": {
                    "precipitationMm": weather["precipitation"],
                    "snowfallCm": weather["snowfall"],
                    "slopeDegrees": slope,
                    "temperatureC": weather["temperature_2m"]
                }
            }
            
        # 6. Push to Convex
        try:
            res = requests.post(CONVEX_INGEST_URL, json=payload)
            if res.status_code == 200:
                print("   ✅ Data successfully pushed to Convex.")
            else:
                print(f"   ❌ Convex push failed: {res.text}")
        except Exception as e:
            print(f"   ❌ Network error: {e}")

if __name__ == "__main__":
    # You will need to install pyproj: `pip install pyproj`
    while True:
        run_pipeline()
        print("\n⏳ Waiting 60 seconds for next cycle...")
        time.sleep(60)