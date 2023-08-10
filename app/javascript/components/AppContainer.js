import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GatelessGatePage from './GatelessGatePage';
import ZenGarden from './ZenGarden';
import SplashPage from './SplashPage';

const AppContainer = props => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<SplashPage/>} />
      <Route path="/gateless-gate" element={<GatelessGatePage/>} />
      <Route path="/zen-garden" element={<ZenGarden/>} />
    </Routes>
  </BrowserRouter>
)

export default AppContainer;