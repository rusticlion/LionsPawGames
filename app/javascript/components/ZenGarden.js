import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

import NavigationOverlay from './NavigationOverlay';

const pixelColors = {
  'STONE': '#8B8B8B', // Grey
  'SAND': '#F4C542',  // Sand color
  'WATER': '#3498DB', // Blue
  'PLANT': '#2ECC71', // Green
  'VOID': '#FFF7D4',  // $Cream
};
const size = 240;
const pixelSize = 1;

const sizeToClass = (size) => {
  if (size <= 1) return 'extra-small';
  if (size <= 3) return 'small';
  if (size <= 5) return 'medium';
  if (size <= 7) return 'large';
  return 'extra-large';
}

const applyRules = (currentGrid) => {
  // Copy the current grid to work on
  const newGrid = [...currentGrid];
  // Create a flag grid to track processed cells
  const processed = Array(size).fill(false).map(() => Array(size).fill(false));
  // Iterate through the cells and apply rules
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip this cell if it's already been processed
      if (processed[r][c]) continue;
      const seed = Math.random();
      const cell = currentGrid[r][c];
      const neighbor_n = currentGrid[r-1]?.[c];
      const neighbor_ne = currentGrid[r-1]?.[c+1];
      const neighbor_e = currentGrid[r]?.[c+1];
      const neighbor_se = currentGrid[r+1]?.[c+1];
      const neighbor_s = currentGrid[r+1]?.[c];
      const neighbor_sw = currentGrid[r+1]?.[c-1];
      const neighbor_w = currentGrid[r]?.[c-1];
      const neighbor_nw = currentGrid[r-1]?.[c-1];
      // Rule: If a 'SAND' or 'WATER' cell has a 'VOID' cell below, swap them
      if ((cell === 'SAND' || cell === 'WATER') && (neighbor_s === 'VOID')) {
        newGrid[r+1][c] = cell;
        newGrid[r][c] = 'VOID';
        processed[r+1][c] = true;
        processed[r][c] = true;
      }
      // Rule: If a 'SAND or 'WATER' cell has a 'VOID' cell SE and it still hasn't fallen, swap them
      else if ((cell === 'SAND' || cell === 'WATER') && (neighbor_se === 'VOID' && seed > 0.3)) {
        newGrid[r+1][c+1] = cell;
        newGrid[r][c] = 'VOID';
        processed[r+1][c+1] = true;
        processed[r][c] = true;
      }
      // Rule: If a 'SAND or 'WATER' cell has a 'VOID' cell SW and it still hasn't fallen, swap them
      else if ((cell === 'SAND' || cell === 'WATER') && (neighbor_sw === 'VOID')) {
        newGrid[r+1][c-1] = cell;
        newGrid[r][c] = 'VOID';
        processed[r+1][c-1] = true;
        processed[r][c] = true;
      }
      // Rule: If a 'WATER' cell has a 'VOID' cell left and it still hasn't fallen, swap them
      else if ((cell === 'WATER') && (neighbor_w === 'VOID' && seed > 0.3)) {
        newGrid[r][c-1] = cell;
        newGrid[r][c] = 'VOID';
        processed[r][c-1] = true;
        processed[r][c] = true;
      }
      // Rule: If a 'WATER cell has a 'VOID' cell right and it still hasn't fallen, swap them
      else if ((cell === 'WATER') && (neighbor_e === 'VOID')) {
        newGrid[r][c+1] = cell;
        newGrid[r][c] = 'VOID';
        processed[r][c+1] = true;
        processed[r][c] = true;
      }
      // Rule: If a 'SAND' cell has a 'WATER' cell below, swap them
      else if ((cell === 'SAND') && (neighbor_s === 'WATER')) {
        newGrid[r+1][c] = cell;
        newGrid[r][c] = 'WATER';
        processed[r+1][c] = true;
        processed[r][c] = true;
      }
      // Rule: If a 'SAND' cell has a 'WATER' cell SE and it still hasn't fallen, swap them
      else if ((cell === 'SAND') && (neighbor_se === 'WATER')) {
        newGrid[r+1][c+1] = cell;
        newGrid[r][c] = 'WATER';
        processed[r+1][c+1] = true;
        processed[r][c] = true;
      }
      // Rule: If a 'SAND' cell has a 'WATER' cell SW and it still hasn't fallen, swap them
      else if ((cell === 'SAND') && (neighbor_sw === 'WATER')) {
        newGrid[r+1][c-1] = cell;
        newGrid[r][c] = 'WATER';
        processed[r+1][c-1] = true;
        processed[r][c] = true;
      }
      
      // Rule: If a 'STONE' cell is next to a 'WATER' cell, change it to 'SAND'
      else if (cell === 'STONE' && (neighbor_n === 'WATER' || neighbor_e === 'WATER' || neighbor_s === 'WATER' || neighbor_w === 'WATER')) {
        newGrid[r][c] = 'SAND';
        processed[r][c] = true;
      }
      // Rule: If a 'PLANT' cell is next to a 'WATER' cell, change the 'WATER' cell to 'VOID' and change either NW, N, or NE to 'PLANT'
      else if (cell === 'PLANT' && (neighbor_n === 'WATER' || neighbor_e === 'WATER' || neighbor_s === 'WATER' || neighbor_w === 'WATER')) {
        if (seed > .6) {
          newGrid[r-1][c-1] = 'PLANT';
        }
        else if (seed > .5) {
          newGrid[r-1][c] = 'PLANT';
        }
        else {
          newGrid[r-1][c+1] = 'PLANT';
        }
      }
    }
  }

  return newGrid;
};

