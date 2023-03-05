//const { connect } = require("http2");
function server() {
  /*** server.js ***/
  //define variables
  const port = process.argv[3] || 3000;
  //socket.io library
  const io = require("socket.io")(port);
  //State server is now running
  console.log("Server is listening on port: %d", port);
  //list of socket objects, each object has id, ip, port, nickname
  let connections = [];
  //server controller
  io.of("/").on("connect", async(socket) => {
    //console.log({rooms: io.sockets.adapter.rooms});
    console.log("A client connected");
    //when connection is made for the first time
    socket.on("connection", (data) => {
      //check if name exists in clients, if so reject the socket
        if(nameExists(data.userName,connections)){
          socket.disconnect(true);
          return;
        }
        data.port = socket.request.connection.remotePort;
        connections.push(data);
        console.log(connections);
        io.sockets.emit("list", connections);
    });

    //when a user disconnects, display the reason why to the server
    socket.on("disconnect", (reason) => {
      //pull the socket out
      connections = connections.filter((connection) => {
        return connection.id != socket.id;
      });
      //update the connections list to all sockets...notify them that someone has left
      io.sockets.emit("list", connections);
      console.log("\nA client disconnected, reason: %s", reason);
      if(reason == 'server namespace disconnect')
        console.log('Number of clients: %d', io.of("/").server.engine.clientsCount - 1);
      else
        console.log("Number of clients: %d", io.of("/").server.engine.clientsCount);
    });
    //when a user sends a message, emit it to all clients
    socket.on("broadcast", (data, room) => {
      console.log({broadcast: data, room: room});
      //console.log("\n%s%s", data, room);
      if(room === '')
        socket.broadcast.emit("broadcast", data);
      else
        socket.to(room).emit("broadcast", data);
    });

    //when a new connection is created
    socket.on('new-room',(data, callback)=>{
      socket.join(data.roomName);
      callback({
        status: 'ok'
      })
    });

    //chat in private room response
    //roomName: destination ID (peer B)
    socket.on('chat-msg', ({roomName, msg, userName}) =>{
      console.log({roomName: roomName, msg: msg, userName: userName});
      io.to(roomName).emit('chat-msg', {msg, userName});
    });

    // Server listens for the 'joinRoom' event
    socket.on('joinRoom', ({ roomName, peerId }) => {
      socket.join(roomName);
      // You can also emit a message to the other peer (peer B) to let them know that they've been added to the room
      io.to(peerId).emit('addedToRoom', roomName);
    });


    //check if there is a connection with socket and destination id
    socket.on('checkIfConnection', (data, callback)=>{
      //data.id, data.destId
      let response = false;
      const socketsInRoom = io.sockets.adapter.rooms.get(data.destId);
      socketsInRoom.forEach((socketId)=>{
        if(socketId == data.id)
          response = true;
      });
      //callback object
      callback({
        response: response
      });
    });

    socket.on("terminate", (data, callback)=>{
      //data has two arguments, id of the user, and id of the desired termination socket
      //id: user.id,
      const roomName = data.destId;
      //destId: terminateUser.id
      socket.leave(data.destId);
      //console.log({rooms: io.sockets.adapter.rooms});
      io.to(data.destId).emit('leave-room', {userID: data.id});
      callback({
        status: 'ok'
      });
    });
    //join a specific room
    socket.on("joinRoom", (data, callback)=>{
      socket.join(data);
      //pass the room back form storage
      callback({
        status: 'ok',
        room: data
      })
    });
  });
}

//check if there is a duplicate name in the array, used for new socket connections,
//sockets must be unique
function nameExists(name, users){
  for(let i = 0; i < users.length; i++){
    if(name == users[i].userName)
      return true;
  }
  return false;
}

