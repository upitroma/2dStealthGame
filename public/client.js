//Make connection
var socket = io.connect(window.location.href);//change to server's location
var mySocketId = -1

var uploadrate=.3


//get html assets
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo"),
    pseudoServerInfo = document.getElementById("pseudoServerInfo"),
    startServerButton = document.getElementById("startServerButton"),
    joinCodeInput = document.getElementById("joinCodeInput");

//server just relays data, PseudoServer manages the game 
var isPseudoServer = false

//hide scrollbar
//document.body.style.overflow = 'hidden';


//define objects
class player{
    constructor(x,y,id){
        this.x=x;
        this.y=y;
        this.angle;
        this.id=id;
        this.isActive=true;
    }
}



//handle inputs-----------------------------
var keys = [];
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; } 

var pastKeys = []

//canvas setup----------------------------
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//graphics--------------
function drawBackground(){
    context.fillStyle = "black"
    if(isPseudoServer)
        context.fillStyle = "red"
    context.fillRect(0, 0, canvas.width, canvas.height)
}

//game logic------------------------------------


//update loop------------------------------------
var uploadtimer=0
window.onload = function(){
    
    function update(deltatime){

        
        // ten times/second
        /*
        37 left
        39 right
        65 a
        68 d
        81 q
        69 e
        */
        canvas.width=canvas.width//refresh canvas

        drawBackground()


        /*

        //render visible players
        visiblePlayers.forEach(function(p){

            //move player
            if(p.id==mySocketId){//if me

                if(keys[65]){
                    p.position-=playerMoveSpeed*deltatime
                }
                if(keys[68]){
                    p.position+=playerMoveSpeed*deltatime
                }

                //send data
                uploadtimer+=deltatime
                if(uploadtimer>uploadrate){
                    //updatePlayer(p)
                }
                

                
            }
            else if(p.isActive){//if other player
                //render other players
            }
            
        });

        */


        context.stroke();
 
    }

    //tick----------------
    
    //https://stackoverflow.com/questions/13996267/loop-forever-and-provide-delta-time
    var lastTick = performance.now()
    function tick(nowish) {
        var delta = nowish - lastTick
        lastTick = nowish
        delta/=1000 //ms to s
        update(delta)
        window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
}


//networking---------------------------


//request to be host
startServerButton.addEventListener("click", function(){
    becomeHost()
}); 

//emmit events
function updatePlayer(p){
    socket.emit("playerdata",{
        x: p.x,
        y: p.y
    });
}

function becomeHost(){
    socket.emit("NewHostPlz","plz work");
    console.log("requested to be host")
}



socket.on("serverPrivate",function(data){
    if(mySocketId==-1){
        //add self to game
        mySocketId=data
        pseudoServerInfo.innerHTML="connected to server, but not host"
    }
    else{
        console.log(data)
    }
});

/*
socket.on("serverPlayerDisconnect",function(data){

    for( var i = 0; i < players.length; i++){ 
        if ( players[i].id == data) {
            players[i].isActive=false

            players.splice(i, 1);//save some memory
        }
     }
})

*/


socket.on("serverMessage",function(data){
    serverInfo.innerHTML="[server]: "+data
})

socket.on("playerdata",function(data){
    //update player in question and add unrecognised players

    var isNew = true
    //move the player
    if(data.id!=mySocketId){
        players.forEach(function(p){
            if(p.id==data.id){
                if(p.isActive){
                    p.position=data.position
                    p.colorId=data.colorId
                    isNew=false
                }
                else{
                    isNew=false
                }
            }
        });

        if(isNew){
            players.push(new player(data.position,data.id))
        }
    }
})