const ZenGarden = () => {
  const canvasRef = useRef(null);

  const createEmptyGrid = () => {
  const grid = new Array(size);
  for (let i = 0; i < size; i++) {
    grid[i] = new Array(size).fill('VOID');
  }
  return grid;
}
  const [selectedType, setSelectedType] = useState('STONE');
  const [brushSize, setBrushSize] = useState(1);
  const [grid, setGrid] = useState(createEmptyGrid()); // You'll want to define a function to create an empty grid.
  
  useEffect(() => {
    axios.get('/api/zen_gardens/1')
      .then(response => setGrid(response.data.grid))
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    // Set up an interval to repeatedly apply the rules
    const intervalId = setInterval(() => {
      // Get the new grid by applying the rules
      const newGrid = applyRules(grid);
  
      // Update the grid state and draw the new grid
      setGrid(newGrid);
      drawGrid(newGrid);
    }, 100); // Repeat every 1000ms (1 second)
  
    // Make sure to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [grid]);

  const drawGrid = (gridToDraw) => {
    const ctx = canvasRef.current.getContext('2d');
    gridToDraw.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        ctx.fillStyle = pixelColors[cell];
        ctx.fillRect(colIndex * pixelSize, rowIndex * pixelSize, pixelSize, pixelSize);
      });
    });
  };

  const drawOnGrid = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    const newGrid = grid.map((rowArr, r) => rowArr.map((cell, c) => {
      // Calculate the Euclidean distance between the clicked point and the current cell
      const distance = Math.sqrt(Math.pow(r - y, 2) + Math.pow(c - x, 2));

      // Check if the distance is within the brush size
      if (distance <= brushSize) {
        return selectedType; // The selected type
      }
      return cell; // Otherwise, return the original cell value
    }));
    setGrid(newGrid);
    drawGrid(newGrid);
    // Post updated grid to server
    axios.patch('/api/zen_gardens/1', { zen_garden: { grid: newGrid } })
      .catch(error => console.error(error));
  };

  const resetGrid = () => {
    // Resetting the grid to an empty grid
    const emptyGrid = createEmptyGrid();
    setGrid(emptyGrid);
    drawGrid(emptyGrid);
    // Optionally, you can send the updated grid to the server
    axios.patch('/api/zen_gardens/1', { zen_garden: { grid: emptyGrid } })
      .catch(error => console.error(error));
  };

  return (
    <div>
      <div className='button-container'>
        {/* Palette */}
        {['STONE', 'SAND', 'WATER', 'PLANT', 'VOID'].map((type,i) => (
          <button
            key={`type-btn-${i}`}
            className={`pixel-type-button ${type.toLowerCase()} ${selectedType === type ? 'selected' : ''}`}
            onClick={() => setSelectedType(type)}
          />
        ))}
      </div>
      <div className='button-container'>
        {/* Brush Size */}
        {[1, 3, 5, 7, 9].map((size, i) => (
          <button 
            className={`brush-size-button ${sizeToClass(size)} ${brushSize === size ? 'selected' : ''}`} 
            onClick={() => setBrushSize(size)}
            key={`size-btn-${i}`}
          >
            <div className={`brush-size-preview ${sizeToClass(size)} ${selectedType.toLowerCase()}`}/>
          </button>
        ))}
      </div>
      <canvas
        id='zen-garden-canvas'
        ref={canvasRef}
        onClick={drawOnGrid}
        width={size * pixelSize} // Adjust the drawing resolution accordingly
        height={size * pixelSize} // Adjust the drawing resolution accordingly
        style={{
          width: `${size * pixelSize}px`, // Adjust the display size accordingly
          height: `${size * pixelSize}px` // Adjust the display size accordingly
        }}
      />
      <div className='button-container'>
        <button
          className='reset-button'
          onClick={resetGrid}
        >
          Reset
        </button>
      </div>
      <NavigationOverlay />
    </div>
  );
};

export default ZenGarden;