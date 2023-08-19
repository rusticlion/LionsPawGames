import React, { useState } from 'react';
import axios from './axiosConfig';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/users', {
        user: {
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      // Handle success (e.g., navigate to a protected page or update UI)
    } catch (error) {
      // Handle error (e.g., show error message)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <input type="password" placeholder="Confirm Password" onChange={e => setPasswordConfirmation(e.target.value)} />
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default Signup;