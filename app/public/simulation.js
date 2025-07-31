var grid = document.getElementById('grid');


var teams = [{ team: 'red', home: [0, 0] }, { team: 'blue', home: [0, 49] }, { team: 'green', home: [49, 0] }, { team: 'yellow', home: [49, 49] }];
let gridSize = 50;
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
gridArray[teams[0].home[0]][teams[0].home[1]].classList.add('red');
gridArray[teams[1].home[0]][teams[1].home[1]].classList.add('blue');
gridArray[teams[2].home[0]][teams[2].home[1]].classList.add('green');
gridArray[teams[3].home[0]][teams[3].home[1]].classList.add('yellow');

let myTeam = teams[0]; //default team
let teamHome = gridArray[myTeam.home[0]][myTeam.home[1]];
let currentCell = teamHome;
let hcells = highlightNearbyCells();

let connectedCells = [
  {group : 0, color: 'red', cells: []},
  {group : 1, color: 'blue', cells: []},
  {group : 2, color: 'green', cells: []},
  {group : 3, color: 'yellow', cells: []}
];
function updateConnectedCells() {


  console.log('Connected Cells:', connectedCells);
}



document.addEventListener('keypress', (event) => {
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
    case 'q':
      if (currentCell.classList.contains('cell') && currentCell.classList.contains('current') && !currentCell.classList.contains('red') && !currentCell.classList.contains('blue') && !currentCell.classList.contains('green') && !currentCell.classList.contains('yellow')) {
        currentCell.classList.add(myTeam.team);
        updateHighlightedCells();
        updateConnectedCells();
      } else if (currentCell.classList.contains('cell') && !currentCell.classList.contains(myTeam.team)) {
        // If the current cell is already occupied by another team, remove that team
        let occupiedTeam = Array.from(currentCell.classList).find(cls => teams.map(t => t.team).includes(cls));
        if (occupiedTeam) {
          currentCell.classList.remove(occupiedTeam);
          updateHighlightedCells();
          updateConnectedCells();
        }
      }
      break;
    case ' ':
      // Switch team
      let currentTeamIndex = teams.findIndex(team => team.team === myTeam.team);
      currentTeamIndex = (currentTeamIndex + 1) % teams.length;
      myTeam = teams[currentTeamIndex];

      teamHome = gridArray[myTeam.home[0]][myTeam.home[1]];
      currentCell.classList.remove('current');
      currentCell = teamHome;
      currentCell.classList.add('current');
      updateHighlightedCells();
      updateConnectedCells();
  }
});

function highlightNearbyCells() {
  //iterate through all cells in gridArray with my team
  let highlightedCells = [];
  gridArray.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.classList.contains(myTeam.team)) {
        //highlight 4 cells around the current cell
        let directions = [
          { row: -1, col: 0 }, // Up
          { row: 1, col: 0 }, // Down
          { row: 0, col: -1 }, // Left
          { row: 0, col: 1 }   // Right
        ];
        directions.forEach(dir => {
          let newRow = rowIndex + dir.row;
          let newCol = colIndex + dir.col;
          if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
            let neighborCell = gridArray[newRow][newCol];
            if (neighborCell.classList.contains('cell') && !neighborCell.classList.contains(myTeam.team)) {
              neighborCell.classList.add('highlight');
              highlightedCells.push(neighborCell);
            }
          }
        });
      }
    });
  }, this);
  return highlightedCells;
}

function updateHighlightedCells() {
  hcells.forEach(cell => {

    //wait for the console to log before removing highlight
    cell.classList.remove('highlight');

  });
  setInterval(() => {
    hcells = highlightNearbyCells();
  }, 1);
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
  if (gridArray[newRow][newCol].classList.contains('cell') && gridArray[newRow][newCol].classList.contains('highlight') || gridArray[newRow][newCol].classList.contains('red') || gridArray[newRow][newCol].classList.contains('blue') || gridArray[newRow][newCol].classList.contains('green') || gridArray[newRow][newCol].classList.contains('yellow')) {
    currentCell.classList.remove('current');
    currentCell = gridArray[newRow][newCol];
    updateHighlightedCells();
    updateConnectedCells();
    currentCell.classList.add('current');

  }
}