let socket = null;
let gridLoaded = false;
window.addEventListener('load', () => {
  let userId = document.cookie.replace(/(?:(?:^|.*;\s*)user_id\s*\=\s*([^;]*).*$)|^.*$/, '$1');
  if (!userId) {
    const username = getRandomUsername();
    document.cookie = `user_id=${username};`;
    userId = username;
  }
  console.log(userId);
  socket = new WebSocket(`ws://localhost:8080?user_id=${userId}`);

  chatUser = userId;

  socket.onopen = function (event) {
    // Handle connection open
  };

  socket.onmessage = function (event) {
    const msg = JSON.parse(event.data);
    if (msg.type === 'grid') {
      const gridData = msg.data;

      for (let cell of gridData) {
        let domCell = gridArray[cell.x][cell.y];
        domCell.className = 'cell';
        if (cell.color) {
          domCell.classList.add(cell.color);
        }
      }
      gridLoaded = true;
    }
    else if (msg.type === 'chat') {
      addChatMessage(msg.data);
    }
    else if (msg.type === 'chatHistory') {
      msg.data.forEach(addChatMessage);
    } else if (msg.type === 'player') {
      player = msg.data;
      currentCell = gridArray[player.location[0]][player.location[1]];
      updateHighlightedCells();
      currentCell.style.border = "black 1px solid";
      currentCell.style.boxShadow = "inset 0 0 0 1px black";
    } else if (msg.type === 'eliminated') {
      currentCell.style.border = null;
      currentCell.style.boxShadow = null;
      currentCell = null;
      isAlive = false;
    }
  };

  socket.onclose = function (event) {
    // Handle connection close
  };

});

function sendMessage(message) {
  socket.send(message);
}


// --- Chat logic ---
const chatMessagesDiv = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
var chatUser = null;

function addChatMessage(msg) {
  console.log(msg);
  const date = new Date(msg.timestamp || Date.now());
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const name = msg.name ? `<b style="color:${msg.color || '#888'}">${escapeHtml(msg.name)}</b>` : '<b>Anonymous</b>';
  const text = escapeHtml(msg.text);
  const div = document.createElement('div');
  div.innerHTML = `<span style="color:#888">[${time}]</span> ${name}: ${text}`;
  chatMessagesDiv.appendChild(div);
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

chatForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  const name = chatUser.trim() || 'Anonymous';
  if (text) {
    socket.send(JSON.stringify({ type: 'chat', name, text, color: player.color }));
    chatInput.value = '';
  }
});

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[m];
  });
}

var grid = document.getElementById('grid');
let gridSize = 50;
var teams = [
  { team: 'red', home: [0, 0] },
  { team: 'blue', home: [0, 49] },
  { team: 'green', home: [49, 0] },
  { team: 'yellow', home: [49, 49] }
];
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

let player = {
  color: null,
  location: []
}

let currentCell = null;
let hcells = [];

// --- Tile Bank and Timer Logic ---
const tileCountSpan = document.getElementById('tile-count');
const timerCountSpan = document.getElementById('timer-count');
let tileBank = 0;
const tileBankMax = 5;
let timer = 3;

function updateTileBankUI() {
  tileCountSpan.textContent = tileBank;
}

function updateTimerUI() {
  timerCountSpan.textContent = timer;
}

function tileTimerTick() {
  if (tileBank < tileBankMax) {
    timer--;
    updateTimerUI();
    if (timer <= 0) {
      tileBank++;
      updateTileBankUI();
      timer = 3;
      updateTimerUI();
    }
  } else {
    timer = 3;
    updateTimerUI();
  }
}

setInterval(tileTimerTick, 1000);
updateTileBankUI();
updateTimerUI();

