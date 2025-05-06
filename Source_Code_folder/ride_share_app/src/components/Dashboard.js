import React, { useEffect, useState, useRef } from 'react';
import { getLoggedInUser, getUser } from '../utils/storage';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Chatbot from './Chatbot';           

export default function Dashboard() {
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [userRides, setUserRides] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideDuration, setRideDuration] = useState('');
  const [chatOpen, setChatOpen]           = useState(false);

  const email = getLoggedInUser();
  const role = getUser(email)?.role;
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const directionsRendererRef = useRef(null);
  const rideCardStyle = {
    cursor: 'pointer',
    marginBottom: '1rem',
    padding: '1rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
  };
const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.3)',
  zIndex: 999
};

const modalStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '1rem',
  width: '90%',
  height: '80%',
  position: 'relative'
};

  useEffect(() => {
    if (!email) return navigate('/login');

    const fetchRides = async () => {
      try {
        const res = await fetch(`http://localhost:5000/rides?user=${encodeURIComponent(email)}`);
        const data = await res.json();
        setUserRides(data);
      } catch (err) {
        console.error('Failed to fetch ride history:', err);
      }
    };

    const fetchAcceptedRides = async () => {
      try {
        const res = await fetch(`http://localhost:5000/rides/accepted?driver=${encodeURIComponent(email)}`);
        const data = await res.json();
        setAcceptedRides(data);
      } catch (err) {
        console.error('Failed to fetch accepted rides:', err);
      }
    };

    if (role === 'driver') {
      fetchAcceptedRides();
    } else {
      fetchRides();
    }
  }, [email, role, navigate]);

  const handleStartRide = (ride) => {
    setSelectedRide(ride);
    setRideDuration('');

    setTimeout(() => {
      if (!window.google || !ride.from_lat || !ride.to_lat) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: ride.from_lat, lng: ride.from_lng },
        zoom: 13
      });

      const directionsService = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({ map });

      directionsService.route({
        origin: { lat: ride.from_lat, lng: ride.from_lng },
        destination: { lat: ride.to_lat, lng: ride.to_lng },
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          setRideDuration(leg.duration.text);
        } else {
          alert('Failed to draw route');
        }
      });

      mapInstance.current = map;
    }, 100);
  };

  return (
    <>
      <Header />
      <div style={{ padding: '6rem 1rem 2rem', maxWidth: '800px', margin: 'auto' }}>
        <h2>Dashboard</h2>
        <p>Welcome, <strong>{email}</strong>!</p>

        <h3>Your Ride History</h3>
        {role === 'driver' && (
  <>
    <h4>Accepted Rides</h4>
    {acceptedRides.length ? (
      acceptedRides.map((ride, i) => (
        <div key={i} onClick={() => handleStartRide(ride)} style={rideCardStyle}>
          <strong>{ride.from}</strong> → <strong>{ride.to}</strong><br />
          Fare: ${ride.fare?.toFixed(2)} | ETA: {ride.eta_minutes} min<br />
          Status: {ride.status}<br />
          {ride.driver && <>Driver: {ride.driver}<br /></>}
          Time: {new Date(ride.timestamp).toLocaleString()}
        </div>
      ))
    ) : (
      <p>No accepted rides.</p>
    )}
  </>
)}
<Header />

<div style={{ maxWidth: '800px', margin: 'auto' }}>
</div>

{selectedRide && createPortal(
  <div>…</div>,
  document.body
)}


{role !== 'driver' && (
  <>
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <button
        onClick={() => setActiveTab('pending')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: activeTab === 'pending' ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Pending Rides
      </button>
      <button
        onClick={() => setActiveTab('active')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: activeTab === 'active' ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Active Rides
      </button>
    </div>

    {activeTab === 'pending' && (
      userRides.filter(ride => ride.status === 'pending').length ? (
        userRides.filter(ride => ride.status === 'pending').map((ride, i) => (
          <div key={i} onClick={() => handleStartRide(ride)} style={rideCardStyle}>
            <strong>{ride.from}</strong> → <strong>{ride.to}</strong><br />
            Fare: ${ride.fare?.toFixed(2)} | ETA: {ride.eta_minutes} min<br />
            Status: {ride.status}<br />
            Time: {new Date(ride.timestamp).toLocaleString()}
          </div>
        ))
      ) : (
        <p>No pending rides.</p>
      )
    )}

    {activeTab === 'active' && (
      userRides.filter(ride => ride.status === 'accepted' || ride.status === 'active').length ? (
        userRides.filter(ride => ride.status === 'accepted' || ride.status === 'active').map((ride, i) => (
          <div key={i} onClick={() => handleStartRide(ride)} style={rideCardStyle}>
            <strong>{ride.from}</strong> → <strong>{ride.to}</strong><br />
            Fare: ${ride.fare?.toFixed(2)} | ETA: {ride.eta_minutes} min<br />
            Status: {ride.status}<br />
            {ride.driver && <>Driver: {ride.driver}<br /></>}
            Time: {new Date(ride.timestamp).toLocaleString()}
          </div>
        ))
      ) : (
        <p>No active rides.</p>
      )
    )}
  </>
)}


</div>
      {selectedRide && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '1rem',
            width: '90%',
            height: '80%',
            position: 'relative'
          }}>
            <h3>Ride Route</h3>
            
            <div ref={mapRef} style={{ width: '100%', height: '80%' }}></div>
            <button onClick={() => setSelectedRide(null)} style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'red',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>Close</button>
          </div>
        </div>, document.body
      )}
      {selectedRide && createPortal(
        <div style={overlayStyle} onClick={() => setSelectedRide(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
          </div>
        </div>,
        document.body
      )}

      <div
        onClick={() => setChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          background: '#007bff',
          color: '#fff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        💬
      </div>

      {chatOpen && createPortal(
  <div style={overlayStyle} onClick={() => setChatOpen(false)}>
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        right: 20,
        width: 280,               
        height: 400,              
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',         
        flexDirection: 'column',  
        overflow: 'hidden'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ textAlign: 'right', padding: 8 }}>
        <button onClick={() => setChatOpen(false)} style={{
          background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer'
        }}>×</button>
      </div>

<div style={{
  flex: 1,                 
  display: 'flex',         
  flexDirection: 'column',
  overflow: 'hidden'       
}}>
  <Chatbot hideHeader={true} />
</div>

    </div>
  </div>,
  document.body
)}

    </>
    
  );
}