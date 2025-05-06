import React, { useEffect, useState } from 'react';
import { getLoggedInUser } from '../utils/storage';
import './DriverDashboard.css';
import Header from './Header';



export default function DriverDashboard() {
  const [rides, setRides] = useState([]);
  const email = getLoggedInUser();
  const [pendingRides, setPendingRides] = useState([]);
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, err => {
        console.error("Geolocation error", err);
        alert("Location access required for driver functionality");
      });
    }
  }, []);

  useEffect(() => {
    if (location) {
      loadNearbyRides();
    }
  }, [location]);

  const loadNearbyRides = async () => {
    try {
      const res = await fetch('http://localhost:5000/rides/all');
      const allRides = await res.json();
      console.log("All rides from backend:", allRides);
allRides.forEach(ride => {
  console.log(`Ride ${ride.from} (${ride.from_lat}, ${ride.from_lng})`);
  if (location) {
    const d = haversine(location.lat, location.lng, ride.from_lat, ride.from_lng);
    console.log(`Distance from driver: ${d.toFixed(2)} km`);
  }
});


const filtered = allRides.filter(ride => {
  const rejected = ride.rejected_by || [];
  if (ride.status && ride.status !== 'pending') return false;
  if (rejected.includes(email)) return false; 
  const d = haversine(location.lat, location.lng, ride.from_lat, ride.from_lng);
  return d <= 100; 
});


      setRides(filtered.map(r => ({
        ...r,
        _id: r._id || r.id 
      })));
      
      setPendingRides(filtered);
    } catch (err) {
      console.error("Failed to load rides", err);
    }
  };

  const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const handleStatusChange = async (rideId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/rides/update/${rideId}`, {
        method: 'POST',      
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, driver: email })
      });
      if (!res.ok) throw new Error();
  
      if (newStatus === 'accepted') {
        const updatedRide = pendingRides.find(r => r._id === rideId);
        setAcceptedRides([...acceptedRides, { ...updatedRide, status: 'accepted' }]);
      }
  
      setPendingRides(prev => prev.filter(r => r._id !== rideId));
    } catch (err) {
      alert('Failed to update ride status');
      console.error(err);
    }
  };
  

  return (
    <div className="driver-dashboard">
        <Header />
      <h2>Nearby Ride Requests</h2>
      {pendingRides.length ? pendingRides.map(ride => (
  <div key={ride._id} className="ride-card">
    <strong>{ride.from} → {ride.to}</strong>
    <p>Fare: ${ride.fare?.toFixed(2)} | ETA: {ride.eta_minutes} min</p>
    <p>Requested at: {new Date(ride.timestamp).toLocaleString()}</p>
    <p>Status: {ride.status || 'pending'}</p>
    {ride.status === 'pending' && (
      <>
        <button className="accept" onClick={() => handleStatusChange(ride._id, "accepted")}>Accept</button>
        <button className="reject" onClick={() => handleStatusChange(ride._id, "rejected")}>Reject</button>
      </>
    )}
  </div>
)) : <p>No rides near you</p>}

    </div>
  );
}
