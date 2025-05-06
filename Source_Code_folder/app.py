#pip install --ignore-installed blinker
#pip install blinker Flask scikit-learn
#pip install geopy
#pip install pandas
#pip install flask_cors

from flask import Flask, request, jsonify, send_file
from geopy.geocoders import Nominatim
import pickle
import pandas as pd
import io
from geopy.distance import geodesic
import numpy as np
from flask_cors import CORS
from elasticsearch import Elasticsearch, NotFoundError
from dotenv import load_dotenv
import os, openai

load_dotenv()                 
openai.api_key = os.getenv("OPENAI_API_KEY")
print(openai.api_key)

# Load the model
with open('./trip_total_predictor.pkl', 'rb') as f:
    loaded_model = pickle.load(f)

app = Flask(__name__)
CORS(app)

INDEX = "rides"
es = Elasticsearch("http://localhost:9200")

try:
    es.indices.get(index=INDEX)
    print(f"Index '{INDEX}' already exists.")
except NotFoundError:
    print(f"Index '{INDEX}' not found. Creating mapping…")
    es.indices.create(
        index=INDEX,
        body={
            "mappings": {
                "properties": {
                    "user":        {"type": "keyword"},
                    "from":        {"type": "text"},
                    "to":          {"type": "text"},
                    "from_lat":    {"type": "float"},
                    "from_lng":    {"type": "float"},
                    "to_lat":      {"type": "float"},
                    "to_lng":      {"type": "float"},
                    "fare":        {"type": "float"},
                    "eta_minutes": {"type": "integer"},
                    "timestamp":   {"type": "date"},
                    "status":      { "type": "keyword" },           
                    "driver":      { "type": "keyword" },         
                    "rejected_by": { "type": "keyword" } 
                }
            }
        }
    )


def get_week_hour(timestamp):
  dt = pd.to_datetime(timestamp)
  # Extract the day of the week (0=Monday, 6=Sunday)
  dayofweek = dt.dayofweek
  # Extract the hour (0-23)
  hour = dt.hour
  print(f"Day of Week: {dayofweek} (0=Monday, 6=Sunday)")
  print(f"Hour: {hour}")
  return dayofweek, hour

