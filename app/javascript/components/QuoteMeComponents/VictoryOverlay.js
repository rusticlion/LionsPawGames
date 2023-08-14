import React from 'react';

const VictoryOverlay = ({ quote, score }) => {
  if (!quote || !score) {
    return <div>Loading...</div>;
  }
  return (
    <div className="victory-overlay">
      <div className="attribution-placard">{quote.attribution}</div>
      {quote.context ? <div className="context-placard">{quote.context}</div> : null}
      <div className="final-score-placard">Final Score: {score}</div>
    </div>
  );
};

export default VictoryOverlay;