import React, { useState, useEffect } from 'react';

const GRID_SIZE = 3;
const MAX_ATTEMPTS = 6;
const CELL_VALUES = ['', 'X', 'O'];

const ruleComponents = {
    count: { 
      label: 'Count', 
      params: ['symbol', 'comparator', 'number'],
      generate: () => ({
        symbol: ['X', 'O'][Math.floor(Math.random() * 2)],
        comparator: ['eq', 'gt', 'lt'][Math.floor(Math.random() * 3)],
        number: Math.floor(Math.random() * 9) + 1
      }),
      evaluate: (grid, params) => {
        const count = grid.flat().filter(cell => cell === params.symbol).length;
        switch (params.comparator) {
          case 'eq': return count === Number(params.number);
          case 'gt': return count > Number(params.number);
          case 'lt': return count < Number(params.number);
          default: return false;
        }
      }
    },
    pattern: { 
      label: 'Pattern', 
      params: ['pattern'],
      generate: () => ({
        pattern: Array(9).fill().map(() => Math.random() < 0.3 ? (Math.random() < 0.5 ? 'X' : 'O') : '*').join('')
      }),
      evaluate: (grid, params) => {
        const flatGrid = grid.flat();
        return params.pattern.split('').every((p, i) => p === '*' || p === flatGrid[i]);
      }
    },
    winningPlay: { 
      label: 'Winning Play', 
      params: ['symbol'],
      generate: () => ({
        symbol: ['X', 'O'][Math.floor(Math.random() * 2)]
      }),
      evaluate: (grid, params) => {
        const lines = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
          [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
          [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        return lines.some(line => line.every(i => grid[Math.floor(i / 3)][i % 3] === params.symbol));
      }
    },
  };

const comparators = [
  { value: 'eq', label: 'Equal to' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' }
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
    const [remainingAttempts, setRemainingAttempts] = useState(MAX_ATTEMPTS);
  
    useEffect(() => {
      generateRandomRule();
    }, []);
  
    const generateRandomRule = () => {
      const ruleTypes = Object.keys(ruleComponents).filter(type => type !== 'pattern');
      const randomType = ruleTypes[Math.floor(Math.random() * ruleTypes.length)];
      const randomParams = ruleComponents[randomType].generate();
      setSecretRule({ type: randomType, params: randomParams });
    };
  
    const handleCellClick = (row, col) => {
      if (gameState !== 'playing') return;
      const newGrid = [...grid];
      const currentIndex = CELL_VALUES.indexOf(grid[row][col]);
      newGrid[row][col] = CELL_VALUES[(currentIndex + 1) % CELL_VALUES.length];
      setGrid(newGrid);
    };
  
    const handleSubmit = () => {
      if (gameState !== 'playing') return;
      const correct = ruleComponents[secretRule.type].evaluate(grid, secretRule.params);
      const newAttempts = [...attempts, { grid: grid, correct }];
      setAttempts(newAttempts);
      if (!correct) {
        const newRemainingAttempts = remainingAttempts - 1;
        setRemainingAttempts(newRemainingAttempts);
        if (newRemainingAttempts <= 0) {
          setGameState('lost');
        }
      }
      setGrid(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('')));
    };
  
    const handleRuleChange = (newRule) => {
      setBuiltRule(newRule);
    };
  
    const handleGuess = () => {
      const guessedCorrectly = JSON.stringify(builtRule) === JSON.stringify([secretRule]);
      if (guessedCorrectly) {
        setGameState('won');
      } else {
        const newRemainingAttempts = remainingAttempts - 1;
        setRemainingAttempts(newRemainingAttempts);
        if (newRemainingAttempts <= 0) {
          setGameState('lost');
        }
      }
    };
  
    const describeRule = (rule) => {
      if (!rule) return '';
      const { type, params } = rule;
      switch (type) {
        case 'count':
          return `${comparators.find(c => c.value === params.comparator).label} ${params.number} ${params.symbol}s`;
        case 'pattern':
          return `Matches pattern: ${params.pattern}`;
        case 'winningPlay':
          return `Winning play for ${params.symbol}`;
        default:
          return '';
      }
    };
  
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Inducto</h1>
        <div style={{ marginBottom: '10px' }}>Remaining Attempts: {remainingAttempts}</div>
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
            {gameState === 'won' ? 'Congratulations! You won!' : `Game Over. The correct rule was: ${describeRule(secretRule)}`}
          </div>
        )}
      </div>
    );
  };

  export default Inducto;