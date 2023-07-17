const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const playerMovementSpeed = 5;
const bulletMovementSpeed = 7;
const firingInterval = 100;

let animationId;
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
            console.log(projectiles);
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
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    updateVelocity() {
        // When determining the angle for two points always subtract from the destination
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
        const radius = Math.random() * (30 - 10) + 10;

        let x;
        let y;

        if (Math.random() < 0.5) {
            x = Math.random() < .5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < .5 ? 0 - radius : canvas.height + radius;
        }
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
    animationId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    projectiles.forEach((projectile, index) => {
        projectile.update();

        if (projectile.x - projectile.radius < 0) {
            // This timeout causes the enemy to be removed one fram later to eliminate a stutter in the animation of other enemies
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }

        if (projectile.x - projectile.radius > canvas.width) {
            // This timeout causes the enemy to be removed one fram later to eliminate a stutter in the animation of other enemies
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }

        if (projectile.y - projectile.radius < 0) {
            // This timeout causes the enemy to be removed one fram later to eliminate a stutter in the animation of other enemies
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }

        if (projectile.y - projectile.radius > canvas.height) {
            // This timeout causes the enemy to be removed one fram later to eliminate a stutter in the animation of other enemies
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
    })
    enemies.forEach((enemy, index) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            console.log("Game Over!");
            // cancelAnimationFrame(animationId);
        };

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // Objects touch?
            if (dist - enemy.radius - projectile.radius < 1) {
                // This timeout causes the enemy to be removed one fram later to eliminate a stutter in the animation of other enemies
                setTimeout(() => {
                    enemies.splice(index, 1);
                    projectiles.splice(projectileIndex, 1)
                }, 0)
            }
        })
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

