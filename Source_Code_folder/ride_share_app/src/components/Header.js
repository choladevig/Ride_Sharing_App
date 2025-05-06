import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getLoggedInUser, logoutUser, getUser } from '../utils/storage';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = getLoggedInUser();
  const user = getUser(email);
  const role = user?.role;

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };


  const linkStyle = (path) => ({
    margin: '0 0.5rem',
    paddingBottom: '0.25rem',
    textDecoration: 'none',
    color: location.pathname === path ? '#1ca0f2' : '#555',
    borderBottom: location.pathname === path ? '2px solid #1ca0f2' : 'none',
    cursor: 'pointer'
  });

  return (
    <header
      style={{
        // position: 'fixed',
        // top: 0,
        // left: 0,
        // right: 0,
        // width: '100%',
        // boxSizing: 'border-box',
        // display: 'flex',
        // alignItems: 'center',
        // padding: '0.75rem 1.5rem',
        // backgroundColor: 'rgba(255,255,255,0.9)',
        // boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        // zIndex: 10


        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        backgroundColor: 'rgba(255,255,255,0.9)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}
    >
      <h1
        style={{ margin: 0, fontSize: '1.25rem', cursor: 'pointer' }}
        onClick={() => navigate('/landing')}
      >
        Ride Share App
      </h1>

      <nav
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}
      >


        {role === 'admin' ? (
          <>
            <Link to="/admin" style={linkStyle('/admin')}>
              Analytics
            </Link>
            <Link to="/manageusers" style={linkStyle("/manageusers")}>
              Users
            </Link>
          </>
        ) : (
          <Link
            to={role === 'driver' ? '/driver' : '/landing'}
            style={linkStyle(role === 'driver' ? '/driver' : '/landing')}
          >
            {role === 'driver' ? 'Rides Available' : 'Book Ride'}
          </Link>

        )}
        {/* 
        {role === 'admin' && (
          <Link to="/manageusers" style={linkStyle("/manageusers")}>
            Users
          </Link>
        )} */}


        {role !== 'admin' && (
          <Link to="/dashboard" style={linkStyle('/dashboard')}>
            Dashboard
          </Link>
        )}

        <span style={{ margin: '0 1rem', fontWeight: 500 }}>{email}</span>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            background: '#e53e3e',
            color: '#fff',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
