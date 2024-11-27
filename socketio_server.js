import express from 'express'
import {Server} from 'socket.io'
import http from 'http'
// const http = require('http')
// const express = require('express');
// const socketIO = require('socket.io');
const port = process.env.PORT || 3000
var app = express();
let server = http.createServer(app);
var io = new Server(server,
    {  cors: {
        origin: '*',
    }
    }
);

let players = []

// make connection with user from server side
io.on('connection',
    (socket) => {

        const query = socket.handshake.query

        let data =  {
            username: query.username,
            joinedAt: new Date(),
            avatar : query.avatar
        }
        players.push(data)
        console.log('New user connected');
        
        //emit message from server to user
        socket.broadcast.emit('someone_joined',
           data
        );

        // listen for message from user
        socket.on('createMessage',
            (newMessage) => {
                console.log('newMessage', newMessage);
            });

        socket.on('player-moving', (data) =>{
            socket.broadcast.emit('player-moving', data)
        })
        // when server disconnects from user
        socket.on('disconnect',
            () => {
                console.log('disconnected from user');
                socket.broadcast.emit('someone_left',
                    data
                 );
            });
    });

server.listen(port);