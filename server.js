/*** server.js ***/
//define variables

const port = process.argv[2] || 3000;
//socket.io library
const io = require('socket.io')(port);
//
const requestIP = require('request-ip');
//State server is now running
console.log('Server is listening on port: %d', port);
//list of socket objects, each object has id, ip, port, nickname
let connections = [];
//server controller
io.of("/").on("connect", (socket) => {
    console.log("A client connected");
    //when connection is made for the first time
    socket.on("connection", (data)=>{
        connections.push(data);
        console.log(connections);
        socket.emit('list', connections);
    })

    //when a user disconnects, display the reason why to the server
    socket.on("disconnect", (reason) => {
        console.log("\nA client disconnected, reason: %s", reason);
        console.log("Number of clients: %d", io.of('/').server.engine.clientsCount);
    });
    //when a user sends a message, emit it to all clients
    socket.on('broadcast', (data)=>{
        console.log("\n%s", data);
        socket.broadcast.emit("broadcast", data);
    });
});
