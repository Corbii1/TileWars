const pg = require("pg");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
});

app.use(express.json());
app.use(express.static("public"));

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const connectedUsers = [];

let chatMessages = 0;

const gridSize = 50;
const teams = [
  { team: 'red', home: [0, 0] },
  { team: 'blue', home: [0, 49] },
  { team: 'green', home: [49, 0] },
  { team: 'yellow', home: [49, 49] }
];

async function initializeGrid() {
  await pool.query('DELETE FROM messages');
  await pool.query('DELETE FROM board');

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let team = null;
      for (let t of teams) {
        if (t.home[0] === i && t.home[1] === j) team = t.team;
      }
      await pool.query('INSERT INTO board (x, y, color) VALUES ($1, $2, $3)', [i, j, team]);
    }
  }
}

async function update() {
  var res = await pool.query('SELECT * FROM board');
  var gridData = res.rows;
  //check for connected groups
  const groups = connectedCells(gridData);
  //update gray groups
  for (const group of groups) {
    if (group.color === 'gray') {
      for (const cell of group.cells) {
        await pool.query('UPDATE board SET color = $1 WHERE x = $2 AND y = $3', ['gray', cell.x, cell.y]);
        if (connectedUsers.some(user => user.playerLocation[0] === cell.x && user.playerLocation[1] === cell.y)) {
          //TODO mark player as eliminated
          const user = connectedUsers.find(user => user.playerLocation[0] === cell.x && user.playerLocation[1] === cell.y);
          user.ws.send(JSON.stringify({ type: 'eliminated' }));
        }
      }
    }
  }

  const payload = JSON.stringify({ type: 'grid', data: gridData });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function connectedCells(cells) {
  const visited = new Set();
  const groups = [];

  for (const cell of cells) {
    if (cell.color === null) continue;
    if (!visited.has(cell)) {
      const group = { id: groups.length, color: cell.color, cells: [] };
      const queue = [cell];

      while (queue.length > 0) {
        const currentCell = queue.shift();
        visited.add(currentCell);
        group.cells.push(currentCell);

        const adjacentCells = getAdjacentCells(currentCell.x, currentCell.y, cells);
        for (const adjacentCell of adjacentCells) {
          if (adjacentCell.color !== cell.color) {
            continue;
          }
          if (!visited.has(adjacentCell)) {
            queue.push(adjacentCell);
          }
        }
      }

      groups.push(group);
    }
  }
  for (const group of groups) {
    let hasHome = false;
    for (const team of teams) {
      if (group.cells.some(cell => cell.x === team.home[0] && cell.y === team.home[1])) {
        hasHome = true;
        break;
      }
    }
    if (!hasHome) {
      group.color = 'gray';
      group.cells.forEach(c => c.color = 'gray')
    }
  }
  console.log(groups);
  return groups;
}


function getAdjacentCells(row, col, cells) {
  const adjacentCells = [];
  if (row - 1 >= 0) adjacentCells.push(cells.find(cell => cell.x === row - 1 && cell.y === col));
  if (row + 1 < gridSize) adjacentCells.push(cells.find(cell => cell.x === row + 1 && cell.y === col));
  if (col - 1 >= 0) adjacentCells.push(cells.find(cell => cell.x === row && cell.y === col - 1));
  if (col + 1 < gridSize) adjacentCells.push(cells.find(cell => cell.x === row && cell.y === col + 1));
  return adjacentCells;

}

let allConnected = false;

wss.on('connection', async (ws, req) => {

  const clientId = req.url.split('user_id=')[1].split('&')[0];
  console.log('Client connected', clientId);

  if (!connectedUsers.some(user => user.clientId === clientId) && connectedUsers.length < 4) {
    connectedUsers.push({ ws, clientId, teamColor: teams[connectedUsers.length].team, playerLocation: teams[connectedUsers.length].home });
  } else if (connectedUsers.some(user => user.clientId === clientId)) {
    connectedUsers.find(user => user.clientId === clientId).ws = ws;
  }

  ws.send(JSON.stringify({ type: 'player', data: { color: connectedUsers[connectedUsers.length - 1].teamColor, location: connectedUsers[connectedUsers.length - 1].playerLocation } }));

  if (connectedUsers.length === 4 && !allConnected) {
    console.log('All players are connected');
    update();
    allConnected = true;
  }

  const res = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100');
  chatMessages = res.rows.length;
  ws.send(JSON.stringify({ type: 'chatHistory', data: res.rows }));

  ws.on('message', async (message) => {
    const msg = JSON.parse(message);

    if (msg.type === 'update') {
      const { x, y, color } = msg;
      await pool.query('UPDATE board SET color = $1 WHERE x = $2 AND y = $3', [color, x, y]);
      await update();
    } else if (msg.type === 'move') {
      const { x, y, color } = msg;
      connectedUsers[connectedUsers.indexOf(connectedUsers.find(user => user.teamColor === color))].playerLocation = [x, y];
    } else if (msg.type === 'chat') {
      const chatMsg = {
        name: msg.name || 'Anonymous',
        text: msg.text,
        color: msg.color
      };
      await pool.query(
        `INSERT INTO messages (name, text${chatMsg.color ? `, color` : ''}) VALUES ($1, $2${chatMsg.color ? `, $3` : ''})`,
        chatMsg.color ? [chatMsg.name, chatMsg.text, chatMsg.color] : [chatMsg.name, chatMsg.text]
      );
      chatMessages++;
      if (chatMessages > 100) {
        await pool.query('DELETE FROM messages ORDER BY timestamp ASC LIMIT 1');
        chatMessages--;
      }
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat', data: chatMsg }));
        }
      });
    }
  });


  ws.on('close', () => {
    console.log('Client disconnected', clientId);
  });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});


initializeGrid();

