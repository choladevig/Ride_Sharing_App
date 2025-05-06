import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLoggedInUser,
  getUser,
  saveUser
} from '../utils/storage';
import Header from './Header';
import './LandingPage.css';

export default function LandingPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [fromCoords, setFromCoords] = useState(null);
  const [showFromOptions, setShowFromOptions] = useState(false);
  const [toCoords, setToCoords] = useState(null);
  const [rides, setRides] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const fromMarker = useRef(null);
  const toMarker = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const email = getLoggedInUser();
    if (!email) return navigate('/login');

    setRides(getUser(email)?.rides || []);

    if (window.google && window.google.maps) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 41.8781, lng: -87.6298 },
        zoom: 12,
        disableDefaultUI: true
      });
      mapInstance.current = map;

      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true
      });

      const Autocomplete = window.google.maps.places.Autocomplete;
      const LatLngBounds = window.google.maps.LatLngBounds;
      const Marker = window.google.maps.Marker;

      const update = () => {
        const bounds = new LatLngBounds();
        let count = 0;
        if (fromMarker.current) { bounds.extend(fromMarker.current.getPosition()); count++; }
        if (toMarker.current) { bounds.extend(toMarker.current.getPosition()); count++; }

        if (count === 1) {
          map.panTo((fromMarker.current || toMarker.current).getPosition());
        } else if (count === 2) {
          map.fitBounds(bounds, 50);
          directionsServiceRef.current.route({
            origin: fromMarker.current.getPosition(),
            destination: toMarker.current.getPosition(),
            travelMode: window.google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);
            }
          });
        }
      };

      const wire = (inputRef, setter, coordSetter, markerRef) => {
        const ac = new Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry']
        });

        ac.bindTo('bounds', map);

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place.geometry) return;

          setter(place.formatted_address);
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          coordSetter({ lat, lng });

          markerRef.current?.setMap(null);

          markerRef.current = new Marker({
            map,
            position: place.geometry.location,
            draggable: true
          });

          const geocoder = new window.google.maps.Geocoder();
          markerRef.current.addListener('dragend', () => {
            const newPos = markerRef.current.getPosition();
            const newLat = newPos.lat();
            const newLng = newPos.lng();
            coordSetter({ lat: newLat, lng: newLng });

            geocoder.geocode({ location: newPos }, (results, status) => {
              if (status === 'OK' && results.length > 0) {
                setter(results[0].formatted_address);
              }
              update();
            });
          });

          update();
        });
      };


      wire(fromInputRef, setFrom, setFromCoords, fromMarker);
      wire(toInputRef, setTo, setToCoords, toMarker);
    }
    loadRides();
  }, [navigate]);


  async function loadRides() {
    const user = getLoggedInUser();
    const res = await fetch(`http://localhost:5000/rides?user=${encodeURIComponent(user)}`);
    const data = await res.json();
    setRides(data);
  }

  const preserveInputAfterBooking = (from, to) => {
    setTimeout(() => {
      if (from) setFrom(from);
      if (to) setTo(to);
    }, 200);
  };

  const handlePredict = async () => {
    if (!fromCoords || !toCoords) {
      alert("Select valid From and To locations.");
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_lat: fromCoords.lat,
          pickup_long: fromCoords.lng,
          dropoff_lat: toCoords.lat,
          dropoff_long: toCoords.lng,
          trip_timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error(`Prediction failed with status ${res.status}`);
      const json = await res.json();
      setPrediction(json);
    } catch (err) {
      console.error('Prediction error:', err);
      alert('Could not get fare and ETA prediction.');
    }
  };


  const handleRideClick = (ride) => {
    const fromLatLng = new window.google.maps.LatLng(ride.from_lat, ride.from_lng);
    const toLatLng = new window.google.maps.LatLng(ride.to_lat, ride.to_lng);

    fromMarker.current?.setMap(null);
    toMarker.current?.setMap(null);

    fromMarker.current = new window.google.maps.Marker({
      map: mapInstance.current,
      position: fromLatLng,
      draggable: true
    });
    toMarker.current = new window.google.maps.Marker({
      map: mapInstance.current,
      position: toLatLng,
      draggable: true
    });

    mapInstance.current.fitBounds(new window.google.maps.LatLngBounds().extend(fromLatLng).extend(toLatLng));

    directionsRendererRef.current.setMap(null);
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstance.current,
      suppressMarkers: true
    });

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route({
      origin: fromLatLng,
      destination: toLatLng,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(result);
      }
    });
  };



  const handleBookRide = async () => {
    if (!from || !to) {
      return alert('Select both FROM and TO');
    }

    let fare, eta_minutes;

    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_lat: fromCoords.lat,
          pickup_long: fromCoords.lng,
          dropoff_lat: toCoords.lat,
          dropoff_long: toCoords.lng,
          trip_timestamp: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      console.log(json);
      fare = json.fare;
      eta_minutes = json.eta_minutes;
      setPrediction(json);
    } catch (err) {
      console.error('Prediction error', err);
      alert('Could not get prediction');
      return;
    }

    const ride = {
      user: getLoggedInUser(),
      from,
      to,
      from_lat: fromCoords.lat,
      from_lng: fromCoords.lng,
      to_lat: toCoords.lat,
      to_lng: toCoords.lng,
      fare,
      eta_minutes,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      const esRes = await fetch('http://localhost:5000/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ride)
      });
      if (!esRes.ok) throw new Error(`ES save failed ${esRes.status}`);
    } catch (err) {
      console.error('ES save error', err);
      alert('Could not save ride');
      return;
    }

    await loadRides();

    setFrom(''); setTo('');
    setFromCoords(null); setToCoords(null);
  };
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    setChatLoading(true);
    setChatResponse('');
    setPrediction(null);

    try {
      const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful rideshare assistant.' },
            {
              role: 'user', content:
                chatInput +
                " Provide me the latitude and longitude of my From and To location. " +
                "If From location is not provided take my current location as \"2901 S King Dr, Chicago, IL 60616\". " +
                "Respond with only a JSON-style array of four numbers in this exact order: [from_lat, from_lng, to_lat, to_lng]. Do not include any other text."
            }
          ],
          max_tokens: 50
        })
      });
      const chatJson = await chatRes.json();
      const coordsText = chatJson.choices[0].message.content.trim();
      setChatResponse(coordsText);

      let coords;
      try {
        coords = JSON.parse(coordsText);
        if (!Array.isArray(coords) || coords.length !== 4) {
          throw new Error('Invalid coordinate array');
        }
      } catch (err) {
        alert('ChatGPT did not return a valid coordinate array');
        return;
      }

      const predictRes = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_lat: coords[0],
          pickup_long: coords[1],
          dropoff_lat: coords[2],
          dropoff_long: coords[3],
          trip_timestamp: new Date().toISOString()
        })
      });
      if (!predictRes.ok) throw new Error(`Predict error ${predictRes.status}`);
      const predictJson = await predictRes.json();
      setPrediction(predictJson);

    } catch (err) {
      console.error(err);
      alert('Something went wrong fetching data');
    } finally {
      setChatLoading(false);
    }
  };



  return (
    <div className="landing-container">
      <Header />

      <div className="content-container">
        <div className="card search-section">
          <div style={{ position: 'relative' }}>
            <input
              ref={fromInputRef}
              placeholder="From..."
              value={from}
              onChange={e => setFrom(e.target.value)}
              onFocus={() => setShowFromOptions(true)}
              onBlur={() => setTimeout(() => setShowFromOptions(false), 150)}
            />
          </div>
          <input ref={toInputRef} placeholder="To..." value={to} onChange={e => setTo(e.target.value)} />
          <button
            onClick={handlePredict}
            disabled={!fromCoords || !toCoords}
            style={{
              backgroundColor: (!fromCoords || !toCoords) ? 'gray' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '5px',
              cursor: (!fromCoords || !toCoords) ? 'not-allowed' : 'pointer',
              marginBottom: '0.5rem'
            }}
          >
            Predict Fare & ETA
          </button>

          <button
            onClick={handleBookRide}
            disabled={!prediction}
            style={{
              backgroundColor: prediction ? '#007bff' : 'gray',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '5px',
              cursor: prediction ? 'pointer' : 'not-allowed'
            }}
          >
            Book Ride
          </button>

        </div>

        <div className="card map-container">
          <div id="map" ref={mapRef}></div>
        </div>

        {prediction && (
          <div className="prediction-cards">
            <div className="prediction-card fare-card">
              <h4>Estimated Fare</h4>
              <p>${prediction.fare.toFixed(2)}</p>
            </div>
            <div className="prediction-card eta-card">
              <h4>ETA</h4>
              <p>{prediction.eta_minutes} min</p>
            </div>
          </div>
        )}


        <div className="card history-card">
          <h3>Your Rides</h3>
          <ul>
            {rides.length ? rides.map((ride, i) => (
              <li
                key={i}
                onClick={() => handleRideClick(ride)}
                style={{
                  cursor: 'pointer',
                  marginBottom: '10px',
                  padding: '8px',
                  borderBottom: '1px solid #ddd'
                }}
              >
                <strong>{ride.from}</strong> → <strong>{ride.to}</strong>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  Requested at: {new Date(ride.timestamp).toLocaleString()}
                </div>
              </li>
            )) : <li>No rides yet</li>}
          </ul>

        </div>
      </div>
    </div>

  );
}