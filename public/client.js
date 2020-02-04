//Make connection
var socket = io.connect(window.location.href);//change to server's location


var uploadrate=.5//slow for testing
var playerViewDist=200 //100
var playerViewAngle=0.785398//45 degrees
var playerSpeedNormal=50
var playerTurnSpee=20


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

class Player{
    constructor(x,y,id,isConnected){
        this.x=x
        this.y=y
        this.angle=90
        this.id=id
        this.isActive=true
        this.isConnected=isConnected
        this.joinCode=-1
        this.inputs={
            walkForward: false,
            walkBackward: false,
            walkRight: false,
            walkLeft: false,
            turnRight: false,
            turnLeft: false
        }
        this.visibleWalls=[]
        this.visiblePlayers=[]
    }
}
var me=new Player(-1,-1,-1,false)//overwritten when connected to server

class Wall{
    constructor(x1,x2,y1,y2){
        this.x1=x1
        this.x2=x2
        this.y1=y1
        this.y2=y2
    }
}

//handle inputs-----------------------------
var keys = [];
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; } 
keys[87]=keys[83]=keys[68]=keys[65]=keys[76]=keys[75]=false

//canvas setup----------------------------
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//graphics--------------
function drawBackground(){
    context.fillStyle = "black"
    if(isPseudoServer)
        context.fillStyle = "rgb(19, 19, 32)"
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
        87 w
        65 a
        83 s
        68 d

        75 k
        76 l

        81 q
        69 e
        */
        canvas.width=canvas.width//refresh canvas
        drawBackground()

        if(!isPseudoServer && me.isConnected){
            uploadtimer+=deltatime
            if(uploadtimer>uploadrate){
                // send inputs to pseudoServer
                sendInputsToHost(keys[87],keys[83],keys[68],keys[65],keys[76],keys[75])
            }
            
            //render light
            context.beginPath();
            context.fillStyle = 'white'
            context.strokeStyle="white"
            context.moveTo(me.x+0,me.y)
            context.arc(me.x, me.y, playerViewDist , me.angle-(playerViewAngle/2), me.angle+(playerViewAngle/2));
            context.fill();
            context.stroke();

            //render self
            context.beginPath();
            context.fillStyle = 'blue'
            context.strokeStyle="blue"
            context.moveTo(me.x+25,me.y)
            context.arc(me.x, me.y, 25, 0, 2 * Math.PI);
            context.closePath();
            context.fill();
            context.stroke();
            

            //render others
            context.beginPath();
            context.fillStyle = 'red'
            context.strokeStyle="red"
            var mul=2
            me.visiblePlayers.forEach(function(vp){
                context.moveTo((vp.x*mul)+25+me.x,(-vp.y*mul)+me.y)
                context.arc((vp.x*mul)+me.x, (-vp.y*mul)+me.y, 25, 0, 2 * Math.PI);
            })
            context.stroke();

        }

        //pseudoServer stuff
        else if(isPseudoServer){
            if(me.players.length>0){
                me.players.forEach(function(p){
                    //y is inverted
                    p.y-=p.inputs.walkForward*playerSpeedNormal*deltatime
                    p.y+=p.inputs.walkBackward*playerSpeedNormal*deltatime
                    p.x+=p.inputs.walkRight*playerSpeedNormal*deltatime
                    p.x-=p.inputs.walkLeft*playerSpeedNormal*deltatime
                    //TODO: angle stuff

                    //calculate what player can see
                    var tempVpsx=[]
                    var tempVpsy=[]
                    var tempWalls=[]
                    me.players.forEach(function(vp){
                        if(vp!=p){//oviously you can see yourself
                            if(Math.abs(vp.x-p.x)<playerViewDist){
                                if(Math.abs(vp.y-p.y)<playerViewDist){
                                    
                                    //TODO: factor in fov angle

                                    //calculate circular range instaid of square

                                    //relativeAngle = Math.atan2(deltax,deltay)*(180/Math.PI)
                                    //isInsideCircle = ((x - center_x)^2 + (y - center_y)^2 < radius^2)


                                    //calculate angle to vp
                                    //only render vp if within p's sight

                                    
                                    console.log("player "+p.id+" can see "+vp.id)

                                    //relative coordinates
                                    tempVpsx.push(vp.x-p.x)
                                    tempVpsy.push(p.y-vp.y)

                                }
                            }
                        }
                    })


                    //debugging server graphics-----------------
                    context.fillStyle = 'blue';
                    context.moveTo(p.x+10,p.y)
                    context.arc(p.x, p.y, 10, 0, 2 * Math.PI);// x,y, r, start angle, end angle
                    context.fill();
                    //debugging fov
                    context.strokeStyle = 'red';
                    context.strokeRect(p.x-playerViewDist,p.y-playerViewDist,playerViewDist*2,playerViewDist*2)


                    //TODO: make a startGame() function once pseudoServer is up
                    //TODO: modify player based on inputs
                    //TODO: calculate what the player can see
                    //TODO: send said data to the user (probably using hostToSingleClient)

                    //send data to player
                    socket.emit("hostToSingleClient",{
                        targetId: p.id,
                        visiblePlayersX: tempVpsx,
                        visiblePlayersY: tempVpsy
                    })

                })
            }
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
    me=new Player(-1,-1,-1,false)
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

    //console.log("[ ",walkForward,walkBackward,walkRight,walkLeft,turnRight,turnLeft," ] sent to "+me.joinCode)

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
        //new player is added in serverToHost
        //me.players[data.playerId].inputs=[data.walkForward,data.walkBackward,data.walkLeft,data.turnRight,data.turnLeft]
        me.players[data.playerId].inputs={
            walkForward: data.walkForward,
            walkBackward: data.walkBackward,
            walkRight: data.walkRight,
            walkLeft: data.walkLeft,
            turnRight: data.turnRight,
            turnLeft: data.turnLeft
        }
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
        me.players[data]=(new Player(50,50,data,true))
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
socket.on("hostToSingleClient",function(data){// should probably authenticate since no data is sent
    pseudoServerInfo.innerHTML="connected to PseudoServer"
    if(!isPseudoServer){
        if(!me.isConnected){
            me.x=canvas.width/2
            me.y=canvas.height/2
            me.isConnected=true
            me.joinCode=joinCodeInput.value
            console.log(me)
        }
        else{
            me.visiblePlayers=[]

            for(var i=0;i<data.visiblePlayersX.length;i++){
                //console.log("px="+data.visiblePlayersX[i]+" py="+data.visiblePlayersY[i])
                console.log(Math.atan2(data.visiblePlayersX[i],data.visiblePlayersY[i])*180/Math.PI)//0 degrees is north
                me.visiblePlayers.push(new Player(data.visiblePlayersX[i],data.visiblePlayersY[i],-1,true))//relative coords
            }
        }
    }
})

socket.on("serverMessage",function(data){
    serverInfo.innerHTML="[server]: "+data
    console.log(serverInfo.innerHTML="[server]: "+data)
})
