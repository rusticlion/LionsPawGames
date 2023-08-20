import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import axios from './axiosConfig';

import { AuthProvider } from './AuthContext';

import GatelessGatePage from './GatelessGatePage';
import ZenGarden from './ZenGarden';
import SplashPage from './SplashPage';
import QuoteMe from './QuoteMe';
import GamesDirectory from './GamesDirectory';
import Resume from './Resume';
import Signup from './Signup';
import Login from './Login';
import ArenaLandingPage from './ArenaLandingPage';

axios.defaults.headers.common['X-CSRF-Token'] = document.querySelector("meta[name='csrf-token']").getAttribute("content");

const AppContainer = props => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage/>} />
        <Route path="/gateless-gate" element={<GatelessGatePage/>} />
        <Route path="/zen-garden" element={<ZenGarden/>} />
        <Route path="/quote-me" element={<QuoteMe />} />
        <Route path="/games" element={<GamesDirectory />} />
        <Route path="/dreamlands-arena" element={<ArenaLandingPage/>} />
        <Route path="/resume" element={<Resume/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/sign-up" element={<Signup/>} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default AppContainer;