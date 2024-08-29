import React, { useState, useEffect } from 'react';

const GRID_SIZE = 3;
const MAX_ATTEMPTS = 6;
const CELL_VALUES = ['', 'X', 'O'];

const ruleComponents = {
  count: { label: 'Count', params: ['symbol', 'comparator', 'number'] },
  pattern: { label: 'Pattern', params: ['pattern'] },
  winningPlay: { label: 'Winning Play', params: ['symbol'] },
};

const comparators = [
  { value: 'eq', label: 'Equal to' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'gte', 'label': 'Greater than or equal to' },
  { value: 'lte', label: 'Less than or equal to' },
];

const RuleBuilder = ({ onRuleChange }) => {
  const [rules, setRules] = useState([]);

  const addRule = () => {
    setRules([...rules, { type: '', params: {} }]);
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    onRuleChange(newRules);
  };

  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
    onRuleChange(newRules);
  };

  return (
    <div>
      {rules.map((rule, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          <select 
            value={rule.type} 
            onChange={(e) => updateRule(index, 'type', e.target.value)}
          >
            <option value="">Select rule type</option>
            {Object.entries(ruleComponents).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {rule.type && ruleComponents[rule.type].params.map((param) => (
            <React.Fragment key={param}>
              {param === 'comparator' ? (
                <select 
                  value={rule.params[param] || ''} 
                  onChange={(e) => updateRule(index, 'params', { ...rule.params, [param]: e.target.value })}
                  style={{ marginLeft: '5px' }}
                >
                  <option value="">Select {param}</option>
                  {comparators.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text"
                  placeholder={param}
                  value={rule.params[param] || ''}
                  onChange={(e) => updateRule(index, 'params', { ...rule.params, [param]: e.target.value })}
                  style={{ marginLeft: '5px', width: '100px' }}
                />
              )}
            </React.Fragment>
          ))}
          <button onClick={() => removeRule(index)} style={{ marginLeft: '5px' }}>Remove</button>
        </div>
      ))}
      <button onClick={addRule}>Add Rule</button>
    </div>
  );
};

const Inducto = () => {
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('')));
  const [secretRule, setSecretRule] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [builtRule, setBuiltRule] = useState([]);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'

  useEffect(() => {
    // For simplicity, we're using a fixed secret rule here
    setSecretRule({ type: 'count', params: { symbol: 'X', comparator: 'gte', number: '3' } });
  }, []);

  const handleCellClick = (row, col) => {
    if (gameState !== 'playing') return;
    const newGrid = [...grid];
    const currentIndex = CELL_VALUES.indexOf(grid[row][col]);
    newGrid[row][col] = CELL_VALUES[(currentIndex + 1) % CELL_VALUES.length];
    setGrid(newGrid);
  };

  const handleSubmit = () => {
    if (gameState !== 'playing') return;
    // This is a simplified check. In a real implementation, you'd need to properly evaluate the rule.
    const correct = grid.flat().filter(cell => cell === 'X').length >= 3;
    const newAttempts = [...attempts, { grid: grid, correct }];
    setAttempts(newAttempts);
    if (newAttempts.length >= MAX_ATTEMPTS) {
      setGameState('lost');
    }
    setGrid(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('')));
  };

  const handleRuleChange = (newRule) => {
    setBuiltRule(newRule);
  };

  const handleGuess = () => {
    // This is a simplified check. In a real implementation, you'd need to properly compare the rules.
    const guessedCorrectly = JSON.stringify(builtRule) === JSON.stringify([secretRule]);
    if (guessedCorrectly) {
      setGameState('won');
    } else if (attempts.length >= MAX_ATTEMPTS) {
      setGameState('lost');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Inducto</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {grid.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{ width: '60px', height: '60px', fontSize: '24px', fontWeight: 'bold' }}
            >
              {cell}
            </button>
          ))
        )}
      </div>
      <button onClick={handleSubmit} style={{ marginBottom: '20px' }}>Submit Grid</button>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Build Your Rule Guess:</h2>
        <RuleBuilder onRuleChange={handleRuleChange} />
        <button onClick={handleGuess} style={{ marginTop: '10px' }}>Submit Rule Guess</button>
      </div>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Attempts:</h2>
        {attempts.map((attempt, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            Attempt {index + 1}: {attempt.correct ? '✅' : '❌'}
          </div>
        ))}
      </div>
      {gameState !== 'playing' && (
        <div style={{ marginTop: '20px', fontSize: '20px', fontWeight: 'bold' }}>
          {gameState === 'won' ? 'Congratulations! You won!' : `Game Over. The correct rule was: At least 3 Xs`}
        </div>
      )}
    </div>
  );
};

export default Inducto;