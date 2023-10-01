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
import MediaCatalogue from './MediaCatalogue';
import MediaItem from './MediaItem';
import Signup from './Signup';
import Login from './Login';
import ArenaLandingPage from './ArenaLandingPage';

axios.defaults.headers.common['X-CSRF-Token'] = document.querySelector("meta[name='csrf-token']").getAttribute("content");

const mediaItemDefaultProps = {
  title: "Haunting of Hill House",
  synopsis: "A shattered family faces their past.",
  recommendation: "Meticulously structured and masterfully shot. A spine-chilling ghost story, but also a meditation on grief and trauma.",
  discussion: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  tags: ["Ghost story", "Horror", "Cinematography", "Non-linear narrative"]
}

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
        <Route path="/reviews" element={<MediaItem {...mediaItemDefaultProps} />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/sign-up" element={<Signup/>} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default AppContainer;