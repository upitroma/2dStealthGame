//Make connection
var socket = io.connect(window.location.href);//change to server's location
var mySocketId = -1

var uploadrate=.3

//constants
var playerMoveSpeed=200
var playerStabSpeed=400

var fov=45
var viewDist=100

//get html assets
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo"),
    isServerCheckBoxDEBUGGING = document.getElementById("amServer(DEBUGGING)");

//server just relays data, PseudoServer manages the game 
var isPseudoServer = isServerCheckBoxDEBUGGING.checked

//hide scrollbar
//document.body.style.overflow = 'hidden';


//define objects
class player{
    constructor(x,y,id){
        this.x=x;
        this.y=y;
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
    context.fillStyle = "red"
    context.fillRect(0, 0, canvas.width, canvas.height)
}

//game logic------------------------------------
//client
var visiblePlayers=[]

//PseudoServer
var allPlayers=[]
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

//emmit events
function updatePlayer(p){
    socket.emit("playerdata",{
        position: p.position,
        colorId: p.colorId
    });
}


//listen for server events



socket.on("serverPrivate",function(data){
    if(mySocketId==-1){
        //add self to game
        mySocketId=data
    }
});

socket.on("serverPlayerDisconnect",function(data){

    for( var i = 0; i < players.length; i++){ 
        if ( players[i].id == data) {
            players[i].isActive=false

            players.splice(i, 1);//save some memory
        }
     }
})

socket.on("newPlayer",function(data){
    players.push(new player(Math.floor(data.random * (canvas.width-borderh-borderm+1)),data.id))
})

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
