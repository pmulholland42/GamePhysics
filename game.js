// Page variables
var canvas; 			// <canvas> HTML tag
var c;					// Canvas rendering context
var container;			// <div> HTML tag
var width = window.innerWidth;
var height = window.innerHeight;

// Player physics variables
var playerX = width/2;	// Player position starts in the middle of the screen
var playerY = height/2;
var previousX = playerX;// Player position from the last function call
var previousY = playerY;// We keep track of these in case the player moves too fast and flies through the floor
var playerXSpeed = 0;	// Velocity is measured in pixels per 20ms
var playerYSpeed = 0;
var grounded = false;	// True when player is on the ground
var walled = false;		// Like grounded but for the wall, ya know?
var jumps = 0;			// Number of jumps the player has made while in the air
var dropping = false;	// Prevents collisions with platforms when dropping down through them
var facing = 'right';	// Which way the player is facing
var gravDir = 'down';	// Gravity direction

// Sprites
var snekman_down_right;
var snekman_down_left;
var snekman_up_right;
var snekman_up_left;
var snekman_left_up;
var snekman_left_down;
var snekman_right_up;
var snekman_right_down;

// Adjustable values:
var gravity = 0.7;		// Downward acceleration (pixels per 20ms^2)
var friction = 0.7;		// Coefficient of friction on ground
var wallBounce = 0.0;	// Wall bounciness coefficient
var floorBounce = 0;	// Floor bounciness coefficient
var maxSpeed = 10;		// Max horizontal speed for the player when on ground
var jumpSpeed = 21;		// Vertical speed to apply when jumping
var floorHeight = 0; 	// Pixels above bottom of window
var maxJumps = 2;		// Single, double, or triple jump, etc.
var projSpeed = 15;		// Velocity of projectiles shot by player
var projCooldown = 10;	// Number of ticks till you can shoot again

// Projectile linked list variables
var projHead = null;	// Head of the projectile linked list
var projLast = null;	// Last element of projectile linked list
var projCount = 0;		// Number of player projectiles
var projTimer = 0;		// Projectile cooldown timer

// Snek linked list variables
var snekHead = null;
var snekLast = null;
var snekCount = 0;

// Platform data
var platform1Height = 220;
var platform2Height = 600;

var heldKeys = {};		// heldKey[x] is true when the key with that keyCode is being held down

function init() {
	// Initial the canvas
	setupCanvas();
	
	// PUBNUB
	var pubnub = PUBNUB.init({
		subscribe_key: 'sub-c-9609aa90-f010-11e6-9032-0619f8945a4f',
		publish_key: 'pub-c-62822c7d-339b-4abc-9e87-fb6671883787'
	});
	pubnub.subscribe({
    channel: "con", // Subscribe to our random channel.
    message: function(m) {
		console.log(m);
        // Handle the message.
        var key = Object.keys(m);


        if(key == "log") {
			console.log(m.log);
        }
        else {
			heldKeys[65] = m.digx == -1;
			heldKeys[68] = m.digx == 1;
			heldKeys[83] = m.digy == -1;
			heldKeys[87] = m.digy == 1;

		}
    }
	});

	
	// Load in all the sprites
	snekman_down_right = document.createElement( 'img' );
	snekman_down_left = document.createElement( 'img' );
	snekman_up_right = document.createElement( 'img' );
	snekman_up_left = document.createElement( 'img' );
	snekman_left_up = document.createElement( 'img' );
	snekman_left_down = document.createElement( 'img' );
	snekman_right_up= document.createElement( 'img' ); 
	snekman_right_down = document.createElement( 'img' );
	snekman_down_right.src = "snekman_down_right.png";
	snekman_down_left.src = "snekman_down_left.png";
	snekman_up_right.src = "snekman_up_right.png";
	snekman_up_left.src = "snekman_up_left.png";
	snekman_left_up.src = "snekman_left_up.png";
	snekman_left_down.src = "snekman_left_down.png";
	snekman_right_up.src = "snekman_right_up.png";
	snekman_right_down.src = "snekman_right_down.png";
	
	// These functions are called every 20 milliseconds:
	// Parse the input - from keyboard for now
	setInterval(parseInput, 20);
	// Calculate player physics
	setInterval(physics, 20);
	// Render the canvas
	setInterval(draw, 20);
}//init

