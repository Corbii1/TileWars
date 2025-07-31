var grid = document.getElementById('grid');


var teams = ['red', 'blue', 'green', 'yellow'];
let gridSize = 100;
for (let i = 0; i < gridSize; i++) {
  let row = document.createElement('div');
  row.className = 'row';
  for (let j = 0; j < gridSize; j++) {
    let cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = i;
    cell.dataset.col = j;
    row.appendChild(cell);
  }
  grid.appendChild(row);
}
let gridArray = Array.from(grid.children).map(row => Array.from(row.children));
//intialize grid with teams in each corner
gridArray[0][0].classList.add('red');
gridArray[0][gridSize - 1].classList.add('blue');
gridArray[gridSize - 1][0].classList.add('green');
gridArray[gridSize - 1][gridSize - 1].classList.add('yellow');

let myTeam = 'red'; //default team
let currentCell = gridArray[0][0];
let teamHome = currentCell;
let hcells = highlightNearbyCells();

document.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
      move('up');
      break;
    case 's':
      move('down');
      break;
    case 'a':
      move('left');
      break;
    case 'd':
      move('right');
      break;
  }
});

function highlightNearbyCells() {
  //iterate through all cells in gridArray with my team
  let highlightedCells = [];
  gridArray.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.classList.contains(myTeam)) {
        //highlight cells in a 3x3 grid around the current cell
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            let newRow = rowIndex + i;
            let newCol = colIndex + j;
            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
              let neighborCell = gridArray[newRow][newCol];
              if (!neighborCell.classList.contains(myTeam)) {
                neighborCell.classList.add('highlight');
                highlightedCells.push(neighborCell);
              }
            }
          }
        }
      }
    });
  }, this);
  return highlightedCells;
}

function updateHighlightedCells() {
  hcells.forEach(cell => {

    //wait for the console to log before removing highlight
    console.log('Removed highlight from:', cell);
    cell.classList.remove('highlight');

  });
  // wait .5 seconds
  setTimeout(() => {
    hcells = highlightNearbyCells();
  }, 10);
}

function move(direction) {

  let row = parseInt(currentCell.dataset.row);
  let col = parseInt(currentCell.dataset.col);

  let newRow = row;
  let newCol = col;

  switch (direction) {
    case 'up':
      newRow = Math.max(0, row - 1);
      break;
    case 'down':
      newRow = Math.min(gridSize - 1, row + 1);
      break;
    case 'left':
      newCol = Math.max(0, col - 1);
      break;
    case 'right':
      newCol = Math.min(gridSize - 1, col + 1);
      break;
  }
  if (gridArray[newRow][newCol].classList.contains('cell') && gridArray[newRow][newCol].classList.contains('highlight') || gridArray[newRow][newCol].classList.contains(myTeam)) {
    gridArray[newRow][newCol].classList.add(myTeam);
    currentCell.classList.remove('current');
    currentCell = gridArray[newRow][newCol];
    updateHighlightedCells();
    // highlight the new current cell
    currentCell.classList.add('current');
  }
}