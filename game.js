// Page variables
var canvas; 			// <canvas> HTML tag
var c;					// Canvas rendering context
var container;			// <div> HTML tag
var width = window.innerWidth;
var height = window.innerHeight;

// Physics variables
var playerX = width/2;	// Player position starts in the middle of the screen
var playerY = height/2;
var playerXSpeed = 0;	// Velocity is measured in pixels per 20ms
var playerYSpeed = 0;
var grounded = false;	// True when player is on the ground
var jumps = 0;			// Number of jumps the player has made while in the air
// Adjustable values:
var gravity = 0.7;		// Downward acceleration (pixels per 20ms^2)
var friction = 0.7;		// Coefficient of friction on ground
var wallBounce = 0.9;	// Wall bounciness coefficient
var floorBounce = 0.0;	// Floor bounciness coefficient
var maxSpeed = 10;		// Max horizontal speed for the player when on ground
var jumpSpeed = 21;		// Vertical speed to apply when jumping
var floorHeight = 0; 	// Pixels above bottom of window
var maxJumps = 2;		// Single, double, or triple jump, etc.

var platform1Height = 250;
var platform2Height = 500;

var heldKeys = {};		// heldKey[x] is true when the key with that keyCode is being held down

function init() {
	// Initial the canvas
	setupCanvas();
	
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
	if (heldKeys[65]) {
		// Left
		moveLeft();
	}
	if (heldKeys[87]) {
		// Up
		jump();
	}
	if (heldKeys[68]) {
		// Right
		moveRight();
	}
	if (heldKeys[83]) {
		// Down
	}
}

// Player movement functions
function jump() {
	//console.log("jump");
	if (grounded) {
		playerYSpeed = -jumpSpeed;
		jumps++;
	}
}
function moveLeft() {
	if (playerXSpeed > -maxSpeed) {
		playerXSpeed -= 1;
	}
}
function moveRight() {
	if (playerXSpeed < maxSpeed) {
		playerXSpeed += 1;
	}
}

// Calculate player physics - called every 20ms
function physics() {
	// Player physics
	playerYSpeed += gravity;
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
		playerYSpeed *= -wallBounce;
		playerY = 0;
	}
	
	// Platform collision
	// It would be nice not to hard code this but...
	if (playerX < width/3) {
		// Only collide with platform while falling
		// (Positive Y velocity == going down)
		if (playerYSpeed >= 0) {
			if (Math.abs(playerY-(height-platform1Height)) < 5) {
				playerYSpeed = 0;
				playerY = height-platform1Height;
				grounded = true;
			}
		}
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
	c.fillText('Y velocity: '+(-playerYSpeed), 10, 100);
	c.fillText('Y position: '+Math.floor(height-playerY), 10, 120);
	c.fillText('On ground: '+grounded, 10, 160);
	c.fillText('Jumps: '+jumps, 10, 180);
	c.fillText('W: '+heldKeys[87], 10, 200);
	c.fillText('A: '+heldKeys[65], 10, 220);
	c.fillText('S: '+heldKeys[83], 10, 240);
	c.fillText('D: '+heldKeys[68], 10, 260);
	
	// Draw platform 1
	c.beginPath();
	c.strokeStyle = "rgba(0, 200, 200, 0.9)";
	c.rect(0, height-platform1Height, width/3, 0);
	c.stroke();
	
	// Draw the player (blue square)
	c.beginPath();
	c.strokeStyle = "rgba(0, 0, 255, 0.5)";
	c.rect(playerX, playerY-50, 40, 40);
	c.stroke();
}




