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

const gridSize = 50;
const teams = [
  { team: 'red', home: [0, 0] },
  { team: 'blue', home: [0, 49] },
  { team: 'green', home: [49, 0] },
  { team: 'yellow', home: [49, 49] }
];

async function initializeGrid() {
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
  const res = await pool.query('SELECT * FROM board');
  const gridData = res.rows;
  const payload = JSON.stringify({ type: 'grid', data: gridData });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', async (ws) => {
    console.log('Client connected');

    const res = await pool.query('SELECT * FROM board');
    ws.send(JSON.stringify({ type: 'grid', data: res.rows }));

    ws.on('message', async (message) => {
      const msg = JSON.parse(message);

      if (msg.type === 'update') {
        const { x, y, color } = msg;
        await pool.query('UPDATE board SET color = $1 WHERE x = $2 AND y = $3', [color, x, y]);
        await broadcastGrid();
      }
    });

    ws.on('close', function () {
        console.log('Client disconnected');
    });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});

initializeGrid();
