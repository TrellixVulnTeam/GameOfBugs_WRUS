const express = require('express');
const app = express();
const http = require('http');
const { join } = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./mock.db', sqlite3.OPEN_READWRITE, (err)=> {
    if (err) return console.error(err.message);

    console.log('db connection sucessful');
});
db.run('DELETE FROM players');

//db.run('CREATE TABLE players(id, name, score)');
//db.run('CREATE TABLE users(first_name, last_name, username, password, email, id)');

app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });

var playersTop = [];
var playersBottom = [];
var gamers = [];
var currentClients;
var players = {};
var bullet_array = [];
var shootDir;
var shootingDir;
var enemy ;
var playersocket;

  io.on('connection', (socket) => {
    playersocket = socket.id;
    socket.on('chatter', (msg) => { 
      io.emit('chatter' ,{ msg: msg , name : players[socket.id].name});
    });


    socket.on('startGame', () => {
      if(currentClients < 2){
        io.emit('chatter', "waiting for other players");
      }else{
         io.emit('startGame');
    io.emit('admin', "@Admin : The game has started");
      }
    });
    
    const colorString = "#" + Math.floor(Math.random() * 16777215).toString(16);
    socket.on('new player', function(data) {
        console.log(socket.id);
        io.emit('admin', "@Admin : " +data.name+ " has joined!");
       
        console.log(data.name);

        currentClients = io.engine.clientsCount;
        console.log("number of clients : ", currentClients);

        gamers.push(players[socket.id]);
        
         players[socket.id] = {
              x:300,
              y: 400,
              h: 30,
              w: 30,
              shoot : 'up',
              id : socket.id,
              name: "playerX", //unidentified lenne data.name-el
              bullets : [],
              //id : socket.id,
              color : colorString,
        }

        
        players[socket.id].name = data.name;
        console.log(gamers.length);
         //gamers.push(players[socket.id]); 
        console.log( " player "+data.name+ "created in : ", players[socket.id].x,players[socket.id].y)

        let sql = 'INSERT INTO players (id, name, score) VALUES(?,?,?)';
        db.run(sql,[socket.id, data.name, 0], (err) => {
            if (err) return console.error(err.message);

            console.log("A new row has been created");
        });

        sql = 'SELECT * FROM players';

        db.all(sql, [], (err, rows) => {
            if (err) return console.error(err.message);

            rows.forEach((row) => {
                console.log(row);
            })
        })
        
        
        for(i in players){
         
          if(currentClients % 2 == 0){

          players[socket.id].x = 0;
          players[socket.id].y = 0;
         // playersBottom.push(players[socket.id]);
          
        
      
         }else{
          players[socket.id].x =600;
          players[socket.id].y = 400;
          
          //playersTop.push(players[socket.id]);
         
         }
        }
        
        socket.emit('new player', {x : players[socket.id].x, y: players[socket.id].y, name: players[socket.id].name});
         console.log("lent " +   playersBottom.length);
         console.log("fent" + playersTop.length);
    });



    socket.on('movement', function(data) {
      var player = players[socket.id] || {};
      if ( currentClients <2 ){
          player.x -= 0;
          player.y -= 0;
        }else{
           if (data.left) {
        player.x -= 2;
      }
      if (data.up) {
        player.y -= 2;
      }
      if (data.right) {
        player.x += 2;
      }
      if (data.down) {
        player.y += 2;
      }
      if (player.x < 0) {
        player.x = 0;
      } else if (player.x + player.w > 600) {
        player.x = 600 - player.w;
      }
      if (player.y < 0) {
        player.y = 0;
      } else if (player.y+ player.h > 400) {
        player.y= 400 - player.h;
    }

        }
     
      });
 
      socket.on('addBullet', function(data){
        if(players[socket.id] == undefined || currentClients < 2) return;    //ha nincs meg a min2 kliens akkor addig ne lőjön.
       data.y = players[socket.id].y;
       data.x = players[socket.id].x
        if(players[socket.id].y > 200){
           data.dir ='up';

        }  else{
          data.dir ='down';
        }      
        shootDir = data.dir;
        bullet_array.push(data);   
       
         //players[socket.id].bullets.push(data);
       
      });
    
    socket.on('disconnect', () => {
    // if(players[socket.id].name == undefined) return;
         io.emit('admin', "@Admin :", "A user has disconnected!"); 
         for(i in gamers){
          gamers.splice(i, 1);
        }
        delete players[socket.id];
       
    
      });
  });


  function updateBullet(){

    var count  = 0;
    for(i in bullet_array){
      
      bullet = bullet_array[i];
      if(shootDir == 'up'){
        bullet.y -= 5;
      }

      if(shootDir == 'down'){
        bullet.y += 5;
      }
      
      
      for(j in players){
          //console.log("length of dict "+ Object.keys(players).length);
       
       if(shootDir == 'up'){
        if (bullet.x +15 < players[j].x    +players[j].w && 
          bullet.x+15 + bullet.w > players[j].x     &&
          bullet.y -40  < players[j].y  +players[j].h && 
          bullet.y -40 + bullet.h > players[j].y ){
            
          
          //console.log(this.name);
          console.log(""+players[j].name +" was hit", );
          io.emit('admin',"@Admin "+  players[j].name + "was hit");
          count++;
          console.log(count);

          //delete players[j];
        }
       }

       if(shootDir == 'down'){
        if (bullet.x +15 < players[j].x    +players[j].w && 
          bullet.x+15 + bullet.w > players[j].x     &&
          bullet.y   < players[j].y  +players[j].h && 
          bullet.y  + bullet.h > players[j].y ){
            
          
          //console.log(this.name);
          console.log(""+players[j].name +" was hit", );
          io.emit('admin',"@Admin "+  players[j].name + "was hit");
          count++;
          console.log(count);
          //delete players[j];
        }
       }
   
      }
     }
    
    
    io.emit('bupdate', bullet_array);
  }
  
  setInterval(updateBullet,1000 / 60);

  setInterval(function() {
    io.sockets.emit('state', players);
    
  }, 1000 / 60);
  
  server.listen(3000, () => {
    console.log('listening on *:3000');
  });

