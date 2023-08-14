import React, { useState, useEffect, useRef } from 'react';
import QuoteBoard from './QuoteMeComponents/QuoteBoard'
import VictoryOverlay from './QuoteMeComponents/VictoryOverlay';

const QuoteMe = () => {
  const [quote, setQuote] = useState(null);
  const [shuffledQuote, setShuffledQuote] = useState([]);
  const [unshuffledQuote, setUnshuffledQuote] = useState([]);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(null);
  const [score, setScore] = useState(0);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hasMounted = useRef(false);

  const saveStateToLocalStorage = () => {
    const state = {
      quote: quote,
      shuffledQuote: shuffledQuote,
      score: score,
    };
  
    localStorage.setItem('puzzleState', JSON.stringify(state));
  };

  // Fetch the daily quote when the component mounts
  useEffect(() => {
    fetch('/api/quotes/daily')
      .then(response => response.json())
      .then(data => {
        setQuote(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Couldn't fetch a quote from the API");
        setIsLoading(false);
      })
  }, []);

  useEffect(() => {
    if (quote) {
      setDailyQuote(quote.content);
    }
  }, [quote]);

  useEffect(() => {
    if (hasMounted.current) {
      saveStateToLocalStorage();
    } else {
      hasMounted.current = true;
    }

    checkCompletion();
  }, [shuffledQuote]);

  const setDailyQuote = (quote) => {
    const game_pieces = tokenizeQuote(quote);
    setUnshuffledQuote(game_pieces);

    const savedState = localStorage.getItem('puzzleState');
    if (savedState) {
      const parsedSavedState = JSON.parse(savedState);
      // Check if the saved state's quote is defined and matches the current quote content
      if (
        parsedSavedState['quote'] &&
        parsedSavedState['quote']['content'] == quote
      ) {
        const { shuffledQuote, score } = parsedSavedState;
        setShuffledQuote(shuffledQuote);
        setScore(score);
      } else {
        localStorage.removeItem('puzzleState');
        const live_game_pieces = game_pieces.slice(0);
        shuffleArray(live_game_pieces);
        setShuffledQuote(live_game_pieces);
      }
    } else {
      const live_game_pieces = game_pieces.slice(0);
      shuffleArray(live_game_pieces);
      setShuffledQuote(live_game_pieces);
    }
  };

  const tokenizeQuote = (quote) => {
    const tokens = [];
    let word = '';
    let index = 0;
  
    for (let i = 0; i < quote.length; i++) {
      const char = quote[i];
      const nextChar = quote[i + 1];
  
      if (/\w/.test(char) || (char === "'" && /\w/.test(quote[i - 1]) && /\w/.test(nextChar)) || (char === '-' && /\w/.test(quote[i - 1]) && /\w/.test(nextChar))) {
        word += char;
      } else {
        if (word.length > 0) {
          tokens.push({
            content: word,
            index: index++,
            type: 'word',
            behind: [],
            ahead: [],
          });
          word = '';
        }
  
        if (/\s/.test(char)) continue; // If the character is whitespace, continue to next iteration
  
        tokens.push({
          content: char,
          index: index++,
          type: 'punctuation',
          behind: [],
          ahead: []
        });
      }
    }
  
    // Add the last word if there is one
    if (word.length > 0) {
      tokens.push({
        content: word,
        index: index,
        type: 'word',
        behind: [],
        ahead: [],
      });
    }
  
    // Set the 'ahead' and 'behind' properties for each token
    tokens.forEach((token, i) => {
      if (i > 0) token.behind.push(tokens[i - 1].content);
      if (i < tokens.length - 1) token.ahead.push(tokens[i + 1].content);
    });
  
    // Iterate again to find any duplicates and update the 'ahead' and 'behind' properties
    tokens.forEach((token, i) => {
      tokens.forEach((otherToken, j) => {
        if (i !== j && token.content === otherToken.content) {
          if (j > 0) token.behind.push(tokens[j - 1].content);
          if (j < tokens.length - 1) token.ahead.push(tokens[j + 1].content);
        }
      });
    });
    return tokens;
  };
  
  

  const handleTokenClick = (index) => {
    // If the clicked token is the same as the selected one, or it is a correct one, simply return
    if (index === selectedTokenIndex || shuffledQuote[index].content === unshuffledQuote[index].content) {
      setSelectedTokenIndex(null);
      return;
    }

    // If there is a selected token, swap it with the clicked token
    if (selectedTokenIndex !== null) {
      handleSwap(selectedTokenIndex, index);
    }

    // Select the clicked token if no other token is selected
    if (selectedTokenIndex === null) {
      setSelectedTokenIndex(index);
    }
  };

  const handleSwap = (index1, index2) => {
    // Perform the swap
    const swappedTokens = [...shuffledQuote];
    const temp = swappedTokens[index1];
    swappedTokens[index1] = swappedTokens[index2];
    swappedTokens[index2] = temp;
    setShuffledQuote(swappedTokens);

    // Deselect the token
    setSelectedTokenIndex(null);

    // Increment the score
    setScore(score + 1);
  };

  const checkCompletion = () => {
    // Check if the shuffledQuote matches the original quote and handle completion
    if (shuffledQuote.length === 0) {
      return;
    }
    if (shuffledQuote.every((token, i) => {
      return (token.content == unshuffledQuote[i].content)
    })) {
      setPuzzleComplete(true);
    }
  };

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <QuoteBoard tokens={shuffledQuote} originalTokens={unshuffledQuote} onTokenClick={handleTokenClick} selectedTokenIndex={selectedTokenIndex} puzzleComplete={puzzleComplete}/>
          {puzzleComplete ? <VictoryOverlay quote={quote} score={score}/> : <div className="score-panel">Score: {score}</div>}
        </div>
      )}
    </div>
  );
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // If the current item is punctuation, continue to the next iteration
    if (array[i].type === 'punctuation') continue;

    let j = Math.floor(Math.random() * (i + 1));

    // If the randomly chosen item is punctuation, continue to the next iteration
    while (array[j].type === 'punctuation') {
      j = Math.floor(Math.random() * (i + 1));
    }

    // Swap the two word tokens
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export default QuoteMe;