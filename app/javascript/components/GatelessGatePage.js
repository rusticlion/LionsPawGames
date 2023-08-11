import React, { useEffect, useState } from 'react';

const GatelessGatePage = props => {
  const [koan, setKoan] = useState(null);

  useEffect(() => {
    fetch('/api/gateless-gate/random')
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
        paragraphs.map(p => {
          return <p>{p}</p>
        })
      }
      </div>
      <div id="mumon-commentary-container">
      {
        mumon_lines.map(line => {
          return <p className='mumon-commentary'>{line}</p>
        })
      } 
      </div>
    </div>
  )
};

export default GatelessGatePage;