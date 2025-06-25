const io = require('socket.io')(3000, { cors: { origin: "*" } });
let users = {};

io.on('connection', socket => {
  socket.on('login', username => {
    users[socket.id] = username;
    io.emit('update-users', Object.values(users));
  });

  socket.on('disconnect', () => {
    io.emit('update-disconnected', users[socket.id]);

    delete users[socket.id];
    io.emit('update-users', Object.values(users));
  });
});
