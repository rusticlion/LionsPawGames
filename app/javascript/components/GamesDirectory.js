import React from 'react';
import { Link } from 'react-router-dom';
import NavigationOverlay from './NavigationOverlay';

const GamesDirectory = props => {

  return (
    <div id="games-directory-container">
      <p>Under construction! I am working on two games right now: "Temple of Terror", a HTML5 dungeon-plunderer based on the Forged in the Dark ruleset, and "Into the Dreamlands", a retro RPG for Mac/PC/Linux with an original one-on-one, turn-based, simultaneous resolution combat system.</p>
      <p>For now, check out the <Link to="/zen-garden">interactive Zen Garden sandbox</Link> and the <Link to="/quote-me">daily quote-guessing game</Link>.</p>
      <NavigationOverlay/>
    </div>
  )
};

export default GamesDirectory;