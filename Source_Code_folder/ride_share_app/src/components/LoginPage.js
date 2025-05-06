import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser, setLoggedInUser, getUser } from '../utils/storage';
import './Login.css';

export default function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); 
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!email || !password || !confirmPassword || !role) {
      return alert('Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return alert('Passwords do not match');
    }
    if (getUser(email)) {
      return alert('User already exists, please login');
    }


    saveUser(email, { password, rides: [], role });
    alert('Registration successful! Please login.');
    setPassword('');
    setConfirmPassword('');
    setIsRegisterMode(false);
  };

  const handleLogin = () => {
    if (!email || !password) {
      return alert('Please enter both email and password');
    }

    const user = getUser(email);
    if (!user) return alert('User not found, please register');
    if (user.password !== password) return alert('Incorrect password');
    if (user.enabled === false) return alert('Your account has been disabled. Please contact an administrator.');

    setLoggedInUser(email);

    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'driver':
        navigate('/driver');
        break;
      default:
        navigate('/landing');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Ride Share App</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {isRegisterMode && (
          <>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
           <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
  style={{
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: '1rem',
    fontSize: '1rem'
  }}
>
  <option value="user">Rider</option>
  <option value="driver">Driver</option>
  <option value="admin">Admin</option>
</select>

          </>
        )}

        <button onClick={isRegisterMode ? handleRegister : handleLogin}>
          {isRegisterMode ? 'Register' : 'Login'}
        </button>

        <div
          className="toggle-link"
          onClick={() => {
            setIsRegisterMode(!isRegisterMode);
            setPassword('');
            setConfirmPassword('');
          }}
        >
          {isRegisterMode
            ? 'Already have an account? Login'
            : "Don't have an account? Register"}
        </div>
      </div>
    </div>
  );
}
