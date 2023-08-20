import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from './axiosConfig';

import { useAuth } from './AuthContext';
import { humanize } from './utility';

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
        const errorMessages = error.response?.data;
        const messages = [];

        if (errorMessages) {
          for (const key in errorMessages) {
            console.log(errorMessages);
            const readable_err = humanize(`${key} ${errorMessages[key]}`);
            messages.push(readable_err);
          }
        }

        const errorMessage = messages.join('\n');
        setErrors(errorMessage);
      });
  };

  return (
    <div className="login-container">
      <form id="login-form" onSubmit={handleSubmit}>
        <input className="input-field" type="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="input-field" type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
        {errors && <div id="error-message">{errors}</div>}
      </form>
      <div className="signup-link">
        <p>Don't have an account? <Link to="/sign-up">Sign Up</Link></p>
      </div>
      <NavigationOverlay />
    </div>
  );
};

export default Login;