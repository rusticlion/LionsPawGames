import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GatelessGatePage from './GatelessGatePage';
import ZenGarden from './ZenGarden';
import SplashPage from './SplashPage';
import QuoteMe from './QuoteMe';
import GamesDirectory from './GamesDirectory';
import Resume from './Resume';

const AppContainer = props => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<SplashPage/>} />
      <Route path="/gateless-gate" element={<GatelessGatePage/>} />
      <Route path="/zen-garden" element={<ZenGarden/>} />
      <Route path="/quote-me" element={<QuoteMe />} />
      <Route path="/games" element={<GamesDirectory />} />
      <Route path="/resume" element={<Resume/>} />
    </Routes>
  </BrowserRouter>
)

export default AppContainer;