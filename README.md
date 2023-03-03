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

How to start:
     1. Install dependencies listed above
#    2. Run 'node index "client or server" port#' in a terminal
        a. port# is reffering to server port number, even on client if 8080 use 8080 when executing client terminal as well or it will not work
#    3. Run 'node index client YOUR_NAME port#' in a separate terminal
        a. You should see client connected on server side
        b. You should see connected on client side
#    4. Run another instance of 'node client OTHER_NAME port#' in a separate terminal
        a. again client connected on server.js
        b. again welcome OTHER_NAME on client.js
     5. Write a text
        a. FORMAT: 'chat MESSAGE'
        b. should see the message on the other client 

