var express = require("express")
var socket = require("socket.io")

//app setup
var app = express();
var server = app.listen(5000,function(){
    console.log("Server is up on http://"+getIp()+":5000")
});

//static files
app.use(express.static("public"))

//socket setup
var io = socket(server)

var clientId=0
var lookup=[]
var isActiveLookup=[]

//useful source
//https://gist.github.com/alexpchin/3f257d0bb813e2c8c476


io.on("connection",function(socket){
    socket.id=clientId++
    lookup[socket.id]=socket
    isActiveLookup[socket.id]=true
    lookup[socket.id].emit("serverPrivate",socket.id)
    console.log("client connected on socket: ",socket.id +" Current active sockets: "+getTotalActiveSockets())
    io.sockets.emit("serverMessage","new connection on socket: "+socket.id+". Current active sockets: "+getTotalActiveSockets())
    io.sockets.emit("newPlayer",{
        random: Math.random(),
        id: socket.id
    });

    //listen for data
    socket.on("playerdata",function(data){
        socket.broadcast.emit("playerdata",{
            position: data.position,
            colorId: data.colorId,
            id: socket.id
        })//needs to be scrubbed
    });

    socket.on("fireBullet",function(data){
        socket.broadcast.emit("fireBullet",{
            startPosition: data.startPosition,
            colorId: data.colorId,
            direction: data.direction,
            bulletId: data.bulletId,
            shooterId: socket.id
        })//needs to be scrubbed
    });

    socket.on("amHit",function(data){
        socket.broadcast.emit("amHit",{
            bulletId: data.bulletId,
            shooterId: data.shooterId,
            hitPlayerId: socket.id
        })//needs to be scrubbed
    });

    socket.on("IDead",function(data){
        socket.broadcast.emit("IDead",socket.id)
    });

    socket.on('disconnect', function(){
        console.info('user disconnected from socket: ' + socket.id+" Current active sockets: "+getTotalActiveSockets());
        isActiveLookup[socket.id]=false
        io.sockets.emit("serverMessage","user disconnected on socket: "+socket.id+". Current active sockets: "+getTotalActiveSockets())
        io.sockets.emit("serverPlayerDisconnect",socket.id)
    });
});


function getIp(){
    var os = require('os');

    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }

    return addresses
}

function getTotalActiveSockets(){
    var total=0
    for(var i=0;i<lookup.length;i++){
        if(isActiveLookup[i]){
            total++
        }
    }
    return total
}