function setupCanvas() {
	// Create a <canvas> HTML tag
    canvas = document.createElement( 'canvas' );
	canvas.width = window.innerWidth;				
	canvas.height = window.innerHeight;
	
	// Get a CanvasRenderingContext2D on the canvas
	c = canvas.getContext( '2d' );
	
	// Create a <div> HTML tag called container
	container = document.createElement( 'div' );
	container.className = "container";
	
	// Put the canvas in the container
	container.appendChild(canvas);
	// Put the container on the page
	document.body.appendChild( container );
}//setupCanvas

function resetCanvas (e) {
 	// Resize the canvas - but remember - this clears the canvas too
  	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// Scroll to the top left.
	window.scrollTo(0,0);
}

// Called when a key is held down
document.onkeydown = function(event) {
	// Set this key as being held
	heldKeys[event.keyCode] = true;
}
// Called when a key is released
document.onkeyup = function(event) {
	// Unset this key
	heldKeys[event.keyCode] = false;
}

// Interpret player input - called every 20ms
function parseInput() {
	// Check the heldKeys array to see what the current input is
	if (heldKeys[65]) { // A
		if (gravDir == 'down' || gravDir == 'up') {
			moveLeft();
		} else if (gravDir == 'right') {
			jump();
		}
	}
	if (heldKeys[87]) { // W
		if (gravDir == 'down') {
			jump();
		} else if (gravDir == 'right') {
			moveRight();
		} else if (gravDir == 'left') {
			moveLeft();
		}
	}
	if (heldKeys[68]) {	// D
		if (gravDir == 'down' || gravDir == 'up') {
			moveRight();
		} else if (gravDir == 'left') {
			jump();
		}
	}
	if (heldKeys[83]) { // S
		if (gravDir == 'down') {
			dropDown();
		} else if (gravDir == 'up') {
			jump();
		} else if (gravDir == 'right') {
			moveLeft();
		} else if (gravDir == 'left') {
			moveRight();
		}
	}
	if (heldKeys[69]) { // E
		shoot();
	}
	if (heldKeys[73]) { // I
		gravDir = 'up';
	}
	if (heldKeys[74]) { // J
		gravDir = 'left';
	}
	if (heldKeys[75]) { // K
		gravDir = 'down';
	}
	if (heldKeys[76]) { // L
		gravDir = 'right';
	}
	if (heldKeys[81]) { // Q
		if (playerX > 5*width/6 && playerY == height-floorHeight) {
			console.log("You win!");
		}
	}
}

// Player movement/action functions
function jump() {
	if (gravDir == 'down' && grounded) {
		playerYSpeed = -jumpSpeed;
		jumps++;
	} else if (gravDir == 'right' && playerX > 1490) {
		playerXSpeed = -jumpSpeed;
		jumps++;
	} else if (gravDir == 'left' && playerX == 0) {
		playerXSpeed = jumpSpeed;
		jumps++;
	} else if (gravDir == 'up' && playerY == 0) {
		playerYSpeed = jumpSpeed;
	}
}
function moveLeft() {
	if (gravDir == 'up' || gravDir == 'down') {
		facing = 'left';
		if (playerXSpeed > -maxSpeed) {
			playerXSpeed -= 1;
		}
	} else if (gravDir == 'right') {
		facing = 'down';
		if (playerYSpeed < maxSpeed) {
			playerYSpeed += 1;
		}
	} else if (gravDir == 'left') {
		facing = 'up';
		if (playerYSpeed > -maxSpeed) {
			playerYSpeed -= 1;
		}
	}
}
function moveRight() {
	if (gravDir == 'up' || gravDir == 'down') {
		facing = 'right';
		if (playerXSpeed < maxSpeed) {
			playerXSpeed += 1;
		}
	} else if (gravDir == 'left') {
		facing = 'down';
		if (playerYSpeed < maxSpeed) {
			playerYSpeed += 1;
		}
	} else if (gravDir == 'right') {
		facing = 'up';
		if (playerYSpeed > -maxSpeed) {
			playerYSpeed -= 1;
		}
	}
}
function dropDown() {
	if (gravDir == 'down' && grounded && !dropping && playerY != height-floorHeight) {
		playerYSpeed = -5;
		dropping = true;
	}
	if (gravDir == 'right' || gravDir == 'left') {
		facing = 'down';
		if (playerYSpeed < maxSpeed) {
			playerYSpeed += 1;
		}
	}
	if (gravDir == 'up') {
		
	}
}
function shoot() {
	// This adds a projectile json to the linked list
	if (projTimer == 0) {
		
		// Linked lists man. You either do em or you dont
		var currProj;
		if (facing == 'left') {
			currProj = {'x': playerX+28, 'y': playerY-40, 'yV': 0, 'xV': -projSpeed, 'next': null, 'prev': null};
		} else if (facing == 'right') {
			currProj = {'x': playerX+28, 'y': playerY-40, 'yV': 0, 'xV': projSpeed, 'next': null, 'prev': null};
		} else if (facing == 'up') {
			currProj = {'x': playerX+28, 'y': playerY-40, 'yV': -projSpeed, 'xV': 0, 'next': null, 'prev': null};
		} else {
			currProj = {'x': playerX+28, 'y': playerY-40, 'yV': projSpeed, 'xV': 0, 'next': null, 'prev': null};
		}
		if (projCount == 0) {
			projHead = currProj;
		} else {
			projLast.next = currProj;
			currProj.prev = projLast;
		}
		projLast = currProj;
		
		projCount++;
		projTimer = projCooldown;
	}
}

