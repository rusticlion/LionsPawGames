import React, { useEffect, useState } from 'react';
import NavigationOverlay from './NavigationOverlay';

const GatelessGatePage = props => {
  const [koan, setKoan] = useState(null);

  useEffect(() => {
    fetch('/api/gateless-gate/daily')
      .then(response => response.json())
      .then(data => setKoan(data))
      .catch(error => console.error("Couldn't fetch a koan from the API"))
  }, []);
  const paragraphs = [];
  if (koan?.text) {
    koan.text.split(/\\n|\n/).forEach(line => {
      paragraphs.push(line);
    })
  }
  const mumon_lines = [];
  if (koan?.mumon_commentary) {
    koan.mumon_commentary.split(/\\n|\n/).forEach(line => {
      mumon_lines.push(line);
    })
  }
  return (
    <div id="gateless-gate-container">
      <h1 id="koan-title">{koan?.title}</h1>
      <div id="koan-text">
      {
        paragraphs.map((p, i) => {
          return <p key={i}>{p}</p>
        })
      }
      </div>
      <div id="mumon-commentary-container">
      {
        mumon_lines.map((line,i) => {
          return <p key={i} className='mumon-commentary'>{line}</p>
        })
      } 
      </div>
      <NavigationOverlay/>
    </div>
  )
};

export default GatelessGatePage;