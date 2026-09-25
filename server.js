const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static('public'));

let online = {};

io.on('connection', (socket) => {
  socket.on('join', (name) => {
    online[name] = socket.id;
    socket.username = name;
    io.emit('online-list', Object.keys(online));
  });

  socket.on('callUser', (data) => {
    if (online[data.to]) {
      io.to(online[data.to]).emit('incomingCall', {
        from: socket.username,
        offer: data.offer,
        isVideo: data.isVideo
      });
    }
  });

  socket.on('answerCall', (data) => {
    if (online[data.to]) {
      io.to(online[data.to]).emit('callAnswered', { answer: data.answer });
    }
  });

  socket.on('ice', (data) => {
    if (online[data.to]) {
      io.to(online[data.to]).emit('ice', data.candidate);
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      delete online[socket.username];
      io.emit('online-list', Object.keys(online));
    }
  });
});

server.listen(process.env.PORT || 3000);
