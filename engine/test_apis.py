import requests
import json

def test_swisstopo_height():
    print("\n--- Testing Swisstopo Height API ---")
    # Coordinates for a point in the Swiss Alps (LV95 format)
    url = "https://api3.geo.admin.ch/rest/services/height?easting=2600000&northing=1200000"
    
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        print(f"✅ Elevation at coordinate: {data.get('height')} meters")
    else:
        print(f"❌ Failed: {response.status_code}")

def test_swisstopo_profile():
    print("\n--- Testing Swisstopo Elevation Profile API ---")
    # A short line segment to calculate the slope
    geom = '{"type":"LineString","coordinates":[[2600000,1200000],[2600100,1200100]]}'
    url = f"https://api3.geo.admin.ch/rest/services/profile.json?geom={geom}"
    
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        # Just printing the first 3 points so it doesn't flood your terminal
        print(json.dumps(data[:3], indent=2))
        print(f"✅ Profile fetched. Total points along the line: {len(data)}")
    else:
        print(f"❌ Failed: {response.status_code}")

def test_meteoswiss_weather():
    print("\n--- Testing MeteoSwiss (ICON-CH1) API ---")
    # Coordinates roughly matching the Gotthard Pass
    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=46.559"
        "&longitude=8.551"
        "&current=temperature_2m,precipitation,snowfall,wind_speed_10m"
        "&models=meteoswiss_icon_ch1"
    )
    
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data["current"], indent=2))
        print(f"✅ Temperature: {data['current']['temperature_2m']}°C")
        print(f"✅ Precipitation: {data['current']['precipitation']} mm")
    else:
        print(f"❌ Failed: {response.status_code}")

if __name__ == "__main__":
    test_swisstopo_height()
    test_swisstopo_profile()
    test_meteoswiss_weather()