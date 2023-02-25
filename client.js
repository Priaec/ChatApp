/*** client.js ***/
const io = require("socket.io-client");
const socket = io("http://localhost:3000");
const readline = require('readline');
let nickname = null;
console.log("Connecting to the server...");
socket.on("connect", () => {
    nickname = process.argv[2];
    console.log("[User]: Welcome %s", nickname);
});
socket.on("disconnect", (reason) => {
    console.log("[INFO]: Client disconnected, reason: %s", reason);
});

const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);
//when a user types on the running command line, this function is executed
rl.on('line', (input)=>{
    if(true === input.startsWith('b;')){
        let str = input.slice(2);
        socket.emit('broadcast', 
        {
            "sender": nickname,
            "action": 'broadcast',
            "msg": str
        });
    }
});

//send the data to the server, this can also be used to insert data into a DB
socket.on('broadcast', (data)=>{
    console.log('%s', data.msg);
})