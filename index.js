const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const playerMovementSpeed = 5;
const bulletMovementSpeed = 7;
const firingInterval = 100;

let playGame = false;
let ableToFire = true;
setInterval(() => { ableToFire = true }, firingInterval);
let playerCenter = { x: canvas.width / 2, y: canvas.height / 2 }
let controllerIndex = null;
let playerVelocity = { x: 0, y: 0 };
let bulletTrajectory = { x: 0, y: 0 };



// BEGIN GAMEPAD FUNCTIONALITY
window.addEventListener("gamepadconnected", (event) => {
    handleConnectDisconnect(event, true);
});

window.addEventListener("gamepaddisconnected", (event) => {
    handleConnectDisconnect(event, false);
});

function handleConnectDisconnect(event, connected) {
    const gamepad = event.gamepad;

    if (connected) {
        controllerIndex = gamepad.index;
    } else {
        controllerIndex = null;
    }
};

function handleButtons(buttons) {
    if (buttons[0].pressed) {
        playGame = true;
    }
}

// This function determines the movement of the player and where to fire bullets
function handleSticks(axes) {
    if ([axes[0], axes[1]].some(axis => axis > .2 || axis < -.2)) {
        playerVelocity = { x: axes[0] * playerMovementSpeed, y: axes[1] * playerMovementSpeed };
    }
    else {
        playerVelocity = { x: 0, y: 0 }
    }
    if ([axes[2], axes[3]].some(axis => axis > .2 || axis < -.2)) {
        const angle = Math.atan2(axes[3], axes[2]);
        bulletTrajectory = {
            // Will yield a result that is in the range -1 to 1
            x: Math.cos(angle) * bulletMovementSpeed,
            y: Math.sin(angle) * bulletMovementSpeed
        }
        if (ableToFire) {
            ableToFire = false;
            projectiles.push(new Projectile(5, 'red', bulletTrajectory));
        }
    }
};

// function handleRumble(gamepad) {
//     const rumbleOnButtonPress = document.getElementById("rumble-on-button-press");

//     if (rumbleOnButtonPress.checked) {
//         if (gamepad.buttons.some(button => button.value > 0)) {
//             gamepad.vibrationActuator.playEffect("dual-rumble", {
//                 startDelay: 0,
//                 duration: 25,
//                 weakMagnitude: 1.0,
//                 strongMagnitude: 1.0,
//             });
//         }
//     }
// };

// END GAMEPAD FUNCTIONALITY



// PLAYER CLASS
class Player {
    constructor(origin, radius, color) {
        this.x = origin.x
        this.y = origin.y
        this.radius = radius
        this.color = color
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + playerVelocity.x;
        this.y = this.y + playerVelocity.y;
        playerCenter = {
            x: this.x,
            y: this.y
        }
    }
}



// PROJECTILE CLASS
class Projectile {
    constructor(radius, color, velocity) {
        this.x = playerCenter.x
        this.y = playerCenter.y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}



// ENEMY CLASS
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    updateVelocity() {
        const angle = Math.atan2(playerCenter.y - this.y, playerCenter.x - this.x);
        const velocity = {
            // Will yield a result that is in the range -1 to 1
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        this.velocity = velocity;
    }

    update() {
        this.draw();
        this.updateVelocity();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}



const x = canvas.width / 2;
const y = canvas.height / 2;

const player = new Player(playerCenter, 30, 'blue');
player.draw();

const projectiles = [];
const enemies = [];

function spawnEnemies() {
    setInterval(() => {
        const x = 100;
        const y = 100;
        const radius = 30;
        const color = "dimgrey";
        const angle = Math.atan2(playerCenter.y - y, playerCenter.x - x);
        const velocity = {
            // Will yield a result that is in the range -1 to 1
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
};

function gameLoop() {
    if (controllerIndex !== null) {
        const gamepad = navigator.getGamepads()[controllerIndex];
        handleButtons(gamepad.buttons);
        handleSticks(gamepad.axes);
        // handleRumble(gamepad);
    }
    requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    projectiles.forEach(projectile => {
        projectile.update();
    })
    enemies.forEach(enemy => {
        enemy.update();
    })
}

window.addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
    const velocity = {
        // Will yield a result that is in the range -1 to 1
        x: Math.cos(angle),
        y: Math.sin(angle)
    }
    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'red', velocity));
})

gameLoop();
spawnEnemies();

