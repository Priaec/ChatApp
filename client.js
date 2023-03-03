/*** client.js ***/
//define variables
const port = process.argv[3] || 3000;
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
socket.on("connect", (port) => {
    userName = process.argv[2];
    console.log("[User]: Welcome %s", userName);
    //send ip address to the server
    socket.emit('connection',{
        id: socket.id,
        ip: ip.address(),
        userName: userName,
        port: port
    });
    socket.on('broadcast', (data)=>{
        console.log('%s:%s', data.sender, data.msg);
    });
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
    if(input.startsWith('--help'))
        displayHelpDoc();
    if(input.startsWith('--myport'))
        console.log('Server Port: ' + port);
    if(input.startsWith('--myip'))
        console.log('IP Addr: ' + ip.address());
    if(input.startsWith('--list')){
        console.log("Users:");
        //display all of the other clients
        users.forEach((item, i)=>{
            console.log(i + ': '+ item.ip + ' | Port#: ' + port);
        });
    }
});

//when there is a broadcast message from server, display broadcast to the client
socket.on('broadcast', (data)=>{
    console.log('%s:%s', data.sender, data.msg);
});