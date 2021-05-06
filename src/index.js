const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const { InMemorySessionStore } = require("../sessionStore");
const sessionStore = new InMemorySessionStore();

const { InMemoryMessageStore } = require("../messageStore");
const messageStore = new InMemoryMessageStore();

app.get('/', function(req, res) {
    res.render('index.ejs');
});

io.sockets.on('connection', function(socket) {

    // trying to save previous chats
    const users = [];
    const messagesPerUser = new Map();
    messageStore.findMessagesForUser(socket.userID).forEach((message) => {
      const { from, to } = message;
      const otherUser = socket.userID === from ? to : from;
      if (messagesPerUser.has(otherUser)) {
        messagesPerUser.get(otherUser).push(message);
      } else {
        messagesPerUser.set(otherUser, [message]);
      }
    });

    sessionStore.findAllSessions().forEach((session) => {
      users.push({
        userID: session.userID,
        username: session.username,
        connected: session.connected,
        messages: messagesPerUser.get(session.userID) || [],
      });
    });
    socket.emit("users", users);


    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' join the chat..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
    })

    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
        console.log(message); 
        // socket.to(to).to(socket.userID).emit("chat_message", message);
        messageStore.saveMessage(message);
        });
        // ...

});

const server = http.listen(8080, function() {
    console.log('listening on *:8080');
});