// Calculate player physics - called every 20ms
function physics() {
	// Player physics
	// Gravity
	if (gravDir == 'down') {
		playerYSpeed += gravity;
	} else if (gravDir == 'up') {
		playerYSpeed -= gravity;
	} else if (gravDir == 'left') {
		playerXSpeed -= gravity;
	} else if (gravDir == 'right') {
		playerXSpeed += gravity;
	}
	playerX += playerXSpeed;
	playerY += playerYSpeed;
	
	// If the player is on the ground
	if (grounded) {
		// Apply friction when not holding left or right
		if (!(heldKeys[65] || heldKeys[68])) {
			if (playerXSpeed > 0) {
				playerXSpeed -= friction;
			}
			else if (playerXSpeed < 0) {
				playerXSpeed += friction;
			}
		}
		// Stop movement when X velocity is too low
		// This prevents occilating back and forth from friction
		if (Math.abs(playerXSpeed) < 0.50) {
			playerXSpeed = 0;
		}
	}
	
	// Ground collision detection
	if (playerY >= (height-floorHeight)) {
		grounded = true;
		jumps = 0;
		// Bounce off the ground
		playerYSpeed *= -floorBounce;
		// Stop bouncing when Y velocity is too low
		if (Math.abs(playerYSpeed) < 0.50) playerYSpeed = 0;
		// Set player position to be on the floor
		playerY = height-floorHeight;
	} else {
		grounded = false;
	}
	
	// Right wall collision detection
	if (playerX >= (width-40)) {
		playerXSpeed *= -wallBounce;
		playerX = width-40;
	}
	// Left wall collision detection
	if (playerX <= 0) {
		playerXSpeed *= -wallBounce;
		playerX = 0;
	}
	// Ceiling collision detection
	if (playerY <= 0) {
		playerYSpeed *= -floorBounce;
		playerY = 0;
	}
	
	// Platform collision
	// It would be nice not to hard code this but...
	if ((playerX < width/3) && (playerX > width/6) && (previousY <= (height-platform1Height)) && playerY >= (height-platform1Height)) {
		// If player is dropping down fall through
		if (dropping) {
			dropping = false;
		// If they're not, and they're moving downward, collide with platform
		} else if (playerYSpeed >= 0) {
			playerYSpeed *= -floorBounce;
			playerY = height-platform1Height;
			grounded = true;
		}
	}
	walled = false;
	// Platform 1 left wall
	if ((playerY > height-platform1Height) && (previousX <= width/6) && playerX >= width/6) {
		playerXSpeed *= -wallBounce;
		playerX = width/6;
		if (gravDir == 'left') walled = true;
	}
	// Platform 1 right wall
	if ((playerY > height-platform1Height) && (previousX >= width/3) && playerX <= width/3) {
		playerXSpeed *= -wallBounce;
		playerX = width/3;
		if (gravDir == 'left') walled = true;
	}
	// Platform 2
	if ((playerX < 5*width/6) && (playerX > 2*width/3) && (previousY <= (height-platform2Height)) && playerY >= (height-platform2Height)) {
		// If player is dropping down fall through
		if (dropping) {
			dropping = false;
		// If they're not, and they're moving downward, collide with platform
		} else if (playerYSpeed >= 0) {
			playerYSpeed *= -floorBounce;
			playerY = height-platform2Height;
			grounded = true;
		}
	}
	// Platform 2 left wall
	if ((playerY > height-platform2Height) && (previousX <= 2*width/3) && playerX >= 2*width/3) {
		playerXSpeed *= -wallBounce;
		playerX = 2*width/3;
		if (gravDir == 'left') walled = true;
	}
	// Platform 2 right wall
	if ((playerY > height-platform2Height) && (previousX >= 5*width/6) && playerX <= 5*width/6) {
		playerXSpeed *= -wallBounce;
		playerX = 5*width/6;
		if (gravDir == 'right') walled = true;
	}
	
	// Keep track of last position (this is for collision detection)
	previousX = playerX;
	previousY = playerY;
	
	// Projectile physics
	// Iterate through the linked list of projectiles and move them
	if (projTimer != 0) projTimer--;
	var currProj = projHead;
	while (currProj != null) {
		currProj.y += currProj.yV;
		currProj.x += currProj.xV;
		if (currProj.x < 0 || currProj.x > width || currProj.y < 0 || currProj.y > height) {
			// Remove this from the linked list
			if (currProj != projHead) {
				currProj.prev.next = currProj.next;
			} else {
				projHead = currProj.next;
			}
			if (currProj != projLast) {
				currProj.next.prev = currProj.prev;
			} else {
				projLast = currProj.prev;
			}
			projCount--;
		}
		currProj = currProj.next;
	}
}

