import React from 'react';

const QuoteBoard = ({ tokens, originalTokens, onTokenClick, selectedTokenIndex, puzzleComplete }) => {
  if (!tokens || !originalTokens) {
    return <div>Loading...</div>;
  }
  return (
    <div className="quote-board">
      <div className="tiles-container">
        {tokens.map((token, i) => {
          let tileClass = "tile";
          let linkingBar = null;
          const behindIsCorrect = i > 0 && token.behind.includes(tokens[i-1].content);
          const aheadIsCorrect = i < tokens.length - 1 && token.ahead.includes(tokens[i+1].content);
          
          linkingBar = (
            <div className={`linking-bar-container ${puzzleComplete ? 'linking-bar-completed' : ''}`}>
              {behindIsCorrect && <div className="linking-bar behind"></div>}
              {aheadIsCorrect && <div className="linking-bar ahead"></div>}
            </div>
          );
          // Set class to reflect tile state
          if (token.type === 'punctuation') {
            tileClass += ' tile-punctuation';
          } else if (originalTokens[i].content === token.content) {
            tileClass += ' tile-correct';
          } else if (behindIsCorrect || aheadIsCorrect) {
            tileClass += ' tile-partially-correct';
          }
          if (i === selectedTokenIndex) {
            tileClass += ' tile-selected'; // Add a class to indicate the selected token
          }
          if (puzzleComplete) {
            tileClass += ' tile-completed'; // Add a class for completed puzzle
          }

          return (
            <div className={tileClass} key={i} onClick={() => token.type !== 'punctuation' && onTokenClick(i)}>
              {token.content}
              {linkingBar}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuoteBoard;