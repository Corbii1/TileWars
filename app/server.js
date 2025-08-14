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

async function broadcastGrid() {
  var res = await pool.query('SELECT * FROM board');
  var gridData = res.rows;

  //check for connected groups
  const groups = connectedCells(gridData);
  //update grey groups
  for (const group of groups) {
    if (group.color === 'gray') {
      for (const cell of group.cells) {
        await pool.query('UPDATE board SET color = $1 WHERE x = $2 AND y = $3', ['gray', cell.x, cell.y]);
      }
    }
  }
  res = await pool.query('SELECT * FROM board');
  gridData = res.rows;

  const payload = JSON.stringify({ type: 'grid', data: gridData });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function connectedCells(cells) {
  const groups = [];
  for (const cell of cells) {
    if (cell.color === null) continue;
    const foundGroup = groups.find(group => group.color === cell.color && group.cells.some((c) => c.x === cell.x && c.y === cell.y + 1 || c.x === cell.x + 1 && c.y === cell.y || c.x === cell.x && c.y === cell.y - 1 || c.x === cell.x - 1 && c.y === cell.y));
    if (foundGroup) {
      foundGroup.cells.push(cell);
    } else {
      groups.push({ id: groups.length, color: cell.color, cells: [cell] });
    }
  }

  // Only groups containing the associated team colors' home are playable
  for (const group of groups) {
    if (!teams.some(team => team.team === group.color)) {
      group.color = 'gray';
    }
  }

  return groups;
}

let allConnected = false;

wss.on('connection', async (ws, req) => {

  const clientId = req.url.split('user_id=')[1].split('&')[0];
  console.log('Client connected', clientId);

  if (!connectedUsers.some(user => user.clientId === clientId) && connectedUsers.length < 4) {
    connectedUsers.push({ clientId, teamColor: teams[connectedUsers.length].team, playerLocation: teams[connectedUsers.length].home });
  }

  if (connectedUsers.length === 4 && !allConnected) {
    console.log('All players are connected');
    broadcastGrid();
    allConnected = true;
  }

  ws.send(JSON.stringify({ type: 'player', data: { color: connectedUsers[connectedUsers.length - 1].teamColor, location: connectedUsers[connectedUsers.length - 1].playerLocation } }));

  const res = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100');
  chatMessages = res.rows.length;
  ws.send(JSON.stringify({ type: 'chatHistory', data: res.rows }));

  ws.on('message', async (message) => {
    const msg = JSON.parse(message);

    if (msg.type === 'update') {
      const { x, y, color } = msg;
      await pool.query('UPDATE board SET color = $1 WHERE x = $2 AND y = $3', [color, x, y]);
      await broadcastGrid();
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

