import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from './axiosConfig';

import { useAuth } from './AuthContext';

import NavigationOverlay from './NavigationOverlay';

const Login = () => {
  const { setIsAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    axios.post('/users/sign_in', { user: { email, password } })
      .then(response => {
        // Handle login success, e.g., redirect to dashboard or set user in context/state
        localStorage.setItem('authToken', response.data.token);
        setIsAuthenticated(true);
        navigate(-1);
      })
      .catch(error => {
        // Handle login failure
        setErrors('Invalid email or password');
      });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
        {errors && <div>{errors}</div>}
      </form>
      <NavigationOverlay/>
    </div>
    
  );
};

export default Login;