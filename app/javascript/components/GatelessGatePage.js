import React, { useEffect, useState } from 'react';

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
    <div>
      <h1>{koan?.title}</h1>
      {
        paragraphs.map(p => {
          console.log("creating a p element for a koan line")
          return <p>{p}</p>
        })
      }
      {
        mumon_lines.map(line => {
          console.log("creating a p element for a Mumon line")
          return <p className='mumon-commentary'>{line}</p>
        })
      }
    </div>
  )
};

export default GatelessGatePage;