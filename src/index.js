const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const Filter = require('bad-words'); // stops bad words from being entered
const {
  generateMessage,
  generateLocationMessage
} = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils/users');

//this extracts the port heroku sets and sets it to 3000 locally
const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// let count = 0;
io.on('connection', socket => {
  //console.log('Web socket io connected', socket);
  console.log('Web socket io connected');

  // socket.emit to single client
  // io emit all connections
  // broadcast goes to every connection except current client

  // list for join event
  socket.on('join', ({ username, room }, callback) => {
    // destructing what is returned potentially error, or user
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }
    socket.join(user.room); //uses user because that has been trimmed and converted to lowercase
    // this will only emit events to users in that room
    socket.emit(
      'welcomeMessage',
      generateMessage(`Welcome aboard to the ${room} room ${user.username}!`)
    );
    socket.broadcast
      .to(user.room) //uses user because that has been trimmed and converted to lowercase
      .emit('message', generateMessage(`${user.username} has joined`));

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    //callback sends back the acknowledgment that group was joined
    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    //console.log('test', user.room);

    //callback sends back the acknowledgment that message was received
    // check for profanity
    const filter = new Filter();

    if (filter.isProfane(message)) {
      //only if true
      return callback('Profanity is not allowed');
    }

    // send message to ALL clients
    // io.emit('message', generateMessage(message));
    //callback(); // try removing this

    // only send message to users in the same room
    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  });

  // receives event
  socket.on('locationMessage', () => {});

  socket.on('sendLocation', (locationCoords, callback) => {
    const user = getUser(socket.id);
    //callback sends back the acknowledgment that message was received
    if (locationCoords.length === 0) {
      return callback('no Coordinates');
    }
    // console.log(
    //   'test',
    //   generateLocationMessage(
    //     `https://google.com/maps?q=${locationCoords.latitude},${locationCoords.longitude}`
    //   )
    // );
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${locationCoords.latitude},${locationCoords.longitude}`
      )
    );

    // io.emit(
    //   'message',
    //   `https://google.com/maps?q=${locationCoords.latitude},${locationCoords.longitude}`
    // );
    callback();
  });

  //when user disconnects
  socket.on('disconnect', () => {
    // remove the user when they disconnect
    // returns either an error our user
    const user = removeUser(socket.id);

    // user could have tried to join room but failed, we only want to send messages
    // for users that joined successfully
    if (user) {
      // console.log('Left', user);
      //send message to all connected users
      io.to(user.room).emit(
        'message',
        generateMessage(`${user.username} has left! the ${user.room} room`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

//starts the server
server.listen(port, () => {
  console.log(`Hello server running on port ${port}!`);
});
