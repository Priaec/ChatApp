const port = 3000;
const io = require('socket.io')(port);

console.log('Server is listening on port: %d', port);

//when a new member is connected to out server, run this function
io.of("/").on("connect", (socket) => {
    console.log("A client connected");
    //when a user disconnects, display the reason why
    socket.on("disconnect", (reason) => {
        console.log("\nA client disconnected, reason: %s", reason);
        console.log("Number of clients: %d", io.of('/').server.engine.clientsCount);
    });
});

//
io.of('/').on("connect", (socket)=>{
    //
    socket.on('broadcast', (data)=>{
        console.log("\n%s", data);
        socket.broadcast.emit("broadcast", data);
    });
});