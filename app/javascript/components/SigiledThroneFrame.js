import React, { useEffect } from 'react';

const SigiledThroneFrame = () => {
  useEffect(() => {
    // Load the GameMaker script
    const script = document.createElement('script');
    script.src = 'sigiled_throne/html5game/SigiledThrone.js'; // Adjust this path
    script.async = true;

    // Add a load listener to initialize the game when the script has loaded
    script.onload = () => {
      window.GameMaker_Init && window.GameMaker_Init();
    };

    document.body.appendChild(script);

    return () => {
      // Clean up the script element when the component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <div className="gm4html5_div_class" id="gm4html5_div_id">
        <canvas id="canvas" width="640" height="512">
          <p>Your browser doesn't support HTML5 canvas.</p>
        </canvas>
      </div>
    </div>
  );
};

export default SigiledThroneFrame;
