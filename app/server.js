const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

app.use(express.static("public"));

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('Client connected');

    ws.on('message', function incoming(message) {
        console.log('Received: %s', message);
        ws.send(`${message}`);
    });


    ws.on('close', function () {
        console.log('Client disconnected');
    });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});