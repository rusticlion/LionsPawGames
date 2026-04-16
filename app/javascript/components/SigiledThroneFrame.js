import React, { useEffect } from 'react';

const SigiledThroneFrame = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/sigiled_throne/html5game/SigiledThrone.js';
    script.async = true;

    script.onload = () => {
      if (window.JSON_game && window.JSON_game.Options) {
        window.JSON_game.Options.GameDir = '/sigiled_throne/html5game';
      }

      window.GameMaker_Init && window.GameMaker_Init();
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="sigiled-throne-page">
      <div className="gm4html5_div_class sigiled-throne-frame" id="gm4html5_div_id">
        <canvas id="canvas" width="640" height="512">
          <p>Your browser doesn't support HTML5 canvas.</p>
        </canvas>
      </div>
    </div>
  );
};

export default SigiledThroneFrame;
