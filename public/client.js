//Make connection
var socket = io.connect(window.location.href);//change to server's location


var uploadrate=.5//slow for testing


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
                      //later defined as host or player

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
    constructor(x,y,id,isConnected){
        this.x=x
        this.y=y
        this.angle
        this.id=id
        this.isActive=true
        this.isConnected=isConnected
        this.joinCode=-1
        this.inputs=[]
    }
}
var me=new player(-1,-1,-1,false)


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

        if(!isPseudoServer && me.isConnected){
            uploadtimer+=deltatime
            if(uploadtimer>uploadrate){
                //TODO: send inputs to pseudoServer
                
                sendInputsToHost(true,false,false,false,false,false)
                

            }
        }

        //server stuff
        else{
            //TODO: make a startGame() function once pseudoServer is up
            //TODO: modify player based on inputs
            //TODO: calculate what the player can see
            //TODO: send said data to the user (hostToSingleClient)

        }


        //send data
        


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
    me=new player(-1,-1,-1,false)
    me.joinCode=joinCodeInput.value
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

function sendInputsToHost(walkForward,walkBackward,walkRight,walkLeft,turnRight,turnLeft){
    socket.emit("clientToHost",{
        joinCode: me.joinCode,
        walkForward: walkForward,
        walkBackward: walkBackward,
        walkRight: walkRight,
        walkLeft: walkLeft,
        turnRight: turnRight,
        turnLeft: turnLeft
    })

    console.log("[ ",walkForward,walkBackward,walkRight,walkLeft,turnRight,turnLeft," ] sent to "+me.joinCode)

}

//networking in---------------------------

socket.on("serverPrivate",function(data){//server connection
    if(mySocketId==-1){
        mySocketId=data
        pseudoServerInfo.innerHTML="connected to server, but not host"
    }
});

socket.on("clientToHost",function(data){
    if(isPseudoServer){
        // record player's inputs
        me.players[data.playerId].inputs=[data.walkForward,data.walkBackward,data.walkLeft,data.turnRight,data.turnLeft]
        console.log(me.players[data.playerId].inputs)
    }

})

socket.on("ServerToHost",function(data){
    
    if(!isPseudoServer){//initilize server
        isPseudoServer=true
        console.log("server accepted request. now hosting with code "+data)
        me=new Host(mySocketId,data)
        pseudoServerInfo.innerHTML="PseudoServer is up on id: "+me.joinCode
    }
    else{//new player
        me.players[data]=(new player(50,50,data,true))//probably replace when player sends data
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
    if(!isPseudoServer){
        if(!me.isConnected){
            me.isConnected=true
            me.joinCode=joinCodeInput.value
            console.log(me)
        }
    }
})

socket.on("serverMessage",function(data){
    serverInfo.innerHTML="[server]: "+data
    console.log(serverInfo.innerHTML="[server]: "+data)
})
