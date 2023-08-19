import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Import the useAuth hook
import axios from './axiosConfig';

const Auth = ({ isAuthenticated }) => {
  const { setIsAuthenticated } = useAuth(); // Get setIsAuthenticated method from context
  const navigate = useNavigate();

  const logout = () => {
    // Retrieve the CSRF token from the meta tag at the time of the logout request
    const csrfToken = document.querySelector('[name=csrf-token]').content;
    console.log("Token from meta tag: ", csrfToken);
    
    axios.delete('/users/sign_out', {
      // Include the CSRF token in the headers for this specific request
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    })
      .then(() => {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false); // Update the authentication status
        navigate('/');
      })
      .catch(error => {
        console.error('Failed to log out', error);
        // Handle logout failure if needed
      });
  };

  if (isAuthenticated) {
    return (
      <li><a onClick={logout}>Log Out</a></li>
    );
  } else {
    return (
      <li><a href="/login">Log In</a></li>
    );
  }
};

export default Auth;