let namebase = {
  prefixes: [
    'golden',
    'silver',
    'bronze',
    'bold',
    'brave',
    'silent',
    'strong',
    'fierce',
    'intrepid',
    'cunning',
    'wise',
    'sneaky',
    'quick',
    'lively',
    'agile',
    'sharp'
  ],
  suffixes: [
    'tiger',
    'fox',
    'wizard',
    'goose',
    'donkey',
    'samurai',
    'lion',
    'elephant',
    'monkey',
    'ninja',
    'warrior',
    'pirate',
    'viking',
    'dragon',
    'knight',
  ]
}



function getRandomUsername() {
  const prefix = namebase.prefixes[Math.floor(Math.random() * namebase.prefixes.length)];
  const suffix = namebase.suffixes[Math.floor(Math.random() * namebase.suffixes.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${prefix}_${suffix}${number}`;
}

let isAlive = true;

document.addEventListener('keypress', (event) => {
  if (gridLoaded && isAlive) {
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
        if (tileBank > 0) {
          sendMessage(JSON.stringify({
            type: 'update',
            x: parseInt(currentCell.dataset.row),
            y: parseInt(currentCell.dataset.col),
            color: player.color
          }));
          currentCell.classList = 'cell ' + player.color;
          tileBank--;
          updateTileBankUI();
        }
        break;
      case ' ':
        // Switch team
        let currentTeamIndex = teams.findIndex(team => team.team === player.color);
        currentTeamIndex = (currentTeamIndex + 1) % teams.length;
        player.color = teams[currentTeamIndex].team;
        player.location[0] = teams[currentTeamIndex].team.home[0];
        player.location[1] = teams[currentTeamIndex].team.home[1];
        location = gridArray[player.location[0]][player.location[1]];
        currentCell.style.border = null;
        currentCell.style.boxShadow = null;
        currentCell = location;
        currentCell.style.border = "black 1px solid";
        currentCell.style.boxShadow = "inset 0 0 0 1px black";
        break;

    }
    updateHighlightedCells();

  }
});


function updateHighlightedCells() {
  hcells = [];
  gridArray.forEach(row => row.forEach(cell => {
    cell.style.animationDuration = null;
    cell.style.animationIterationCount = null;
    cell.style.animationName = null;
  }));

  if (player.color) {
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (gridArray[i][j].classList.contains(player.color)) {
          if (hcells.some(cell => cell === gridArray[i][j])) continue;

          const adjacentCells = getAdjacentCells(i, j);
          adjacentCells.forEach(cell => {
            if (!cell.classList.contains(player.color) && cell.style.animationName !== 'highlight-animation') {
              if (hcells.some(cell => cell === gridArray[i][j])) return;
              setTimeout(() => {
                cell.style.animationDuration = '1s';
                cell.style.animationIterationCount = 'infinite';
                cell.style.animationName = 'highlight-animation';
              }, 100); // Delay applied here
              hcells.push(cell);
            }
          });
        }
      }
    }
  }
}

function getAdjacentCells(row, col) {
  const adjacentCells = [];
  if (row - 1 >= 0) adjacentCells.push(gridArray[row - 1][col]);
  if (row + 1 < gridSize) adjacentCells.push(gridArray[row + 1][col]);
  if (col - 1 >= 0) adjacentCells.push(gridArray[row][col - 1]);
  if (col + 1 < gridSize) adjacentCells.push(gridArray[row][col + 1]);
  return adjacentCells;

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
  if (gridArray[newRow][newCol].classList.contains('cell') && (gridArray[newRow][newCol].style.animationName === 'highlight-animation' || gridArray[newRow][newCol].classList.contains(player.color))) {
    currentCell.style.border = null;
    currentCell.style.boxShadow = null;
    currentCell = gridArray[newRow][newCol];
    currentCell.style.border = "black 1px solid";
    currentCell.style.boxShadow = "inset 0 0 0 1px black";

    sendMessage(JSON.stringify({
      type: 'move',
      x: parseInt(currentCell.dataset.row),
      y: parseInt(currentCell.dataset.col),
      color: player.color
    }));
  }
}

updateHighlightedCells();