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
          <li><a href="/i-ching">I Ching</a></li>
          <li><a href="/essays">Essays</a></li>
        </ul>
        <div id="close-button" onClick={toggleOverlay}>Close</div>
      </div>
    </div>
  );
};

export default NavigationOverlay;