import React, { useEffect, useState } from 'react';

const SplashPage = props => {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const toggleOverlay = () => {
    setOverlayOpen(!overlayOpen);
  };

  useEffect(() => {
    const numPetals = 100;
    const whitePetalIndex = Math.floor(Math.random() * numPetals);
    const cherryBlossoms = document.getElementById('cherry-blossoms');
    for (let i = 0; i < numPetals; i++) {
      setTimeout(() => {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        if (i === whitePetalIndex) {
          petal.classList.remove('petal');
          petal.classList.add('petal-white');
          petal.addEventListener('click', () => {
            window.location.href = '/gateless-gate';
          });
        }
        cherryBlossoms.appendChild(petal);
        
        const startLeft = Math.random() * window.innerWidth;
        const startTop = -20;
        const endTop = window.innerHeight;

        petal.style.left = startLeft + 'px';
        petal.style.top = startTop + 'px';

        const animatePetal = () => {
          petal.style.top = parseInt(petal.style.top) + 1 + 'px';
          petal.style.left = Math.round(parseInt(petal.style.left) + (Math.random() * 2 - 1.5)) + 'px';

          if (parseInt(petal.style.top) < endTop && parseInt(petal.style.left) >= -5) {
            requestAnimationFrame(animatePetal);
          } else {
            cherryBlossoms.removeChild(petal);
          }
        };

        requestAnimationFrame(animatePetal);
      }, Math.random() * 5000);
    }
  }, []);

  return (
    <div>
      <div id="cherry-blossoms"></div>
      <p>
        Welcome. Please, feel free to wander.
      </p>
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
    </div>
  )
};

export default SplashPage;