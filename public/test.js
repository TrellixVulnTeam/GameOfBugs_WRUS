var canvas = document.getElementById('canvas1');
canvas.width = 600;
canvas.height = 400;
var ctx = canvas.getContext('2d');

//socket.emit("startGame", {width : canvas.width, height: canvas.height});

var background = new Image();
background.src = "grass.jpeg";

background.onload = function () {
  ctx.drawImage(background, 0, 0);
}

class Obstackle {

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.height = 10;
    this.width = canvas.width;

  }

  draw(ctx) {
    ctx.fillStyle = "black";

    ctx.fillRect(this.x, this.y, this.width, this.height);

  }

}

var bullets = [];

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.height = 20;
    this.width = 3;

  }
  move() {
    this.y -= 5;
  }

  clear() {

    var prevCoords = {};
    prevCoords.x = Math.floor(this.x - 2);
    prevCoords.y = Math.floor(this.y - 2);
    ctx.clearRect(prevCoords.x, prevCoords.y, this.width + 2, this.height + 2);
  };

  draw(ctx) {
    ctx.fillStyle = "red";

    ctx.fillRect(this.x, this.y, this.width, this.height);

  }

}

class Player {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 4;
    this.color = ctx.fillStyle;
    this.playerRounds = [];
    this.shootPressed = false;
    this.isDead = false;
    this.id = id;


    this.movement = {
      up: false,
      down: false,
      left: false,
      right: false,

    };
    document.addEventListener("keydown", this.keydown);
    document.addEventListener("keyup", this.keyup);
  }

  draw(ctx) {
    this.clear();
    this.move();
    ctx.fillRect(this.x, this.y, this.width, this.height);

  }

  shoot() {
    g.playerRounds.forEach(bullet => {

      bullet.draw(ctx);

    });


    /*rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y*/
  }



  clear() {

    var prevCoords = {};
    prevCoords.x = Math.floor(this.x - 2);
    prevCoords.y = Math.floor(this.y - 2);
    ctx.clearRect(prevCoords.x, prevCoords.y, this.width + 2, this.height + 2);
  };

  move() {
    if (this.downPressed) {
      this.y += this.speed;
    }
    if (this.upPressed) {
      this.y -= this.speed;
    }
    if (this.leftPressed) {
      this.x -= this.speed;
    }

    if (this.rightPressed) {
      this.x += this.speed;
    }

  };

  keydown = (e) => {
    if (e.code === "ArrowUp") {
      this.movement.up = true;
    }
    if (e.code === "ArrowDown") {
      this.movement.down = true;
    }
    if (e.code === "ArrowLeft") {
      this.movement.left = true;
    }
    if (e.code === "ArrowRight") {
      this.movement.right = true;

    }
    if (e.code === "Space") {

      console.log("fireeeee");
      //socket.emit('addBullet', 1);

      socket.emit('addBullet', { x: this.x, y: this.y, w: 3, h: 20, dir: 'up' });
    }
  };

  keyup = (e) => {
    if (e.code === "ArrowUp") {
      this.movement.up = false;
    }
    if (e.code === "ArrowDown") {
      this.movement.down = false;
    }
    if (e.code === "ArrowLeft") {
      this.movement.left = false;
    }
    if (e.code === "ArrowRight") {
      this.movement.right = false;
    }
    if (e.code === "Space") {
      this.shootPressed = false;
      console.log("fire stopped");
      //  socket.emit('addBullet', 0);

    }
  };
}

var socket = io();
var color;

var g = new Player(0, 0, color, socket.id);
var obstackle = new Obstackle(0, canvas.height / 2)

socket.on('new player', function (data) {
  g.x = data.x;
  g.y = data.y;

});


setInterval(function () {
  socket.emit('movement', g.movement);

}, 1000 / 60);

socket.on('bupdate', function (projectileData) {
  //új lövedék vételekor kliens létrehoz egy újat
  //console.log(projectileData.id);
  for (var i in projectileData) {

    g.playerRounds[i] = new Bullet(projectileData[i].x + 15, projectileData[i].y);

  }
});



socket.on('state', function (players) {
  //console.log(players);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  obstackle.draw(ctx);

  for (var i in players) {

    g.x = players[i].x;
    g.y = players[i].y;

    ctx.fillStyle = players[i].color;


    g.draw(ctx);
    g.shoot();




  }


});



var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var nameInput = document.getElementById('nameInput');
var startButton = document.getElementById('startButton');
var startDiv = document.getElementById('startDiv');
var newRow = document.getElementById('score_board').insertRow();
//var nameForm = document.getElementById('name').value;


startButton.addEventListener('click', () => {
  if (nameInput.value == 0 || nameInput.value == undefined) {
    alert("Name is required to play");

  } else {
    socket.emit('new player', { name: nameInput.value });
    socket.emit('chatter ', { name: nameInput.value });
    socket.emit('startGame');
    //startButton.style.display = "none";
    canvas.style.display = "block";
    startDiv.style.display = "none";
    form.style.display = "block";
  }
});
form.addEventListener('submit', function (e) {
  e.preventDefault();

  if (input.value) {
    socket.emit('chatter', input.value);

    input.value = '';
  }
});

socket.on('playerName', function (data) {
  g.name = data.name;
});
socket.on('admin', function (msg) {
  var item = document.createElement('p');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
socket.on('chatter', function (msg) {
  var item = document.createElement('p');
  item.textContent = msg.name + " : " + msg.msg;
  //console.log(g.name);
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

//új rekord a html táblába
socket.on("table", function (data) {
  var newCell = newRow.insertCell();
  var newText = document.createTextNode(data.name + "" + data.score);
  newRow.appendChild(newText);

});

socket.on('redirect', function (destination) {
  alert("The admin has restarted the game");
  window.location.href = destination;
});

socket.on('killed', function (destination) {
  //alert("You died!");
  window.location.href = destination;
});