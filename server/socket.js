// server/socket.js
const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
    io = new Server(server, { cors: { origin: '*' } });
    io.on('connection', (socket) => {
        console.log('socket connected', socket.id);
    });
    return io;
}

function getIO() {
    return io;
}

module.exports = { initSocket, getIO };