#funcation to calculate trip distance in miles

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in miles between two points 
    on the Earth (specified in decimal degrees).
    """
    # Earth radius in miles
    R = 3958.8  

    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlat = lat2 - lat1 
    dlon = lon2 - lon1 
    a = np.sin(dlat/2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2.0)**2
    c = 2 * np.arcsin(np.sqrt(a))

    miles = R * c
    return miles
    
def calculate_trip_miles(pickup_lat, pickup_long, dropoff_lat, dropoff_long):
    pickup_coords = (pickup_lat, pickup_long)
    dropoff_coords = (dropoff_lat, dropoff_long)
    distance_km = geodesic(pickup_coords, dropoff_coords).km
    distance_miles = distance_km * 0.621371  # Convert kilometers to miles
    return distance_miles


#http://127.0.0.1:5000/predict
# Route to predict fare and total seconds
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the JSON request with latitude and longitude
        data = request.get_json()

        pickup_lat = data['pickup_lat']
        pickup_long = data['pickup_long']
        dropoff_lat = data['dropoff_lat']
        dropoff_long = data['dropoff_long']
        trip_timestamp = data['trip_timestamp']
        
        # Calculate trip miles from latitudes and longitudes
        #trip_miles=haversine_distance(pickup_lat,pickup_long,dropoff_lat,dropoff_long) *1.3
        trip_miles = calculate_trip_miles(pickup_lat, pickup_long, dropoff_lat, dropoff_long)
        
        # Prepare the input data for the model
        input_data = pd.DataFrame([{
            'pickup_centroid_latitude': pickup_lat,
            'pickup_centroid_longitude': pickup_long,
            'dropoff_centroid_latitude': dropoff_lat,
            'dropoff_centroid_longitude': dropoff_long,
            'trip_miles': trip_miles
        }])
        input_data["dayofweek"],input_data["hour"] = get_week_hour(trip_timestamp)
        input_data["dayofweek"] = input_data["dayofweek"].apply(lambda x: 0 if x in [5, 6] else 1)
        input_data["hour"] = input_data["hour"].apply(lambda x: 0 if x in [23, 0, 1, 2, 3, 4, 5, 6, 7] else 1)
        input_data = input_data[['pickup_centroid_latitude', 'pickup_centroid_longitude', 'dropoff_centroid_latitude',
                                 'dropoff_centroid_longitude','dayofweek','hour','trip_miles']]

        # Predict the fare and total seconds using the trained model
        predictions = loaded_model.predict(input_data)
        fare_predicted = round(predictions[0][0],2)
        trip_seconds_predicted = int(round(predictions[0][1]/60,0))

        # Return the prediction results
        return jsonify({'fare': fare_predicted, 'eta_minutes': trip_seconds_predicted})

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route("/rides", methods=["POST"])
def add_ride():
    data = request.json
    res = es.index(
        index=INDEX,
        document=data
    )
    print(res)
    return jsonify({"result": res["result"], "id": res["_id"]}), 201

@app.route("/rides", methods=["GET"])
def get_rides():
    user = request.args.get("user")
    if not user:
        return jsonify([])

    query = {
        "query": {
            "term": { "user": user }
        },
        "sort": [{ "timestamp": { "order": "desc" } }]
    }
    # search with keyword args
    resp = es.search(
        index=INDEX,
        body=query,
        size=1000
    )
    rides = [hit["_source"] for hit in resp["hits"]["hits"]]
    return jsonify(rides)




@app.route("/rides/all", methods=["GET"])
def get_all_rides():
    resp = es.search(index=INDEX, body={"query": {"match_all": {}}, "size": 1000})
    return jsonify([
        { **hit["_source"], "_id": hit["_id"] } for hit in resp["hits"]["hits"]
    ])

@app.route("/rides/accepted", methods=["GET"])
def get_accepted_rides_for_driver():
    driver_email = request.args.get("driver")
    if not driver_email:
        return jsonify([])

    query = {
        "query": {
            "bool": {
                "must": [
                    { "match": { "driver": driver_email } },
                    { "match": { "status": "accepted" } }
                ]
            }
        }
    }

    resp = es.search(index=INDEX, body=query)
    return jsonify([hit["_source"] | {"_id": hit["_id"]} for hit in resp["hits"]["hits"]])


@app.route("/rides/update/<ride_id>", methods=["POST"])
def update_ride(ride_id):
    data = request.json
    status = data.get("status")
    driver = data.get("driver")

    if status == "rejected":
        # Append driver to rejected_by list using painless script
        es.update(index=INDEX, id=ride_id, body={
            "script": {
                "source": """
                    if (ctx._source.rejected_by == null) {
                        ctx._source.rejected_by = [];
                    }
                    if (!ctx._source.rejected_by.contains(params.driver)) {
                        ctx._source.rejected_by.add(params.driver);
                    }
                """,
                "lang": "painless",
                "params": {
                    "driver": driver
                }
            }
        })
    elif status == "accepted":
        es.update(index=INDEX, id=ride_id, body={
            "doc": {
                "status": "accepted",
                "driver": driver
            }
        })
    else:
        return jsonify({"error": "Invalid status"}), 400

    return jsonify({"message": "Ride updated"}), 200


@app.route("/rides/<ride_id>", methods=["PATCH"])
def update_ride_status(ride_id):
    data = request.json
    status = data.get("status")
    driver = data.get("driver")

    if status not in ["accepted", "rejected"]:
        return jsonify({"error": "Invalid or missing status"}), 400

    if not driver:
        return jsonify({"error": "Missing driver"}), 400

    es.update(
        index=INDEX,
        id=ride_id,
        body={"doc": {"status": status, "driver": driver }}
    )
    return jsonify({"message": "Ride updated successfully"}), 200

# with open("all_charts.pkl", "rb") as f:
#     figs = pickle.load(f)

# @app.route("/chart/<name>")
# def chart(name):
#     fig = figs.get(name)
#     buf = io.BytesIO()
#     fig.savefig(buf, format="png", bbox_inches="tight")
#     buf.seek(0)
#     print(buf)
#     return send_file(buf, mimetype="image/png")

@app.route('/chat', methods=['POST'])
def chat():
    """
    Proxy endpoint for chat completions.
    Expects JSON: { "messages": [ { "role": "system"|"user"|"assistant", "content": "..." }, … ] }
    Returns JSON: { "role": "assistant", "content": "…" }
    """
    data = request.get_json()
    print("------------",data)
    messages = data.get("messages", [])
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",     # or "gpt-4o" if you have access
            messages=messages
        )
        msg = resp.choices[0].message
        print("**********",msg)
        return jsonify({"role": msg.role, "content": msg.content}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/geocode', methods=['GET'])
def geocode():
    address = request.args.get('address')
    if not address:
        return jsonify({'error':'Missing address'}), 400

    geolocator = Nominatim(user_agent="rideshare_app")
    loc = geolocator.geocode(address)
    if not loc:
        return jsonify({'error':'Could not geocode'}), 404

    return jsonify({'lat': loc.latitude, 'lng': loc.longitude})

with open("chart_data.pkl", "rb") as f:
    chart_data = pickle.load(f)

# ── Endpoint: list all available chart keys ────────────────────────────
@app.route("/api/charts", methods=["GET"])
def list_charts():
    return jsonify(list(chart_data.keys()))

# ── Endpoint: fetch data for a specific chart ──────────────────────────
@app.route("/api/chart/<chart_name>", methods=["GET"])
def get_chart(chart_name):
    data = chart_data.get(chart_name)
    if data is None:
        abort(404, description=f"Chart '{chart_name}' not found")
    return jsonify(data)



if __name__ == '__main__':
    app.run(debug=True)