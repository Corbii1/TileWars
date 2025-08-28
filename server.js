const pg = require("pg");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";
const index = '/public/index.html';

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
});

var server = app.use((res) => res.sendFile(index, { root: __dirname })).listen(port, () => console.log(`Listening on port ${port}`));
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

const connectedUsers = new Map();

let numConnected = 0;
let chatMessages = 0;

const gridSize = 10;
const teams = [
  { team: 'red', home: [0, 0] },
  { team: 'blue', home: [0, gridSize - 1] },
  { team: 'green', home: [gridSize - 1, 0] },
  { team: 'yellow', home: [gridSize - 1, gridSize - 1] }
];

async function initializeGrid() {
  await pool.query('DELETE FROM messages');
  await pool.query('DELETE FROM board');
  await pool.query('DELETE FROM players');

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
        checkEliminated = await pool.query('SELECT * FROM players WHERE x = $1 AND y = $2', [cell.x, cell.y]);
        if (checkEliminated.rows.length > 0) {
          await pool.query('UPDATE players SET alive = FALSE WHERE id = $1', [checkEliminated.rows[0].id]);
          const user = connectedUsers.get(checkEliminated.rows[0].id);
          user.send(JSON.stringify({ type: 'eliminated' }));
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

  const playerIdExists = await pool.query('SELECT * FROM players WHERE id = $1', [clientId]);

  console.log(playerIdExists.rows);

  var team, color, location, alive;

  if (playerIdExists.rows.length === 0) {
    team = teams[Math.floor(Math.random() * teams.length)];
    if (numConnected < 4) {
      team = teams[numConnected];
    }

    color = team.team;
    console.log("Assigning team", color);
    location = team.home;
    alive = true;

    await pool.query(`INSERT INTO players (id, color, x, y) VALUES ($1, $2, $3, $4)`, [clientId, color, location[0], location[1]]);
  } else {
    color = playerIdExists.rows[0].color;
    location = [playerIdExists.rows[0].x, playerIdExists.rows[0].y];
    alive = playerIdExists.rows[0].alive;
  }
  
  connectedUsers.set(clientId, ws);
  ws.send(JSON.stringify({ type: 'player', data: { color: color, location: location, alive: alive } }));
  numConnected++;

  if (!allConnected && numConnected >= 4) {
    console.log('All players are connected');
    allConnected = true;
    update();
  } else if (allConnected) {
    update();
  }

  const res = await pool.query('SELECT * FROM messages ORDER BY timestamp ASC LIMIT 100');
  chatMessages = res.rows.length;
  ws.send(JSON.stringify({ type: 'chatHistory', data: res.rows }));

  ws.on('message', async (message) => {
    const msg = JSON.parse(message);

    if (msg.type === 'update') {
      const { x, y, color } = msg;
      await pool.query('UPDATE board SET color = $1 WHERE x = $2 AND y = $3', [color, x, y]);
      await update();
    } else if (msg.type === 'move') {
      const { x, y, id } = msg;
      await pool.query('UPDATE players SET x = $1, y = $2 WHERE id = $3', [x, y, id]);
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
      if (chatMessages < 100) {
        chatMessages++;
      } else {
        await pool.query('DELETE FROM messages ORDER BY timestamp ASC LIMIT 1');
      }
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat', data: chatMsg }));
        }
      });
    }
  });


  ws.on('close', () => {
    connectedUsers.delete(clientId);
    console.log('Client disconnected', clientId);
    numConnected--;
  });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});


initializeGrid();

