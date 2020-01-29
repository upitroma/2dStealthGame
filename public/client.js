//Make connection
var socket = io.connect(window.location.href);//change to server's location


var uploadrate=.3


//get html assets
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    serverInfo = document.getElementById("serverinfo"),
    pseudoServerInfo = document.getElementById("pseudoServerInfo"),
    startServerButton = document.getElementById("startServerButton"),
    joinCodeInput = document.getElementById("joinCodeInput"),
    joinServerButton = document.getElementById("joinServerButton");



var mySocketId = -1         //default as -1 
var myJoinCode              //for players connecting to psudoServer
var isPseudoServer = false  //server just relays data, PseudoServer manages the game 
var me                      //later defined as host or player

//hide scrollbar
//document.body.style.overflow = 'hidden';


//define objects

//only used by host
class Host{
    constructor(id,joinCode){
        this.id=id
        this.joinCode=joinCode
        this.players=[]
    }
}

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


//networking out---------------------------


//request to be host
startServerButton.addEventListener("click", function(){
    becomeHost()
}); 

joinServerButton.addEventListener("click",function(){
    joinHost(joinCodeInput.value)
});

//emmit events
function updatePlayer(p){
    socket.emit("playerdata",{
        x: p.x,
        y: p.y
    });
}

function becomeHost(){
    socket.emit("BecomeHost","plz work");
    console.log("requested to be host")
}

function joinHost(joinCode){
    socket.emit("joinHost",joinCode)
    console.log("attempting to join "+joinCode)
}

//networking in---------------------------

socket.on("serverPrivate",function(data){//server connection
    if(mySocketId==-1){
        mySocketId=data
        pseudoServerInfo.innerHTML="connected to server, but not host"
    }
});

socket.on("ServerToHost",function(data){
    
    if(!isPseudoServer){//initilize server
        isPseudoServer=true
        console.log("server accepted request. now hosting with code "+data)
        me=new Host(mySocketId,data)
        pseudoServerInfo.innerHTML="PseudoServer is up on id: "+me.joinCode
    }
    else{//new player
        me.players.push(new player(0,0,data))
        socket.emit("hostToSingleClient",{
            targetId: data
        })
        console.log("new player on socket "+data)
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
socket.on("hostToSingleClient",function(data){
    pseudoServerInfo.innerHTML="connected to PseudoServer"
})

socket.on("serverMessage",function(data){
    serverInfo.innerHTML="[server]: "+data
    console.log(serverInfo.innerHTML="[server]: "+data)
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