function client() {
  /*** client.js ***/
  //define variables
  const ip = require("ip");
  console.log(process.argv[4]);
  const port = process.argv[4] || 3000;
  //socket.io library
  const io = require("socket.io-client");
  //create destination pointer
  const socket = io('http://'+ip.address()+':'+ port);
  //const socket = io("http://localhost:" + port);
  //cmd line library
  const readline = require("readline");
  //read file for help and documentation on CMD
  const fs = require("fs");
  //library to get IP address of client
  const { listeners } = require("process");
  //users name
  let userName = null;
  //list of all users that are joined in the chat room
  let users = [];
  //current User
  let user = {};
  //used to not resend information to client more than once in some functions
  let flag = 0;
  //destination socket (ID of socket)
  let destination = "";
  //log previous command
  let prev = "";
  //room we are currently connected in, if '', that means we are not connected to anyone in particular
  let room = '';
  //connecting to server
  console.log("Connecting to the server...");
  //when client has connected to server socket, welcome them in chat room
  socket.on("connect", () => {
    userName = process.argv[3];
    console.log("[User]: Welcome %s", userName);
    //send ip address to the server
    user = {
        id: socket.id,
        ip: ip.address(),
        userName: userName,
        port: ""
    }
    socket.emit("connection", user);
    socket.on("broadcast", (data) => {
      console.log("%s:%s", data.sender, data.msg);
    });
    //when i receive code 'list'
    socket.on("list", (data) => {
      //reupdate list of users when new socket is connected into server
        users = data;
        if(flag <= 0){
          //set current port num the user.port field
          const id = getUser(userName, users);
          const userPort = getPort(id, users);
          user.port = userPort;
        }
        //set the port field of current user
        flag++;
    });
  });

  //once connected with someone, peer B recieves this message
  socket.on('addedToRoom', (roomName)=>{
    //if the person that you are connected with is now connected to you, too, mention two way connection established
    if(roomName == room)
      console.log('Established 2 way connection with: ' + roomName);
    else{
      console.log('You are now connected with: ' + roomName);
      console.log('Connect back with them to respond to them, if you have not already!');
    }
  });

  //once chat has been sent to room, notify peers
  socket.on('chat-msg' ,({msg, userName})=>{
    //get the information regarding that user
    const sender = getUserObj(userName, users);
    console.log('\nMessage recieved from ' + sender.ip);
    console.log("Sender's Port: " + sender.port);
    console.log('Message: "' + msg + '"\n');
    //we have id, we need port and ip
    //console.log(userName + ": " + msg);
  })

  //when user leaves or terminates connection, send this to peer B
  socket.on('leave-room', ({userID})=>{
    console.log(userID + ' disconnected from you');
  });

  //when the client is disconnected from the server, notify the user and specify reason
  socket.on("disconnect", (reason) => {
    console.log("[INFO]: Client disconnected, reason: %s", reason);
    process.exit();
  });

  //function to display helper documentation
  displayHelpDoc = () => {
    const file = "help.txt";
    const buffer = fs.readFileSync(file);
    console.log(buffer.toString());
  };

  //interface to read from command line
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  //cmd line controller
  rl.on("line", (input) => {
    const args = input.split(' ');
    if (true === input.startsWith("chat")) {
      let str = input.slice(4);
      socket.emit("broadcast", {
        sender: userName,
        action: "broadcast",
        msg: str,
        address: ip.address(),
      }, destination);
    }
    //final version of chat message
    if(input.startsWith('send')){
      if(room == ''){
        return console.log('Must be connected to someone to send message to them only');
      }
      //get the id of the user we want to send to
      const destIndex = parseInt(args[1]);
      //lookup destination object given the id
      const destUser = users[destIndex - 1];
      //check if we made a room with this person
        //there has to be a connection by this point
        const msg = args.filter((val, index)=>{
          return index >= 2;
        });
        //reformat the message into one string
        let readyMsg = ' ';
        msg.forEach((word)=>{
          readyMsg += (word + ' ');
        })
        socket.emit('chat-msg', {
          roomName: destUser.id,
          msg: readyMsg,
          userName: user.userName
        });
    }

    //user wants their information of their socket
    if(input.startsWith("--myinfo")){
      console.log({userInformation: user});
      prev = '--myinfo';
    }
    //user types help command
    if (input.startsWith("--help")){
      displayHelpDoc()
      prev = '--help';
    };
    //user wants to know the port connection
    if (input.startsWith("--myport")){
      //get the id of the user based off of the userName
        const id = getUser(userName, users);
        const userPort = getPort(id, users);
        console.log("Port: " + userPort);
        prev = '--myport';
    }
    //user wants to know their ip address
    if (input.startsWith("--myip")){
      console.log("IP Addr: " + ip.address());
      prev = '--myip';
    }
    //list of all connected users in the chat
    if (input.startsWith("--list")) {
      console.log("id: IP address      Port No.       UserName");
      //display all of the other clients
      users.forEach((item, i) => {
        if(item.id == user.id)
          console.log(i + 1 + ": " + item.ip + " | Port#: " + item.port + " | userName: " + item.userName + ' (ME)');
        else if(item.id == room)
          console.log(i + 1 + ": " + item.ip + " | Port#: " + item.port + " | userName: " + item.userName + ' (Connected To)');
        else
          console.log(i + 1 + ": " + item.ip + " | Port#: " + item.port + " | userName: " + item.userName);
      });
      prev = "--list";
    }
    if (input.startsWith("--connect")) {
      console.log(args[1]);
      //check if IP address is valid 
      if(!isIP(args[1]))
        return console.log('Invalid IP');
      //find destination id from given port and ip address combination
      const destId = getID(args[1],args[2],users);
      if(destId == "")
        return console.log('Ip Address and/or Port not in use')
      //check if its me
      if(destId == user.id)
        return console.log({error: 'Connection to oneself, aborted'});
      if(room != '')
        return console.log({error: 'You must terminate connection with user before connecting to new user'});
      //find the id of the user based off the ip address and port #
      console.log('connecting to user...');
      //set the destination socket id as a global to connect via a room
      //create room with current user and the specified user
      prev = '--connect';
      // Peer A asks server to establish connection between peer A and B
      socket.emit('joinRoom', {
        roomName: user.id,
        peerId: destId
      },
      (response)=>{
        //we we connected to a room
        if(response.status == 'ok'){
          //set connected room to variable
          room = response.room.peerId;
          console.log({success: 'Connected with socket (id): ' + room});
        }
      });
    }
    if(input.startsWith('--terminate')){
      //if you have not made a connection to someone, return, you dont need to do anything here
      if(room == '')
        return console.log('No one way connection exists');
      //we know we are connected to someone at the moment
      let terminateUser = {};
      //if the user used --list command before this one
      if(prev != '--list')
        return console.log('Invalid input, try command --list before using --terminate');
      let termIndex = parseInt(args[1]);
      if(typeof(termIndex) != 'number')
        return console.log('Invalid id, try again')
      //we know we added correct value
      //user we want to teminate room with
      terminateUser = users[termIndex - 1];
      if(terminateUser.id == user.id)
        return console.log('Invalid id: this is your port, you cannot remove your connection with yourself');
      //all inputs are valid, terminate connection with user
      socket.emit('terminate', {
        id: user.id,
        destId: terminateUser.id
      },(response)=>{
        //if we get an okay message, we disconnected from the room, set room variable to nothing
        if(response.status == 'ok'){
          room = '';
          console.log('Disconnected from user');
        }
      });
      destination = "";
    }
    //when ar user exits
    if(input.startsWith('exit')){
      //terminate connection with room
      console.log(room);
      //if no room, then just exit
      if(room != ''){
        socket.emit('terminate',{
          id: user.id,
          destId: room
        },(response)=>{
          if(response.status == 'ok')
            console.log('Disconnected from connected user!');  
        });
      }
      console.log('Terminating Process');
      //exit the process
      process.exit();
    }
  });
}

//regex for checking ip address
function isIP(input) {
  if (
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      input
    )
  )
    return true;
  return false;
}

//socket lookups

//returns id of user
function getUser(name, users){
    for(let i = 0; i < users.length; i++){
        if(name == users[i].userName)
            return users[i].id;
    }
    return "";
}

//specify port and ip address, will locate the id of that user
function getID(ip, port,users){
  for(let i=0;i<users.length;i++){
    if(ip == users[i].ip && port == users[i].port)
      return users[i].id
  }
  return "";
}

//returns port of user, give id to it
function getPort(id, users){
    for(let i = 0; i < users.length; i++){
        if(id == users[i].id)
            return users[i].port;
    }
    return "";
}

//gets the whole user object back, give it the name and the set of users to look through
function getUserObj(name, users){
  for(let i=0; i < users.length; i++){
    if(name == users[i].userName)
      return users[i];
  }
  return "";
}

//check if the person is still connected into the main room
function isUserConnected(id, users){
  for(let i=0;i<users.length;i++){
    if(users[i].id == id)
      return true;
  }
  return false;
}

//main
//node index server 8080
if (process.argv[2] == "server") {
  server();
} else if (process.argv[2] == "client") {
  client();
}