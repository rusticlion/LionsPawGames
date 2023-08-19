import React, { useState } from 'react';
import axios from './axiosConfig';
import NavigationOverlay from './NavigationOverlay';

import { humanize } from './utility';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState('');

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
      const errorMessages = error.response?.data;
      console.log(errorMessages);
      const messages = [];

      if (errorMessages) {
        for (const key in errorMessages) {
          const readable_err = humanize(`${key} ${errorMessages[key].join(', ')}`);
          messages.push(readable_err);
        }
      }

      const errorMessage = messages.join('\n');
      setErrors(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <form id="login-form" onSubmit={handleSubmit}>
        <input className="input-field" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input className="input-field" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <input className="input-field" type="password" placeholder="Confirm Password" onChange={e => setPasswordConfirmation(e.target.value)} />
        <button type="submit">Sign Up</button>
      </form>
      {errors && <div id="error-message">{errors}</div>}
      <NavigationOverlay />
    </div>
  );
};

export default Signup;