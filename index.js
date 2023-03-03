function server(){
    /*** server.js ***/
    //define variables
    const port = process.argv[3] || 3000;
    //socket.io library
    const io = require('socket.io')(port);
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
            io.sockets.emit('list', connections);
        });

        //when a user disconnects, display the reason why to the server
        socket.on("disconnect", (reason) => {
            //pull the socket out
            connections = connections.filter((connection)=>{
                return connection.id != socket.id
            });
            //update the connections list to all sockets...notify them that someone has left
            io.sockets.emit('list', connections);
            console.log("\nA client disconnected, reason: %s", reason);
            console.log("Number of clients: %d", io.of('/').server.engine.clientsCount);
        });
        //when a user sends a message, emit it to all clients
        socket.on('broadcast', (data)=>{
            console.log("\n%s", data);
            socket.broadcast.emit("broadcast", data);
        });
    });
}

function client(){
    /*** client.js ***/
    //define variables
    console.log(process.argv[4]);
    const port = process.argv[4] || 3000;
    //socket.io library
    const io = require("socket.io-client");
    //create destination pointer
    const socket = io("http://localhost:" + port);
    //cmd line library
    const readline = require('readline');
    //read file for help and documentation on CMD
    const fs = require('fs');
    //library to get IP address of client
    const ip = require('ip');
    const { listeners } = require("process");
    //users name
    let userName = null;
    let users = [];
    //connecting to server
    console.log("Connecting to the server...");
    //when client has connected to server socket, welcome them in chat room
    socket.on("connect", () => {
        userName = process.argv[3];
        console.log("[User]: Welcome %s", userName);
        //send ip address to the server
        socket.emit('connection',{
            id: socket.id,
            ip: ip.address(),
            userName: userName,
            port: ""
        });
        socket.on('broadcast', (data)=>{
            console.log('%s:%s', data.sender, data.msg);
        });
        //when i recieve code 'list'
        socket.on('list', (data)=>{
            users = data;
        });

    });

    //when the client is disconnected from the server, notify the user and specify reason
    socket.on("disconnect", (reason) => {
        console.log("[INFO]: Client disconnected, reason: %s", reason);
    });

    //function to display helper documentation
    displayHelpDoc = () =>{
        const file = 'help.txt';
        const buffer = fs.readFileSync(file);
        console.log(buffer.toString());
    }

    //interface to read from command line
    const rl = readline.createInterface(
        {
            input: process.stdin,
            output: process.stdout
        }
    );

    //cmd line controller
    rl.on('line', (input)=>{
        if(true === input.startsWith('chat')){
            let str = input.slice(4);
            socket.emit('broadcast', 
            {
                "sender": userName,
                "action": 'broadcast',
                "msg": str,
                "address": ip.address()
            });
        }
        //user types help command
        if(input.startsWith('--help'))
            displayHelpDoc();
        //user wants to know the port connection
        if(input.startsWith('--myport'))
            console.log('Server Port: ' + port);
        //user wants to know their ip address
        if(input.startsWith('--myip'))
            console.log('IP Addr: ' + ip.address());
        //list of all connected users in the chat
        if(input.startsWith('--list')){
            console.log("id: IP address      Port No.");
            //display all of the other clients
            users.forEach((item, i)=>{
                console.log((i + 1) + ': '+ item.ip + ' | Port#: ' + port);
            });
        }
        if(input.startsWith('--connect')){

        }
    });
}

//regex for checking ip address
function isIP(input){
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input))
        return (true)    
    return (false)  
}

//main
//node index server 8080
console.log(process.argv[2]);
if(process.argv[2] == 'server'){
    server();
}
else if(process.argv[2] == 'client'){
    client();
}