// Render the canvas - called every 20ms
function draw() {
	// Erase the current canvas
    c.clearRect(0, 0, width, height);
	c.lineWidth = "10";
	
	// Display stats
	c.fillText('X velocity: '+playerXSpeed, 10, 40);
	c.fillText('X position: '+Math.floor(playerX), 10, 60);
	c.fillText('Width: ' + width, 10, 80);
	c.fillText('Y velocity: '+(-playerYSpeed), 10, 100);
	c.fillText('Y position: '+Math.floor(height-playerY), 10, 120);
	c.fillText('Gravity: '+gravDir, 10, 160);
	c.fillText('Facing: '+facing, 10, 180);
	//c.fillText('Projectiles: '+projCount, 10, 200);
	c.fillText('W: '+heldKeys[87], 10, 200);
	c.fillText('A: '+heldKeys[65], 10, 220);
	c.fillText('S: '+heldKeys[83], 10, 240);
	c.fillText('D: '+heldKeys[68], 10, 260);
	
	c.beginPath();
	c.strokeStyle = "rgba(0, 200, 200, 0.9)";
	// Draw platform 1 (hardcoded)
	c.rect(width/6, height-platform1Height, width/6, 0);
	c.rect(width/6, height-platform1Height, 0, platform1Height);
	c.rect(width/3, height-platform1Height, 0, platform1Height);
	// Draw platform 2 (hardcoded)
	c.rect(2*width/3, height-platform2Height, width/6, 0);
	c.rect(2*width/3, height-platform2Height, 0, platform2Height);
	c.rect(5*width/6, height-platform2Height, 0, platform2Height);
	c.stroke();
	c.fillText('Press Q to go through the door', 5*width/6+80, height-floorHeight-80);
	c.beginPath();
	// Draw the door
	c.strokeStyle = "rgba(128, 0, 0, 0.9)";
	c.rect(5*width/6+80, height-floorHeight-70, 40, 80);
	c.stroke();
	
	// Draw the player
	if (gravDir == 'down') {
		if (facing == 'right') {
			c.drawImage(snekman_down_right, playerX-44, playerY-57, 44, 57);
		} else {
			c.drawImage(snekman_down_left, playerX, playerY-57, 44, 57);
		}
	} else if (gravDir == 'up') {
		if (facing == 'right') {
			c.drawImage(snekman_up_right, playerX-44, playerY, 44, 57);
		} else {
			c.drawImage(snekman_up_left, playerX, playerY, 44, 57);
		}
	} else if (gravDir == 'left') {
		if (facing == 'down') {
			c.drawImage(snekman_left_down, playerX, playerY-44, 57, 44);
		} else {
			c.drawImage(snekman_left_up, playerX, playerY, 57, 44);
		}
	} else {
		if (facing == 'down') {
			c.drawImage(snekman_right_down, playerX-57, playerY-44, 57, 44);
		} else {
			c.drawImage(snekman_right_up, playerX-57, playerY, 57, 44);
		}
	}
	
	c.beginPath();
	c.lineWidth = "2";
	c.strokeStyle = "rgba(255, 0, 0, 0.7)";
	c.rect(playerX, playerY, 2, 2);
	c.stroke();
	
	// Draw the projectiles by iterating through the linked list
	if (projCount != 0) {
		var currProj;
		for (currProj = projHead; currProj != null; currProj = currProj.next) {
			c.beginPath();
			c.lineWidth = "5";
			c.strokeStyle = "rgba(255, 0, 0, 0.7)";
			c.rect(currProj.x, currProj.y, 5, 5);
			c.stroke();
		}
	}
}




