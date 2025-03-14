# ChatApp
Description:
    Peer 2 Peer chat application on the terminal

Tech Stack:
    Node.js
    Socket.IO

Contributors:
    Joshua Cohen
    Sergio

Dependencies:
    node.js
    socket.io-client
    socket.io
    nodemon

FUNCTIONS:
    NOTE:
        Each argument is separated by a white_space
    --help (Sergio)
        Display help.txt which is a document with helpful information regarding how to operate this application
    --myip (Sergio)
        Give back the user their IP address they are connected on
    --myport (Sergio)
        Give back the user their port they are conencted on
    chat <message> (Joshua)
        Sends message to everyone in the server
    --connect <destination (IP address)> <port no>
        Creates a new connection at the specified <destination> and <port no>.   
    --list 
        Creates a table for the client to see who is connected to the server
    --terminate <connection ID> (Joshua)
        Terminates a connection given the connection ID
            Connection ID has an IP address and port # associated with ID
        Must have connected with someone in order to use this command
    send <connection id> <message> (Joshua)
        Sends the message to the IP address associated with the connection ID
        NOTE: Suggested to use --list prior at least once in order to see the connection id's
    exit (Joshua)
        Terminates the process completely. If you are connected to someone, they will be notified you dropped the connection


Example of running application
    1. Open 3 terminals
      For each write this:
        1. node index.js server 8080
            node <file> <client/[server]> <listening port no.>
        2. node index.js client Joshua 8080
            node <file> <[client]/server> <Name of user (no duplicate names)> <listening port no. of server>
        3. node index.js client Joe 8080
            node <file> <[client]/server> <Name of user (no duplicate names)> <listening port no. of server>
    2. On Terminal 2:
        --chat 'YOUR_MSG'
            'YOUR_MSG' will appear to both Joshua and Joe
        --list (Should output this):
            1: 192.168.86.248 | Port#: 53160 | userName: Joshua 
            2: 192.168.86.248 | Port#: 53184 | userName: Joe
        --connect 192.168.86.248 53184
                        |          |
                    <DEST IP>  <Dest Port>
        send 2 Hello Joe
             |     \--|
             |      \-|
         <conn ID>  <msg>




# Youtube video structure
    1. 