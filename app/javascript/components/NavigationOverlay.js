import React, { useState } from 'react';

const NavigationOverlay = () => {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const toggleOverlay = () => {
    setOverlayOpen(!overlayOpen);
  };

  return (
    <div id="ensou-container">
      <div id="ensou-icon" onClick={toggleOverlay}></div>
      <div id="navigation-overlay" className={overlayOpen ? "open" : ""}>
        <ul>
          <li><a href="/zen-garden">Zen Garden</a></li>
          <li><a href="/quote-me">Quote Me</a></li>
          <li><a href="/games">Games</a></li>
          {/* <li><a href="/essays">Essays</a></li>
          <li><a href="/reviews">Reviews</a></li> */}
          <li><a href="/resume">Résumé</a></li>
        </ul>
        <div id="close-button" onClick={toggleOverlay}>Close</div>
      </div>
    </div>
  );
};

export default NavigationOverlay;