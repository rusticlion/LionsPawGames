import React, { useEffect, useState } from 'react';
import axios from './axiosConfig';

import { humanize } from './utility';

import { useAuth } from './AuthContext';
import BodyPartList from './BodyPartList';

const ArenaLandingPage = () => {
  // Replace these with actual logic to check user's sign-in status and ArenaPlayer existence
  const isSignedIn = useAuth();
  const [activeArenaPlayer, setActiveArenaPlayer] = useState(null);

  useEffect(() => {
    getArenaPlayer();
  }, []);

  const getArenaPlayer = () => {
    axios.get('/api/dreamlands-arena/current-arena-player')
      .then(response => setActiveArenaPlayer(response.data.currentArenaPlayer))
      .catch(error => console.error(error));
  }

  const createPlayer = () =>{
    axios.post('/api/dreamlands-arena/create-arena-player')
      .then(response => setActiveArenaPlayer(response.data.currentArenaPlayer))
      .catch(error => console.error(error));
  }

  return (
    <div className={`arena-container affinity-${activeArenaPlayer?.affinity}`}>
      {!isSignedIn ? (
        <div>
          <h2>Welcome to Dreamlands: Arena!</h2>
          <p>Please <a href="/signup">sign up</a> or <a href="/login">log in</a> to play.</p>
        </div>
      ) : !activeArenaPlayer ? (
        <div>
          <h2>Create Your Character</h2>
          <p>You're almost there! If you click this, the dream will begin...</p>
          <button onClick={createPlayer}>Create Character</button>
        </div>
      ) : (
        <div>
          <h2 className={`affinity-${activeArenaPlayer.affinity}`}>{`Welcome, ${activeArenaPlayer.affinity} warrior!`}</h2>
          <h3>Your Dreamform:</h3>
          <BodyPartList bodyParts={activeArenaPlayer.body_parts} />
        </div>
      )}
    </div>
  );
}

export default ArenaLandingPage;
